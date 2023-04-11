import { filter_split } from "./util";

export class Params {
  flags: string[] | undefined;
}

export class DualFilter<T> {
  constructor(public blacklist: T[], public whitelist: T[]) {}

  check(value: T) {
    if (this.blacklist.includes(value)) {
      return false;
    }
    if (this.whitelist.includes(value)) {
      return true;
    }
    return false;
  }
}

export class Query {
  words: string[];

  flags: DualFilter<string>;

  constructor(query: string) {
    this.words = query
      .trim()
      .replace(/\s{2,}/, " ")
      .split(" ");
    const [blacklist_flags, rest] = filter_split(this.words, (w) =>
      w.startsWith("!")
    );
    this.flags = new DualFilter(blacklist_flags, rest);
  }
}
