import { CONTINUE, SKIP, visit } from "unist-util-visit";
import { h } from "hastscript";

export function rehypeDynamicScripts(options = {}) {
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
        if (el.tagName != "script") {
          return CONTINUE;
        }

        let scriptSource = el.properties?.src;
        if (scriptSource == null) {
          return SKIP;
        }

        let deferred = el.properties.defer == true;
        deferred = deferred ? ["defer"] : [];

        const scriptCall = h(
          "div",
          { className: ["dynamic-script", ...deferred] },
          [h("span", { className: ["path"] }, scriptSource)]
        );

        parent.children.splice(i, 1, scriptCall);
      }
    );
  };
}

export default rehypeDynamicScripts;
