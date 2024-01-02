export const prerender = true;

export async function load({ params, fetch }) {
    let posts = await fetch("/blog/posts.json");

    const tag = params.slug;
    posts = (await posts.json()).filter(post => {
        return post.tags.includes(tag);
    });

    return {
        tag,
        posts
    };
}
