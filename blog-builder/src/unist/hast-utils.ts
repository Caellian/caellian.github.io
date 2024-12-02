import {
  Element as HASTElement,
  ElementContent as HASTElementContent,
  ElementData as HASTElementData,
  Properties,
  Text,
} from "rehype";

// fix incorrect HASTElementData use
type Data = HASTElementData | Record<string, unknown>;
type Element = HASTElement & { data?: Data | undefined };
type ElementContent = HASTElementContent | Element;

/**
 * Single text child node.
 */
type SingleText<C> = [{ value: C } & Text, ...ElementContent[]] &
  ElementContent[];
/**
 * Type of children that avoids widening.
 */
type Children<C extends ElementContent[]> = readonly [...C] & ElementContent[];

interface HElementFn {
  <T extends string>(tagName: T): { tagName: T } & Element;
  <T extends string, const P extends Properties>(
    tagName: T,
    properties: P
  ): { tagName: T; properties: P } & Element;
  <T extends string, const C extends Children<TC>, TC extends ElementContent[]>(
    tagName: T,
    children: C
  ): { tagName: T; children: C } & Element;
  <T extends string, const C extends string>(
    tagName: T,
    innerText: C
  ): {
    tagName: T;
    children: SingleText<C>;
  } & Element;
  <
    T extends string,
    const P extends Properties,
    const C extends Children<TC>,
    TC extends ElementContent[],
  >(
    tagName: T,
    properties: P,
    children: C
  ): { tagName: T; properties: P; children: C } & Element;
  <T extends string, const P extends Properties, const C extends string>(
    tagName: T,
    properties: P,
    innerText: C
  ): { tagName: T; properties: P; children: SingleText<C> } & Element;
  <T extends string, const P extends Properties, const D extends Data>(
    tagName: T,
    properties: P,
    data: D
  ): { tagName: T; properties: P; data: D } & Element;
  <
    T extends string,
    const C extends Children<TC>,
    const D extends Data,
    TC extends ElementContent[],
  >(
    tagName: T,
    children: C,
    data: D
  ): { tagName: T; children: C; data: D } & Element;
  <T extends string, const C extends string, const D extends Data>(
    tagName: T,
    innerText: C,
    data: D
  ): { tagName: T; children: SingleText<C>; data: D } & Element;
  <
    T extends string,
    const P extends Properties,
    const C extends Children<TC>,
    const D extends Data,
    TC extends ElementContent[],
  >(
    tagName: T,
    properties: P,
    children: C,
    data: D
  ): { tagName: T; properties: P; children: C; data: D } & Element;
  <
    T extends string,
    const P extends Properties,
    const C extends string,
    const D extends Data,
  >(
    tagName: T,
    properties: P,
    innerText: C,
    data: D
  ): {
    tagName: T;
    properties: P;
    children: SingleText<C>;
    data: D;
  } & Element;
}

/**
 * A type safe version of `hastscript` `h` function. Doesn't work with arbitrary
 * selectors.
 */
export const hElement: HElementFn = ((tagName: string, ...args: any) => {
  const result = {
    type: "element",
    tagName,
  };
  let order = [
    {
      key: "properties",
      check: {},
      default: {},
    },
    {
      key: "children",
      check: [],
      default: [],
    },
    {
      key: "data",
      check: {},
      default: undefined,
    },
  ];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    let current = order.shift();
    if (current == null) {
      throw new TypeError(`invalid argument #${i + 1} provided: ${arg}`);
    }
    if (
      typeof arg === typeof current.check &&
      Array.isArray(arg) === Array.isArray(current.check)
    ) {
      result[current.key] = arg;
    } else if (current.key === "children" && typeof arg === "string") {
      result[current.key] = [hText(arg)];
    } else {
      result[current.key] = current.default;
      i--;
    }
  }
  for (const other of order) {
    if (other.default == null) {
      continue;
    }
    result[other.key] = other.default;
  }
  return result;
}) as undefined as HElementFn;

export function hText(value: string): Text {
  return { type: "text", value };
}
