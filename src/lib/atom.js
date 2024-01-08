import { BASE_URL } from '$lib/store';
import { normalizePostEntry, postDateISO } from '$lib/posts';

const AUTHORS = `<author>
    <name>Tin Švagelj</name>
    <email>tin.svagelj@live.com</email>
</author>`;

export function blogAtom(name, subtitle, content = [], id = BASE_URL) {
    let updated = (Array.isArray(content) && content.length > 0 && content[0].date) || new Date().toISOString();

    let data = Object.entries(content)
        .map(([slug, post]) => postAtom({
            ...normalizePostEntry(post),
            slug
        }))
        .join('\n');

    return `<?xml version="1.0" encoding="utf-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
        <title>${name}</title >
        <subtitle>${subtitle}</subtitle>
        <link href="${id}/atom.xml" rel="self" />
        <link href="${id}" />
        <updated>${updated}</updated>
        ${AUTHORS}
        <id>${id}</id>
        ${data}
    </feed>`;
}

export function postAtom(post) {
    let updated = postDateISO(post.update) || postDateISO(post.create);
    let published = postDateISO(post.create);
    return `<entry>
        <title>${post.title}</title>
        <link href="${BASE_URL}/blog/p/${post.slug}" />
        <id>${BASE_URL}/blog/p/${post.slug}</id>
        <updated>${updated}</updated>
        ${updated != published ? `<published>${published}</published>` : ""}
        ${post.summary && `\n<summary>${post.summary}</summary>` || ""}
    </entry>`;
}
