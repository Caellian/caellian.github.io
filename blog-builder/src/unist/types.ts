export type ElementContent = import("hast").ElementContent;
export type ElementData = import("hast").ElementData;
export type Properties = import("hast").Properties;
export type Element = import("hast").Element;
export type Node = import("hast").Node;

export type Text = import("hast").Text;
export interface ImgElementProperties {
  src: string;
}
export interface HASTImgElement {
  type: "element";
  tagName: "img";
  children: ElementContent[];
  properties: ImgElementProperties;
}
export interface ScriptElementProperties {
  src?: string;
  className?: string[];
}
export interface HASTScriptElement {
  type: "element";
  tagName: "script";
  children: ElementContent[];
  properties: ScriptElementProperties;
}
