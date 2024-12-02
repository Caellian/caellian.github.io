/**
 * @template T,R
 * @callback Fn
 * @param {...T} args
 * @returns {R}
 */
/**
 * Memoizes a {@link Function|function}.
 * @template T,R
 * @param {(args: T) => R} fn - function to memoize
 * @returns {(args: T) => R} a memoized version of function
 * @throws {TypeError} if provided parameter isn't a {@link Function|function}.
 */
export function memoize(fn) {
  if (typeof fn !== "function") {
    throw new TypeError("memoize function expects a `function` parameter type");
  }
  let cache = new Map();
  return (...args) => {
    let keyArgs = [...args].slice(0, fn.length);
    let key = JSON.stringify(keyArgs);
    let cached = cache.get(key);
    if (cached) {
      return cached[0];
    }
    // @ts-ignore
    cached = fn.apply(this, keyArgs);
    cache.set(key, cached);
    return cached;
  };
}

/**
 * @param {any} value
 * @returns {string} type name of `value`.
 */
export function typeName(value) {
  if (value === null) {
    return "null";
  } else if (value === undefined) {
    return "undefined";
  } else if (typeof value === "object") {
    if (Array.isArray(value)) {
      let items = value.map(typeName).join(", ");
      return `[${items}]`;
    } else {
      let items = Object.keys(value).join(", ");
      return `${value.constructor?.name || "object"} {${items}}`;
    }
  } else {
    return typeof value;
  }
}

/**
 * @template T type of argument value
 * @param {T} value - original value
 * @returns {T} shallow copy of original value
 */
export function shallowCopy(value) {
  if (typeof value == "object") {
    if (Array.isArray(value)) {
      // @ts-ignore
      return [...value];
    } else {
      return { ...value };
    }
  } else {
    return value;
  }
}

/**
 * @template T type of argument value
 * @param {T} value - original value
 * @returns {T} deep copy of original value
 */
export const deepCopy = structuredClone;

/**
 * Blocks until all object values that are promises have been resolved and then
 * returns a shallow copy of the object with resolved values.
 * @param {Record<string, (Promise<any> | any)>} object
 * @returns {Promise<Record<string, any>>} `object` copy with resolved values.
 */
export async function objectPromiseValues(object) {
  let entries = await Promise.all(
    Object.entries(object).map(async ([k, v]) => {
      const resolved = await Promise.resolve(v);
      return [k, resolved];
    })
  );
  return Object.fromEntries(entries);
}
