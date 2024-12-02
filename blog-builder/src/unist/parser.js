import { unified } from "unified";

import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkFrontmatter from "remark-frontmatter";
import remarkMath from "remark-math";

import rehypeRaw from "rehype-raw";
import rehypeMathjax from "rehype-mathjax/svg";
import rehypeStringify from "rehype-stringify";

import rehypeRetarget from "./rehype-retarget.js";
import rehypeDynamicScripts from "./rehype-dynamicScripts.js";
import rehypeTreeSitter from "./rehype-codeblocks.js";
import logger from "../ext/logging.js";

const ALLOW_HTML = true;

/**
 * @typedef {import("vfile").VFile} VFile
 * @typedef {import("unist").Node} Node
 * @typedef {import("hast").Root} HTMLRoot
 */
/**
 * @template {Node | undefined} [ParseTree=undefined]
 *   Output of `parse` (optional).
 * @template {Node | undefined} [HeadTree=undefined]
 *   Input for `run` (optional).
 * @template {Node | undefined} [TailTree=undefined]
 *   Output for `run` (optional).
 * @template {Node | undefined} [CompileTree=undefined]
 *   Input of `stringify` (optional).
 * @template {import("unified").CompileResults | undefined} [CompileResult=undefined]
 *   Output of `stringify` (optional).
 * @typedef {import("unified").Processor<ParseTree, HeadTree, TailTree, CompileTree, CompileResult>} Processor
 */

/**
 * @typedef {object} ParserOptions
 * @property {import("fs").PathLike} localContentPath
 * @property {import("fs").PathLike} contentPath
 */

/**
 * @param {ParserOptions} options
 * @returns {Processor<HTMLRoot, HTMLRoot, Node, HTMLRoot, string>}
 */
function parser(options) {
  let targetLocation = options.contentPath;

  let parser = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ["yaml"])
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, {
      allowDangerousHtml: ALLOW_HTML,
    })
    .use(rehypeRaw) // Process raw HTML into Rehype nodes
    // @ts-ignore
    .use(rehypeDynamicScripts, {
      locallyAccessible: options.localContentPath,
      targetLocation,
    });

  if (targetLocation != null) {
    // @ts-ignore
    parser = parser.use(rehypeRetarget, {
      targetLocation,
    });
  }

  parser = parser
    .use(rehypeTreeSitter, {
      extraCaptures: [
        "function.macro",
        "variable.macro",
        "lifetime",
        "lifetime.label",
        "reference",
        "reference.keyword",
      ],
    })
    .use(rehypeMathjax, {
      chtml: {
        fontURL: "/mathjax/chtml/fonts/woff-v2",
      },
    });

  // @ts-ignore
  return parser.use(rehypeStringify, {
    allowDangerousHtml: true,
  });
}

/**
 * @param {VFile} input
 * @param {ParserOptions} options
 * @returns {Promise<string?>}
 */
export async function parse(input, options) {
  try {
    return String(await parser(options).process(input));
  } catch (error) {
    error.cause = error.cause || {};
    error.cause.file = input.path;
    logger.error(error);
  }
}
