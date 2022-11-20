import type { Post } from "$lib/blog";

export const GET = async () => {
  const res = await fetch("/blog/posts");
  let body = render(await res.json()).replace("\n", "");
  const headers = {
    "Cache-Control": `max-age=0, s-max-age=600`,
    "Content-Type": "application/xml",
  };
  return new Response(body, { headers });
};

const render = (posts: Post[]) => `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<atom:link href="https://caellian.me/blog/rss" rel="self" type="application/rss+xml" />
<title>Caellian::me</title>
<link>https://caellian.me</link>
<description>Tin's blog about computer graphics and Rust</description>
${posts.map(renderPost).join("")}
</channel>
</rss>`;

const renderPost = (post: Post) => `<item>
<guid>https://caellian.me/blog/${post.url}</guid>
<title>${post.title}</title>
<link>https://caellian.me/blog/${post.url}</link>
<description>${post.description}</description>
<pubDate>${new Date(post.published).toUTCString()}</pubDate>
</item>`;
