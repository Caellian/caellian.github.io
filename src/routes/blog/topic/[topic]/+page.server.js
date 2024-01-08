import { postMapToList } from "$lib/posts";

export const prerender = true;

export async function load({ params, fetch }) {
    let posts = await fetch("/blog/posts.json").then(postMapToList);

    const topic = params.topic;
    posts = posts.filter(post => {
        return post.topic == topic;
    });

    return {
        topic,
        posts
    };
}
