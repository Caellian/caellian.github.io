import parseArguments from "args-parser";
import { parse as parseYaml } from "yaml";
import fs from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { COMMANDS } from "./main.js";
import { pathToSlug, POST_EXT } from "./data/post.js";

/**
 * @typedef {Record<string, (boolean|string|number)>} Arguments
 */
/**
 * @typedef {string} PathLike
 */
/**
 * @typedef {import("pino").LevelWithSilent} LogLevel
 */
/**
 * @typedef {object} CommitEvent
 * @property {string} hash
 * @property {Date} date
 */

/**
 * @typedef Environment build environment
 * @type {object}
 * @property {string} command command being executed
 * @property {PathLike} input directory containing posts to process
 * @property {PathLike} output output directory for generated content
 * @property {boolean} production indicates whether content should be
 * processed/generated for production
 * @property {PathLike} indexPath path of post index relative to {@link output}
 * @property {string | null} assetURL url where post assets will be hosted
 * @property {string | null} hostURL url where blog content will be hosted
 * @property {string} postURLSuffix blog post suffix
 * @property {Arguments} arguments command line arguments
 */

/**
 * Default environment settings.
 * @type {Environment}
 */
const DEFAULT_ENVIRONMENT = {
  command: "build",
  input: "posts",
  output: "out",
  production: true,
  indexPath: "index.json",
  assetURL: null,
  hostURL: null,
  postURLSuffix: "p/",
  arguments: {},
};

const TRUELIKE = ["1", "t", "true", ""];

/**
 * @param {Environment} environment
 */
function applyEnvVariables(environment) {
  environment.input = process.env.BLOG_BUILDER_INPUT || environment.input;
  environment.output = process.env.BLOG_BUILDER_OUTPUT || environment.output;
  environment.production =
    // @ts-ignore
    !TRUELIKE.includes(process.env.BLOG_BUILDER_DEV) || environment.production;
  environment.indexPath =
    process.env.BLOG_BUILDER_INDEX_PATH || environment.indexPath;
  environment.assetURL =
    process.env.BLOG_BUILDER_ASSET_URL || environment.assetURL;
  environment.hostURL =
    process.env.BLOG_BUILDER_HOST_URL || environment.hostURL;
  environment.postURLSuffix =
    process.env.BLOG_BUILDER_HOST_URL || environment.postURLSuffix;
}

/**
 * @param {Environment} environment
 */
function applySettings(environment) {
  const settingsPath = path.join(process.cwd(), "settings.yml");
  if (!fs.existsSync(settingsPath)) {
    return;
  }

  const document = parseYaml(
    fs.readFileSync(settingsPath, { encoding: "utf-8" })
  );

  let devSpecific = {};
  if (document.development) {
    Object.assign(devSpecific, document.development);
    delete document["development"];
  }
  if (document.dev) {
    Object.assign(devSpecific, document.dev);
    delete document["dev"];
  }
  let prodSpecific = {};
  if (document.production) {
    Object.assign(prodSpecific, document.production);
    delete document["production"];
  }
  if (document.prod) {
    Object.assign(prodSpecific, document.prod);
    delete document["prod"];
  }

  if (environment.production) {
    Object.assign(document, prodSpecific);
  } else {
    Object.assign(document, devSpecific);
  }

  // Avoid overwriting runtime-only values
  if (document.command) {
    delete document["command"];
  }
  if (document.arguments) {
    delete document["arguments"];
  }
  for (const c in COMMANDS) {
    if (document[c]) {
      delete document[c];
    }
  }

  Object.assign(environment, document);
}

/**
 * @param {Environment} environment
 */
function detectCommand(environment) {
  let cmd = null;
  for (const c in COMMANDS) {
    if (environment.arguments[c]) {
      cmd = c;
      break;
    }
  }

  if (cmd == null) {
    cmd = "build";
  } else {
    // @ts-ignore
    delete environment[cmd];
  }

  environment.command = cmd;
}

/**
 * Raises an {@link Error} if provided `environment` is invalid.
 * @param {Environment} environment - environment to check
 * @throws {Error}
 */
function validateEnvironment(environment) {
  const e = environment;
  if (e.assetURL == null) {
    throw new Error("Asset hosting URL not provided");
  }
  if (e.hostURL == null) {
    throw new Error("Content hosting URL not provided");
  }
  if (e.postURLSuffix == null) {
    throw new Error("Post URL suffix not set");
  } else if (e.postURLSuffix.startsWith("/")) {
    e.postURLSuffix = e.postURLSuffix.slice(1);
  }
  if (!fs.existsSync(e.input)) {
    throw new Error("Provided input path doesn't exist: " + e.input);
  }
  // Should be ok; more or less
}

/**
 * @type {Environment}
 * @readonly
 */
export const E = structuredClone(DEFAULT_ENVIRONMENT);

let environmentInitialized = false;
/**
 * Initializes {@link E}.
 * @private
 */
export async function __initialize_env_from_main() {
  if (environmentInitialized) {
    return;
  }
  environmentInitialized = true;

  E.arguments = parseArguments(process.argv);

  if (E.arguments.dev) {
    E.production = false;
    delete E.arguments["dev"];
  }

  applySettings(E);
  if (E.arguments != null) {
    // @ts-ignore
    E.input = E.arguments.posts || E.input;
    // @ts-ignore
    E.output = E.arguments.o || E.arguments.output || E.output;
    // @ts-ignore
    E.indexPath = E.arguments.indexPath || E.indexPath;
    // @ts-ignore
    E.assetURL = E.arguments.assetURL || E.assetURL;
    // @ts-ignore
    E.hostURL = E.arguments.hostURL || E.hostURL;
    // @ts-ignore
    E.postURLSuffix = E.arguments.postURLSuffix || E.postURLSuffix;
  }
  applyEnvVariables(E);
  detectCommand(E);

  E.input = fs.realpathSync(E.input);
  E.output = path.resolve(E.output);
  E.indexPath = path.resolve(path.join(E.output, E.indexPath));

  // E.commitHistory = await getCommitHistory();

  validateEnvironment(E);
}

/**
 * @typedef {import("./data/post.js").PostSlug} PostSlug
 */
/**
 * @returns {AsyncGenerator<PostSlug, any, any>}
 * @async
 * @yields {Promise<PostSlug>}
 */
export async function* postSlugs() {
  const sources = promisify(fs.glob)(path.join(E.input, `**/*${POST_EXT}`));
  for await (const item of await sources) {
    let slug = path.relative(E.input, item);
    yield pathToSlug(slug);
  }
}

export default E;
