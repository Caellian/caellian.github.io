import { BLOG } from "$lib/blog";

async function postTitle(slug: string) {
  const post = await BLOG.getPost(slug);
  if (post) {
    return await post.title();
  }
  return undefined;
}

export const load = async ({ params }: { params: { path: string } }) => {
  const post = await BLOG.getPost(params.path);
  const postInfo = await post?.info();
  const content = await post?.content();

  const previousTitle = postInfo?.previous && postTitle(postInfo?.previous);
  const nextTitle = postInfo?.next && postTitle(postInfo?.next);

  return {
    post: postInfo,
    content,
    previousTitle,
    nextTitle,
  };
};
