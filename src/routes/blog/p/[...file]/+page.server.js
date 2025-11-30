import { parsePostEntry } from "$lib/posts";
import { localFile } from "$lib/local";

export const prerender = true;

/** @type {import("@sveltejs/kit").ServerLoad} */
export async function load({ params }) {
  /**
   * @type {import("$lib/posts").Post}
   */
  let postData = await localFile(`$gen/${params.file}.json`, {
    format: "json",
  });
  /**
   * @type {Map<string, string>}
   */
  let names = new Map(
    Object.entries(
      await localFile(`$gen/index.json`, {
        format: "json",
      })
    ).map(([slug, post]) => [slug, post.name])
  );

  if (params.file == null) {
    throw new Error("missing file path parameter");
  }

  /**
   * @type {import("$lib/posts").PostData}
   */
  const post = parsePostEntry(params.file, postData);

  let prevTitle = null;
  if (post.previousArticle) {
    // @ts-ignore
    prevTitle = names.get(post.previousArticle);
  }

  let nextTitle = null;
  if (post.nextArticle) {
    // @ts-ignore
    nextTitle = names.get(post.nextArticle);
  }

  return {
    ...post,
    slug: params.file,
    prevTitle,
    nextTitle,
    content: post.articleBody,
  };
}
