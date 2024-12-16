import type {
  ElementContent,
  ElementData,
  Properties,
  Element,
  Node,
  Text,
  Nodes,
} from "hast";
import { Output } from "./parser.js";

export interface AnnotationData {
  parent: Element;
  /**
   * Location in parent when first discovered.
   */
  index: number;
  prevSibling: Nodes | null;
  nextSibling: Nodes | null;
}

declare module "unist" {
  interface Data {
    annotation?: AnnotationData | undefined;
    markers?: { [marker: string]: boolean } | undefined;
    noCodeblock?: boolean | undefined;
  }
}
declare module "unified" {
  interface CompileResultMap {
    Output: Output;
  }
}

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
