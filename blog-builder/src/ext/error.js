const old_JSON_parse = JSON.parse;

/**
 * @typedef {{line?: number, column?: number}} SyntaxErrorCause
 */
/**
 * @typedef {SyntaxError & {cause?: SyntaxErrorCause}} ExtSyntaxError
 */

/**
 * @param {string} text
 * @param {(this: any, key: string, value: any) => any} reviver
 * @returns {any}
 * @throws {SyntaxError & {cause?: {line?: number, column?: number}}} when input JSON is malformed
 */
JSON.parse = (text, reviver = undefined) => {
  try {
    return old_JSON_parse(text, reviver);
  } catch (e) {
    if (e instanceof SyntaxError) {
      let [message, details] = e.message.split("(");
      let line, column;
      if (details?.startsWith("line")) {
        [line, , column] = details.slice(5).split(" ");
      } else {
        throw e;
      }
      throw new SyntaxError(message.trim(), {
        cause: {
          line,
          column,
        },
      });
    } else {
      throw e;
    }
  }
};
