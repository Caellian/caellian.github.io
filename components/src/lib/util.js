export function assertType(value, type = null, name = null) {
    if (type != null && (typeof value != type || (value === null && type !== "null"))) {
        let insert = "";
        if (name != null) {
            insert = `${name} value`;
        }

        if (value === undefined) {
            throw new Error(`Missing ${insert}; expected a ${type}`);
        }

        if (name != null) {
            insert = `${name} value to be `;
        }
        if (value === null && type !== "null") {
            throw new Error(`Expected ${insert}${type}; got null`);
        }
        throw new Error(`Expected ${insert}${type}; got ${typeof value}`);
    }
    return value;
}
