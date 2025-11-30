import { building } from "$app/environment";

const minification_options = {
  collapseBooleanAttributes: true,
  collapseWhitespace: true,
  conservativeCollapse: true,
  decodeEntities: true,
  html5: true,
  ignoreCustomComments: [/^#/],
  minifyCSS: true,
  minifyJS: true,
  removeAttributeQuotes: false,
  removeComments: true,
  removeOptionalTags: false,
  removeRedundantAttributes: true,
  removeScriptTypeAttributes: false,
  removeStyleLinkTypeAttributes: true,
  sortAttributes: true,
  sortClassName: true,
};

/** @type {import('@sveltejs/kit').Handle} */
export async function handle({ event, resolve }) {
  const response = await resolve(event);

  if (!building) return response;
  if (response.headers.get("content-type") !== "text/html") return response;
  
  const { minify } = await import("html-minifier");
  const body = await response.text();
  return new Response(minify(body, minification_options), {
    status: response.status,
    headers: response.headers,
  });

  return response;
}

