import { unified } from "unified";

import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkFrontmatter from "remark-frontmatter";
import remarkMath from "remark-math";

import rehypeRaw from "rehype-raw";
import rehypeMathjax from "rehype-mathjax/svg";

import rehypeRetarget from "./rehype-retarget.js";
import rehypeDynamicScripts from "./rehype-dynamicScripts.js";
import rehypeTreeSitter from "./rehype-codeblocks.js";
import logger from "../logging/index.js";
import { toHtml } from "hast-util-to-html";

/**
 * @import {VFile} from 'vfile'
 * @import {Node} from 'unist'
 * @import {Root as HTMLRoot} from 'hast'
 * @import {Plugin, Compiler, CompileResults, Processor} from 'unified'
 */

/**
 * @typedef {object} Output
 * @property {string} htmlContent
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
 * @template {CompileResults | undefined} [CompileResult=Output]
 *   Output of `stringify` (optional).
 * @typedef {Processor<ParseTree, HeadTree, TailTree, CompileTree, CompileResult>} Processor
 */

/**
 * @typedef {object} ParserOptions
 * @property {import("fs").PathLike} localContentPath
 * @property {import("fs").PathLike} contentPath
 */

/**
 * @param {ParserOptions} options
 * @returns {Processor<HTMLRoot, HTMLRoot, Node, HTMLRoot, Output>}
 */
function parser(options) {
  let targetLocation = options.contentPath;

  let parser = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ["yaml"])
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, {
      allowDangerousHtml: true,
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
      mappings: {
        ".": targetLocation,
      },
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
  return parser.use(compiler);
}

/**
 * @type {Plugin<[(null | undefined)?], HTMLRoot, Output>}
 * @param {null | undefined} [options] Configuration (optional).
 * @returns {undefined} Nothing.
 */
export default function compiler(options = undefined) {
  /** @type {Processor<undefined, undefined, undefined, HTMLRoot, Output>} */
  const self = this;

  self.compiler = handler;

  /**
   * @type {Compiler<HTMLRoot, Output>}
   */
  function handler(tree) {
    const html = toHtml(tree, {
      allowDangerousHtml: true,
    });
    return {
      htmlContent: String(html),
    };
  }
}

/**
 * @param {VFile} input
 * @param {ParserOptions} options
 * @returns {Promise<Output?>}
 */
export async function parse(input, options) {
  try {
    return (await parser(options).process(input)).result;
  } catch (error) {
    error.cause = error.cause || {};
    error.cause.file = input.path;
    logger.error(error);
  }
}
