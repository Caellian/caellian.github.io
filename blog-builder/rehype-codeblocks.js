import { CONTINUE, SKIP, visit } from "unist-util-visit";
import { toText } from "hast-util-to-text";
import { h } from "hastscript";
import Highlighter from "highlight";

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

/**
 * @param {import("hast").Element} ast
 * @param {import("hast").Element} node
 * @returns {[import("hast").Element, number]} [parent, index_in_parent]
 */
function findParent(ast, node) {
    let queue = [ast];
    while (queue.length > 0) {
        let curr = queue.shift();
        if (curr.children != null &&
            typeof curr.children.indexOf == "function") {
            let indexOf = curr.children.indexOf(node);
            if (indexOf > -1) {
                return [curr, indexOf];
            }
            queue.push(...curr.children);
        }
    }
    return null;
}

/**
 * Normalizes node class names into an array of names.
 * 
 * Returns an empty array if the node is not an element.
 * 
 * @param {import("hast").Node} node
 * @returns {string[]} class names
 */
function nodeClasses(node) {
    if (node.type != "element") {
        return [];
    }
    let classes = node.properties?.className || "";
    if (typeof classes == "string") {
        classes = classes.split(" ");
    }
    return classes.filter(it => it.length > 0);
}

const RE_ANNOTATION = /^.*?#!\s*/;

/**
 * @typedef {Object} AnnotationLocation
 * @prop {import("hast").Element} parent
 * @prop {number} index index in parent before removal
 * @prop {import("hast").Node} prevSibling
 * @prop {import("hast").Node} nextSibling
 * 
 * @typedef {Object} Annotation
 * @prop {AnnotationLocation} location
 * @prop {string} value
 * 
 * @param {import("hast").Element} ast
 * @returns {string[]} annotations
 */
function extractAnnotations(ast) {
    let annotations = [];

    function annotationValue(elem) {
        let text = elem;
        if (typeof text !== "string" && text.type != null) {
            text = toText(text, { whitespace: "pre" });
        }
        return text.replace(RE_ANNOTATION, "");
    }

    visit(ast, "element",
        /**
         * @param {import("hast").Element} node 
         * @param {number} i 
         * @param {import("hast").Element} parent 
         * @returns {import("unist").VisitResult}
         */
        (node, i, parent) => {
            if (parent == null || node.tagName != "span") {
                return CONTINUE;
            }

            let classes = nodeClasses(node);
            if (!classes.find(it => it === "comment")) {
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
                value
            });
            return SKIP;
        });

    for (const node of annotations.reverse()) {
        let { parent, index, prevSibling, nextSibling } = node.location;
        let remove_count = 1;
        // remove leading newline
        if (prevSibling == null &&
            nextSibling?.type === "text" && nextSibling?.value === "\n") {
            remove_count = 2;
        }
        parent.children.splice(index, remove_count);
    }

    return annotations;
}

/**
 * @typedef {Object} CodeBlock
 * A code block that's being processed
 * 
 * @prop {import("hast").Element} pre
 * @prop {import("hast").Element} code
 * @prop {number} line_count
 * @prop {string} lang
 * @prop {Annotation[]} annotations
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
 * 
 * @param {Annotation} annotation
 * @param {string} tag tag name
 * @param {number} [offset=0] offset to start searching for the tag
 * @returns {string | boolean | number | null} tag value
 */
function takeTag(annotation, tag, offset = 0) {
    let l = annotation.value;
    let index = l.indexOf(tag, offset);
    if (index === -1) {
        return null;
    }

    let leadingWhitespace = l.substring(0, index).match(RE_TAILING_SPACE)[0].length;
    if (leadingWhitespace == 0 && index > 0) {
        return takeTag(annotation, tag, index + tag.length);
    }

    let afterTag = l.substring(index + tag.length);
    if (afterTag.length == 0 || afterTag.startsWith(" ")) {
        let tailingWhitespace = l.substring(index + tag.length).match(RE_LEADING_SPACE)[0].length;
        annotation.value = l.substring(0, index - leadingWhitespace) + afterTag.substring(tailingWhitespace);
        return true;
    } else if (!afterTag.startsWith(":")) {
        return takeTag(annotation, tag, index + tag.length);
    }

    let match = afterTag.substring(1).match(RE_TAG_VALUE);
    if (match == null) {
        return null;
    }

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

    annotation.value = l.substring(0, index - leadingWhitespace) + afterTag.substring(match[0].length + 1);
    return value;
}

/**
 * @param {CodeBlock} block
 * @param {HeadingOptions} options
 */
function processHeadingAnnotations(block, options) {
    filterOutHandled(block.annotations, it => {
        let collapse = takeTag(it, "collapse-heading");
        if (collapse === true) {
            options.collapse = true;
        }

        let copy = takeTag(it, "copy");
        if (copy && options.copy !== false) {
            options.copy = true;
        }

        let file = takeTag(it, "file");
        if (file) {
            options.file = file;
        }

        let name = takeTag(it, "name");
        if (name) {
            options.name = name;
        }

        return it.value.trim().length == 0;
    })
}

/**
 * @param {CodeBlock} block
 * @param {NumberLineOptions} options
 */
function processNumberAnnotations(block, options) {
    filterOutHandled(block.annotations, it => {
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
    })
}

export const SHOW_IF_NO_FILE = "no-file";

/**
 * @typedef {Object} HeadingOptions
 * @prop {string} [name] fixed codeblock title
 * @prop {bool} [copy] force display of copy button
 * @prop {string} [copyText="Copy"] copy button text
 * @prop {bool | "no-file"} [showLang] whether to show the language
 * 
 * @param {CodeBlock} block
 * @param {HeadingOptions} options
 * @returns {import("hast").Element} heading
 */
function buildBlockHeading(block, options) {
    if (options === false) {
        return null;
    }
    options = typeof options === "object" ? options : {};
    processHeadingAnnotations(block, options);

    if (options.collapse === true) {
        return h("div.block-heading.collapsed");
    }

    options.showLang = options.showLang ?? SHOW_IF_NO_FILE;

    let headingComponents = [];

    if (options.name) {
        headingComponents.push(
            h("span.heading.name", options.name),
        );
    }

    if (options.file) {
        headingComponents.push(
            h("span.heading.file", options.file),
        );
    }

    if (options.showLang === true ||
        options.showLang === SHOW_IF_NO_FILE && options.file == null) {
        headingComponents.push(
            h("span.heading.language", block.lang),
        );
    }

    headingComponents.push(
        h("span.spacer")
    );

    if (options.copy) {
        headingComponents.push(h("button.copy", options.copyText || "Copy"));
    }

    return h("div.block-heading", headingComponents);
}

/**
 * @typedef {Object} NumberLineOptions
 * @prop {number} [start] starting line number
 * @prop {bool} [collapse] completely hide the number line
 * @prop {bool} [hide] hide the number line numbers
 * 
 * @param {CodeBlock} block
 * @param {NumberLineOptions} options
 * @returns {import("hast").Element} number line
 */
function buildBlockNumberLine(block, options) {
    if (options === false) {
        return null;
    }
    options = typeof options === "object" ? options : {};
    processNumberAnnotations(block, options);

    if (options.collapse === true) {
        return h("div.line-numbers.collapsed");
    } else if (options.hide === true) {
        return h("div.line-numbers");
    }

    let start = options.start || 1;
    let line_numbers = [];
    for (let i = start; i < start + block.line_count; i++) {
        line_numbers.push(h("span"), i.toString());
    }

    return h("div.line-numbers", line_numbers);
}

/**
 * @typedef {Object} Options
 * @prop {any[]} [grammars]
 * @prop {string[]} [overrideCaptures=STANDARD_CAPTURE_NAMES] noncomformant capture names
 * @prop {string[]} [extraCaptures=STANDARD_CAPTURE_NAMES] noncomformant capture names
 * @prop {bool | NumberLineOptions} [lineNumbers=true] whether to insert line numbers
 * @prop {bool | HeadingOptions} [heading=true] whether to insert heading or options
 * 
 * @param {Options} [options={}]
 * @returns {import("unified").Transformer}
 */
export function rehypeTreeSitter(options = {}) {
    let numberLineOptions = options.lineNumbers ?? true;
    let headingOptions = options.heading ?? true;

    let captures = [...(options.overrideCaptures || STANDARD_CAPTURE_NAMES), ...(options.extraCaptures || [])];
    let highlighter = new Highlighter(captures);

    return (ast, _file) => {
        let code_blocks = [];

        visit(ast, "element",
            /**
             * @param {import("hast").Element} pre 
             * @param {number} i 
             * @param {import("hast").Element} parent 
             * @returns {import("unist").VisitResult}
             */
            (pre, i, parent) => {
                if (pre.tagName != "pre") {
                    return CONTINUE;
                }

                let code = pre.children[0];
                if (code == null || code.tagName != "code") {
                    return SKIP;
                }

                let content = toText(code, { whitespace: "pre" });
                content = content.trimEnd();
                code.children = [{
                    type: "text",
                    value: content
                }];

                let line_count = content.split("\n").length;

                let classes = nodeClasses(code);
                if (classes == null || classes.length == 0) {
                    return SKIP;
                }

                let lang = classes.find(it => it.startsWith("language-"))?.substring(9) || "text";

                let annotations = [];
                if (highlighter.isSupported(lang)) {
                    try {
                        const new_content = highlighter.highlight(content, lang);
                        annotations = extractAnnotations(new_content)
                        if (annotations.length > 0) {
                            line_count = toText(new_content, { whitespace: "pre" }).split("\n").length;
                        }
                        code.children = [new_content];
                    } catch (e) {
                        console.warn(e);
                    }
                }

                code_blocks.push({
                    location: { parent, i },
                    pre,
                    code,
                    line_count,
                    lang,
                    annotations,
                });
                return SKIP;
            });

        for (const block of code_blocks) {
            let { parent, i } = block.location;

            let code = block.pre;
            code.properties = code.properties || {};
            code.properties.className = code.properties?.className || [];
            code.properties.className.push(`language-${block.lang}`);

            let components = [
                block.pre
            ];
            let heading = buildBlockHeading(block, headingOptions);
            if (heading != null) {
                components.splice(0, 0, heading);
            }
            let lineNumbers = buildBlockNumberLine(block, numberLineOptions);
            if (lineNumbers != null) {
                components.push(lineNumbers);
            }
            let wrapper = h("div.code-block", components)

            parent.children.splice(i, 1, wrapper);
        }
    }
}

export default rehypeTreeSitter;
