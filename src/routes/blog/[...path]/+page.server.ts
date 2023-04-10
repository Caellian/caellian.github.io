import { Blog } from "../../../lib/blog";

async function postTitle(blog: Blog, slug: string) {
  let post = await blog.getPost(slug);
  if (post) {
    return await post.title();
  }
  return undefined;
}

export const load = async ({ params }: { params: { path: string } }) => {
  const blog = new Blog("src/posts");
  const post = await blog.getPost(params.path);
  const postInfo = await post?.info();
  const content = await post?.content();

  const previousTitle =
    postInfo?.previous && postTitle(blog, postInfo?.previous);
  const nextTitle = postInfo?.next && postTitle(blog, postInfo?.next);

  return {
    post: postInfo,
    content,
    previousTitle,
    nextTitle,
  };
};
