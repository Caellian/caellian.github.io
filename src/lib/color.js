import { clamp } from "$lib/util";

/**
 * @abstract
 * @class
 * @classdesc Represents an abstract Color class.
 */
export class Color {
  /**
   * @abstract
   * @returns {RGB} Returns the RGB representation of the color.
   */
  toRGB() { }

  /**
   * @abstract
   * @returns {HSL} Returns the HSL representation of the color.
   */
  toHSL() { }

  /**
   * @abstract
   * @returns {string} Returns the CSS representation of the color.
   */
  toCSS() { }
}

/**
 * Represents a color in RGB format.
 * @implements {Color}
 */
export class RGB {
  /**
   * Creates an instance of RGB.
   * @param {number} r - The red component (0-255).
   * @param {number} g - The green component (0-255).
   * @param {number} b - The blue component (0-255).
   * @throws Will throw an error if the RGB values are out of range [0, 255].
   */
  constructor(r, g, b) {
    if (!(r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255)) {
      throw new Error("Invalid RGB color: value not in range [0, 255]");
    }

    /** @type {number} */
    this.r = r;
    /** @type {number} */
    this.g = g;
    /** @type {number} */
    this.b = b;
  }

  /**
   * Returns a white RGB color.
   * @returns {RGB} The white RGB color.
   */
  static white() {
    return new RGB(255, 255, 255);
  }

  /**
   * Returns a black RGB color.
   * @returns {RGB} The black RGB color.
   */
  static black() {
    return new RGB(0, 0, 0);
  }

  /**
   * Returns the CSS representation of the color.
   * @returns {string} The CSS representation of the color.
   */
  toCSS() {
    return this.toHSL().toCSS();
  }

  /**
   * Returns the RGB representation of the color.
   * @returns {RGB} The RGB representation of the color.
   */
  toRGB() {
    return this;
  }

  /**
   * Returns the HSL representation of the color.
   * @returns {HSL} The HSL representation of the color.
   */
  toHSL() {
    const r = this.r / 255,
      g = this.g / 255,
      b = this.b / 255;

    const max = Math.max(r, g, b),
      min = Math.min(r, g, b);

    const l = (max + min) / 2;

    if (max == min) {
      return new HSL(0, 0, l);
    } else {
      let h;
      const d = max - min;
      switch (max) {
        case r:
          h = (g - b) / d + (g < b ? 6 : 0);
          break;
        case g:
          h = (b - r) / d + 2;
          break;
        default:
          h = (r - g) / d + 4;
          break;
      }
      return new HSL(
        (h / 6) * 360,
        l > 0.5 ? d / (2 - max - min) : d / (max + min),
        l
      );
    }
  }

  /**
   * Parses a color from a string input.
   * @param {string} input - The input string representing a color.
   * @returns {Color | null} The parsed color or null if parsing fails.
   */
  static parse(input) {
    let m = input.match(/^#([0-9a-f]{3})$/i);
    if (m != null) {
      const s = m[1];
      return new RGB(
        parseInt(s.charAt(0), 16) * 0x11,
        parseInt(s.charAt(1), 16) * 0x11,
        parseInt(s.charAt(2), 16) * 0x11
      );
    }

    m = input.match(/^#([0-9a-f]{6})$/i);
    if (m != null) {
      const s = m[1];
      return new RGB(
        parseInt(s.substring(0, 2), 16),
        parseInt(s.substring(2, 4), 16),
        parseInt(s.substring(4, 6), 16)
      );
    }

    return null;
  }

  /**
   * Returns a string representation of the color.
   * @returns {string} The string representation of the color.
   */
  toString() {
    return this.toCSS();
  }
}

/** 
 * @param {number} p
 * @param {number} q
 * @param {number} t
 * @returns {number}
 */
function hue2rgb(p, q, t) {
  while (t < 0) t += 1;
  while (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

const HSLA_RE = /^hsla?\((\d+\.\d+),(\d+%?),(\d+%?),?(\d+\.\d+)?\)$/;

/**
 * Represents a color in HSL format.
 * @implements {Color}
 */
export class HSL {
  /**
   * Creates an instance of HSL.
   * @param {number} h - The hue component (0-359).
   * @param {number} s - The saturation component (0-1).
   * @param {number} l - The lightness component (0-1).
   * @throws Will throw an error if the HSL values are out of range.
   */
  constructor(h, s, l) {
    while (h < 0) {
      h += 360;
    }
    while (h >= 360) {
      h -= 360;
    }
    if (s < 0 || s > 1 || l < 0 || l > 1) {
      throw new Error("Invalid HSL color.");
    }

    /** @type {number} */
    this.h = h;
    /** @type {number} */
    this.s = s;
    /** @type {number} */
    this.l = l;
  }

  /**
   * Parses a color from a string input in HSL format.
   * @param {string} input - The input string representing an HSL color.
   * @returns {HSL | null} The parsed HSL color or null if parsing fails.
   */
  static parse(input) {
    const matches = HSLA_RE.exec(input);
    if (matches) {
      return new HSL(
        parseFloat(matches[1]),
        parseInt(matches[2].substring(0, matches[2].length - 1)) / 100,
        parseInt(matches[3].substring(0, matches[3].length - 1)) / 100
      );
    }

    return null;
  }

  /**
   * Returns the RGB representation of the color.
   * @returns {RGB} The RGB representation of the color.
   */
  toRGB() {
    if (this.s == 0) {
      return new RGB(this.l, this.l, this.l);
    } else {
      const q =
        this.l < 0.5
          ? this.l * (1 + this.s)
          : this.l + this.s - this.l * this.s;
      const p = 2 * this.l - q;

      return new RGB(
        Math.round(hue2rgb(p, q, this.h / 360 + 1 / 3) * 255),
        Math.round(hue2rgb(p, q, this.h / 360) * 255),
        Math.round(hue2rgb(p, q, this.h / 360 - 1 / 3) * 255)
      );
    }
  }

  /**
   * Returns the HSL representation of the color.
   * @returns {HSL} The HSL representation of the color.
   */
  toHSL() {
    return this;
  }

  /**
   * Returns the CSS representation of the color.
   * @returns {string} The CSS representation of the color.
   */
  toCSS() {
    return `hsl(${Math.round(this.h)},${Math.round(this.s * 100)}%,${Math.round(
      this.l * 100
    )}%)`;
  }

  /**
   * Returns a string representation of the color.
   * @returns {string} The string representation of the color.
   */
  toString() {
    return this.toCSS();
  }
}

/**
 * Parses a color from a string input.
 * @param {string} input - The input string representing a color.
 * @returns {Color | null} The parsed color or null if parsing fails.
 */
function parse(input) {
  return RGB.parse(input) || HSL.parse(input);
}

/**
 * Creates a lighter version of the color.
 * @param {Color} color - The input color.
 * @param {number} percent - The percentage by which to lighten the color.
 * @returns {Color} The lighter color.
 */
function lighter(color, percent) {
  const c = color.toHSL();
  return new HSL(c.h, c.s, clamp(c.l + percent, 0, 1));
}

/**
 * Creates a darker version of the color.
 * @param {Color} color - The input color.
 * @param {number} percent - The percentage by which to darken the color.
 * @returns {Color} The darker color.
 */
function darker(color, percent) {
  return lighter(color, -percent);
}

/**
 * Creates a color with adjusted contrast.
 * @param {Color} color - The input color.
 * @returns {Color} The color with adjusted contrast.
 */
function contrast(color) {
  const hsl = color.toHSL();
  hsl.h = (hsl.h + 180) % 360;
  return hsl;
}

/**
 * Shifts the hue of the color.
 * @param {Color} color - The input color.
 * @param {number} degrees - The degree by which to shift the hue.
 * @returns {Color} The color with shifted hue.
 */
function hueShift(color, degrees) {
  const hsl = color.toHSL();
  hsl.h = (hsl.h + degrees) % 360;
  return hsl;
}
