import { filter_split } from "./util";

export class Params {
  /**
   * @type {string[]}
   */
  flags;

  /**
   * @param {string[]} [flags=[]]
   */
  constructor(flags = []) {
    this.flags = flags;
  }
}

export class DualFilter {
  constructor(blacklist, whitelist) {
    this.blacklist = blacklist;
    this.whitelist = whitelist;
  }

  check(value) {
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
  /**
   * @type {string[]}
   */
  words;

  /**
   * @type {DualFilter}
   */
  flags;

  /**
   * @param {string} query 
   */
  constructor(query) {
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
