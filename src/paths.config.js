/**
 * Simplified version of `url.fileURLToPath`, that's allowed by vite to be used
 * from SvelteKit.
 *
 * @param {URL | string} fileURL
 * @returns {import("fs").PathLike}
 */
function fileURLToPath(fileURL) {
  /**
   * @type {string}
   */
  let href = /** @type {any} */ (fileURL);
  if (typeof fileURL === "object" && fileURL.constructor.name === "URL") {
    href = fileURL.toString();
  }
  let path = href.replace(/^file:\/\//, "");

  const CHECK = /%[A-F0-9]{2}/g;
  let match = CHECK.exec(path);
  while (match) {
    const substitute = Number(path.slice(match.index, match.index + 3));
    path =
      path.slice(0, match.index) +
      String.fromCharCode(substitute) +
      path.slice(match.index + 3);
    match = CHECK.exec(path);
  }

  if (path.match(/^[A-Z]:/)) {
    path = path.replace("/", "\\");
  }
  return path;
}

/**
 * @param {Record<string, string>} aliases
 * @returns {any}
 */
function defineAliases(aliases) {
  return Object.fromEntries(
    Object.entries(aliases).map(([k, v]) => {
      return [k, fileURLToPath(new URL(v, import.meta.url))];
    })
  );
}

export const LOCAL = {
  $content: "./content",
  $data: "./data",
  $components: "./components",
  $gen: "../blog-builder/out",
  $icons: "../art/icons",
};

/**
 * @type {any}
 */
const ALIAS = defineAliases(LOCAL);
// also update jsconfig.json because it can't be a .js...

export default ALIAS;
