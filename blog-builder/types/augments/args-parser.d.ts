declare module "args-parser" {
  export default function parseArguments(arguments: string[]): {
    [argument: string]: boolean | string | number;
  };
}
