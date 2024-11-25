import { CONTINUE, SKIP, visit } from "unist-util-visit";

export function rehypeRetarget(options = {}) {
  /** @type {String} */
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
       * @param {import("hast").Element} el
       * @param {number} i
       * @param {import("hast").Element} parent
       * @returns {import("unist").VisitResult}
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
      }
    );
  };
}

export default rehypeRetarget;
