import { json } from "@sveltejs/kit";
import { orderPosts, processPostData } from "$lib/posts";

export const prerender = true;

export async function GET() {
    const posts = import.meta.glob(`../posts/**/*.svx`);

    const postResults = [];
    for (const post in posts) {
        let slug = post.split('posts/').pop().split('.')[0];
        let data = await import(/* @vite-ignore */ post);
        postResults.push(processPostData({
            ...data.metadata,
            slug
        }));
    }

    return json(orderPosts(postResults));
}