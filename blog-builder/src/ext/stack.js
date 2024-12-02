/**
 * @typedef {object} LineColumnPath
 * @property {string} scriptName
 * @property {number} [lineNumber]
 * @property {number} [column]
 */
/**
 * Parses a line-column path (e.g. "/some/file.txt:2:12"), into a computer
 * friendly format.
 * @param {string} path - input path to parse.
 * @returns {LineColumnPath} path with separated line-column information.
 */
function parseLCPath(path) {
  let clean = path;
  if (path.startsWith("file://")) {
    clean = path.slice(7);
  }
  if (/^[a-zA-Z0-9]+:\/\//.test(clean)) {
    // got "href://" or something
    let fileParts = clean.split(":");
    return {
      scriptName: fileParts[0] + ":" + fileParts[1],
      lineNumber: Number(fileParts[2]) || undefined,
      column: Number(fileParts[3]) || undefined,
    };
  } else {
    let fileParts = clean.split(":");
    return {
      scriptName: fileParts[0],
      lineNumber: Number(fileParts[1]) || undefined,
      column: Number(fileParts[2]) || undefined,
    };
  }
}

/**
 * @typedef {object} StackEntry
 * @property {boolean} [async] - whether the entry is asynchronous
 * @property {string} [functionName] - called function
 * This can only be `undefined` if entry represents file execution.
 * @property {string} [functionAlias] - export alias of function that was called
 * @property {string} scriptName - name of the resource that contains the script for the function for this call site
 * @property {number} [lineNumber] - number of the line for the associate function call (1-based)
 * @property {number} [column] - column offset on the line for the associated function call (1-based)
 */

/**
 * Format of stack trace like, excluding "at" prefix.
 *
 * e.g. async main [as m] (file:///example/main.js)
 */
const LINE = new RegExp(/(async\s+)?([^\s]+\s+)?(\[as\s(\w+)]\s)?(.*)/);
/**
 * Parses a single line of stack trace.
 * @param {string} line - line that should be parsed
 * @returns {StackEntry} parsing result
 */
function parseStackLine(line) {
  const matches = LINE.exec(line);
  const async = matches[1] ? true : undefined;
  let functionName = matches[2]?.trim();
  let alias = undefined;
  if (matches[3] !== null) {
    alias = matches[4];
  }
  let path = matches[5];
  if (path.startsWith("(")) {
    path = path.slice(1, path.length - 1);
  }
  let cleanPath = parseLCPath(path);
  return {
    async,
    functionName,
    functionAlias: alias,
    ...cleanPath,
  };
}

/**
 * @typedef {string | string[] | RegExp | ((value: string) => boolean)} StringFilter
 * A value that can be used to filter strings.
 */
/**
 * Keeps all array entries until one containing `excluded` is found.
 * @param {string[]} items - items to shift through.
 * @param {StringFilter} filter - an expresion (or many) that act as a filter
 * @param {boolean} [inclusive=false] - whether to include the first matching
 * entry as well
 * @returns {string[]} items until the excluded entry (excluding it, unless
 * `inclusive`)
 */
function keepUntil(items, filter, inclusive = false) {
  /**
   * @type {(item: string)=>boolean}
   */
  let keep = () => true;
  if (typeof filter === "string") {
    keep = (item) => {
      return !item.includes(filter);
    };
  } else if (typeof filter === "function" && filter.length === 1) {
    keep = (item) => {
      return !filter(item);
    };
  } else if (typeof filter === "object" && filter instanceof RegExp) {
    keep = (item) => {
      return !filter.test(item);
    };
  } else {
    keep = (item) => {
      // @ts-ignore
      for (const one of filter) {
        if (item.includes(one)) {
          return false;
        }
      }
      return true;
    };
  }

  let kept = [];
  for (const item of items) {
    if (keep(item)) {
      kept.push(item);
    } else {
      if (inclusive) kept.push(item);
      break;
    }
  }

  return kept;
}

/**
 * Produces structured stack trace information.
 *
 * Ponyfill for [util.getCallSites](https://nodejs.org/api/util.html#utilgetcallsitesframecountoroptions-options).
 * Note: tested only in Node environment.
 * @param {StringFilter | null} [since] - outermost stack entry to remove (and all previous items)
 * @param {StringFilter | null} [until] - innermost stack entry to remove (and all following items)
 * @param {number} [take] - number of stack trace entries to return
 * @returns {StackEntry[]} caller stack trace
 */
export function getCallSites(
  since = null,
  until = "stackEntries",
  take = Infinity
) {
  let stack = Error().stack.split("\n").slice(1); // Skip first "Error" line

  if (until) {
    stack = keepUntil(stack.reverse(), until);
  }
  if (since) {
    stack = keepUntil(stack.reverse(), since);
  }
  stack = stack.map((it) => it.trim().slice(3)); // remove padding and "at" prefix

  let result = [];
  while (result.length < take && result.length < stack.length) {
    // parse only `take` lines
    result.push(parseStackLine(stack[result.length]));
  }
  return result;
}

/**
 * Produces structured stack trace information.
 *
 * Ponyfill for [util.getCallSites](https://nodejs.org/api/util.html#utilgetcallsitesframecountoroptions-options).
 * Note: tested only in Node environment.
 * @param {StringFilter | null} [until] - innermost stack entry to remove (and all following items)
 * @returns {StackEntry} caller location
 */
export function getTopCallSite(until = "callSite") {
  let stack = Error().stack.split("\n").slice(1); // Skip first "Error" line
  if (until) {
    stack = keepUntil(stack.reverse(), until).reverse();
  }
  let result = stack[0].trim().slice(3); // remove padding and "at" prefix
  return parseStackLine(result);
}
