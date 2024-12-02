/**
 * @typedef {{line?: number, column?: number}} SyntaxErrorCause
 */
/**
 * @typedef {SyntaxError & {cause?: SyntaxErrorCause}} ExtSyntaxError
 */

const old_JSON_parse = JSON.parse;
/**
 * @param {any[]} args
 * @returns {any}
 * @throws {ExtSyntaxError} when input JSON is malformed
 */
JSON.parse = (...args) => {
  try {
    return old_JSON_parse.apply(JSON, args);
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
