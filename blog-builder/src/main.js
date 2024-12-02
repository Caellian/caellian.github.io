// polyfills
import "./ext/error.js";
import "./types.ts";

import E, { __initialize_env_from_main } from "./env.js";
import logger from "./logging/index.js";

/**
 * @type {{[command: string]: Promise<{ default: () => Promise<void> }>}}
 */
export const COMMANDS = {
  build: import("./command/build.js"),
  watch: import("./command/watch.js"),
};

/**
 * Runs the appropriate blog builder command.
 */
export async function main() {
  await __initialize_env_from_main();

  let cmd = E.command;
  logger.info(`Running ${cmd} command...`);
  let command = await COMMANDS[cmd];
  await command.default();
}

export default main;
