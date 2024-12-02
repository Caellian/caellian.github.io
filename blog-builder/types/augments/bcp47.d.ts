declare module "bcp47" {
  export function parse(tag: string): BCP47 | null;

  interface BCP47Language {
    language: string;
    extlang: string[];
  }
  interface BCP47LanguageTag {
    language: BCP47Language;
    script: string | null;
    region: string | null;
    variant: string[];
    extension: string[];
    privateuse: string[];
  }
  interface BCP47Gradfathered {
    irregular: string | null;
    regular: string | null;
  }
  interface BCP47 {
    langtag: BCP47LanguageTag;
    privateuse: string[];
    grandfathered: BCP47Gradfathered;
  }
}
