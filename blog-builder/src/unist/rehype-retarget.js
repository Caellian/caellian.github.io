import { CONTINUE, SKIP, visit } from "unist-util-visit";
import { urlAppend, urlJoin } from "../data/path.js";

/**
 * @typedef {import("./types.js").HASTImgElement} HASTImgElement
 * @typedef {import("./types.js").HASTScriptElement} HASTScriptElement
 */

/**
 * @param {string | URL} basePath
 * @param {{[location: string]: (string | URL)}} mappings
 * @returns {{[location: string]: (string | URL)}}
 */
function resolveMappings(basePath, mappings) {
  let result = /** @type {{[location: string]: (string | URL)}} */ ({});
  for (const mapping in mappings) {
    result[urlAppend(basePath, mapping).toString()] = mappings[mapping];
  }
  return result;
}

const ELEMENT_PROPERTY = {
  img: "src",
  script: "src",
  a: "href",
};

/**
 * @typedef {object} RetargetOptions
 * @property {string} [basePath]
 * @property {{[location: string]: (string | URL)}} mappings
 */
/**
 * Replaces relative links with specified {@link RetargetOptions.targetLocation|targetLocation}.
 * @param {RetargetOptions} options
 * @returns {import("unified").Transformer}
 */
export function rehypeRetarget(options) {
  let resolvedMappings = resolveMappings(options.basePath, options.mappings);

  return (ast, _file) => {
    visit(
      ast,
      "element",
      /**
       * @param {HASTImgElement | HASTScriptElement | *} el
       * @param {number} i
       * @param {import("hast").Element} parent
       * @returns {import("unist-util-visit").VisitorResult}
       */
      (el, i, parent) => {
        let propertyName = ELEMENT_PROPERTY[el.tagName];
        if (propertyName == null) {
          return CONTINUE;
        }
        let path = el.properties[propertyName];
        if (path == null) {
          return SKIP;
        }

        let absolutePath = urlAppend(options.basePath, path);
        for (const key in resolvedMappings) {
          const path = absolutePath.toString();
          if (path.startsWith(key)) {
            const targetBase = resolvedMappings[key];
            if (targetBase instanceof URL) {
              absolutePath = targetBase;
            } else {
              absolutePath = urlJoin(targetBase, path.slice(key.length));
            }
          }
        }

        el.properties[propertyName] = absolutePath.toString();
        parent.children.splice(i, 1, el);
        return SKIP;
      }
    );
  };
}

export default rehypeRetarget;
