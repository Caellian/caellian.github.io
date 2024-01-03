export const prerender = true;

export async function load({ fetch }) {
    const posts = await fetch("/blog/posts.json").then(res => res.json());
    const tags = await fetch("/blog/tag/list.json").then(res => res.json());
    const topics = await fetch("/blog/topic/list.json").then(res => res.json());

    return {
        posts,
        tags,
        topics
    };
}
