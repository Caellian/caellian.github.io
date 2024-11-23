import { visit } from "unist-util-visit";

/**
 * @typedef {Object} CSSProperty
 * @prop {"css-property"} type Node type.
 * @prop {import("unist").Data} [data] Info from the ecosystem.
 * @prop {import("unist").Position} [position] Position of a node in a source document.
 * @prop {string} name CSS property name.
 * @prop {any} value CSS property value.
 * 
 * @typedef {Object} CSSError
 * @prop {"css-error"} type Node type.
 * @prop {import("unist").Data} [data] Info from the ecosystem.
 * @prop {import("unist").Position} [position] Position of a node in a source document.
 * @prop {string} reason Reason for the error.
 * @prop {string} value Value that caused the error.
 * 
 * @typedef {CSSProperty | CSSPropertyBlock} BlockEntry
 * 
 * @typedef {Object} CSSAtRule
 * @prop {"css-at-rule"} type Node type.
 * @prop {import("unist").Data} [data] Info from the ecosystem.
 * @prop {import("unist").Position} [position] Position of a node in a source document.
 * @prop {import("unist").Position} [preludePosition] Position of prelude in a source document.
 * @prop {string} identifier CSS at-rule identifier.
 * @prop {string} [prelude] CSS at-rule prelude.
 * @prop {CSSPropertyBlock[]} children CSS block children.
 * 
 * @typedef {Object} CSSSelector
 * @prop {"css-selector"} type Node type.
 * @prop {import("unist").Data} [data] Info from the ecosystem.
 * @prop {import("unist").Position} [position] Position of the selector in a source document.
 * @prop {string} value CSS path segment.
 * 
 * @typedef {Object} CSSPropertyBlock
 * @prop {"css-block"} type Node type.
 * @prop {import("unist").Data} [data] Info from the ecosystem.
 * @prop {import("unist").Position} [position] Position of a node in a source document.
 * @prop {CSSSelector[]} selectors Selectors this block applies to.
 * @prop {BlockEntry[]} children CSS block entries; can be properties or inner blocks.
 * 
 * @typedef {CSSPropertyBlock | CSSAtRule} CSSBlock
 */

/**
 * Parses CSS properties.
 * @param {string} key Property name.
 * @param {string} value Property value.
 * @param {import("unist").Position} [position] Position of the property in the source.
 * @returns {CSSProperty} Parsed CSS property.
 */
function parseProperty(key, value, position = undefined) {
    return {
        type: "css-property",
        name: key,
        value: value,
        position,
    };
}

/**
 * Parses CSS rule content.
 * @param {string} source Content to parse.
 * @param {number} startIndex Absolute start position in the source.
 * @param {number} [basePos=0] Source start position in the document.
 * @returns {BlockEntry[]} Parsed CSS rule content.
 */
function parseBlockContent(source, startIndex, basePos = 0) {
    let properties = [];
    let index = startIndex;
    let terminated = false;

    while (index < source.length && !terminated) {
        // Skip leading whitespace
        while (index < source.length && isWhitespace(source[index])) {
            index++;
        }

        if (source[index] === '}') {
            terminated = true;
            break;
        }

        const nameStart = index;

        while (index < source.length && source[index] !== ':' && source[index] !== '{') {
            index++;
        }
        const name = source.substring(nameStart, index).trim();
        let nameEnd = nameStart + name.length;

        if (index >= source.length) {
            properties.push({
                type: "css-error",
                position: {
                    start: basePos + nameStart,
                    end: basePos + nameEnd,
                },
                reason: "Dangling property name/selector",
                value: name,
            });
            continue;
        }

        let property = source[index] === ':';
        index++; // Skip ':' or '{'

        if (property) {
            const valueStart = index;
            while (index < source.length && (source[index] !== ';' && source[index] !== '}')) {
                index++;
            }
            const value = source.substring(valueStart, index).trim();

            properties.push(parseProperty(name, value, {
                start: basePos + nameStart,
                end: basePos + index,
            }));

            if (source[index] === '}') {
                terminated = true;
            }
            index++; // Skip ';' or terminator
        } else {
            let block = parseBlockSelectors(name);
            block.children = parseBlockContent(source, index);

            let innerTerminator;
            if (block.children.length > 0) {
                innerTerminator = children[children.length - 1].data.cssast.terminator;
            } else {
                while (index < source.length && source[index] !== '}') {
                    index++;
                }
                innerTerminator = index;
            }

            block.position = {
                start: basePos + nameStart,
                end: basePos + innerTerminator
            };
            properties.push(block);
            index = innerTerminator + 1;
        }
    }

    if (properties.length > 0) {
        let last = properties[properties.length - 1];
        last.data = last?.data ?? {};
        last.data.cssast = last.data.cssast ?? {};
        last.data.cssast.terminator = index;
    }

    return properties;
}

function isWhitespace(char) {
    return char === " " || char === "\t" || char === "\n";
}

/**
 * Parses an at-rule.
 * 
 * @param {string} selector CSS selector text.
 * @returns {CSSAtRule | null} Parsed at-rule, or null if the selector is not an at-rule.
 */
function parseAtSelector(selector) {
    let index = 0;

    if (selector[index] !== '@') {
        return null;
    }
    index++;

    let identifierStart = index;
    while (index < selector.length && !isWhitespace(selector[index])) {
        index++;
    }
    let identifier = selector.substring(identifierStart, index).trim();

    while (index < selector.length && isWhitespace(selector[index])) {
        index++;
    }

    let preludeStart = index;
    while (index < selector.length && selector[index] !== ';' && selector[index] !== '{') {
        index++;
    }
    let prelude = selector.substring(preludeStart, index).trim();

    return {
        type: "css-at-rule",
        identifier,
        prelude,
    };
}

/**
 * Parses a path selector.
 * 
 * @param {string} source CSS source code.
 * @returns {CSSPropertyBlock} Parsed path selector.
 */
function parseBlockSelectors(selector) {
    let index = 0;
    let selectors = [];

    while (index < selector.length) {
        let segmentStart = index;
        while (index < selector.length && selector[index] !== ',') {
            index++;
        }
        let segment = selector.substring(segmentStart, index).trim();
        let segmentEnd = segmentStart + segment.length;

        if (segment.length > 0) {
            selectors.push({
                type: "css-selector",
                value: segment,
                position: {
                    start: segmentStart,
                    end: segmentEnd,
                },
            });
        }
        index++; // Skip ','
    }

    return {
        type: "css-block",
        selectors,
    };
}

/**
 * Parses style into a CSS AST.
 * @param {string} source CSS source code.
 * @param {number} [basePos=0] Source start position in the document.
 * @returns {CSSBlock[]} Parsed CSS blocks.
 */
function parseTopLevelBlocks(source, basePos = 0) {
    let rules = [];
    let index = 0;

    while (index < source.length) {
        // Skip leading whitespace
        while (index < source.length && isWhitespace(source[index])) {
            index++;
        }

        // Take anything until the first '{'
        const selectorStart = index;
        while (index < source.length && source[index] !== '{') {
            index++;
        }

        const selectorText = source.substring(selectorStart, index).trim();
        let selectorEnd = selectorStart + selectorText.length;
        index++; // Skip '{'

        let entry = parseAtSelector(selectorText) || parseBlockSelectors(selectorText);
        if (entry == null) {
            rules.push({
                type: "css-error",
                position: {
                    start: basePos + selectorStart,
                    end: basePos + selectorEnd,
                },
                reason: "Invalid at-rule or css selectors",
                value: selectorText,
            });
            continue;
        }

        entry.children = parseBlockContent(source, index, basePos);
        let terminatorIndex;
        if (entry.children.length > 0) {
            terminatorIndex = entry.children[entry.children.length - 1].data.cssast.terminator;
        } else {
            while (index < source.length && source[index] !== '}') {
                index++;
            }
            terminatorIndex = index;
        }

        entry.position = {
            start: basePos + selectorStart,
            end: basePos + terminatorIndex
        };
        rules.push(entry);
        index = terminatorIndex + 1;
    }

    return rules;
}

/**
 * Parses style into a CSS AST.
 * 
 * @param {string | import("hast").Element | CSSRuleset} style CSS source code.
 * @returns {CSSBlock[]} Parsed CSS entries.
 */
export function parseCssast(style) {
    if (typeof style === "string") {
        return parseTopLevelBlocks(style);
    }
    if (typeof style !== "object") {
        return [];
    }
    if (style.type === "element" && style.tagName === "style") {
        let type = style.properties?.type?.replace(" ", "") ?? "";
        if (type !== "" && type.toLowerCase() !== "text/css") {
            return [];
        }

        if (style.children.length === 0) {
            return [];
        }
        if (style.children.length > 1) {
            throw new Error("Expected only one child node in style element");
        }

        let innerText = style.children[0];
        let text = innerText.value;

        if (text.trim() === "") {
            return [];
        }

        let startPos = innerText.position?.start ?? 0;
        let parsed = parseTopLevelBlocks(text, startPos);

        if (startPos == null) {
            return parsed;
        }

        return parsed;
    }
    if (style.type === "css-rule") {
        return [style];
    }
    return [];
}
