import { writable } from "svelte/store";
import PickerHSL from "./PickerHSL.svelte";
import { browser } from "$app/environment";

export function rainbow(
    saturation = "100%",
    lightness = "50%",
    gradient = "linear-horizontal"
) {
    const STEP_COUNT = 8;

    const stepSize = 360 / STEP_COUNT;
    let result = `hsl(360deg, ${saturation}, ${lightness})`;
    for (let i = 1; i <= STEP_COUNT; i++) {
        let h = 360 - i * stepSize + "deg";
        result += `, hsl(${h}, ${saturation}, ${lightness})`;
    }

    let direction = "";
    if (gradient == "linear-horizontal") {
        direction = "to right,";
    }

    let gradientName;
    if (gradient == "linear-horizontal") {
        gradientName = "linear-gradient";
    } else if (gradient == "linear-vertical") {
        gradientName = "linear-gradient";
    } else if (gradient == "conic") {
        gradientName = "conic-gradient";
    }

    if (!gradientName) {
        return undefined;
    }

    return `${gradientName}(${direction}${result})`;
}

/**
 * @typedef {Object} HSLColor
 * @prop {ColorSpace} colorSpace
 * @prop {number} h
 * @prop {number} s
 * @prop {number} l
 * @prop {number} a
 * 
 * @typedef {Object} RGBColor
 * @prop {ColorSpace} colorSpace
 * @prop {number} r
 * @prop {number} g
 * @prop {number} b
 * @prop {number} a
 * 
 * @typedef {Object} CYMKColor
 * @prop {ColorSpace} colorSpace
 * @prop {number} c
 * @prop {number} y
 * @prop {number} m
 * @prop {number} k
 * @prop {number} a
 * 
 * @typedef {Object} LabColor
 * @prop {ColorSpace} colorSpace
 * @prop {number} L
 * @prop {number} a
 * @prop {number} b
 * @prop {number} alpha
 * 
 * @typedef {Object} XYZColor
 * @prop {ColorSpace} colorSpace
 * @prop {number} x
 * @prop {number} y
 * @prop {number} z
 * @prop {number} a
 * 
 * @typedef {HSLColor | RGBColor | CYMKColor | LabColor | XYZColor} Color
 * @typedef {"hsl" | "rgb" | "cmyk" | "lab" | "xyz"} ColorSpace
 * 
 * @type {Object.<string, ColorSpace>}
 */
export const CS = Object.freeze({
    HSL: "hsl",
    RGB: "rgb",
    CMYK: "cmyk",
    LAB: "lab",
    XYZ: "xyz",
});

/**
 * @prop {ColorSpace | string} cs
 * @returns {ColorSpace | null} 
 */
export function isCSValid(parsed) {
    if (!parsed) return null;
    let parsedLower = parsed.toLowerCase();
    for (const it of Object.values(CS)) {
        if (parsedLower === it) {
            return parsedLower;
        }
    }

    return null;
}

/**
 * @param {ColorSpace} cs 
 */
export function csName(cs) {
    return cs.toUpperCase()
}

export const DEFAULT = Object.freeze({
    [CS.HSL]: {
        colorSpace: CS.HSL,
        h: 0,
        s: 100,
        l: 50,
        a: 1.,
    },
    [CS.RGB]: {
        colorSpace: CS.RGB,
        r: 0,
        g: 0,
        b: 0,
        a: 1.,
    },
    [CS.CMYK]: {
        colorSpace: CS.CMYK,
        c: 0,
        y: 0,
        m: 0,
        k: 0,
        a: 1.,
    },
    [CS.LAB]: {
        colorSpace: CS.LAB,
        L: 0,
        a: 0,
        b: 0,
        alpha: 1.,
    },
    [CS.XYZ]: {
        colorSpace: CS.XYZ,
        x: 0,
        y: 0,
        z: 0,
        a: 1.,
    },
});

/**
 * @typedef {(color) => string} SliderInit
 * 
 * @typedef {Object} SliderData
 * @prop {string} name
 * @prop {SliderInit} [background]
 * @prop {SliderInit} [backgroundFrom]
 * @prop {SliderInit} [backgroundTo]
 * 
 * @typedef {Object} Control
 * @prop {string} type
 * @prop {model} model
 * @prop {controls} SliderData[]
 * 
 * @param {string} model model name
 * @param {Object.<SliderData[]>} controls 
 * @returns {Control}
 */
function controls(model, controls) {
    return {
        type: "controls",
        model,
        controls,
    }
}

function clipped(min, value, max) {
    let c = value / max - Math.floor(value / max);
    if (c === min) {
        if (value === min) {
            return min;
        } else {
            return max;
        }
    } else {
        return Math.round(c * max);
    }
}

export const ALPHA_SLIDER_DATA = {
    label: "Alpha",
    min: 0,
    max: 100,
    backgroundTo: (current) => {
        return `hsla(${current.h}deg, ${current.s}%, ${current.l}%, 1.0)`
    },
    display: (value) => {
        return `${Math.round(value * 100) / 100}% `
    },
    parse: (value) => {
        if (value.endsWith("%")) {
            value = value.substring(0, value.length - 1)
            value = Number.parseFloat(value) / 100;
        } else {
            value = Number.parseFloat(value);
        }

        value -= Math.floor(value / 100) * 100;

        return value;
    }
};

export const HSL_SLIDERS = controls("HSL", {
    "h": {
        label: "Hue",
        field: "h",
        min: 0,
        max: 360,
        background: () => {
            return rainbow();
        },
        display: (value) => {
            return `${value}°`
        },
        parse: (value) => {
            if (value.endsWith("°")) {
                value = value.substring(0, value.length - 1)
            }

            value = Number.parseFloat(value);
            value = clipped(0, value, 360);

            return value;
        },
    },
    "s": {
        label: "Saturation",
        field: "s",
        min: 0,
        max: 100,
        backgroundFrom: (current) => {
            return `hsla(${current.h}deg, 0%, ${current.l}%, 1.0)`;
        },
        backgroundTo: (current) => {
            return `hsla(${current.h}deg, 100%, ${current.l}%, 1.0)`;
        },
        display: (value) => {
            return `${value}% `
        },
        parse: (value) => {
            if (value.endsWith("%")) {
                value = value.substring(0, value.length - 1)
            }
            value = Number.parseFloat(value);
            value -= Math.max(0, Math.min(value / 100, 1.1));
            return value;
        },
    },
    "l": {
        label: "Lightness",
        field: "l",
        min: 0,
        max: 100,
        background: (current) => {
            return `linear-gradient(to right, hsla(${current.h}deg, ${current.s}%, 0%, 1.0), hsla(${current.h}deg, ${current.s}%, 50%, 1.0), hsl(${current.h}deg, ${current.s}%, 100%, 1.0))`;
        },
        display: (value) => {
            return `${value}% `
        },
        parse: (value) => {
            if (value.endsWith("%")) {
                value = value.substring(0, value.length - 1)
            }

            value = Number.parseFloat(value);
            value -= Math.floor(value / 100) * 100;

            return value;
        },
    },
    "a": {
        ...ALPHA_SLIDER_DATA,
        field: "a",
    }
});

/**
 * @param {Color} color
 */
function asHSL(color) {

}

export const RGB_SLIDERS = controls("RGB", [
    {
        label: "Red",
        field: "r",
        min: 0,
        max: 255,
        backgroundFrom: (current) => {
            return `rgba(0, ${current.g}, ${current.b}, 1.0)`;
        },
        backgroundTo: (current) => {
            return `rgba(255, ${current.g}, ${current.b}, 1.0)`;
        },
    },
    {
        label: "Green",
        field: "g",
        min: 0,
        max: 255,
        backgroundFrom: (current) => {
            return `rgba(${current.r}, 0, ${current.b}, 1.0)`;
        },
        backgroundTo: (current) => {
            return `rgba(${current.r}, 255, ${current.b}, 1.0)`;
        },
    },
    {
        label: "Blue",
        field: "b",
        min: 0,
        max: 255,
        backgroundFrom: (current) => {
            return `rgba(${current.r}, ${current.g}, 0, 1.0)`;
        },
        backgroundTo: (current) => {
            return `rgba(${current.r}, ${current.g}, 255, 1.0)`;
        },
    },
    {
        ...ALPHA_SLIDER_DATA,
        field: "a",
    }
]);

/**
 * @type {Object.<ColorSpace, SliderData>}
 */
export const SLIDERS = Object.freeze({
    [CS.HSL]: HSL_SLIDERS,
    [CS.RGB]: RGB_SLIDERS,
});

function hue2rgb(p, q, t) {
    while (t < 0) t += 1;
    while (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
}
export const _CONVERSION_FUNCTIONS = {
    [CS.HSL]: {
        [CS.RGB]: (hsl) => {
            hsl.h = hsl.h / 350;
            hsl.s = hsl.s / 100;
            hsl.l = hsl.l / 100;
            if (hsl.s == 0) {
                return {
                    ...DEFAULT[CS.RGB],
                    r: hsl.l,
                    g: hsl.l,
                    b: hsl.l,
                    a: hsl.a
                };
            } else {
                const q =
                    hsl.l < 0.5
                        ? hsl.l * (1 + hsl.s)
                        : hsl.l +
                        hsl.s -
                        hsl.l * hsl.s;
                const p = 2 * hsl.l - q;

                return {
                    ...DEFAULT[CS.RGB],
                    r: Math.round(hue2rgb(p, q, hsl.h + 1 / 3) * 255),
                    g: Math.round(hue2rgb(p, q, hsl.h) * 255),
                    b: Math.round(hue2rgb(p, q, hsl.h - 1 / 3) * 255),
                    a: hsl.a
                };
            }
        }
    },
    [CS.RGB]: {
        [CS.HSL]: (rgb) => {
            const r = rgb.r / 255,
                g = rgb.g / 255,
                b = rgb.b / 255;

            const max = Math.max(r, g, b),
                min = Math.min(r, g, b);

            const l = (max + min) / 2;

            if (max == min) {
                return {
                    ...DEFAULT[CS.HSL],
                    h: 0,
                    s: 0,
                    l,
                    a: rgb.a,
                };
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
                return {
                    ...DEFAULT[CS.HSL],
                    h: h * 60,
                    s: (l > 0.5 ? d / (2 - max - min) : d / (max + min)) * 100,
                    l: l * 100,
                    a: rgb.a,
                };
            }
        }
    }
};

/**
 * @param {ColorSpace} from 
 * @param {ColorSpace} to
 * @returns {(Color) => Color}
 */
export function convert(from, to) {
    let fromSpace = from.colorSpace || isCSValid(from);
    let toSpace = to.colorSpace || isCSValid(to);

    return _CONVERSION_FUNCTIONS[fromSpace][toSpace];
}

/**
 * @param {Color} color 
 */
export function colorCSS(color) {
    let model = color.colorSpace;
    switch (model) {
        case CS.RGB:
            return `rgba(${color.r}, ${color.g}, ${color.b}, ${color.a})`
        case CS.HSL:
            return `hsla(${color.h}, ${color.s}, ${color.l}, ${color.a})`
        default:
            break;
    }
    return null;
}

export const COLOR_STORAGE = "color_picker:color";
export const COLOR = writable(null);
COLOR.subscribe((changed) => {
    if (browser) {
        window.localStorage.setItem(COLOR_STORAGE, JSON.stringify(changed))
    }
});
