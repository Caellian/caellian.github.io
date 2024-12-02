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
