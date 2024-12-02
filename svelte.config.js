import adapter from "@sveltejs/adapter-static";
import preprocess from "svelte-preprocess";
import alias from "./src/paths.config.js";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [
    preprocess({
      stylus: {
        prependData: "@import 'src/style/constants';\n",
      },
    }),
  ],

  extensions: [".svelte", ".svx", ".md"],

  kit: {
    adapter: adapter({
      pages: ".svelte-kit/cloudflare",
      assets: ".svelte-kit/cloudflare",
      fallback: "200.html",
      precompress: true,
      hydrate: true,
      router: true,
      prerender: {
        crawl: true,
        enabled: true,
      },
    }),
    prerender: {
      origin: "https://tinsvagelj.net",
    },
    paths: {
      relative: false,
    },
    alias: {
      ...alias,
      "types/*": "./types/*",
    },
  },
};

export default config;
