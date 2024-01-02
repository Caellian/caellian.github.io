export async function load({ params, fetch }) {
    /**
     * @type {Response}
     */
    const posts = await fetch("/blog/posts.json");

    return {
        posts: await posts.json()
    };
}