import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";

import { parse as parseYaml } from "yaml";
import { readSync as readVFile } from "to-vfile";
import { matter as frontmatterVFile } from "vfile-matter";

import {
  git,
  getFileStatus,
  fileHistory,
  GitStatus,
  getLastCommitForDate,
  getCommitDate,
} from "../ext/git.js";
import E from "../env.js";
import { parse } from "../unist/parser.js";
import { typeName } from "../util.js";
import {
  SCHEMA,
  defaultJSValue,
  defaultValue,
  toJSONFormat,
  fromJSONFormat,
  validatePost,
} from "./schema.js";
import logger from "../ext/logging.js";

/**
 * @typedef {import("../unist/parser.js").VFile} VFile
 */
/**
 * @typedef {import("../ext/git.js").Commit} Commit
 */

/**
 * @typedef {string} PostSlug A post path relative to input directory, without
 * {@link POST_EXT} extension.
 *
 * Slug path separators are **always** forward slashes (`/`).
 *
 * A slug can contain any number of components, but it can't be empty.
 *
 * Given some slug `example/post/slug`, the following paths can be obtained:
 * - Post file: {@link E.input|\<input_dir>} + `/example/post/slug` + {@link POST_EXT}
 * - Post related content: {@link E.input|\<input_dir>} + `/example/post/slug/`
 * - Generated data: {@link E.input|\<output_dir>} + `/example/post/slug.json`
 * - Post url: {@link E.hostURL|\<host_url>} + {@link E.postURLSuffix|\<post_url_suffix>} + "example/post/slug"
 */
/**
 * @typedef {Date | Commit} Time A date or commit representing a point in time.
 */

/**
 * Turns slug into a platform dependent path segment.
 * @param {PostSlug} slug
 * @returns {string} platform dependent path segment
 */
export function slugToPath(slug) {
  return slug.split("/").join(path.sep);
}
/**
 * Turns a platform dependent path into a slug.
 * @param {string} file - platform dependant path
 * @returns {PostSlug}
 */
export function pathToSlug(file) {
  let clean = file;
  if (clean.endsWith(POST_EXT)) {
    clean = clean.slice(0, clean.length - POST_EXT.length);
  }
  if (clean.startsWith(path.sep) || clean.startsWith("/")) {
    clean = clean.slice(1);
  }
  return clean.split(path.sep).join("/");
}

/**
 * @enum {string}
 */
export const ArticleStatus = Object.freeze({
  INCOMPLETE: "incomplete",
  DRAFT: "draft",
  PUBLISHED: "published",
  OBSOLETE: "obsolete",
});

/**
 * Post file extension.
 */
export const POST_EXT = ".md";

/**
 * Many-to-one mapping from frontmatter field names to post names
 */
const FRONTMATTER_NAME_MAP = Object.freeze({
  title: "name",
  summary: "abstract",
  date: "datePublished",
  update: "dateModified",
  lang: "inLanguage",
  tags: "keywords",
  topic: "articleSection",
  next: "nextArticle",
  prev: "previousArticle",
});
/**
 * @param {object} data
 * @returns {object}
 */
function cleanupFrontmatter(data) {
  logger.trace("Cleaning up frontmatter data");
  let result = {};
  for (const entry in data) {
    let mapped = FRONTMATTER_NAME_MAP[entry] || entry;
    result[mapped] = data[entry];
  }
  logger.trace({ before: data, after: result }, "Cleaned up frontmatter");

  // explicitly ignore `content` in frontmatter
  if ("articleBody" in result) {
    delete result["articleBody"];
    logger.warn("Removed 'articleBody' from frontmatter");
  }

  return result;
}

export class Post {
  /**
   * @param {PostSlug} slug
   * @param {object} [data]
   */
  constructor(slug, data = {}) {
    /**
     * @type {PostSlug}
     */
    this.slug = slug;
    /**
     * @type {VFile}
     */
    this.file = null;
    /**
     * @type {object}
     */
    this.frontmatter = null;
    /**
     * @type {Date}
     */
    this.datePublished = null;
    /**
     * @type {Date}
     */
    this.dateModified = null;

    /**
     * @type {string} processed article body
     */
    this.articleBody = null;

    this.data = {};
    for (const property in SCHEMA.properties) {
      this.data[property] = defaultJSValue(property);
    }
    Object.assign(this.data, data);

    /**
     * @type {{[key: string]: any}}
     */
    this.cache = {};

    if (data != null) {
      if (typeof data !== "object") {
        throw new TypeError(
          "post data must be an object; got: " + typeName(data)
        );
      }
      for (const value in data) {
        this[value] = data[value];
      }
    }
  }

  /**
   * @param {string} field
   * @returns {any | null}
   */
  get(field) {
    if (Object.hasOwn(this, field)) {
      return this[field];
    }
    return fromJSONFormat(field)(this.data[field]);
  }

  getOrInit(field, init) {
    let value = this.get(field);
    if (!value) {
      value = init();
    }
    this.set(field, value);
    return value;
  }

  async getOrInitAsync(field, init) {
    let value = this.get(field);
    if (!value) {
      value = await init();
    }
    this.set(field, value);
    return value;
  }

  set(field, value) {
    if (Object.hasOwn(this, field)) {
      this[field] = value;
    } else {
      this.data[field] = toJSONFormat(field)(value);
    }
  }

  /**
   * @returns {Promise<object>}
   * @throws {Error} if post uses an entry with schema format that's not supported
   */
  async toJSON() {
    logger.debug("Converting %s to JSON", this.slug);
    const result = {
      type: "article",
      datePublished:
        this.datePublished && toJSONFormat("datePublished")(this.datePublished),
      dateModified:
        this.dateModified && toJSONFormat("dateModified")(this.dateModified),
    };

    const frontmatter = await this.getFrontmatter();
    logger.debug("Cleaning up %s schema properties", this.slug);
    for (const property in SCHEMA.properties) {
      let isRequired = (SCHEMA.required || []).includes(property);
      if (property in frontmatter) {
        if (frontmatter[property] == defaultValue(property) && !isRequired) {
          // don't copy defaults that aren't required
          continue;
        }
        result[property] = frontmatter[property];
      } else if (
        !(property in result || property in frontmatter) &&
        isRequired
      ) {
        result[property] = defaultValue(property);
      }
    }

    // copy other frontmatter properties
    for (const property in frontmatter) {
      if (property in FRONTMATTER_NAME_MAP) {
        continue;
      }
      if (property in SCHEMA.properties) {
        continue;
      }
      result[property] = frontmatter[property];
    }

    result["creativeWorkStatus"] = await this.getArticleStatus();
    logger.debug("%s status: %s", this.slug, result["creativeWorkStatus"]);
    result.articleBody = await this.getOrInitAsync(
      "articleBody",
      this.getContent.bind(this)
    );

    let validationErrors = validatePost(result);
    if (validationErrors) {
      throw new Error("post result doesn't satisfy schema", {
        cause: {
          frontmatter,
          data: { ...result, articleBody: undefined },
          validationErrors,
        },
      });
    }

    return result;
  }

  async toIndexJSON() {
    let result = await this.toJSON();
    delete result["articleBody"];
    if (result["published"] === true) {
      // index assumes a post is published
      delete result["published"];
    }
    return result;
  }

  /**
   * This function is same as constructor, but expects `data` to be in JSON format (e.g. string timestamps instead of `Date`).
   * @param {PostSlug} slug
   * @param {object} data - JSON compatible post data representation
   * @returns {Post}
   */
  static fromJSON(slug, data) {
    let content = data;
    for (const property in SCHEMA.properties) {
      if (!(property in content)) {
        continue;
      }
      if (content[property] == defaultValue(property)) {
        delete content[property];
        continue;
      }
      content[property] = fromJSONFormat(property)(content[property]);
    }

    return new Post(slug, content);
  }

  /**
   * @returns {string} post file path that's relative to posts input directory
   */
  localPath() {
    return slugToPath(this.slug) + POST_EXT;
  }

  /**
   * @returns {string} path to post file including input path
   */
  absolutePath() {
    return path.join(E.input, this.localPath());
  }

  /**
   * @returns {boolean} whether the post file exists
   */
  exists() {
    return fs.existsSync(this.absolutePath());
  }

  /**
   * Synchronously loads the local post file.
   * @returns {VFile}
   */
  getFile() {
    if (this.file) {
      return this.file;
    }
    if (!this.exists()) {
      return null;
    }

    this.file = readVFile(this.absolutePath());
    frontmatterVFile(this.file, { strip: true });
    this.frontmatter = cleanupFrontmatter(this.file.data?.matter || {});

    return this.file;
  }

  /**
   * @returns {Promise<string>}
   * @throws {Error} if post uses an entry with schema format that's not supported
   */
  async getContent() {
    logger.debug("Getting %s article body", this.slug);
    if (this.articleBody != null) {
      logger.trace("%s content cached", this.slug);
      return this.articleBody;
    }

    const file = this.getFile();
    logger.trace("Parsing %s content", this.slug);
    this.articleBody = await parse(file, {
      contentPath: path.join(E.assetURL, this.slug),
      localContentPath: path.join(E.input, this.slug),
    });

    logger.trace("%s parsed", this.slug);
    return this.articleBody;
  }

  /**
   * Returns the post name at a given point in time if the file existed.
   * @param {Time} time - date or commit to query the file name at
   * @returns {Promise<string | null>} name of the post file at given time
   */
  async nameAtTime(time) {
    if (typeof time === "string") {
      // turn commit hash into Date

      const date = await getCommitDate(time, {
        cwd: E.input,
      });
      if (date == null) {
        throw new Error(`commit ${time} not part of git history`);
      }
      this.cache["commit_date"] = this.cache["commit_date"] || {};
      this.cache["commit_date"][time] = date;

      return await this.nameAtTime(date);
    }

    let history = await fileHistory(this.localPath(), {
      cwd: E.input,
    });
    if (history.length == 0) {
      return null;
    }

    for (const [_hash, date, filename] of history) {
      if (date < time) {
        // first commit before given date
        return filename;
      }
    }

    // commit before file was created
    return null;
  }

  /**
   * If time is provided and the post existed for given `time`, then frontmatter
   * will always be returned (even if empty). If the file didn't exist for a
   * given `time`, then `null` value is returned.
   * @param {Time | [Time, string]} [time]
   * @returns {Promise<object | null>} frontmatter object
   */
  async getFrontmatter(time = null) {
    logger.debug(
      { frontmatterTime: time || undefined },
      "Getting %s frontmatter",
      this.slug
    );
    if (time == null) {
      if (this.frontmatter) {
        logger.trace(
          { frontmatterTime: time || undefined },
          "%s frontmatter cached",
          this.slug
        );
        return this.frontmatter;
      }
      if (this.getFile()) {
        return this.frontmatter;
      }
      return {};
    }

    if (time instanceof Date) {
      let hash = await getLastCommitForDate(time, { cwd: E.input });
      if (hash == null) {
        return null;
      }
      return await this.getFrontmatter(hash);
    } else if (Array.isArray(time) && time[0] instanceof Date) {
      let hash = await getLastCommitForDate(time[0], { cwd: E.input });
      if (hash == null) {
        return null;
      }
      return await this.getFrontmatter([hash, time[1]]);
    } else {
      /**
       * @type {string}
       */
      let hash;
      let filename = this.localPath();
      if (typeof time === "string") {
        // assume local path...
        // will circle back if file not found.
        hash = time;
      } else if (Array.isArray(time)) {
        hash = /** @type {string} */ (time[0]);
        filename = time[1];
      } else {
        throw new TypeError(
          "invalid type argument, expected Time; got: " + typeName(hash)
        );
      }

      logger.trace("Accessing file %s for commit %s", filename, hash);
      let content = await git("show", `${hash}:${filename}`, {
        cwd: E.input,
      });
      if (content.code !== 0) {
        if (filename === this.localPath()) {
          throw new Error(
            `can't git show ${filename} for commit hash: ${hash}`
          );
        }
        let actualName = await this.nameAtTime(hash);
        if (actualName == null) {
          return {};
        }
        return this.getFrontmatter([hash, actualName]);
      }
      logger.trace();

      // Don't store old frontmatter
      let frontmatter = stringFrontmatter(content.stdout);
      return frontmatter ? cleanupFrontmatter(frontmatter) : {};
    }
  }

  /**
   * @param {Time | [Time, string] | null} [time]
   * @returns {Promise<ArticleStatus | null>} whether the file was published
   */
  async getArticleStatus(time = null) {
    logger.debug("Checking whether %s is public", this.slug);
    let frontmatter = await this.getFrontmatter(time);
    if (frontmatter == null) {
      logger.trace("No file, %s can't be public (anymore?)", this.slug);
      return ArticleStatus.INCOMPLETE;
    }

    if (frontmatter.name == null || frontmatter.name.length == 0) {
      logger.trace(
        { frontmatter },
        "Frontmatter indicates %s isn't public",
        this.slug
      );
      return ArticleStatus.INCOMPLETE;
    }

    let date = new Date();
    let first = Array.isArray(time) ? time[0] : time;
    if (typeof first === "string") {
      logger.trace("Provided ");
      date = this.cache["commit_date"][first] || getCommitDate(first);
    } else if (first != null) {
      date = first;
    }

    logger.trace(
      { frontmatter },
      "Used date for %s is %s",
      this.slug,
      date.toISOString()
    );
    if (date < new Date("2024-01-07T07:30")) {
      logger.trace(
        { frontmatter },
        "Post %s created before `publish` introduced, using `date` field",
        this.slug
      );
      if (frontmatter.date != null) {
        return ArticleStatus.INCOMPLETE;
      }
    } else {
      logger.trace(
        { frontmatter },
        "Post %s created after `publish` introduced, using `publish` field",
        this.slug
      );
      if (frontmatter.publish === false) {
        return ArticleStatus.INCOMPLETE;
      }
    }

    if (frontmatter.status) {
      let explicitStatus = frontmatter.status;
      if (Object.values(ArticleStatus).includes(explicitStatus)) {
        return explicitStatus;
      } else {
        logger.warn("Invalid explicit article 'status': %s", explicitStatus);
      }
    }

    return ArticleStatus.PUBLISHED;
  }

  /**
   * Updates publication and modification dates for this post, based on Git tree
   * information, and falls back to system time if file is not in git tree.
   *
   * If file does not exist (at all), or can't be accessed, a `null` value is
   * returned.
   * @returns {Promise<{datePublished: Date, dateModified: Date}>}
   */
  async updateTimeInfo() {
    if (!this.exists()) {
      return this;
    }
    let sourceFrontmatter = await this.getFrontmatter();
    if (sourceFrontmatter.date != null) {
      this.datePublished = new Date(sourceFrontmatter.date);
    }

    let stats = await fsp.stat(this.absolutePath());
    if (!stats) {
      return this;
    }

    this.dateModified = stats.mtime || this.datePublished || new Date();

    let history = await fileHistory(this.localPath(), {
      cwd: E.input,
    });
    if (history.length == 0) {
      this.datePublished =
        this.datePublished || stats.birthtime || stats.mtime || new Date();
      return this;
    }

    if (history[0][1] < this.dateModified) {
      this.dateModified = history[0][1];
    }

    if (this.datePublished == null) {
      this.datePublished = history.at(-1)[1];

      for (let i = history.length - 1; i >= 0; i--) {
        const [hash, date, filename] = history[i];
        if (
          (await this.getArticleStatus([hash, filename])) !==
          ArticleStatus.INCOMPLETE
        ) {
          this.datePublished = date;
          break;
        }
      }
    }

    const fileStatus = await getFileStatus(this.localPath(), {
      cwd: E.input,
    });
    if (
      !fileStatus ||
      !(
        fileStatus.index === GitStatus.UNMODIFIED &&
        fileStatus.workingTree === GitStatus.UNMODIFIED
      )
    ) {
      logger.trace(
        "Local changes found for %s; using local modification time as 'update'",
        this.slug
      );
      this.dateModified = stats.mtime || new Date();
    }

    return this;
  }

  displayTimeInfo() {
    let update = "";
    if (this.dateModified != null) {
      update = `;\tupdated: ${this.dateModified.getFullYear()}-${this.dateModified.getMonth() + 1}-${this.dateModified.getDate()} at ${this.dateModified.getHours()}:${this.dateModified.getMinutes()}:${this.dateModified.getSeconds()}`;
    }
    return `published: ${this.datePublished.getFullYear()}-${this.datePublished.getMonth() + 1}-${this.datePublished.getDate()}${update}`;
  }
}

/**
 * @param {string} document
 * @returns {object} parsed document frontmatter
 */
function stringFrontmatter(document) {
  let segments = document.split("---");
  let frontmatter = null;
  if (segments.length === 3 && segments[0].trim().length === 0) {
    frontmatter = segments[1];
    logger.trace(
      { frontmatter },
      "Extracted frontmatter content from segment #2"
    );
  } else if (segments.length === 2 && segments[0].trim().length > 0) {
    frontmatter = segments[0];
    logger.trace(
      { frontmatter },
      "Extracted frontmatter content from segment #1"
    );
  } else {
    return null;
  }
  try {
    const parsed = parseYaml(frontmatter);
    logger.trace({ parsed }, "Frontmatter parsed");
  } catch (ignore) {
    logger.trace({ err: ignore }, "Unable to parse frontmatter");
    return null;
  }
}

export class PostIndex {
  constructor(posts = {}) {
    /**
     * @type {{[slug: PostSlug]: Post}}
     * @public
     */
    this.posts = posts || {};
    this.source = null;
  }

  static fromJSON(json) {
    let result = new PostIndex();
    let posts = json || {};
    if (typeof json === "string") {
      posts = JSON.parse(json);
    } // else object
    result.posts = Object.fromEntries(
      Object.entries(posts).map(([slug, data]) => {
        return [slug, Post.fromJSON(slug, data)];
      })
    );
    return result;
  }

  /**
   * @param {import("fs").PathLike} path
   * @returns {Promise<PostIndex>}
   */
  static async open(path) {
    if (!fs.existsSync(path)) {
      return new PostIndex();
    }
    let result = await fsp
      .readFile(path, { encoding: "utf-8" })
      .then((it) => PostIndex.fromJSON(it));
    result.source = path;
    return result;
  }
}
