import adapter from "@sveltejs/adapter-static";
import preprocess from "svelte-preprocess";
import { mdsvex } from "mdsvex";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: [
    mdsvex(),
    preprocess({
      stylus: {
        prependData: "@import 'src/style/constants';",
      },
    }),
  ],

  extensions: [".svelte", ".svx"],

  kit: {
    adapter: adapter({
      pages: "build",
      assets: "build",
      precompress: true,
      ssr: true,
      hydrate: true,
      router: false,
      prerender: {
        crawl: true,
        enabled: true,
      },
    }),
  },
};

export default config;
