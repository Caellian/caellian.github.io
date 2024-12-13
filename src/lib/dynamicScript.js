/**
 * WARNING: This code is incredibly unsafe to run on a website that stores ANY
 * user data, or handles with API keys, or well... any secrets of any kind.
 *
 * However, my blog doesn't. So it's as safe as end-user opening some random
 * website they don't know. All an attacker can learn from them is possibly
 * their language and dark/light theme preference.
 */

/**
 * @typedef {Record<string, any>} Scope
 * @typedef {string} Sources
 */

/**
 * @param {string} [scopeGlobalName]
 * @param {string[]} [excluding]
 */
function importScope(scopeGlobalName = "ArticleScope", excluding = []) {
  // @ts-ignore
  let names = Object.keys(window[scopeGlobalName]);
  names = names.filter((it) => !excluding.includes(it));
  return `let {${names.join(", ")}} = ${scopeGlobalName};`;
}

const IGNORE_EXPORTS = ["default"];

/**
 * @callback CodeLoader
 * @param {Scope} scope
 * @param {string[]} scriptExports
 * @returns {Promise<void>}
 */
/**
 * @param {Sources} source
 * @param {(excluding: string[]) => string} importWith
 * @param {{inline: boolean, esm: boolean}} conditions
 * @returns {CodeLoader}
 */
function loader(source, importWith, conditions) {
  let { inline, esm } = conditions;
  const result = {
    /** inline: false, esm: false
     * @type {CodeLoader}
     */
    [0]: async (scope, scriptExports) => {
      const response = await fetch(source, {
        method: "GET",
      });
      if (!response.ok) {
        throw new Error(
          `unable to fetch code from source; got reponse ${response.status}: ${response.statusText}`,
          {
            cause: {
              source,
              response,
            },
          }
        );
      }
      const code = await response.text();

      let exports = eval(
        `(() => {${importWith(scriptExports)}\n${code}\nreturn {${scriptExports.join(", ")}};})()`
      );
      for (const [key, value] of Object.entries(exports)) {
        if (IGNORE_EXPORTS.includes(key)) continue;
        scope[key] = value;
      }
    },
    /** inline: false, esm: true
     * @type {CodeLoader}
     */
    [1]: async (scope) => {
      let exports = await import(/* @vite-ignore */ source);
      for (const [key, value] of Object.entries(exports)) {
        if (IGNORE_EXPORTS.includes(key)) continue;
        scope[key] = value;
      }
    },
    /** inline: true,  esm: false
     * @type {CodeLoader}
     */
    [2]: (scope, scriptExports) => {
      let exports = eval(
        `(() => {${importWith(scriptExports)}\n${source}\nreturn {${scriptExports.join(", ")}};})()`
      );
      for (const [key, value] of Object.entries(exports)) {
        if (IGNORE_EXPORTS.includes(key)) continue;
        scope[key] = value;
      }
      return Promise.resolve();
    },
    /** inline: true,  esm: true
     * @type {CodeLoader}
     */
    [3]: async (scope) => {
      const url = URL.createObjectURL(
        new Blob([source], { type: "application/javascript" })
      );
      const exports = await import(/* @vite-ignore */ url);
      for (const [key, value] of Object.entries(exports)) {
        if (IGNORE_EXPORTS.includes(key)) continue;
        scope[key] = value;
      }
    },
  }[(Number(inline) << 1) | Number(esm)];
  if (result == null) {
    // unreachable
    return () =>
      Promise.reject(
        new Error(
          "no loader provided for conditions: " + JSON.stringify(conditions)
        )
      );
  }
  return result;
}

/**
 * @param {Element | null} codeBlock
 */
function getBlockSource(codeBlock) {
  if (codeBlock == null) {
    return null;
  }
  const sourceBlock = codeBlock.querySelector("code .source");
  if (sourceBlock == null) {
    return null;
  }
  return sourceBlock.textContent?.trim() || null;
}

/**
 * @param {Scope} scope
 * @param {(excluding: string[]) => string} localImportWith
 * @param {HTMLElement} element
 * @param {(() => Promise<void>)[]} deferred
 */
async function handleScript(scope, localImportWith, element, deferred) {
  const isModule = element.getAttribute("data-module") != null;
  const isShown = element.getAttribute("data-shown") != null;

  const remote = element.querySelector(".path")?.textContent?.trim() || null;
  /**
   * @type {string}
   */
  let source = /** @type {any} */ (remote);
  if (!remote) {
    /** @type {string | null} */
    let foundSource = getBlockSource(
      isShown ? element.nextElementSibling : element
    );
    if (foundSource == null) {
      element.classList.add("error");
      console.error("neither '.path' nor 'code .source' available", element);
      element.setAttribute(
        "title",
        `ERROR: neither '.path' nor 'code .source' available`
      );
      return;
    }
    source = foundSource;
  }

  if (source.length === 0) {
    element.classList.add("success");
    console.debug(element, "skipped because it's empty");
    return;
  }

  /**
   * @param {Error | any} error
   */
  let errorHandler = (error) => {
    element.classList.add("error");

    if (error instanceof Error) {
      console.error(element, "execution failed:", error.message);
      element.setAttribute("title", `ERROR: '${error.message}'`);
    } else {
      console.error(element, "execution failed:", error.toString());
      element.setAttribute("title", `ERROR: '${error.toString()}'`);
    }
  };
  if (remote != null) {
    errorHandler = (error) => {
      element.classList.add("error");

      if (error instanceof Error) {
        console.error(element, `'${remote}' execution failed:`, error.message);
        element.setAttribute("title", `ERROR: '${error.message}'`);
      } else {
        console.error(
          element,
          `'${remote}' execution failed:`,
          error.toString()
        );
        element.setAttribute("title", `ERROR: '${error.toString()}'`);
      }
    };
  }

  const scriptExports = (element.getAttribute("data-exports") || "").split(
    /\s+/
  );
  let runner = loader(source, localImportWith, {
    inline: remote == null,
    esm: isModule,
  });
  let e = async () => {
    try {
      await runner(scope, scriptExports)
        .then(() => {
          element.classList.add("success");
        })
        .catch(errorHandler);
    } catch (e) {
      errorHandler(e);
    }
  };

  if (element.getAttribute("data-deferred") != null) {
    deferred.push(e);
  } else {
    await e();
  }
}
/**
 * @param {Scope} scope
 * @param {HTMLElement} heading
 * @param {HTMLElement} block
 * @param {(() => Promise<void>)[]} deferred
 */
async function storeBlockInConst(scope, heading, block, deferred) {
  const source = getBlockSource(block);
  if (!source) {
    return;
  }
  const variableName = heading.textContent;
  if (!variableName) {
    return;
  }

  const isDeferred =
    heading.parentElement?.querySelector(".hint.deferred") != null;

  if (isDeferred) {
    deferred.push(async () => {
      scope[variableName] = source;
    });
  } else {
    scope[variableName] = source;
  }
}

/**
 * @param {HTMLElement} container
 * @param {string} [scopeName="ArticleScope"]
 * @returns {Promise<Scope>} scope produced by evaluating scipts.
 */
export async function evaluateDynamicScripts(
  container,
  scopeName = "ArticleScope"
) {
  const items = container.querySelectorAll(
    "dynamic-script,*[data-store-dynamic-variable]"
  );

  /**
   * @type {(() => Promise<void>)[]}
   */
  const deferred = [];
  /**
   * @type {Scope}
   */
  const scope = {};

  // @ts-ignore
  window[scopeName] = scope;

  const localImportWith = importScope.bind(null, scopeName);

  for (const item of items) {
    if (item.tagName === "DYNAMIC-SCRIPT") {
      await handleScript(
        scope,
        localImportWith,
        /** @type {HTMLElement} */ (item),
        deferred
      );
    } else if (item.getAttribute("data-store-dynamic-variable") != null) {
      const codeBlock = item.parentElement?.parentElement || null;
      if (!codeBlock) {
        continue;
      }
      storeBlockInConst(
        scope,
        /** @type {HTMLElement} */ (item),
        codeBlock,
        deferred
      );
    }
  }

  for (const e of deferred) {
    await e();
  }

  return scope;
}
