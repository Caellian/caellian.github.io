import { parse as bcp47 } from "bcp47";

export class Locale {
  constructor(value) {
    /**
     * @type {import("bcp47").BCP47 | null}
     * @private
     */
    this.data = bcp47(value);
  }

  language() {
    return this.data?.langtag?.language?.language || null;
  }

  region() {
    return this.data?.langtag?.region || null;
  }

  isValid() {
    return this.data != null;
  }

  toString() {
    return this.toISOString();
  }

  toISOString() {
    if (!this.isValid()) {
      return null;
    }
    if (this.region() != null) {
      return `${this.language()}-${this.region()}`;
    } else {
      return this.language();
    }
  }

  static fromJSON(value) {
    return new Locale(value);
  }
  toJSON() {
    return this.toISOString();
  }

  /**
   * @param {string} input
   * @returns {boolean}
   */
  static validateISOString(input) {
    return bcp47(input) != null;
  }
}
