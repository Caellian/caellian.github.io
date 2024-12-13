import { dev } from "$app/environment";
import { error } from "@sveltejs/kit";
import { pathToMimeType } from "$lib/local";
import { readFile } from "fs/promises";

const LOCAL_PATH = "blog-builder/posts";

/** @type {import("@sveltejs/kit").RequestHandler} */
export async function GET({ params }) {
  const file = params.file;

  if (typeof file !== "string") {
    // unreachable
    throw new Error("mising/invalid 'file' route parameter");
  }

  if (!dev) {
    throw new Error("raw route is only intended for development");
  }
  let content;
  try {
    content = await readFile(LOCAL_PATH + "/" + file);
  } catch (noFile) {
    return error(404, {
      message: "Not found",
    });
  }
  return new Response(content, {
    status: 200,
    headers: {
      "Content-Type":
        pathToMimeType(file, { use: "dynamic" }) || "application/octet-stream",
      "Content-Disposition":
        // Use filename* instead of filename to support non-ASCII characters
        `attachment; filename*=UTF-8''${encodeURIComponent(
          file.split("/").at(-1) || ""
        )}`,
    },
  });
}
