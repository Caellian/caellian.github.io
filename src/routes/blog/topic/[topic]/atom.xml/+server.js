import { orderPosts, postMapToList } from "$lib/posts";
import { blogAtom } from "$lib/atom";
import { BASE_URL } from "$lib/store";

export const prerender = true;

export async function GET({ params, fetch }) {
    let posts = await fetch(`/blog/posts.json`).then(postMapToList);

    const topic = params.topic;

    posts = posts.filter(post => {
        return post.topic == topic;
    });

    let content = blogAtom(`tinsvagelj::net - ${topic}`, `Tin's ${topic} blog`, orderPosts(posts), BASE_URL + "/topic/" + topic);

    return new Response(content, {
        headers: {
            "cache-control": "max-age=0, s-maxage=3600",
            "content-type": "application/atom+xml"
        }
    });
}