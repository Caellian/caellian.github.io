import { dev } from "$app/environment";
import { readFile } from "fs/promises";

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

const LOCAL_PATH = "blog-builder/posts";
export async function GET({ params }) {
  const file = params.file;

  if (!dev) {
    throw new Error("raw route is not intended for SSG");
  }

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
}
