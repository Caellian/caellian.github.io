import YAML from "yaml";
import { assertType } from "./util";

/**
 * @typedef {object} ChartEntry
 * @prop {string} [name]
 * @prop {string} [color]
 * @prop {number} weight
 * 
 * @param {string} list
 * @returns {ChartEntry[]}
 */
function parseList(list) {
    const document = YAML.parse(list);

    if (document == null) {
        return [];
    }

    let result = null;
    try {
        if (Array.isArray(document)) {
            result = document.map(weight => ({
                weight: assertType(weight, "number", "weight")
            }));
        } else if (typeof document === "object") {
            result = Object.entries(document).map(([name, data]) => ({
                name,
                color: data.color && assertType(data.color, "string", "color"),
                weight: assertType(data.weight, "number", "weight")
            }));
        }
        return result;
    } catch (e) {
        console.error("Invalid chart list:", e);
    }
}