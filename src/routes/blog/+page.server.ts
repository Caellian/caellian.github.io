import { Blog } from "$lib/blog";
import { PostInfo } from "../../lib/blog";

export const load = async () => {
  const blog = new Blog("src/posts");
  const posts = await Promise.all(
    (await blog.posts()).map((post) => post.info())
  );

  posts.sort((a: PostInfo, b: PostInfo) =>
    a.published < b.published ? 1 : -1
  );

  return {
    posts,
  };
};
