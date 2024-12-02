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
      console.log("imports", importWith(scriptExports));

      let exports = eval(
        `(() => {${importWith(scriptExports)}\n${code}\nreturn {${scriptExports.join(", ")}};})()`
      );
      for (const [key, value] of Object.entries(exports)) {
        scope[key] = value;
      }
    },
    /** inline: false, esm: true
     * @type {CodeLoader}
     */
    [1]: async (scope) => {
      let exports = await import(/* @vite-ignore */ source);
      for (const [key, value] of Object.entries(exports)) {
        scope[key] = value;
      }
    },
    /** inline: true,  esm: false
     * @type {CodeLoader}
     */
    [2]: (scope, scriptExports) => {
      console.log("imports", importWith(scriptExports));
      let exports = eval(
        `(() => {${importWith(scriptExports)}\n${source}\nreturn {${scriptExports.join(", ")}};})()`
      );
      for (const [key, value] of Object.entries(exports)) {
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
 * @param {HTMLElement} container
 * @param {string} [scopeName="ArticleScope"]
 * @returns {Promise<Scope>} scope produced by evaluating scipts.
 */
export async function evaluateDynamicScripts(
  container,
  scopeName = "ArticleScope"
) {
  const dScript = container.querySelectorAll("dynamic-script");
  const deferred = [];
  /**
   * @type {Scope}
   */
  const scope = {};

  // @ts-ignore
  window[scopeName] = scope;

  const localImportWith = importScope.bind(null, scopeName);

  for (const /** @type {HTMLElement} */ el of dScript) {
    const isModule = el.getAttribute("data-module") != null;
    const isShown = el.getAttribute("data-shown") != null;

    const remote = el.querySelector(".path")?.textContent?.trim() || null;
    /**
     * @type {string}
     */
    let source = /** @type {any} */ (remote);
    if (!remote) {
      /** @type {HTMLElement | null} */
      let codeEl = null;
      if (!isShown) {
        codeEl = el.querySelector("code .source");
      } else {
        codeEl = el.nextElementSibling?.querySelector("code .source") || null;
      }
      if (codeEl == null) {
        el.classList.add("error");
        console.error("neither '.path' nor 'code .source' available", el);
        el.setAttribute(
          "title",
          `ERROR: neither '.path' nor 'code .source' available`
        );
        continue;
      }
      source = codeEl.textContent?.trim() || "";
    }

    if (source.length === 0) {
      el.classList.add("success");
      console.debug(el, "skipped because it's empty");
      continue;
    }

    /**
     * @param {Error | any} error
     */
    let errorHandler = (error) => {
      el.classList.add("error");

      if (error instanceof Error) {
        console.error(el, "execution failed:", error.message);
        el.setAttribute("title", `ERROR: '${error.message}'`);
      } else {
        console.error(el, "execution failed:", error.toString());
        el.setAttribute("title", `ERROR: '${error.toString()}'`);
      }
    };
    if (remote != null) {
      errorHandler = (error) => {
        el.classList.add("error");

        if (error instanceof Error) {
          console.error(el, `'${remote}' execution failed:`, error.message);
          el.setAttribute("title", `ERROR: '${error.message}'`);
        } else {
          console.error(el, `'${remote}' execution failed:`, error.toString());
          el.setAttribute("title", `ERROR: '${error.toString()}'`);
        }
      };
    }

    const scriptExports = (el.getAttribute("data-exports") || "").split(/\s+/);
    let runner = loader(source, localImportWith, {
      inline: remote == null,
      esm: isModule,
    });
    let e = async () => {
      try {
        // @ts-ignore
        console.log(el, "BEFORE:", window[scopeName]);
        await runner(scope, scriptExports)
          .then(() => {
            el.classList.add("success");
          })
          .catch(errorHandler);
        // @ts-ignore
        console.log(el, "AFTER:", window[scopeName]);
      } catch (e) {
        errorHandler(e);
      }
    };

    if (!Boolean(el.getAttribute("data-deferred"))) {
      await e();
    } else {
      deferred.push(e);
    }
  }

  for (const e of deferred) {
    await e();
  }

  return scope;
}
