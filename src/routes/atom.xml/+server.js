import { orderPosts, postMapToList } from "$lib/posts";
import { blogAtom } from "$lib/atom";

export const prerender = true;

export async function GET({ fetch }) {
    let posts = await fetch(`/blog/posts.json`).then(postMapToList);
    let content = blogAtom(`tinsvagelj::net`, `Tin's blog`, orderPosts(posts));

    return new Response(content, {
        headers: {
            "cache-control": "max-age=0, s-maxage=3600",
            "content-type": "application/atom+xml"
        }
    });
}