export const prerender = true;

export async function load({ params, fetch }) {
    let posts = await fetch("/blog/posts.json").then(res => res.json());

    const topic = params.topic;
    posts = posts.filter(post => {
        return post.topic == topic;
    });

    return {
        topic,
        posts
    };
}
