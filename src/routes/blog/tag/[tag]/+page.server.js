import { postMapToList } from "$lib/posts";

export const prerender = true;

export async function load({ params, fetch }) {
    let posts = await fetch("/blog/posts.json").then(postMapToList);

    const tag = params.tag;
    posts = posts.filter(post => {
        return post.tags.includes(tag);
    });

    return {
        tag,
        posts
    };
}
