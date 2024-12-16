import { Element } from "hast";

export type JsHighlighter = Highlighter;
export declare class Highlighter {
  readonly highlightNames: Array<string>;
  constructor(highlightNames?: Array<string> | undefined | null);
  supportedLanguages(): Array<string>;
  isSupported(language: string): boolean;
  highlight(code: string, language: string): Element;
}
export default Highlighter;
