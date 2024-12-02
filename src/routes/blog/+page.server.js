import { localFile } from "$lib/local";
import { toPostList } from "$lib/posts";
import { orderPosts } from "$lib/posts";

export const prerender = true;

/** @type {import("@sveltejs/kit").ServerLoad} */
export async function load() {
  /**
   * @type {import("$lib/posts").PostData[]}
   */
  let posts = await localFile("$gen/index.json", { format: "json" }).then(
    toPostList
  );

  const targetLocale = "en";
  posts = orderPosts(
    posts.filter((it) => {
      return (
        it.creativeWorkStatus === "published" && it.inLanguage === targetLocale
      );
    })
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
    posts: orderPosts(posts),
    keywords: Array.from(keywords),
    topics: Array.from(topics),
  };
}
