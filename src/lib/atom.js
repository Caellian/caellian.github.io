import { BASE_URL } from "$lib/store";

const AUTHORS = `<author>
    <name>Tin Švagelj</name>
    <email>tin.svagelj@live.com</email>
</author>`;

/**
 * @param {string} name
 * @param {string} subtitle
 * @param {import('$lib/posts').PostData[]} content
 * @param {string} [id=BASE_URL]
 * @returns {string}
 */
export function blogAtom(name, subtitle, content = [], id = BASE_URL) {
  let modified = (
    (Array.isArray(content) && content.length > 0 && content[0].dateModified) ||
    new Date()
  )?.toISOString();

  let data = content.map((post) => postAtom(post)).join("\n");

  return `<?xml version="1.0" encoding="utf-8"?>
    <feed xmlns="http://www.w3.org/2005/Atom">
        <title>${name}</title>
        <subtitle>${subtitle}</subtitle>
        <link href="${id}/atom.xml" rel="self"></link>
        <link href="${id}"></link>
        <updated>${modified}</updated>
        ${AUTHORS}
        <id>${id}</id>
        ${data}
    </feed>`;
}

/**
 * @param {import('$lib/posts').PostData} post
 * @returns {string}
 */
export function postAtom(post) {
  let modified = (post.dateModified || post.datePublished).toISOString();
  let published = post.datePublished.toISOString();
  return `<entry>
        <title>${post.name}</title>
        <link href="${BASE_URL}/blog/p/${post.slug}"></link>
        <id>${BASE_URL}/blog/p/${post.slug}</id>
        <updated>${modified}</updated>
        ${modified != published ? `<published>${published}</published>` : ""}
        ${(post.abstract && `\n<summary>${post.abstract}</summary>`) || ""}
    </entry>`;
}
