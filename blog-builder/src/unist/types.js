/**
 * @typedef {import("hast").ElementContent} ElementContent
 * @typedef {import("hast").ElementData} ElementData
 * @typedef {import("hast").Properties} Properties
 * @typedef {import("hast").Element} Element
 * @typedef {import("hast").Node} Node
 * @typedef {import("hast").Text} Text
 */
/**
 * @typedef {object} ImgElementProperties
 * @property {string} src
 */
/**
 * @typedef {object} HASTImgElement
 * @property {"element"} type
 * @property {"img"} tagName
 * @property {ElementContent[]} children
 * @property {ImgElementProperties} properties
 */
/**
 * @typedef {object} ScriptElementProperties
 * @property {string} [src]
 * @property {string[]} [className]
 */
/**
 * @typedef {object} HASTScriptElement
 * @property {"element"} type
 * @property {"script"} tagName
 * @property {ElementContent[]} children
 * @property {ScriptElementProperties} properties
 */
