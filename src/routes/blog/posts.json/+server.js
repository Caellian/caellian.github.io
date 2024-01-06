import { json } from "@sveltejs/kit";
import { orderPosts, processPostData } from "$lib/posts";
import { get, writable } from "svelte/store";

export const prerender = true;

const postResults = writable([]);
export async function GET() {
    let cached = get(postResults);
    if (cached.length > 0) {
        return json(cached);
    }

    const posts = import.meta.glob(`../posts/**/*.svx`);

    for (const post in posts) {
        let slug = post.split('posts/').pop().split('.')[0];
        let data = await posts[post]();
        let clean = processPostData({
            ...data.metadata,
            content: data.default.render().html,
            slug
        });
        if (clean.published) {
            cached.push(clean);
        }
    }
    cached = orderPosts(cached);
    postResults.set(cached);

    return json(cached, {
        headers: {
            "cache-control": "max-age=3600, s-maxage=3600",
        }
    });
}