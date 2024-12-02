import fs from "node:fs";

import { CUSTOM_FORMATS, FORMATS } from "./format.js";
import { ValidationError, Validator } from "jsonschema";

/**
 * @typedef {import("json-schema").JSONSchema7} JSONSchema
 * @typedef {import("json-schema").JSONSchema7Type} JSONSchemaType
 * @typedef {import("json-schema").JSONSchema7Definition} JSONSchemaDefinition
 */

/**
 * @type {JSONSchema & {properties: Record<string, JSONSchemaDefinition>}}
 */
export const SCHEMA = ((path) => {
  let schema = fs.readFileSync(path, { encoding: "utf-8" });
  return JSON.parse(schema);
})("./post.schema.json");

/**
 * @param {JSONSchema} schema - schema to use for property format access
 * @param {string} direction - conversion direction
 * @param {string} property - name of the converted property
 * @returns {(any) => any}
 * @throws {Error} if post uses an entry with schema format that's not supported
 */
export function convertJSONFormat(schema, direction, property) {
  let format;
  try {
    if (typeof SCHEMA.properties[property] !== "object") {
      return (it) => it;
    }
    format = SCHEMA.properties[property]?.format;
  } catch (e) {
    if (e instanceof TypeError) {
      e.cause = e.cause || {};
      // @ts-ignore
      e.cause.property = property;
    }
    throw e;
  }
  if (!format) {
    return (it) => it;
  }
  if (!FORMATS[format]) {
    throw new Error(`post entry format '${format}' not supported`, {
      cause: {
        property,
        format,
      },
    });
  }
  return (it) => {
    try {
      return FORMATS[format][direction](it);
    } catch (e) {
      e.cause = e.cause || {};
      e.cause.property = property;
      e.cause.value = it;
      throw e;
    }
  };
}

/**
 * @param {string} property
 * @returns {(any) => any}
 * @throws {Error} if post uses an entry with schema format that's not supported
 */
export const toJSONFormat = (property) =>
  convertJSONFormat(SCHEMA, "toJSON", property);

/**
 * @param {string} property
 * @returns {(any) => any}
 * @throws {Error} if post uses an entry with schema format that's not supported
 */
export const fromJSONFormat = (property) =>
  convertJSONFormat(SCHEMA, "fromJSON", property);

/**
 * Returns the appropriate default (if one exists) as JSON schema value.
 * @param {string} field
 * @returns {JSONSchemaType | null}
 */
export function defaultValue(field) {
  let f = SCHEMA.properties[field];
  if (typeof f !== "object") {
    return null;
  }
  return f.default || null;
}

/**
 * Returns the appropriate default (if one exists) as JS value.
 * @param {string} field
 * @returns {any | null}
 */
export function defaultJSValue(field) {
  let value = defaultValue(field);
  if (value === null) {
    return value;
  }
  return fromJSONFormat(field)(value);
}

/**
 * @type {Validator}
 */
const POST_VALIDATOR = (() => {
  const validator = new Validator();
  validator.customFormats = Object.fromEntries(
    Object.entries(CUSTOM_FORMATS).map(([format, items]) => {
      return [format, items.validate];
    })
  );
  return validator;
})();

/**
 * @param {object} value
 * @returns {ValidationError[] | null}
 */
export function validatePost(value) {
  let errors = POST_VALIDATOR.validate(
    value,
    /** @type {any} */ (SCHEMA)
  ).errors;
  if (errors.length === 0) {
    return null;
  }
  return errors;
}
