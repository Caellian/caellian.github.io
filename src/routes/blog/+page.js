export const prerender = true;

export async function load({ fetch }) {
    const posts = await fetch("/blog/posts.json");

    return {
        posts: await posts.json()
    };
}
