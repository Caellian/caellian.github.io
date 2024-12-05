import { CONTINUE, SKIP, visit } from "unist-util-visit";
import { toText } from "hast-util-to-text";
import { hElement as hEl, hText } from "./hast-utils.js";
import Highlighter from "highlight";

/**
 * @typedef {import("hast").Element} Element
 */

const STANDARD_CAPTURE_NAMES = [
  "attribute",
  "boolean",
  "carriage-return",
  "comment",
  "comment.documentation",
  "number",
  "constant",
  "constant.builtin",
  "constructor",
  "constructor.builtin",
  "embedded",
  "error",
  "escape",
  "function",
  "function.builtin",
  "keyword",
  "keyword.include",
  "module",
  "operator",
  "property",
  "property.builtin",
  "punctuation",
  "punctuation.bracket",
  "punctuation.delimiter",
  "punctuation.special",
  "string",
  "string.escape",
  "string.regexp",
  "string.special",
  "string.special.symbol",
  "tag",
  "type",
  "type.builtin",
  "variable",
  "variable.builtin",
  "variable.member",
  "variable.parameter",
];

const SKIP_LANGS = ["math", "console"];

/**
 * @param {Element} ast
 * @param {Element} node
 * @returns {[Element, number]} [parent, index_in_parent]
 */
// @ts-ignore
function findParent(ast, node) {
  let queue = [ast];
  while (queue.length > 0) {
    let curr = queue.shift();
    if (curr.children != null && typeof curr.children.indexOf == "function") {
      let indexOf = curr.children.indexOf(node);
      if (indexOf > -1) {
        return [curr, indexOf];
      }
      // @ts-ignore
      queue.push(...curr.children);
    }
  }
  return null;
}

/**
 * Normalizes node class names into an array of names.
 *
 * Returns an empty array if the node is not an element.
 * @param {import("hast").Node} node
 * @returns {string[]} class names
 */
function nodeClasses(node) {
  if (node.type != "element") {
    return [];
  }
  // @ts-ignore node is Element; has properties
  let classes = node.properties?.className || "";
  if (typeof classes == "string") {
    classes = classes.split(" ");
  }
  return classes.filter((it) => it.length > 0);
}

const RE_ANNOTATION = /^.*?#!\s*/;

/**
 * @typedef {object} AnnotationLocation
 * @property {Element} parent
 * @property {number} index index in parent before removal
 * @property {import("hast").Node} prevSibling
 * @property {import("hast").Node} nextSibling
 */
/**
 * @typedef {object} Annotation
 * @property {AnnotationLocation} location
 * @property {string} value
 */
/**
 * @param {Element} ast - ast of code syntax
 * @returns {[string]} annotations extracted from syntax ast
 */
function extractAnnotations(ast) {
  let annotations = [];

  /**
   * @param {string | import("hast").Nodes} elem - node(s) or string containing
   * annotations
   * @returns {string}
   */
  function annotationValue(elem) {
    let text = elem;
    if (typeof text !== "string" && text.type != null) {
      text = toText(text, { whitespace: "pre" });
    }
    // @ts-ignore
    return text.replace(RE_ANNOTATION, "");
  }

  visit(
    ast,
    "element",
    /**
     * @param {Element} node
     * @param {number} i
     * @param {Element} parent
     * @returns {import("unist-util-visit").VisitorResult}
     */
    (node, i, parent) => {
      if (parent == null || node.tagName != "span") {
        return CONTINUE;
      }

      let classes = nodeClasses(node);
      if (!classes.find((it) => it === "comment")) {
        return CONTINUE;
      }

      let text = toText(node, { whitespace: "pre" });
      if (!text.substring(0, 8).includes("#!")) {
        return CONTINUE;
      }
      let value = annotationValue(text);

      annotations.push({
        location: {
          parent,
          index: i,
          prevSibling: parent.children[i - 1] || null,
          nextSibling: parent.children[i + 1] || null,
        },
        value,
      });
      return SKIP;
    }
  );

  for (const node of annotations.reverse()) {
    let { parent, index, prevSibling, nextSibling } = node.location;
    let remove_count = 1;
    // remove leading newline
    if (
      prevSibling == null &&
      nextSibling?.type === "text" &&
      nextSibling?.value === "\n"
    ) {
      remove_count = 2;
    }
    parent.children.splice(index, remove_count);
  }

  // @ts-ignore
  return annotations;
}

/**
 * A code block that's being processed
 * @typedef {object} CodeBlock
 * @property {import("unist").Position} location
 * @property {Element} pre
 * @property {Element} code
 * @property {number} line_count
 * @property {string} lang
 * @property {Annotation[]} annotations
 * @property {{string: boolean}} markers
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

const RE_TAILING_SPACE = /\s*$/;
const RE_LEADING_SPACE = /^\s*/;
const RE_TAG_VALUE = /\s*(false|true|(\d+(\.\d+)?)|"([^"]*)"|'([^']*)')\s*/;

/**
 * Removes a tag from the annotation and returns it if found.
 * @param {Annotation} annotation
 * @param {string} tag - tag name
 * @param {number} [offset] - offset to start searching for the tag
 * @returns {string | boolean | number | null} tag value
 */
function takeTag(annotation, tag, offset = 0) {
  let l = annotation.value;
  let index = l.indexOf(tag, offset);
  if (index === -1) {
    return null;
  }

  let leadingWhitespace = l
    .substring(0, index)
    .match(RE_TAILING_SPACE)[0].length;
  if (leadingWhitespace == 0 && index > 0) {
    return takeTag(annotation, tag, index + tag.length);
  }

  let afterTag = l.substring(index + tag.length);
  if (afterTag.length == 0 || afterTag.startsWith(" ")) {
    let tailingWhitespace = l
      .substring(index + tag.length)
      .match(RE_LEADING_SPACE)[0].length;
    annotation.value =
      l.substring(0, index - leadingWhitespace) +
      afterTag.substring(tailingWhitespace);
    return true;
  } else if (!afterTag.startsWith(":")) {
    return takeTag(annotation, tag, index + tag.length);
  }

  let match = afterTag.substring(1).match(RE_TAG_VALUE);
  if (match == null) {
    return null;
  }

  /**
   * @type {*}
   */
  let value = match[1];

  if (value.startsWith('"') || value.startsWith("'")) {
    value = value.substring(1, value.length - 1);
  } else if (value === "true") {
    value = true;
  } else if (value === "false") {
    value = false;
  } else {
    try {
      value = parseFloat(value);
    } catch (e) {
      return null;
    }
  }

  annotation.value =
    l.substring(0, index - leadingWhitespace) +
    afterTag.substring(match[0].length + 1);
  return value;
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
 * @param {HeadingOptions} options
 * @returns {Element} block heading element
 */
function buildBlockHeading(block, options) {
  // @ts-ignore
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

  // @ts-ignore
  if (block.markers.deferred) {
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
 * @param {NumberLineOptions} options
 * @returns {Element} - number line element
 */
function buildBlockNumberLine(block, options) {
  // @ts-ignore
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

  let captures = [
    ...(options.overrideCaptures || STANDARD_CAPTURE_NAMES),
    ...(options.extraCaptures || []),
  ];
  let highlighter = new Highlighter(captures);

  return (ast) => {
    let code_blocks = [];

    visit(
      ast,
      "element",
      /**
       * @param {Element} pre
       * @param {number} index
       * @param {Element} parent
       * @returns {import("unist-util-visit").VisitorResult}
       */
      (pre, index, parent) => {
        if (pre.tagName != "pre") {
          return CONTINUE;
        }

        /**@type {Element} */
        // @ts-ignore
        let code = pre.children[0];
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

        let line_count = content.split("\n").length;

        let classes = nodeClasses(code);
        if (classes == null || classes.length == 0) {
          return SKIP;
        }

        let lang =
          classes.find((it) => it.startsWith("language-"))?.substring(9) ||
          "text";

        let annotations = [];
        if (highlighter.isSupported(lang)) {
          try {
            const new_content = highlighter.highlight(content, lang);
            // @ts-ignore
            annotations = extractAnnotations(new_content);
            if (annotations.length > 0) {
              // @ts-ignore
              line_count = toText(new_content, { whitespace: "pre" }).split(
                "\n"
              ).length;
            }
            // @ts-ignore
            code.children = [new_content];
          } catch (e) {
            console.warn(e);
          }
        }

        if (
          // @ts-ignore
          code.data?.noCodeblock ||
          SKIP_LANGS.includes(lang) ||
          annotations.includes("no-codeblock")
        ) {
          return SKIP;
        }

        code_blocks.push({
          location: { parent, i: index },
          pre,
          code,
          line_count,
          lang,
          annotations,
          // @ts-ignore
          markers: code.data?.markers || {},
        });
        return SKIP;
      }
    );

    for (const block of code_blocks) {
      let { parent, i } = block.location;

      let code = block.pre;
      code.properties = code.properties || {};
      code.properties.className = code.properties?.className || [];
      code.properties.className.push(`language-${block.lang}`);

      let components = [block.pre];
      // @ts-ignore
      let heading = buildBlockHeading(block, headingOptions);
      if (heading != null) {
        components.splice(0, 0, heading);
      }
      // @ts-ignore
      let lineNumbers = buildBlockNumberLine(block, numberLineOptions);
      if (lineNumbers != null) {
        components.push(lineNumbers);
      }
      let wrapper = hEl("div", { className: ["code-block"] }, components);

      parent.children.splice(i, 1, wrapper);
    }
  };
}

export default rehypeTreeSitter;
