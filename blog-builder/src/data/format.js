/**
 * @template T
 * @typedef {object} Format
 * @property {(value: string) => T} fromJSON
 * @property {(value: T) => string} toJSON
 * @property {(value: string) => boolean} validate
 */

import { typeName } from "../util.js";
import { Locale } from "./locale.js";

/**
 * @type {{[format: string]: Format<?>}}
 */
export const CUSTOM_FORMATS = {
  /** @type {Format<Locale>} */
  bcp47: {
    fromJSON: (string) => {
      return Locale.fromJSON(string);
    },
    toJSON: (locale) => {
      if (typeof locale != "object" || !(locale instanceof Locale)) {
        throw new TypeError(
          "bcp47 toJSON requires a Locale input; got: " + typeName(locale)
        );
      }
      return locale.toJSON();
    },
    validate: (locale) => {
      return Locale.validateISOString(locale);
    },
  },
  /** @type {Format<string>} */
  "post-slug": {
    fromJSON: (string) => {
      return string;
    },
    toJSON: (slug) => {
      return slug;
    },
    validate: (slug) => {
      return /[0-9A-Za-z]+(\/[0-9A-Za-z]+)*/.test(slug);
    },
  },
};
/**
 * @type {{[format: string]: Format<?>}}
 */
export const FORMATS = {
  /** @type {Format<Date>} */
  date: {
    fromJSON: (string) => {
      return new Date(string);
    },
    toJSON: (date) => {
      if (date.toISOString == null) {
        throw new TypeError(
          "date toJSON requires a Date input; got: " + typeName(date)
        );
      }
      return date.toISOString().split("T")[0];
    },
    validate: (date) => {
      return /^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(date);
    },
  },
  /** @type {Format<Date>} */
  "date-time": {
    fromJSON: (string) => {
      return new Date(string);
    },
    toJSON(datetime) {
      if (datetime.toISOString == null) {
        throw new TypeError(
          "date-time toJSON requires a Date input; got: " + typeName(datetime)
        );
      }
      let isoString = datetime.toISOString();
      return isoString.replace(/.\d{1,3}Z/, "Z");
    },
    validate: (datetime) => {
      return /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}(.[0-9]{3})?(Z|\\+[0-9]{2}:[0-9]{2})$/.test(
        datetime
      );
    },
  },
  ...CUSTOM_FORMATS,
};
