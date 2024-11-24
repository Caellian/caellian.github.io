import { CONTINUE, SKIP, visit } from "unist-util-visit";
import { h } from "hastscript";

export function rehypeShowScript(options = {}) {
  return (ast, _file) => {
    visit(
      ast,
      "element",
      /**
       * @param {import("hast").Element} script
       * @param {number} i
       * @param {import("hast").Element} parent
       * @returns {import("unist").VisitResult}
       */
      (script, i, parent) => {
        if (script.tagName != "script") {
          return CONTINUE;
        }

        let cn = script.properties?.className;
        if (cn == null || !cn.includes("showscript")) {
          return SKIP;
        }

        const code = script.children
          .filter((child) => child.type === "text")
          .map((child) => child.value)
          .join("")
          .trim();

        const preNode = h("pre", [
          h("code", { className: ["language-js"] }, code),
        ]);

        parent.children.splice(i + 1, 0, preNode);
      }
    );
  };
}

export default rehypeShowScript;
