import { CONTINUE, SKIP, visit } from "unist-util-visit";

/**
 * @typedef {import("./types.js").HASTImgElement} HASTImgElement
 * @typedef {import("./types.js").HASTScriptElement} HASTScriptElement
 */
/**
 * @typedef {object} RetargetOptions
 * @property {string} [targetLocation]
 */
/**
 * Replaces relative links with specified {@link RetargetOptions.targetLocation|targetLocation}.
 * @param {RetargetOptions} options
 * @returns {import("unified").Transformer}
 */
export function rehypeRetarget(options = {}) {
  /** @type {string} */
  let targetLocation = options.targetLocation || "";

  if (!targetLocation.startsWith("/") && !targetLocation.startsWith("http")) {
    targetLocation = "/" + targetLocation;
  }
  if (targetLocation.endsWith("/")) {
    targetLocation = targetLocation.substring(0, targetLocation.length - 1);
  }

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
        if (el.tagName == "img") {
          let imgSource = el.properties?.src;
          if (!imgSource.startsWith(".")) {
            return SKIP;
          }
          el.properties.src = imgSource.replace(/^./, targetLocation);
          parent.children.splice(i, 1, el);
        } else if (el.tagName == "script") {
          let scriptSource = el.properties?.src;
          if (scriptSource == null || !scriptSource.startsWith(".")) {
            return SKIP;
          }
          el.properties.src = scriptSource.replace(/^./, targetLocation);
          parent.children.splice(i, 1, el);
        } else {
          return CONTINUE;
        }
        return SKIP;
      }
    );
  };
}

export default rehypeRetarget;
