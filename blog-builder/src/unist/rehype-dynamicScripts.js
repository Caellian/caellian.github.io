import { CONTINUE, SKIP, visit } from "unist-util-visit";
import * as esprima from "esprima-next";
import { Syntax } from "esprima-next";
import https from "node:https";
import { readFile } from "node:fs/promises";
import { hElement as hEl } from "./hast-utils.js";
import logger from "../logging/index.js";

/**
 * @typedef {import("./types.ts").HASTScriptElement} HASTScriptElement
 * @typedef {import("hast").ElementContent} ElementContent
 * @typedef {import("hast").ElementData} ElementData
 * @typedef {import("hast").Properties} Properties
 * @typedef {import("hast").Element} Element
 * @typedef {import("hast").Text} Text
 */
/**
 * @typedef {object} DynamicCodeData
 * @property {boolean} [noCodeblock]
 * @property {{[marker: string]: boolean}} [markers]
 */
/**
 * @typedef {object} DynamicCodeElement
 * @property {"element"} type
 * @property {"code"} tagName
 * @property {DynamicCodeData & ElementData} [data]
 * @property {{className: ["language-js"]}} properties
 * @property {[Text, ...ElementContent[]]} children
 */
/**
 * @typedef {object} CollapsedCodeElement
 * @property {"element"} type
 * @property {"details"} tagName
 * @property {[
 * {tagName: "summary"},
 * {tagName: "pre", children: [ DynamicCodeElement ]}
 * ]} children
 */
/**
 * @typedef {{
 * "data-exports"?: string[] | undefined,
 * "data-deferred"?: boolean | undefined,
 * "data-module"?: boolean | undefined,
 * }} DynamicScriptProperties
 */
/**
 * @typedef {object} DynamicScriptElement
 * @property {"element"} type
 * @property {"dynamic-script"} tagName
 * @property {DynamicScriptProperties & Properties} properties
 * @property {[DynamicCodeElement | CollapsedCodeElement, ...ElementContent[]] & ElementContent[]} children
 */

/**
 * @param {string} code
 * @param {boolean} module
 * @returns {string[]}
 */
function topLevelDeclarations(code, module = false) {
  let ast = null;
  try {
    if (module) {
      ast = esprima.parseModule(code);
    } else {
      ast = esprima.parseScript(code);
    }
  } catch (_parsing_error) {
    return [];
  }

  let exports = [];
  /**
   * @param {import("esprima-next").Identifier | import("esprima-next").BindingPattern} id
   */
  function exportID(id) {
    if (id.type === Syntax.Identifier) {
      exports.push(id.name);
    } else if (id.type === esprima.Syntax.ArrayPattern) {
      for (const element of id.elements) {
        if (
          element.type === Syntax.Identifier ||
          element.type === Syntax.ArrayPattern ||
          element.type === Syntax.ObjectPattern
        ) {
          exportID(element);
        }
      }
    } else if (id.type === Syntax.ObjectPattern) {
      for (const property of id.properties) {
        if (
          property.type === Syntax.Property &&
          property.key.type === Syntax.Identifier
        ) {
          exportID(property.key);
        }
      }
    }
  }
  /**
   * @param {import("esprima-next").Statement} item
   */
  function handleExport(item) {
    if (item.type === Syntax.FunctionDeclaration) {
      exportID(item.id);
    } else if (item.type === Syntax.VariableDeclaration) {
      for (const variable of item.declarations) {
        exportID(variable.id);
      }
    }
  }
  for (const item of ast.body) {
    if (!module) {
      handleExport(item);
    } else if (item.type === Syntax.ExportNamedDeclaration) {
      if (item.declaration != null) {
        handleExport(item.declaration);
      } else if ((item.specifiers?.length || 0) > 0) {
        for (const specifier of item.specifiers) {
          if (specifier.exported.type === Syntax.Identifier) {
            exportID(specifier.exported);
          }
        }
      }
    }
  }
  return exports;
}

/**
 * @param {string} path
 * @param {string} base
 * @returns {string}
 */
function rebasePath(path, base) {
  if (path.startsWith("/")) {
    return base + path;
  } else if (path.startsWith("./")) {
    return base + path.slice(1);
  } else {
    return path;
  }
}

/**
 * @param {string} path
 * @param {*} [options]
 * @returns {Promise<string>}
 */
async function getSource(path, options = {}) {
  let url = rebasePath(path, options.locallyAccessible || ".");
  if (!url.startsWith("http")) {
    return await readFile(url, { encoding: "utf-8" });
  } else {
    let content = new Promise((resolve, reject) => {
      let buffer = "";
      https
        .get(url, (response) => {
          if (response.statusCode !== 200) {
            return reject(
              new Error(
                `can't get '${url}'; ${response.statusCode}: ${response.statusMessage}`
              )
            );
          }
          response.on("data", (d) => {
            buffer += d;
          });
          response.on("end", () => {
            return resolve(buffer);
          });
        })
        .on("error", (e) => {
          return reject(e);
        });
    });
    return await content;
  }
}

/**
 * @typedef {Array<Promise<void>>} AsyncMutations
 */

/**
 * @typedef {object} DynamicScriptsOptionsExt
 * @property {boolean} isModule
 * @property {boolean} deferred
 */
/**
 * @typedef {DynamicScriptsOptions & DynamicScriptsOptionsExt} HandlerOptions
 */

/**
 * @callback ScriptElementHandler
 * @param {HASTScriptElement} source
 * @param {number} i
 * @param {Element} parent
 * @param {DynamicScriptElement} target
 * @param {HandlerOptions} options
 * @param {AsyncMutations} tasks
 * @returns {import("unist-util-visit").VisitorResult?}
 */

/**
 * @type {ScriptElementHandler}
 */
function handleInclude(source, _i, _parent, target, options, tasks) {
  tasks.push(
    (async () => {
      try {
        const sourceUrl = source.properties?.src;
        const code = await getSource(sourceUrl, options);
        const exports = topLevelDeclarations(code, options.isModule);
        target.properties["data-exports"] = exports;
      } catch (e) {
        logger.error(e);
      }
    })()
  );

  let href = rebasePath(source.properties?.src, options.targetLocation || "/");

  let note = "remote JS";
  if (options.isModule) {
    note = "remote ESM";
  }

  target.children.push(
    hEl("span", { className: "status" }, note),
    hEl("a", { className: "path", href }, href)
  );

  return null;
}

/**
 * @type {ScriptElementHandler}
 */
function handleEmbedded(source, i, parent, target, options) {
  /** @type {string | string[]} */
  let code = source.children
    .filter((child) => child.type === "text")
    .map((child) => child.value)
    .join("");

  if (code.trim().length === 0) {
    parent.children.splice(i, 1);
    return [SKIP, i];
  }
  code = code.split("\n");
  while (code.at(0).trim().length == 0) {
    code.splice(0, 1);
  }

  let indent = Infinity;
  for (const after of code) {
    indent = Math.min(after.match(/^\s*/)[0].length, indent);
  }

  code = code
    .map((line) => {
      const currIndent = line.match(/^\s*/)[0].length;
      let cutoff = Math.min(currIndent, indent);
      return line.slice(cutoff);
    })
    .join("\n")
    .trim();

  target.properties["data-exports"] = topLevelDeclarations(
    code,
    options.isModule
  );

  /**
   * @type {DynamicCodeElement}
   */
  const exec = hEl(
    "code",
    {
      className: ["language-js"],
    },
    code,
    {
      noCodeblock: true,
    }
  );
  /**
   * @type {CollapsedCodeElement}
   */
  let detailsEl = hEl("details", [
    hEl("summary", "source"),
    hEl("pre", [exec]),
  ]);

  if (source.properties?.className?.includes("show")) {
    /**
     * @type {DynamicCodeElement}
     */
    let codeEl = hEl("code", { className: ["language-js"] }, code, {
      markers: options.deferred
        ? {
            deferred: true,
          }
        : undefined,
    });
    const display = hEl("pre", [codeEl]);
    parent.children.splice(i + 1, 0, display);
    target.properties["data-shown"] = true;
    detailsEl = null;
  }

  let note = "embedded JS";
  if (options.isModule) {
    note = "embedded ESM";
  }
  target.children.push(hEl("span", { className: "status" }, note));
  if (detailsEl != null) {
    target.children.push(detailsEl);
  }

  return null;
}

/**
 * @typedef {object} DynamicScriptsOptions
 * @property {string} [targetLocation]
 */
/**
 * Turns `<script>` hast nodes into `<dynamic-script>` nodes with information
 * necessary for their dynamic execution.
 * @param {DynamicScriptsOptions} [options]
 * @returns {import("unified").Transformer}
 */
export function rehypeDynamicScripts(options = {}) {
  return async (ast, _file) => {
    const tasks = [];

    visit(
      ast,
      "element",
      /**
       * @param {HASTScriptElement | *} el
       * @param {number} i
       * @param {Element} parent
       * @returns {import("unist-util-visit").VisitorResult}
       */
      (el, i, parent) => {
        if (el.tagName != "script") {
          return CONTINUE;
        }

        let deferred = el.properties.defer == true;
        let isModule = el.properties.type === "module";
        /**
         * @type {DynamicScriptElement}
         */
        // @ts-ignore the type will be valid once handler is called
        const target = hEl("dynamic-script", {
          "data-deferred": deferred ? true : undefined,
          "data-module": isModule ? true : undefined,
        });

        let handler = handleEmbedded;
        if (el.properties?.src != null) {
          handler = handleInclude;
        }
        let earlyReturn = handler(
          el,
          i,
          parent,
          target,
          {
            ...options,
            deferred,
            isModule,
          },
          tasks
        );
        if (earlyReturn != undefined) {
          return earlyReturn;
        }

        let child = target.children[0];
        if (child.tagName == "code" && child.data.markers["data-deferred"]) {
          // Special handling
        }

        parent.children.splice(i, 1, target);
        return SKIP;
      }
    );

    await Promise.all(tasks);
  };
}

export default rehypeDynamicScripts;
