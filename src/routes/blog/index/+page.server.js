import { localFile } from "$lib/local";
import { toPostList } from "$lib/posts";

export const prerender = true;

export async function load() {
  const posts = await localFile("$gen/index.json", { format: "json" }).then(
    toPostList
  );

  /**
   * @type {Set<string>}
   */
  let topics = new Set();
  for (const post of Object.values(posts)) {
    // @ts-ignore
    topics.add(post.articleSection || "development");
  }

  /**
   * @type {Set<string>}
   */
  let keywords = new Set();
  for (const post of Object.values(posts)) {
    // @ts-ignore
    for (const kw of post.keywords) {
      keywords.add(kw);
    }
  }

  return {
    posts,
    keywords,
    topics,
  };
}
