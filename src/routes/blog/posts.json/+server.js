import { json } from "@sveltejs/kit";
import index from "$gen/index.json";

export const prerender = true;

export async function GET() {
    return json(index, {
        headers: {
            "cache-control": "max-age=3600, s-maxage=3600",
        }
    });
}