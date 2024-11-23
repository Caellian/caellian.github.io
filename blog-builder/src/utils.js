import { toText } from "hast-util-to-text";
import { h } from "hastscript";

/**
 * @param {import("hast").Element} ast
 * @param {import("hast").Element} node
 * @returns {[import("hast").Element, number]} [parent, index_in_parent]
 */
export function findParent(ast, node) {
    let queue = [ast];
    while (queue.length > 0) {
        let curr = queue.shift();
        if (curr.children != null &&
            typeof curr.children.indexOf == "function") {
            let indexOf = curr.children.indexOf(node);
            if (indexOf > -1) {
                return [curr, indexOf];
            }
            queue.push(...curr.children);
        }
    }
    return null;
}

const RE_SPACES = /\s+/g;

/**
 * Normalizes node class names into an array of names.
 * 
 * Returns an empty array if the node is not an element.
 * 
 * @param {import("hast").Node} node
 * @returns {string[]} class names
 */
export function nodeClasses(node) {
    if (node.type != "element") {
        return [];
    }
    let classes = node.properties?.className || "";
    if (typeof classes == "string") {
        classes = classes.split(RE_SPACES);
    }
    return classes.filter(it => it.length > 0);
}

/**
 * @typedef {any} T
 * 
 * @param {T[]} array array to filter
 * @param {(it: T) => any} key selector function
 * @param {boolean} [last=false] whether to keep the first or last item
 * @returns {T[]}
 */
export function uniqueBy(array, key, last = false) {
    let seen = new Set();
    if (last) {
        array = array.reverse();
    }
    array = array.filter(it => {
        let k = key(it);
        if (seen.has(k)) {
            return false;
        }
        seen.add(k);
        return true;
    });
    if (last) {
        array = array.reverse();
    }
    return array;
}
