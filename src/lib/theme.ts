import { browser } from "$app/environment";
import { darker, HSL, lighter, RGB, type Color } from "./color";
import { cssVars } from "./util";

export enum Mode {
  Dark,
  Light,
}

export function contrast_mode(mode: Mode): Mode {
  switch (mode) {
    case Mode.Dark:
      return Mode.Light;
    case Mode.Light:
      return Mode.Dark;
  }
}

export function parse_mode(name: string | null): Mode | null {
  if (name == null) {
    return null;
  }
  if (name.toLowerCase() === "dark") {
    return Mode.Dark;
  } else if (name.toLowerCase() === "light") {
    return Mode.Light;
  }
  return null;
}

export function mode_to_str(mode: Mode): string {
  switch (mode) {
    case Mode.Dark:
      return "dark";
    case Mode.Light:
      return "light";
  }
}

const STEP_COUNT = 10;

type StyleArg = {
  [id: string]: string;
};

export class Theme {
  constructor(public accent: Color, public mode: Mode) {
    let accent_hsl = accent.toHSL();
    accent = new HSL(accent_hsl.h, 1, 0.5);

    if (browser) {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", (event) => {
          mode = event.matches ? Mode.Dark : Mode.Light;
        });
    }
  }

  colorList() {
    const hsl = this.accent.toHSL();
    const result: StyleArg = {};

    result["accent"] = new HSL(hsl.h, 1, 0.5).toCSS();

    if (this.mode == Mode.Light) {
      result["bg"] = new HSL(0, 0, 0.85).toCSS();
      result["bg-light"] = new HSL(0, 0, 0.9).toCSS();
      result["bg-accent"] = new HSL(0, 0, 1).toCSS();
      result["fg"] = new HSL(0, 0, 0.1).toCSS();
      result["fg-accent"] = new HSL(0, 0, 0.2).toCSS();

      for (let i = STEP_COUNT; i >= 0; i--) {
        const l = (1.0 / STEP_COUNT) * i;
        const color = new HSL(hsl.h, hsl.s, l);
        result[`accent-${STEP_COUNT - i}`] = color.toCSS();
      }
    } else if (this.mode == Mode.Dark) {
      result["bg"] = new HSL(0, 0, 0.1).toCSS();
      result["bg-light"] = new HSL(0, 0, 0.15).toCSS();
      result["bg-accent"] = new HSL(0, 0, 0.2).toCSS();
      result["fg"] = new HSL(0, 0, 0.8).toCSS();
      result["fg-accent"] = new HSL(0, 0, 0.9).toCSS();

      for (let i = 0; i <= STEP_COUNT; i++) {
        const l = (1.0 / STEP_COUNT) * i;
        const color = new HSL(hsl.h, hsl.s, l);
        result[`accent-${i}`] = color.toCSS();
      }
    }

    result["red"] = new HSL(0, 0.6, 0.6).toCSS();
    result["orange"] = new HSL(30, 0.6, 0.6).toCSS();
    result["yellow"] = new HSL(60, 0.6, 0.6).toCSS();
    result["green"] = new HSL(120, 0.6, 0.6).toCSS();
    result["aqua"] = new HSL(150, 0.6, 0.6).toCSS();
    result["cyan"] = new HSL(180, 0.6, 0.6).toCSS();
    result["blue"] = new HSL(180, 0.6, 0.6).toCSS();
    result["purple"] = new HSL(270, 0.6, 0.6).toCSS();
    result["pink"] = new HSL(300, 0.6, 0.6).toCSS();
    result["magenta"] = new HSL(330, 0.6, 0.6).toCSS();

    return result;
  }

  cssVars() {
    return cssVars(this.colorList());
  }

  styleTag() {
    return `<style>:root{${this.cssVars()}}</style>`;
  }
}

export function load_theme() {
  const mode =
    parse_mode(localStorage.getItem("ui-theme-mode")) ||
    (window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? Mode.Dark
      : Mode.Light) ||
    Mode.Dark;

  return new Theme(RGB.parse("#ff7b00"), mode);
}
