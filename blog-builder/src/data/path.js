/**
 * @template A,B
 * @typedef {import("../types.ts").Either<A, B>} Either
 */

import path from "node:path";

/**
 * @param {string} path
 * @returns {Either<string, PathError>}
 */
function flattenStrPath(path) {
  const segments = [];
  for (const segment of path.split("/")) {
    if (segment === ".") {
      if (segments.length === 0) {
        segments.push(".");
      }
    } else if (segment === "..") {
      const top = segments.pop();
      if (!top) {
        return [null, new PathError(PathErrorCause.NOT_FLAT)];
      }
    } else {
      segments.push(segment);
    }
  }
  return [segments.join("/"), null];
}

/**
 * @param {string | URL} path
 * @returns {Either<string | URL, PathError>}
 */
export function flattenPath(path) {
  if (typeof path === "string") {
    return flattenStrPath(path);
  } else {
    return [path, null];
  }
}

/**
 * @callback URLAppend
 * @param {URL} basePath
 * @param {string | URL} path
 * @returns {URL}
 */

/**
 * @callback URLAppendToString
 * @param {string} basePath
 * @param {string | URL} path
 * @returns {URL | string}
 */

/**
 * @type {URLAppend | URLAppendToString}
 * @param {URL | string | null} base
 * @param {string | URL} appended
 * @returns {URL | string}
 */
export function urlAppend(base, appended) {
  if (appended instanceof URL) {
    return appended;
  } else if (appended == null) {
    return base;
  }
  if (base == null) {
    return appended;
  }

  let baseHost = /** @type {URL} */ (base);
  let basePrefix = "";
  if (typeof base === "string") {
    if (base.length === 0) {
      return appended;
    }
    try {
      baseHost = new URL(base);
      basePrefix = baseHost.pathname;
    } catch (_not_valid_url) {
      if (appended.startsWith("/")) {
        return appended;
      } else {
        return path.join(base, appended);
      }
    }
  } else {
    basePrefix = baseHost.pathname;
  }

  try {
    return new URL(appended);
  } catch (_ignore) {}

  if (appended.startsWith("/")) {
    return new URL(appended, baseHost);
  } else if (appended.startsWith(".")) {
    if (basePrefix.endsWith("/")) {
      return new URL(basePrefix + appended, baseHost);
    } else {
      return new URL(basePrefix + "/" + appended, baseHost);
    }
  } else {
    if (basePrefix.endsWith("/")) {
      return new URL(basePrefix + appended, baseHost);
    } else {
      return new URL(basePrefix + "/" + appended, baseHost);
    }
  }
}

/**
 * @param {string} first
 * @param {string} second
 * @returns {string}
 */
export function urlJoin(first, second) {
  if (first.endsWith("/") || second.startsWith("/")) {
    return first + second;
  } else {
    return first + "/" + second;
  }
}

/**
 * @enum {string}
 */
const PathErrorCause = Object.freeze({
  NOT_FLAT: "not flattenable",
});

class PathError extends Error {
  /**
   * @param {PathErrorCause} cause
   */
  constructor(cause) {
    super(cause);
  }
}
