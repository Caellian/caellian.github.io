import { browser } from "$app/environment";
import { HSL, RGB, type Color } from "./color";
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

type ThemeCss = {
  [id: string]: string;
};

export type ColorList = {
  [id: string]: Color;
};

export interface ThemeSettings {
  primary: Color;
  secondary: Color;
}

export class Theme {
  constructor(public accent: Color, public mode: Mode) {
    const accent_hsl = accent.toHSL();
    accent = new HSL(accent_hsl.h, 1, 0.5);

    if (browser) {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", (event) => {
          mode = event.matches ? Mode.Dark : Mode.Light;
        });
    }
  }

  colorMap(): Map<string, Color> {
    const hsl = this.accent.toHSL();
    const result = new Map();

    if (this.mode == Mode.Light) {
      hsl.l = 0.4;
      result.set("bg", new HSL(0, 0, 0.98));
      result.set("bg-l", "98%");
      result.set("bg-light", new HSL(0, 0, 0.95));
      result.set("bg-light-l", "95%");
      result.set("bg-accent", new HSL(0, 0, 0.9));
      result.set("bg-accent-l", "90%");
      result.set("fg", new HSL(0, 0, 0.1));
      result.set("fg-l", "10%");
      result.set("fg-accent", new HSL(0, 0, 0.2));
      result.set("fg-accent-l", "20%");

      for (let i = STEP_COUNT; i >= 0; i--) {
        const l = (1.0 / STEP_COUNT) * i;
        const color = new HSL(hsl.h, hsl.s, l);
        result.set(`accent-${STEP_COUNT - i}`, color);
        result.set(`accent-${STEP_COUNT - i}-l`, `${Math.round(l * 100)}%`);
      }
    } else if (this.mode == Mode.Dark) {
      hsl.l = 0.45;
      result.set("bg", new HSL(0, 0, 0.1));
      result.set("bg-l", "10%");
      result.set("bg-light", new HSL(0, 0, 0.15));
      result.set("bg-light-l", "15%");
      result.set("bg-accent", new HSL(0, 0, 0.2));
      result.set("bg-accent-l", "20%");
      result.set("fg", new HSL(0, 0, 0.8));
      result.set("fg-l", "80%");
      result.set("fg-accent", new HSL(0, 0, 0.9));
      result.set("fg-accent-l", "90%");

      for (let i = 0; i <= STEP_COUNT; i++) {
        const l = (1.0 / STEP_COUNT) * i;
        const color = new HSL(hsl.h, hsl.s, l);
        result.set(`accent-${i}`, color);
        result.set(`accent-${STEP_COUNT - i}-l`, `${Math.round(l * 100)}%`);
      }
    }

    result.set("accent", hsl);
    result.set("accent-l", `${hsl.l * 100}%`);

    result.set("red", new HSL(0, 0.6, 0.6));
    result.set("orange", new HSL(30, 0.6, 0.6));
    result.set("yellow", new HSL(60, 0.6, 0.6));
    result.set("green", new HSL(120, 0.6, 0.6));
    result.set("aqua", new HSL(150, 0.6, 0.6));
    result.set("cyan", new HSL(180, 0.6, 0.6));
    result.set("blue", new HSL(180, 0.6, 0.6));
    result.set("purple", new HSL(270, 0.6, 0.6));
    result.set("pink", new HSL(300, 0.6, 0.6));
    result.set("magenta", new HSL(330, 0.6, 0.6));

    return result;
  }

  colorCss(): ThemeCss {
    const result: ThemeCss = {};
    for (const [k, v] of this.colorMap().entries()) {
      result[k] = v.toString();
    }
    return result;
  }

  cssVars() {
    return cssVars(this.colorCss());
  }

  styleTag() {
    return `<style>:root{${this.cssVars()}}</style>`;
  }
}

export function load_theme(accent = "#00a4ba") {
  const mode = parse_mode(localStorage.getItem("ui-theme-mode"));
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const theme = new Theme(RGB.parse(accent)!, mode || Mode.Dark);

  if (!mode && window.matchMedia) {
    const mm = window.matchMedia("(prefers-color-scheme: dark)");
    theme.mode = mm.matches ? Mode.Dark : Mode.Light;
    mm.addEventListener("change", (e) => {
      theme.mode = e.matches ? Mode.Dark : Mode.Light;
    });
  }

  return theme;
}
