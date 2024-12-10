import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import blog from "./blog-builder/vite-watch-content.js";

export default defineConfig({
  plugins: [sveltekit(), blog()],
  assetsInclude: ["**/*.html"],
});
