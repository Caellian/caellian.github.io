import { CONTINUE, SKIP, visit } from "unist-util-visit";
import { toText } from "hast-util-to-text";
import { hElement as hEl, hText } from "./hast-utils.js";
import Highlighter from "highlight";

/**
 * @import {Position} from "unist"
 * @import {VisitorResult} from "unist-util-visit"
 * @import {Element, ElementContent, Node, Nodes, RootContent, Text} from "hast"
 */

const SKIP_LANGS = ["math", "console"];

const RE_ANNOTATION = /^.*?#!\s*/;

/**
 * @typedef {object} AnnotationLocation
 * @property {Element} parent
 * @property {number} index index in parent before removal
 * @property {ElementContent} prevSibling
 * @property {ElementContent} nextSibling
 */
/**
 * @typedef {object} Annotation
 * @property {"annotation"} type
 * @property {AnnotationLocation} location
 * @property {string} value
 */

/**
 * @typedef {object} CodeBlockLocation
 * @property {Element} parent
 * @property {number} localIndex
 * @property {number} absoluteIndex
 */
/**
 * A code block that's being processed
 * @typedef {object} CodeBlock
 * @property {CodeBlockLocation} location
 * @property {Element} pre
 * @property {Element} code
 * @property {number} line_count
 * @property {string} lang
 * @property {Annotation[]} annotations
 * @property {{[marker: string]: boolean}} markers
 */

/**
 * @param {Annotation[]} list
 * @param {(annotation: Annotation) => boolean} handler
 */
function filterOutHandled(list, handler) {
  let retained = [];
  for (const item of list) {
    if (!handler(item)) {
      retained.push(item);
    }
  }
  list.splice(0, list.length, ...retained);
}


/**
 * @param {CodeBlock} block
 * @param {HeadingOptions} options
 */
function processHeadingAnnotations(block, options) {
  filterOutHandled(block.annotations, (it) => {
    let collapse = takeTag(it, "collapse-heading");
    if (collapse === true) {
      options.collapse = true;
    }

    let copy = takeTag(it, "copy");
    if (copy && options.copy !== false) {
      options.copy = true;
    }

    let storeDynamic = takeTag(it, "store-dynamic");
    if (storeDynamic === true) {
      options.storeDynamic = true;
    }

    let file = takeTag(it, "file");
    if (typeof file === "string") {
      options.file = file;
    }

    let name = takeTag(it, "name");
    if (typeof name === "string") {
      options.name = name;
    }

    return it.value.trim().length == 0;
  });
}

/**
 * @param {CodeBlock} block
 * @param {NumberLineOptions} options
 */
function processNumberAnnotations(block, options) {
  filterOutHandled(block.annotations, (it) => {
    let collapse = takeTag(it, "collapse-lines");
    if (collapse === true) {
      options.collapse = true;
    }

    let hide = takeTag(it, "hide-lines");
    if (hide === true) {
      options.hide = true;
    }

    let start = takeTag(it, "line-start");
    if (typeof start === "number") {
      options.start = start;
    }

    return it.value.trim().length == 0;
  });
}

export const SHOW_IF_NO_FILE = "no-file";

/**
 * @typedef {object} HeadingOptions
 * @property {string} [file] Codeblock file path indicator
 * @property {string} [name] Fixed codeblock title
 * @property {boolean} [copy] Force display of copy button
 * @property {string} [copyText="Copy"] Copy button text
 * @property {boolean | "no-file"} [showLang] Whether to show the language
 * @property {boolean} [collapse] Whether to collapse codeblock heading.
 * <br/>The heading won't be shown if collapsed, but line numbers will.
 * @property {boolean} [storeDynamic=false] Whether to store contents in dynamic
 * scripts variable.
 *
 * Has no effect if `name` is not present.
 */

/**
 * @param {CodeBlock} block
 * @param {HeadingOptions | boolean} options
 * @returns {Element} block heading element
 */
function buildBlockHeading(block, options) {
  if (options === false) {
    return null;
  }
  options = typeof options === "object" ? options : {};
  processHeadingAnnotations(block, options);

  if (options.collapse === true) {
    return hEl("div", { className: ["block-heading", "collapsed"] });
  }

  options.showLang = options.showLang ?? SHOW_IF_NO_FILE;

  let headingComponents = [];

  if (options.name) {
    headingComponents.push(
      hEl(
        "span",
        {
          className: ["heading", "name"],
          "data-store-dynamic-variable": options.storeDynamic ? "" : undefined,
        },
        options.name
      )
    );
  }

  if (options.file) {
    headingComponents.push(
      hEl("span", { className: ["heading", "file"] }, options.file)
    );
  }

  if (
    options.showLang === true ||
    (options.showLang === SHOW_IF_NO_FILE && options.file == null)
  ) {
    headingComponents.push(
      hEl("span", { className: ["heading", "language"] }, block.lang)
    );
  }

  headingComponents.push(hEl("span", { className: ["spacer"] }));

  if (block.markers["deferred"]) {
    headingComponents.push(
      hEl(
        "span",
        {
          className: ["hint", "deferred"],
          title: "Runs at the end",
        },
        "(deferred)"
      )
    );
  }

  if (options.copy) {
    headingComponents.push(
      hEl("button", { className: ["copy"] }, options.copyText || "Copy")
    );
  }

  return hEl(
    "div",
    {
      className: ["block-heading"],
    },
    headingComponents
  );
}

/**
 * @typedef {object} NumberLineOptions
 * @property {number} [start] - starting line number
 * @property {boolean} [collapse] - completely hide the number line
 * @property {boolean} [hide] - hide the number line numbers
 */
/**
 * @param {CodeBlock} block
 * @param {NumberLineOptions | boolean} options
 * @returns {Element} - number line element
 */
function buildBlockNumberLine(block, options) {
  if (options === false) {
    return null;
  }
  options = typeof options === "object" ? options : {};
  processNumberAnnotations(block, options);

  if (options.collapse === true) {
    return hEl("div", {
      className: ["line-numbers", "collapsed"],
    });
  } else if (options.hide === true) {
    return hEl("div", {
      className: ["line-numbers"],
    });
  }

  let start = options.start || 1;
  let line_numbers = [];
  for (let i = start; i < start + block.line_count; i++) {
    line_numbers.push(hEl("span"), hText(i.toString()));
  }

  return hEl("div", { className: ["line-numbers"] }, line_numbers);
}

/**
 * @typedef {object} Options
 * @property {any[]} [grammars=[]]
 * @property {string[]} [overrideCaptures=STANDARD_CAPTURE_NAMES] - noncomformant capture names
 * @property {string[]} [extraCaptures=STANDARD_CAPTURE_NAMES] - noncomformant capture names
 * @property {boolean | NumberLineOptions} [lineNumbers=true] - whether to insert line numbers
 * @property {boolean | HeadingOptions} [heading=true] - whether to insert heading or options
 */

/**
 * @param {Options} [options]
 * @returns {import("unified").Transformer}
 */
export function rehypeTreeSitter(options = {}) {
  let numberLineOptions = options.lineNumbers ?? true;
  let headingOptions = options.heading ?? true;

  let highlighter = new Highlighter({
    language: {
      captures: options.overrideCaptures || undefined,
      extraCaptures: options.extraCaptures,
    },
  });

  return async (ast) => {
    /**
     * @type {Promise<CodeBlock | null>[]}
     */
    let codeBlocks = [];

    let currentIndex = 0;
    visit(
      ast,
      "element",
      /**
       * @param {Element} pre
       * @param {number} index
       * @param {Element} parent
       * @returns {VisitorResult}
       */
      (pre, index, parent) => {
        if (pre.tagName != "pre") {
          return CONTINUE;
        }

        let code = pre.children.find((it) => it.type === "element");
        if (code == null || code.tagName != "code") {
          return SKIP;
        }

        let content = toText(code, { whitespace: "pre" });
        content = content.trimEnd();
        code.children = [
          {
            type: "text",
            value: content,
          },
        ];

        let classes = code.properties.className;
        if (!Array.isArray(classes) || classes.length == 0) {
          return SKIP;
        }

        let lang = /** @type {string | undefined} */ (
          classes.find(
            (it) => typeof it === "string" && it.startsWith("language-")
          )
        );
        lang = lang?.substring(9) || "text";

        const absoluteIndex = currentIndex;
        codeBlocks.push(
          new Promise((resolve, reject) => {
            let annotations = [];
            let highlighted;
            let line_count;

            if (highlighter.isLanguageEnabled(lang)) {
              try {
                highlighted = highlighter.highlight(content, lang);
                code.children = [highlighted];
                //annotations = extractAnnotations(highlighted);
                line_count = highlighted.data.lineCount || 0;
              } catch (e) {
                reject(e);
              }
            }

            if (
              code.data?.noCodeblock ||
              SKIP_LANGS.includes(lang) ||
              annotations.includes("no-codeblock")
            ) {
              resolve(null);
            }

            resolve({
              location: { absoluteIndex, parent, localIndex: index },
              pre,
              code,
              line_count,
              lang,
              annotations,
              markers: code.data?.markers || {},
            });
          })
        );
        currentIndex += 1;

        return SKIP;
      }
    );

    if (ast.data.inserts == null) {
      ast.data.inserts = {};
    }

    await Promise.allSettled(
      codeBlocks.map((parsedBlock) => {
        parsedBlock.then((block) => {
          if (block == null) {
            // skipped
            return;
          }

          let { parent, localIndex, absoluteIndex } = block.location;

          let code = block.pre;
          if (!Array.isArray(code.properties.className)) {
            code.properties.className = [];
          }
          code.properties.className.push(`language-${block.lang}`);
          code.properties.className.push(`cb-${absoluteIndex}`);

          let heading = buildBlockHeading(block, headingOptions);
          if (heading != null) {
            ast.data.inserts[`cb-${absoluteIndex}-heading`] = {
              type: "fragment",
              value: heading,
            };
          }
          let lineNumbers = buildBlockNumberLine(block, numberLineOptions);
          if (lineNumbers != null) {
            ast.data.inserts[`cb-${absoluteIndex}-lineno`] = {
              type: "fragment",
              value: lineNumbers,
            };
          }

          parent.children.splice(localIndex, 1, code);
        });
      })
    );
  };
}

export default rehypeTreeSitter;
