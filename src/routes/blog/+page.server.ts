import { BLOG, type PostInfo } from "$lib/blog";

export const load = async () => {
  const posts = await Promise.all(
    (await BLOG.posts()).map((post) => post.info())
  );

  posts.sort((a: PostInfo, b: PostInfo) =>
    a.published < b.published ? 1 : -1
  );

  return {
    posts,
  };
};
