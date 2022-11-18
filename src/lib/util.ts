export const BUILD_DATE = new Date().toLocaleDateString();
export const BUILD_TIME = new Date().toLocaleTimeString();

export class Limits {
  private static _ua: String | null;
  private static _mobile: boolean | undefined;
  private static _webkit: boolean | undefined;

  get ua(): String | null {
    return Limits._ua ??= (typeof window !== 'undefined' && window.navigator && window.navigator.userAgent) || null;
  }

  public get is_mobile(): boolean {
    return Limits._mobile ??= this.ua?.match(/(iPhone|iPod|iPad|Android|BlackBerry)/) != null;
  }

  public get is_webkit(): boolean {
    let i = this.ua?.indexOf("WebKit");
    return Limits._webkit ??= i != null && i > -1;
  }
}

export const LIMITS = new Limits();

export function openUrl(url: string, new_tab = true) {
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

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(value, max));
}

export function round_n(value: number, decimals: number = 2) {
  if (decimals < 0) {
    throw new Error(`tried rounding number to ${decimals} decimals`);
  } else if (decimals == 0) {
    return Math.round(value);
  } else {
    Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
  }
}

export function css_style_constructor(
  variables: Record<string, string>,
  prefix: string = ""
): string {
  let builder = "";

  for (const key in variables) {
    const value = variables[key];
    builder += "--" + prefix + key.replace("_", "-") + ":" + value + ";";
  }

  return builder;
}

export function cssVars(variables: Record<string, string>): string {
  return css_style_constructor(variables);
}

export function deboundce<R, T extends any[]>(
  f: (...args: T) => R,
  timeout = 300
) {
  let timer: string | number | NodeJS.Timeout | undefined;
  return (...args: T) => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      f(...args);
    }, timeout);
  };
}

export function chainFn<T extends any[]>(
  head: (...args: T) => any,
  ...tail: Function[]
) {
  return (...params: T) => {
    let result: any = head(...params);
    for (const fn of tail) {
      result = fn(result);
    }
    return result;
  };
}

export function filter_split<E>(iter: Iterable<E>, f: (element: E) => Boolean) {
  let matches = [];
  let rest = [];

  for (const el of iter) {
    if (f(el)) {
      matches.push(el);
    } else {
      rest.push(el);
    }
  }

  return [matches, rest];
}
