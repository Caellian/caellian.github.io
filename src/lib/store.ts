import { writable } from "svelte/store";
import { RGB } from "./color";
import { Mode, mode_to_str, Theme } from "./theme";

export const theme = writable(new Theme(RGB.parse("#14a7eb"), Mode.Dark));
theme.subscribe((t: Theme) => {
  if (typeof localStorage !== "undefined") {
    localStorage.setItem("ui-theme-mode", mode_to_str(t.mode));
  }
});
