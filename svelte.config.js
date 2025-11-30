import adapter from "@sveltejs/adapter-cloudflare";
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
    adapter: adapter(),
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
