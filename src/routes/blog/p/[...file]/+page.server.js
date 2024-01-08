import { normalizePostEntry } from "$lib/posts";

export async function load({ params, fetch }) {
    let postData = await fetch(`/blog/p/${params.file}/data.json`).then(res => res.json());
    const post = normalizePostEntry(postData);

    let names = await fetch(`/blog/posts.json`).then(res => res.json());

    let prevTitle = null;
    if (post.prev) {
        prevTitle = names[post.prev]?.title;
    }

    let nextTitle = null;
    if (post.next) {
        nextTitle = names[post.next]?.title;
    }

    return {
        ...post,
        slug: params.file,
        prevTitle,
        nextTitle,
        content: post.content,
    };
}
