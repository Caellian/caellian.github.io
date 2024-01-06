import { processPostData } from "$lib/posts";

export async function load({ params, fetch }) {
    const postData = await fetch(`/blog/posts.json`).then(res => res.json());
    const posts = import.meta.glob(`../../posts/**/*.svx`);
    const post = await posts[`../../posts/${params.file}.svx`]();
    const content = post.default;

    let prevTitle = null;
    if (post.metadata.prev) {
        prevTitle = postData.find(p => p.slug === post.metadata.prev)?.title;
    }

    let nextTitle = null;
    if (post.metadata.next) {
        nextTitle = postData.find(p => p.slug === post.metadata.next)?.title;
    }

    return {
        ...processPostData({
            ...post.metadata,
            slug: params.file
        }),
        prevTitle,
        nextTitle,
        content,
    };
}
