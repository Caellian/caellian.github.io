import { error, json } from "@sveltejs/kit";
import { normalizePostEntry } from "$lib/posts";

export const prerender = true;

const BASE_PATH = "/blog-builder/out/";

export async function GET({ params }) {
    const posts = import.meta.glob(`$gen/*/**/*.json`);

    const found = Object.entries(posts).find(([it]) => {
        let slug = it.substring(BASE_PATH.length).replace(/\.json$/, "");
        return slug === params.file;
    });

    if (!found) {
        return error(404, "Not found");
    }

    let [path, import_post] = found;

    const postData = await import_post().then(it => it.default);
    const post = normalizePostEntry(postData);

    return json(post, {
        headers: {
            "cache-control": "max-age=3600, s-maxage=3600",
        }
    });
}