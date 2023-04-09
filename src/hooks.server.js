import { minify } from "html-minifier";
import { browser } from "$app/environment";

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
  var response = await resolve(event);

  if (!browser && response.headers.get("content-type") === "text/html") {
    response = new Response(
      minify(await response.text(), minification_options),
      {
        status: response.status,
        headers: response.headers,
      }
    );
  }

  return response;
}
