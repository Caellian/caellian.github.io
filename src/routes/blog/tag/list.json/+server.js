import { json } from "@sveltejs/kit";
import { orderPosts, processPostData } from "$lib/posts";
import { writable, get } from "svelte/store";

export const prerender = true;

const tags = writable([]);
export async function GET({ fetch }) {
    let cached = get(tags);
    if (cached.length > 0) {
        return json(cached);
    }

    const posts = await fetch(`/blog/posts.json`).then(res => res.json());

    for (const post of posts) {
        for (const tag of post.tags) {
            if (!cached.includes(tag)) {
                cached.push(tag);
            }
        }
    }

    tags.set(cached);

    return json(cached, {
        headers: {
            "cache-control": "max-age=3600, s-maxage=3600",
        }
    });
}