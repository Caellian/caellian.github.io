import { CONTINUE, SKIP, visit } from "unist-util-visit";
import { h } from "hastscript";
import esprima from "esprima";
import https from "https";
import { readFile } from "fs/promises";

function topLevelDeclarations(code, module = false) {
  let ast = null;
  try {
    if (module) {
      ast = esprima.parseModule(code);
    } else {
      ast = esprima.parseScript(code);
    }
  } catch (e) {
    console.error(e.toString());
    return [];
  }

  let exports = [];
  function exportID(id) {
    if (id.type === "Identifier") {
      exports.push(id.name);
    }
  }
  function handleExport(item) {
    if (item.type === "FunctionDeclaration") {
      exportID(item.id);
    } else if (item.type === "VariableDeclaration") {
      for (const variable of item.declarations) {
        exportID(variable.id);
      }
    }
  }
  for (const item of ast.body) {
    if (!module) {
      handleExport(item);
    } else if (item.type === "ExportNamedDeclaration") {
      if (item.declaration != null) {
        handleExport(item.declaration);
      } else if ((item.specifiers?.length || 0) > 0) {
        for (const specifier of item.specifiers) {
          exportID(specifier.exported);
        }
      }
    }
  }
  return exports;
}

function rebasePath(path, base) {
  if (path.startsWith("/")) {
    return base + path;
  } else if (path.startsWith("./")) {
    return base + path.slice(1);
  } else {
    return path;
  }
}

async function getSource(path, options = {}) {
  let url = rebasePath(path, options.locallyAccessible || ".");
  let local = url != path;
  if (!url.startsWith("http") && !url.startsWith("/")) {
    return await readFile(url, { encoding: "utf-8" });
  } else {
    let content = new Promise((resolve, reject) => {
      let buffer = "";
      https
        .get(url, (response) => {
          if (response.statusCode !== 200) {
            return reject(
              new Error(
                `can't get '${url}'; ${err.statusCode}: ${err.statusMessage}`
              )
            );
          }
          response.on("data", (d) => {
            buffer += d;
          });
          response.on("end", (_) => {
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

function handleInclude(source, i, parent, target, options, tasks) {
  tasks.push(
    (async () => {
      try {
        let code = await getSource(source.properties?.src, options);
        target.properties["data-exports"] = topLevelDeclarations(
          code,
          options.isModule
        );
      } catch (e) {
        console.error(e);
      }
    })()
  );

  let href = rebasePath(source.properties?.src, options.targetLocation || "/");

  let note = "remote JS";
  if (options.isModule) {
    note = "remote ESM";
  }

  target.children.push(h("span.status", note), h("a.path", { href }, href));
}

function handleEmbedded(source, i, parent, target, options) {
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

  const exec = h(
    "code",
    {
      className: ["language-js"],
    },
    code
  );
  exec.data = {
    noCodeblock: true,
  };
  let detailsEl = h("details", [h("summary", "source"), h("pre", exec)]);

  if (source.properties?.className?.includes("show")) {
    let codeEl = h("code", { className: ["language-js"] }, code);
    if (options.deferred) {
      codeEl.data = {
        markers: {
          deferred: true,
        },
      };
    }
    const display = h("pre", [codeEl]);
    parent.children.splice(i + 1, 0, display);
    target.properties["data-shown"] = true;
    detailsEl = null;
  }

  let note = "embedded JS";
  if (options.isModule) {
    note = "embedded ESM";
  }
  target.children.push(h("span.status", note));
  if (detailsEl != null) {
    target.children.push(detailsEl);
  }
}

export function rehypeDynamicScripts(options = {}) {
  return async (ast, _file) => {
    const tasks = [];

    visit(
      ast,
      "element",
      /**
       * @param {import("hast").Element} el
       * @param {number} i
       * @param {import("hast").Element} parent
       * @returns {import("unist").VisitResult}
       */
      (el, i, parent) => {
        if (el.tagName != "script") {
          return CONTINUE;
        }

        let deferred = el.properties.defer == true;
        let isModule = el.properties.type === "module";
        const target = h("dynamic-script", {
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

        parent.children.splice(i, 1, target);
        return SKIP;
      }
    );

    await Promise.all(tasks);
  };
}

export default rehypeDynamicScripts;
