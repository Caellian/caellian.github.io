import { building } from "$app/environment";
import path from "path";
import { LOCAL } from "../paths.config.js";
import fsp from "fs/promises";

/**
 * @param {string} alias
 * @param {string[]} components
 * @returns {string}
 */
export function resolveAliasPath(alias, ...components) {
  if (alias in LOCAL) {
    return path.resolve(
      "./src/" + LOCAL[alias] + components.map((it) => "/" + it)
    );
  }
  let concat = alias + components.map((it) => "/" + it);

  for (const a in LOCAL) {
    if (concat.startsWith(a)) {
      concat = path.resolve("./src/" + LOCAL[a] + concat.slice(a.length));
      break;
    }
  }

  return concat;
}

/**
 * @typedef {object} LocalFileOptions
 * @property {string} [encoding]
 * @property {string} [flag]
 * @property {"json"} [format]
 */

/**
 * @param {string} path
 * @param {any} options
 * @returns {Promise<any>}
 */
export async function localFile(path, options = undefined) {
  if (options?.format === "json") {
    /**
     * @type {any}
     */
    let result = await fsp.readFile(resolveAliasPath(path), {
      encoding: options.encoding || "utf-8",
      flag: options.flag,
    });
    return JSON.parse(result);
  } else {
    return await fsp.readFile(resolveAliasPath(path), options);
  }
}

/**
 * @param {string} path
 * @param {string[]} components
 */
export async function localFileResponse(path, ...components) {
  let resolvedPath = resolveAliasPath(path, ...components);
  let data = await localFile(resolvedPath);
  let contentType = pathToMimeType(resolvedPath) || "application/octet-stream";
  return new Response(data, {
    headers: {
      "content-length": data.byteLength.toString(),
      "content-type": contentType,
      "cache-control": "max-age=3600, s-maxage=3600",
    },
  });
}

/**
 * @typedef {object} MimeInferenceHints
 * @property {"static" | "dynamic" | "audio" | "video"} [use]
 */

/**
 * @param {string} path
 * @param {MimeInferenceHints} [hints]
 * @returns {string | null}
 */
export function pathToMimeType(path, hints = {}) {
  let ext = path.split(".").slice(1).join(".");
  return extToMimeType(ext);
}

/**
 * @type {Map<string, string | ((hints: MimeInferenceHints) => string)>}
 */
const EXT_MIMES = new Map(
  Object.entries({
    "7z": "application/x-7z-compressed",
    bin: "application/octet-stream",
    bmp: "image/bmp",
    css: "text/css",
    csv: "text/csv",
    gif: "image/gif",
    gzip: "application/gzip",
    html: "text/html",
    jpeg: "image/jpeg",
    jpg: "image/jpeg",
    js: "text/javascript", // https://www.ietf.org/rfc/rfc9239.pdf
    json: "application/json",
    mjs: "text/javascript", // https://www.ietf.org/rfc/rfc9239.pdf
    mp4: (hints) => {
      if (hints.use == "audio") {
        return "audio/mp4";
      } else {
        return "video/mp4";
      }
    },
    mp4a: "audio/mp4a",
    ogg: (hints) => {
      if (hints.use == "video") {
        return "video/ogg";
      } else {
        return "audio/ogg";
      }
    },
    pdf: "application/pdf",
    png: "image/png",
    rss: "application/rss+xml",
    svg: "image/svg+xml",
    tar: "application/x-tar",
    tex: "application/x-tex",
    tiff: "image/tiff",
    ttf: "application/x-font-ttf",
    txt: "text/plain",
    wav: "audio/x-wav",
    weba: "audio/webm",
    webm: (hints) => {
      if (hints.use == "audio") {
        return "audio/webm";
      } else {
        return "video/webm";
      }
    },
    woff: "application/x-font-woff",
    xml: "application/xml",
    yaml: "text/yaml",
    yml: "text/yaml",
    zip: "application/zip",
  })
);

/**
 * @param {string} ext file extension
 * @param {MimeInferenceHints} [hints]
 * @returns {string | null}
 */
export function extToMimeType(ext, hints = {}) {
  let normalized = ext;
  if (ext.startsWith(".")) {
    normalized = ext.slice(1);
  }

  let mime = EXT_MIMES.get(normalized) || null;
  if (!mime) {
    return null;
  }

  if (typeof mime === "string") {
    return mime;
  } else if (typeof mime === "function") {
    return mime(hints);
  }
  return null;
}
