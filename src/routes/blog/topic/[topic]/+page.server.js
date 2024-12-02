import { localFile } from "$lib/local";
import { toPostList } from "$lib/posts";

export const prerender = true;

/** @type {import("@sveltejs/kit").ServerLoad} */
export async function load({ params }) {
  let posts = await localFile("$gen/index.json", { format: "json" }).then(
    toPostList
  );

  const topic = params.topic;
  posts = posts.filter((post) => {
    return post.articleSection == topic;
  });

  return {
    topic,
    posts,
  };
}
