import { BASE_URL } from '$lib/store';
import { processPostData } from '$lib/posts';

const AUTHORS = `<author>
    <name>Tin Švagelj</name>
    <email>tin.svagelj@live.com</email>
</author>`;

export function blogAtom(name, subtitle, content = [], id = BASE_URL) {
    let updated = (Array.isArray(content) && content.length > 0 && content[0].date) || new Date().toISOString();

    return `<?xml version="1.0" encoding="utf-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
        <title>${name}</title >
        <subtitle>${subtitle}</subtitle>
        <link href="${id}/atom.xml" rel="self" />
        <link href="${id}" />
        <updated>${updated}</updated>
        ${AUTHORS}
        <id>${id}</id>
        ${content.map(postAtom).filter(it => it).join('\n')}
    </feed>`;
}

export function postAtom(input) {
    if (!input.published) return null;
    let post = processPostData(input);

    let updated = post.update && post.update.toISOString() || post.date.toISOString();
    let published = post.date.toISOString();
    return `<entry>
        <title>${post.title}</title>
        <link href="${BASE_URL}/blog/p/${post.slug}" />
        <id>${BASE_URL}/blog/p/${post.slug}</id>
        <updated>${updated}</updated>
        ${updated != published ? `<published>${published}</published>` : ""}
        <content type="html"><![CDATA[${post.content}]]></content>${post.summary && `\n<summary>${post.summary}</summary>` || ''}
    </entry>`;
}
