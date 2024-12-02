import { orderPosts, toPostList } from "$lib/posts";
import { blogAtom } from "$lib/atom";
import { localFile } from "$lib/local";

export const prerender = true;

/** @type {import("@sveltejs/kit").RequestHandler} */
export async function GET({ params }) {
  /**
   * @type {import("$lib/posts").PostData[]}
   */
  let posts = await localFile("$gen/index.json", { format: "json" }).then(
    toPostList
  );

  let content = blogAtom(`tinsvagelj::net`, `Tin's blog`, posts);

  return new Response(content, {
    headers: {
      "cache-control": "max-age=0, s-maxage=3600",
      "content-type": "application/atom+xml",
    },
  });
}
