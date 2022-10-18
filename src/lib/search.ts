import { filter_split } from "./util";

export class Params {
    flags: string[] | undefined;
}

export class DualFilter<T> {
    constructor(public blacklist: T[], public whitelist: T[]) { }

    function check(value: T) {

    }
}

export class Query {
    words: string[];

    flags: DualFilter<string>;

    constructor(query: string) {
        this.words = query.trim().replace(/\s{2,}/, " ").split(" ");
        let [blacklist_flags, rest] = filter_split(this.words, (w) => w.startsWith("!"));
        this.flags = new DualFilter(new Params(), new)
    }
}

export function filter_results<R>() {

}
