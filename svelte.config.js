import adapter from "@sveltejs/adapter-static";
import preprocess from "svelte-preprocess";
import { mdsvex } from "mdsvex";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [
    mdsvex(),
    preprocess({
      stylus: {
        prependData: "@import 'src/style/constants';\n",
      },
    }),
  ],

  extensions: [".svelte", ".svx"],

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
  },
};

export default config;
