import { clamp } from "$lib/util";

export abstract class Color {
  abstract toRGB(): RGB;
  abstract toHSL(): HSL;
  abstract toCSS(): string;
}

export class RGB implements Color {
  constructor(public r: number, public g: number, public b: number) {
    if (!(r >= 0 && r <= 255 && g >= 0 && g <= 255 && b >= 0 && b <= 255)) {
      throw new Error("Invalid RGB color: value not in range [0, 255]");
    }
  }

  static white() {
    return new RGB(255, 255, 255);
  }

  static black() {
    return new RGB(0, 0, 0);
  }

  toCSS(): string {
    return this.toHSL().toCSS();
  }
  toRGB(): RGB {
    return this;
  }
  toHSL(): HSL {
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

  static parse(input: string): RGB | null {
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

  toString(): string {
    return this.toCSS();
  }
}

function hue2rgb(p: number, q: number, t: number) {
  while (t < 0) t += 1;
  while (t > 1) t -= 1;
  if (t < 1 / 6) return p + (q - p) * 6 * t;
  if (t < 1 / 2) return q;
  if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
  return p;
}

const HSLA_RE = /^hsla?\((\d+\.\d+),(\d+%?),(\d+%?),?(\d+\.\d+)?\)$/;

export class HSL implements Color {
  constructor(public h: number, public s: number, public l: number) {
    while (h < 0) {
      h += 360;
    }
    while (h >= 360) {
      h -= 360;
    }
    if (s < 0 || s > 1 || l < 0 || l > 1) {
      throw new Error("Invalid HSL color.");
    }
  }

  static parse(input: string): HSL | null {
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

  toRGB(): RGB {
    console.log(this.toCSS());
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
  toHSL(): HSL {
    return this;
  }

  toCSS(): string {
    return `hsl(${Math.round(this.h)},${Math.round(this.s * 100)}%,${Math.round(
      this.l * 100
    )}%)`;
  }

  toString(): string {
    return this.toCSS();
  }
}

export function parse(input: string): Color | null {
  return RGB.parse(input) || HSL.parse(input);
}

export function lighter(color: Color, percent: number): Color {
  const c = color.toHSL();
  return new HSL(c.h, c.s, clamp(c.l + percent, 0, 1));
}

export function darker(color: Color, percent: number): Color {
  return lighter(color, -percent);
}

export function contrast(color: Color): Color {
  const hsl = color.toHSL();
  hsl.h = (hsl.h + 180) % 360;
  return hsl;
}

export function hueShift(color: Color, degrees: number): Color {
  const hsl = color.toHSL();
  hsl.h = (hsl.h + degrees) % 360;
  return hsl;
}
