import fsp from "node:fs/promises";

import { POST_EXT, PostIndex } from "../data/post.js";
import E from "../env.js";
import { buildPost, requireValidIndex } from "./build.js";
import logger from "../logging/index.js";

/**
 * Runs `watch` command.
 */
async function run() {
  await fsp.mkdir(E.output, { recursive: true });

  let index = await requireValidIndex();

  let indexUpdate = Promise.resolve();
  async function updateIndex(mutation) {
    if (indexUpdate) {
      await indexUpdate;
    }
    let newIndex = new PostIndex({
      ...index.posts,
      ...mutation,
    });
    await fsp.mkdir(E.output, { recursive: true });
    indexUpdate = fsp
      .writeFile(E.indexPath, JSON.stringify(newIndex.posts), {
        encoding: "utf-8",
      })
      .then(() => {
        index = PostIndex.fromJSON(newIndex.posts);
      });
  }

  const ac = new AbortController();
  const { signal } = ac;

  process.once("SIGINT", () => ac.abort());
  process.once("SIGTERM", () => ac.abort());

  logger.info("Watching for changes...");
  const watcher = fsp.watch(E.input, { recursive: true });

  let shouldExit = false;
  signal.addEventListener("abort", async () => {
    shouldExit = true;
    logger.info("Exiting...");
    await indexUpdate;
  });

  for await (const change of watcher) {
    if (shouldExit) {
      break;
    }
    if (!change.filename.endsWith(POST_EXT)) {
      continue;
    }

    const slug = change.filename.slice(
      0,
      change.filename.length - POST_EXT.length
    );
    let prev = index.posts[slug];
    logger.info(`- ${change.eventType}:\t'${slug}'`);

    if (change.eventType == "change") {
      let [_, result] = await buildPost(slug, prev);
      updateIndex({
        [slug]: result,
      });
    } else if (change.eventType == "rename") {
      updateIndex({
        [slug]: null,
      });
    } else if (change.eventType == "add") {
      let [_, result] = await buildPost(slug, prev);
      updateIndex({
        [slug]: result,
      });
    }
  }
}

export default run;
