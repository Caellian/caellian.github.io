export const BUILD_DATE = new Date().toLocaleDateString();
export const BUILD_TIME = new Date().toLocaleTimeString();

export class Limits {
  /**
   * @type {string | null}
   */
  static _ua;
  /**
   * @type {boolean | undefined}
   */
  static _mobile;
  /**
   * @type {boolean | undefined}
   */
  static _webkit;

  /**
   * @returns {string | null} user agent
   */
  get ua() {
    return (Limits._ua ??=
      (typeof window !== "undefined" &&
        window.navigator &&
        window.navigator.userAgent) ||
      null);
  }

  /**
   * @returns {boolean} true if user is mobile
   */
  get is_mobile() {
    return (Limits._mobile ??=
      this.ua?.match(/(iPhone|iPod|iPad|Android|BlackBerry)/) != null);
  }

  /**
   * @returns {boolean} true if user is webkit
   */
  get is_webkit() {
    const i = this.ua?.indexOf("WebKit");
    return (Limits._webkit ??= i != null && i > -1);
  }
}

export const LIMITS = new Limits();

/**
 * @param {string} url
 * @param {boolean} [new_tab=true]
 */
export function openUrl(url, new_tab = true) {
  if (new_tab) {
    return () => {
      window.open(url, "_blank");
    };
  } else {
    return () => {
      location.href = url;
    };
  }
}

/**
 * Clamp a number between a minimum and maximum value.
 * 
 * @param {number} value value to clamp
 * @param {number} min minimum value
 * @param {number} max maximum value
 * 
 * @returns {number} clamped value
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(value, max));
}

/**
 * Round a number to a given number of decimals.
 * 
 * @param {number} value
 * @param {number} [decimals=2]
 * 
 * @returns {number} rounded number
 */
export function round_n(value, decimals = 2) {
  if (decimals < 0) {
    throw new Error(`tried rounding number to ${decimals} decimals`);
  } else if (decimals == 0) {
    return Math.round(value);
  } else {
    return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
}

/**
 * Converts object properties into a css variable list.
 * 
 * @param {Object.<string, any>} variables
 * @param {string} [prefix=""] optional prefix for css variables
 * 
 * @returns {string} semicolon separated css variable list
 */
export function css_style_constructor(
  variables,
  prefix = ""
) {
  let builder = "";

  for (const key in variables) {
    const value = variables[key];
    builder += "--" + prefix + key.replaceAll("_", "-") + ":" + value + ";";
  }

  return builder;
}

/**
 * @param {Object.<string, string>} variables
 * @returns {string}
 */
export function cssVars(variables) {
  return css_style_constructor(variables);
}

/**
 * Calls a function after a timeout, resetting the timeout if called again.
 * 
 * @param {(...params: any[]) => any} f function to debounce
 * @param {number} [timeout=300] timeout in milliseconds
 * 
 * @returns {(...params: any[]) => any} debounced function
 */
export function debounce(
  f,
  timeout = 300
) {
  let timer;
  return (...args) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      f(...args);
    }, timeout);
  };
}

/**
 * Consecutively call functions with the result of the previous.
 * 
 * @param {(...params: any[]) => any} head first function
 * @param {...((...params: any[]) => any)} tail chained functions
 * 
 * @return {(...params: any[]) => any} composed function chain
 */
export function chainFn(
  head,
  ...tail
) {
  return (...params) => {
    let result = head(...params);
    for (const fn of tail) {
      result = fn(result);
    }
    return result;
  };
}

/**
 * Separate an iterable into two arrays based on a filter function.
 * 
 * @param {any[]} iter iterable
 * @param {(el: any) => boolean} f filter function
 * 
 * @returns {[any[], any[]]} [matches, rest]
 */
export function filter_split(iter, f) {
  const matches = [];
  const rest = [];

  for (const el of iter) {
    if (f(el)) {
      matches.push(el);
    } else {
      rest.push(el);
    }
  }

  return [matches, rest];
}
