import { json } from "@sveltejs/kit";
import { processPostData } from "$lib/posts";
import { orderPosts } from "../../lib/posts";
import { BASE_URL } from "../../lib/store";

export const prerender = true;

function blogAtom(content = []) {
    let updated = (Array.isArray(content) && content.length > 0 && (content[0].update && content[0].update.toISOString() || content[0].date.toISOString())) || new Date().toISOString();

    // mutli-line string
    return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
    <title>tinsvagelj::net</title>
    <subtitle>Tin's personal blog</subtitle>
    <link href="${BASE_URL}/atom.xml" rel="self" />
    <link href="${BASE_URL}" />
    <updated>${updated}</updated>
    <author>
        <name>Tin Švagelj</name>
        <email>tin.svagelj@live.com</email>
    </author>
    <id>${BASE_URL}</id>
    ${content.map(postAtom).join('\n')}
</feed>`;
}

function postAtom(post) {
    let updated = post.update && post.update.toISOString() || post.date.toISOString();
    return `<entry>
    <title>${post.title}</title>
    <link href="${BASE_URL}/blog/${post.slug}" />
    <id>${BASE_URL}/blog/${post.slug}</id>
    <updated>${updated}</updated>
    <content type="html"><![CDATA[${post.content}]]></content>${post.summary && `\n<summary>${post.summary}</summary>` || ''}
</entry > `;
}

export async function GET() {
    const posts = import.meta.glob(`../blog/posts/*.svx`);

    const postResults = [];
    for (const post in posts) {
        let slug = post.split('/').pop().split('.')[0];
        let data = await import(`../blog/posts/${slug}.svx`);
        postResults.push(processPostData({
            ...data.metadata,
            content: data.default,
            slug
        }));
    }
    let content = blogAtom(orderPosts(postResults));

    return new Response(content, {
        headers: {
            "cache-control": "public, max-age=0, s-maxage=3600",
            "content-type": "application/atom+xml"
        }
    });
}