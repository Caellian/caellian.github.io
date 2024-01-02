import { processPostData } from "$lib/posts";

export async function load({ params }) {
    const post = await import(`../../posts/${params.slug}.svx`);
    const content = post.default;

    return {
        ...processPostData({
            ...post.metadata,
            slug: params.slug
        }),
        content,
    };
}
