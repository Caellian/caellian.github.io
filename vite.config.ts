import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";
import blog from "./blog-builder/vite-watch-content.js";
import fs from "fs";
import path from "path";

export default defineConfig({
  plugins: [
    sveltekit(),
    blog(),
    {
      name: "raw-assets-handler",
      apply: "serve",
      configureServer(server) {
        server.middlewares.use("/blog/raw/", (req, res, next) => {
          const filePath = path.join(
            process.cwd(),
            "blog-builder/posts",
            req.url
          );
          if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
            res.end(fs.readFileSync(filePath));
          } else {
            next();
          }
        });
      },
    },
  ],
  assetsInclude: ["**/*.html"],
});
