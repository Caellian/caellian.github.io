import { CONTINUE, SKIP, visit } from "unist-util-visit";
import { toText } from "hast-util-to-text";
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

        let deferred = el.properties.defer == true;
        deferred = deferred ? ["defer"] : [];

        const content = h("dynamic-script", { className: deferred });

        let scriptSource = el.properties?.src;
        if (scriptSource != null) {
          content.children.push(
            h("span.status", "run JS from path:"),
            h("a.path", { href: scriptSource }, scriptSource)
          );
        } else {
          let code = el.children
            .filter((child) => child.type === "text")
            .map((child) => child.value)
            .join("");

          if (code.trim().length === 0) {
            parent.children.splice(i, 1);
            return [SKIP, i];
          }
          code = code.split("\n").filter((it) => it.trim().length > 0);

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

          if (el.properties?.className?.includes("show")) {
            let codeEl = h("code", { className: ["language-js"] }, code);
            if (deferred) {
              codeEl.data = {
                markers: {
                  deferred: true,
                },
              };
            }
            const display = h("pre", [codeEl]);
            parent.children.splice(i + 1, 0, display);
          }
          const exec = h("code", { className: ["language-js"] }, code);
          exec.data = {
            noCodeblock: true,
          };

          content.children.push(
            h("span.status", "run embedded JS: "),
            h("details", [h("summary", "source"), h("pre", exec)])
          );
        }

        parent.children.splice(i, 1, content);
        return SKIP;
      }
    );
  };
}

export default rehypeDynamicScripts;
