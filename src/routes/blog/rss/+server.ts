import { BLOG, PostRSSInfo } from "$lib/blog";

export const prerender = true;

const URL = "https://caellian.me";

export const GET = async () => {
  const posts = await BLOG.posts();
  const feed = await Promise.all(posts.map((post) => post.rssInfo()));
  feed.sort((a, b) => (a.published < b.published ? 1 : -1));

  const body = render(feed).replace("\n", "");
  const options = {
    headers: {
      "Cache-Control": `max-age=0, s-maxage=3600`,
      "Content-Type": "application/xml",
    },
  };
  return new Response(body, options);
};

const postDescription = (desc: string | undefined) =>
  desc ? `<description>${desc}</description>` : ``;

const renderPost = (post: PostRSSInfo) => `<item>
<guid>${URL}/blog/${post.url}</guid>
<title>${post.title}</title>
<link>${URL}/blog/${post.url}</link>
${postDescription(post.description)}
<pubDate>${new Date(post.published).toUTCString()}</pubDate>
</item>`;

const render = (
  posts: PostRSSInfo[]
) => `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<atom:link href="${URL}/blog/rss" rel="self" type="application/rss+xml" />
<title>caellian::me</title>
<link>${URL}</link>
<description>Tin's blog about computer graphics and Rust</description>
${posts.map(renderPost).join("")}
</channel>
</rss>`;
