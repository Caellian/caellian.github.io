import { json } from "@sveltejs/kit";
import { dev } from "$app/environment";
import { readFile } from "fs/promises";

export const prerender = true;

const LOCAL_PATH = "blog-builder/posts";
const REPO_URL =
  "https://raw.githubusercontent.com/Caellian/blog/refs/heads/main/";

function getFileType(path) {
  if (path.endsWith(".js")) {
    return "text/javascript";
  } else if (path.endsWith(".css")) {
    return "text/css";
  } else if (path.endsWith(".json")) {
    return "application/json";
  } else {
    return "application/octet-stream";
  }
}

export async function GET({ params }) {
  const file = params.file;

  if (dev) {
    let content = await readFile(LOCAL_PATH + "/" + file);
    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": getFileType(file),
        "Content-Disposition":
          // Use filename* instead of filename to support non-ASCII characters
          `attachment; filename*=UTF-8''${encodeURIComponent(
            file.split("/").at(-1)
          )}`,
      },
    });
  } else {
    // Here's a large secret that makes both GitHub and Cloudflare hate him
    const remote = REPO_URL + file;
    return new Response(null, {
      status: 302,
      headers: {
        Location: remote,
        "Content-Type": getFileType(file),
        "Content-Disposition":
          // Use filename* instead of filename to support non-ASCII characters
          `attachment; filename*=UTF-8''${encodeURIComponent(
            file.split("/").at(-1)
          )}`,
      },
    });
  }
}
