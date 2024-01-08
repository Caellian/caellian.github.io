import { json } from "@sveltejs/kit";
import { writable, get } from "svelte/store";

export const prerender = true;

const topics = writable([]);
export async function GET({ fetch }) {
    let cached = get(topics);
    if (cached.length > 0) {
        return json(cached);
    }

    const posts = await fetch(`/blog/posts.json`).then(res => res.json());

    for (const post of Object.values(posts)) {
        if (!cached.includes(post.topic)) {
            cached.push(post.topic);
        }
    }

    topics.set(cached);

    return json(cached, {
        headers: {
            "cache-control": "max-age=3600, s-maxage=3600",
        }
    });
}