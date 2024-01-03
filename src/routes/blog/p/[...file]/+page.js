import { processPostData } from "$lib/posts";

export async function load({ params }) {
    const posts = import.meta.glob(`../../posts/**/*.svx`);
    const post = await import(/* @vite-ignore */ posts[`../../posts/${params.file}.svx`].name);
    const content = post.default;

    return {
        ...processPostData({
            ...post.metadata,
            slug: params.slug
        }),
        content,
    };
}
