import path from "path";
import fs from "fs";

/**
 * @returns {import("vite").PluginOption}
 */
function vitePlugin() {
  return {
    name: "watch-blog-content",
    configureServer(server) {
      const blogContent = path.resolve("./blog-builder/out");
      const pendingReloads = new Map();

      fs.watch(blogContent, { recursive: true }, (_eventType, filename) => {
        if (!filename?.endsWith(".json")) return;

        if (pendingReloads.has(filename)) {
          clearTimeout(pendingReloads.get(filename));
        }

        const timeout = setTimeout(() => {
          pendingReloads.delete(filename);
          try {
            fs.accessSync(path.join(blogContent, filename), fs.constants.R_OK);
            console.log(`Updated blog content: ${filename}`);
            server.ws.send({ type: "full-reload" });
          } catch (_ignore) {
            // file not ready
          }
        }, 200);

        pendingReloads.set(filename, timeout);
      });
    },
  };
}

export { vitePlugin as blog };
export default vitePlugin;
