import path from "node:path";
import fs from "node:fs";
import fsp from "node:fs/promises";

import { ArticleStatus, Post, PostIndex, slugToPath } from "../data/post.js";
import { E, postSlugs } from "../env.js";
import { memoize } from "../combinators.js";
import logger from "../logging/index.js";

/**
 * @typedef BuildOptions
 * @type {object}
 * @property {boolean} force whether to force re-build of already built content
 * @property {boolean} deploy whether to produce content with deployment paths
 */
/**
 * @returns {BuildOptions}
 */
const options = memoize(() => {
  let args = E.arguments;
  let options = {};
  if (args.force) {
    options.force = true;
  }
  return Object.freeze(options);
});

/**
 * @enum {string}
 */
export const PostState = Object.freeze({
  UNCHANGED: "unchanged",
  CREATED: "created",
  MODIFIED: "modified",
  DELETED: "deleted",
  ERRORED: "errored",
  INCOMPLETE: ArticleStatus.INCOMPLETE,
});

/**
 * @param {import("../data/post.js").PostSlug} slug
 * @param {Post} prev
 * @returns {Promise<[PostState, object]>} index entry for blog post
 */
export async function buildPost(slug, prev) {
  let post = prev ? new Post(slug, prev) : new Post(slug);

  let oldDate =
    post.datePublished &&
    post.datePublished?.toISOString()?.replace(/.\d{1,3}Z/, "Z");
  let oldUpdate =
    post.dateModified &&
    post.dateModified?.toISOString()?.replace(/.\d{1,3}Z/, "Z");
  await post.updateTimeInfo();
  let newDate = post.datePublished.toISOString().replace(/.\d{1,3}Z/, "Z");
  let newUpdate = post.dateModified.toISOString().replace(/.\d{1,3}Z/, "Z");
  if (
    oldDate != null &&
    oldDate === newDate &&
    (oldUpdate == null || oldUpdate === newUpdate)
  ) {
    logger.trace(
      {
        oldDate,
        newDate,
        oldUpdate,
        newUpdate,
      },
      "%s hasn't been updated",
      slug
    );
    return [PostState.UNCHANGED, await post.toIndexJSON()];
  } else {
    logger.trace(
      {
        oldDate,
        newDate,
        oldUpdate,
        newUpdate,
      },
      "%s was updated",
      slug
    );
  }

  let status = await post.getArticleStatus();
  if (status === ArticleStatus.INCOMPLETE) {
    return [PostState.INCOMPLETE, null];
  }

  let document;
  try {
    document = await post.toJSON();
  } catch (err) {
    logger.error({ err, ...(err.cause || {}) });
    return [PostState.ERRORED, null];
  }

  logger.debug("Writing %s JSON to disk", slug);
  let outPath = path.join(E.output, slugToPath(post.slug) + ".json");
  await fsp.mkdir(path.dirname(outPath), { recursive: true });
  await fsp.writeFile(outPath, JSON.stringify(document), {
    encoding: "utf-8",
  });

  return [
    prev == null ? PostState.CREATED : PostState.MODIFIED,
    await post.toIndexJSON(),
  ];
}

/**
 * Returns a valid post index, or creates a new one if it doesn't exist.
 * @returns {Promise<PostIndex>}
 * @throws {SyntaxError} if index JSON is malformed; to avoid data loss
 */
export async function requireValidIndex() {
  try {
    return await PostIndex.open(E.indexPath);
  } catch (err) {
    if (err instanceof SyntaxError) {
      let e = /** @type {import("../ext/error.js").ExtSyntaxError} */ (err);
      let relativePath = path.relative(process.cwd(), E.indexPath);
      logger.fatal(
        {
          title: "Malformed out JSON",
          file: relativePath,
          line: e.cause?.line,
          column: e.cause?.column,
        },
        e.message + " while reading '%s'",
        relativePath
      );
      process.exit(1);
    } else {
      throw err;
    }
  }
}

/**
 * Runs `build` command.
 */
async function run() {
  await fsp.mkdir(E.output, { recursive: true });

  let index = await requireValidIndex();
  const newIndex = fs.createWriteStream(E.indexPath + ".new", { flags: "w" });
  newIndex.write("{");

  let changes = {
    [PostState.UNCHANGED]: [],
    [PostState.CREATED]: [],
    [PostState.MODIFIED]: [],
    [PostState.DELETED]: [],
    [PostState.ERRORED]: [],
    [PostState.INCOMPLETE]: [],
  };
  let first = true;
  logger.summary("## Generated Posts");
  try {
    for await (const slug of postSlugs()) {
      let status, output;
      try {
        [status, output] = await buildPost(slug, index.posts[slug]);
      } catch (err) {
        console.error(err);
        continue;
      }
      logger.info(
        {
          date: output?.date,
          update: output?.update,
        },
        `- ${status}:\t'${slug}'`
      );
      changes[status].push(slug);
      if (status === PostState.INCOMPLETE) {
        continue;
      } else if (status !== PostState.ERRORED) {
        logger.summary(
          `- ["${output.name}"](${E.hostURL}${E.postURLSuffix}${slug})`
        );
        if (!first) {
          newIndex.write(",");
        } else {
          first = false;
        }
        newIndex.write(`"${slug}": ${JSON.stringify(output)}`);
      } else if (status === PostState.ERRORED) {
        logger.error({ err: output }, `- errored: ${slug}`);
      }
    }
  } catch (err) {
    logger.error(err);
    return;
  }
  newIndex.write("}");
  newIndex.end(() => {
    logger.info("Index updated!");
    fs.rename(E.indexPath + ".new", E.indexPath, (err) => {
      if (err) {
        logger.error(err, "Unable to update index");
      }
    });
  });

  let changesNotice = Object.entries(changes)
    .map(([changeSet, slugs]) => {
      if (slugs.length === 0) {
        return null;
      }
      let slugList = slugs.map((slug) => `\t- ${slug}`).join("\n");
      return `${changeSet}:\n${slugList}`;
    })
    .filter((it) => it != null)
    .join("\n");
  logger.notice(`Summary\n${changesNotice}`);

  let indexDir = path.dirname(E.indexPath);
  if (!fs.existsSync(indexDir)) {
    await fsp.mkdir(indexDir, { recursive: true });
  }
}

export default run;
