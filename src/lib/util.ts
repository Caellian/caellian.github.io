export const BUILD_DATE = new Date().toLocaleDateString();
export const BUILD_TIME = new Date().toLocaleTimeString();

export class Limits {
  private static _ua: string | null;
  private static _mobile: boolean | undefined;
  private static _webkit: boolean | undefined;

  get ua(): string | null {
    return (Limits._ua ??=
      (typeof window !== "undefined" &&
        window.navigator &&
        window.navigator.userAgent) ||
      null);
  }

  public get is_mobile(): boolean {
    return (Limits._mobile ??=
      this.ua?.match(/(iPhone|iPod|iPad|Android|BlackBerry)/) != null);
  }

  public get is_webkit(): boolean {
    const i = this.ua?.indexOf("WebKit");
    return (Limits._webkit ??= i != null && i > -1);
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

export function round_n(value: number, decimals = 2) {
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
  prefix = ""
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

export function deboundce<R, T extends unknown[]>(
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

export function chainFn<T extends unknown[]>(
  head: (...args: T) => unknown,
  ...tail: ((arg: unknown) => unknown)[]
) {
  return (...params: T) => {
    let result: unknown = head(...params);
    for (const fn of tail) {
      result = fn(result);
    }
    return result;
  };
}

export function filter_split<E>(iter: Iterable<E>, f: (element: E) => boolean) {
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
