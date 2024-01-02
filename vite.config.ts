import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import { fileURLToPath } from "url";

export default defineConfig({
  plugins: [sveltekit()],
  resolve: {
    alias: {
      $content: fileURLToPath(new URL("./src/content", import.meta.url)),
      $data: fileURLToPath(new URL("./src/data", import.meta.url)),
      $components: fileURLToPath(new URL("./src/components", import.meta.url)),
    },
  },
  assetsInclude: ["**/*.html"],
});
