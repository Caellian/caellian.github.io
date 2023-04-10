import { BLOG } from "$lib/blog";

export const load = async () => {
  const posts = await Promise.all(
    (await BLOG.posts()).map((post) => post.info())
  );

  return {
    posts,
  };
};
