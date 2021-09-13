export function css_style_constructor(
  variables: Record<string, string>,
  prefix: string = ""
): string {
  let builder = "";

  for (const key in variables) {
    const value = variables[key];
    builder += prefix + key.replace("_", "-") + ":" + value + ";";
  }

  return builder;
}

export function css_vars(variables: Record<string, string>): string {
  return css_style_constructor(variables, "--");
}
