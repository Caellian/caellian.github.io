import { glob } from "glob";
import { dirname, join, relative } from "path";
import { mkdir, readFile, writeFile, stat } from "fs/promises";
import { existsSync, watch as watchFs } from "fs";

import parseArguments from "args-parser";
import { git, parseGitStatus, GitStatus, fileHistory } from "./git.js";

import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import remarkFrontmatter from "remark-frontmatter";
import remarkMath from "remark-math";

import rehypeRaw from "rehype-raw";
import rehypeRetarget from "./rehype-retarget.js";
import rehypeDynamicScripts from "./rehype-dynamicScripts.js";
import rehypeTreeSitter from "./rehype-codeblocks.js";
import rehypeMathjax from "rehype-mathjax/svg";
import rehypeStringify from "rehype-stringify";

import { read } from "to-vfile";
import { matter } from "vfile-matter";
import { unified } from "unified";
import { parse as parseYaml } from "yaml";

function parser(options = {}) {
  let targetLocation = options.contentPath;

  let parser = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ["yaml"])
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype, {
      allowDangerousHtml: true,
    })
    .use(rehypeRaw) // Process raw HTML into Rehype nodes
    .use(rehypeDynamicScripts, {
      locallyAccessible: options.localContentPath,
      targetLocation,
    });

  if (targetLocation != null) {
    parser = parser.use(rehypeRetarget, {
      targetLocation,
    });
  }

  parser = parser
    .use(rehypeTreeSitter, {
      extraCaptures: [
        "function.macro",
        "variable.macro",
        "lifetime",
        "lifetime.label",
        "reference",
        "reference.keyword",
      ],
    })
    .use(rehypeMathjax, {
      chtml: {
        fontURL: "/mathjax/chtml/fonts/woff-v2",
      },
    })
    .use(rehypeStringify, {
      allowDangerousHtml: true,
    });

  return parser;
}

const IN_DIR = "./posts";
const OUT_DIR = "out";

const INDEX_PATH = join(OUT_DIR, "index.json");
const GITHUB_STATIC = "https://caellian.github.io/blog/";

/**
 * Returns publication and modification dates for argument post, based on Git
 * tree information, and falls back to system time if file is not in tree.
 *
 * If file does not exist (at all), or can't be accessed, a `null` value is
 * returned.
 */
async function getPostTimeInfo(slug) {
  let path = slug + ".md";
  let full_path = join(IN_DIR, path);

  if (!existsSync(full_path)) {
    return null;
  }
  let stats = await stat(full_path);
  if (!stats) {
    return null;
  }
  let result = {
    date: stats.birthtime || stats.mtime || new Date(),
    update: stats.mtime || new Date(),
  };
  let localUpdateTime = result.update;

  let history = await fileHistory(path, {
    cwd: join(process.cwd(), IN_DIR),
  });
  if (history.length == 0) {
    return result;
  }

  result.update = history[0][1];
  result.create = history.at(-1)[1];

  for (let i = history.length - 1; i >= 0; i--) {
    const [sha, date, filename] = history[i];

    let content = await git("show", `${sha}:${filename}`, {
      cwd: join(process.cwd(), IN_DIR),
    });
    if (content.code !== 0) {
      console.error(content);
      continue;
    }
    content = content.stdout;
    
    let segments = content.split("---");
    let frontmatter = null;
    if (segments.length === 3 && segments[0].trim().length === 0) {
      frontmatter = segments[1];
    } else if (segments.length === 2 && segments[0].trim().length > 0) {
      frontmatter = segments[0];
    } else {
      continue;
    }
    try {
      frontmatter = parseYaml(frontmatter);
    } catch (ignore) {
      // frontmatter not found
      continue;
    }

    let published = frontmatter.publish || frontmatter.title != null;
    if (published) {
      result.create = date;
      break;
    }
  }

  let status = await git(
    "status",
    {
      porcelain: true,
      file: path,
    },
    {
      cwd: join(process.cwd(), IN_DIR),
    }
  );

  if (status.code != 0) {
    return result;
  }
  if (status.stdout.trim().length === 0) {
    return result;
  }
  let fileStatus = parseGitStatus(status.stdout)[path] || {
    index: GitStatus.UNMODIFIED,
    workingTree: GitStatus.UNMODIFIED,
  };
  if (
    !(
      fileStatus.index === GitStatus.UNMODIFIED &&
      fileStatus.workingTree === GitStatus.UNMODIFIED
    )
  ) {
    result.update = localUpdateTime;
  }

  return result;
}

async function processFile(slug, options = {}) {
  let path = join(IN_DIR, slug + ".md");
  let stats = await stat(path);
  if (!stats.isFile()) {
    return null;
  }

  const file = await read(path);
  matter(file, { strip: true });
  let metadata = file.data?.matter || {};

  if (metadata.publish === false) {
    return null;
  }

  console.log(`- Processing '${slug}'`);

  let contentPath = "/blog/raw/" + slug;
  let localContentPath = "./posts/" + slug;
  if (options.deploy) {
    contentPath = GITHUB_STATIC + slug;
    localContentPath = GITHUB_STATIC + slug;
  }

  const parsed = await parser({
    contentPath,
    localContentPath,
  }).process(file);
  console.log(`  - '${slug}' done!'`);

  let { create, update } = await getPostTimeInfo(slug);

  return {
    create,
    update,
    publish: metadata.title != null,
    ...metadata,
    content: String(parsed),
  };
}

function filterIndexData(post) {
  return {
    title: post?.title || "",
    summary: post?.summary || "",
    create: post?.create,
    update: post?.update,
    topic: post?.topic || "development",
    tags: post?.tags || [],
  };
}

function fileSlug(path, prefix = IN_DIR) {
  let p = path;
  if (prefix) {
    p = relative(prefix, p);
  }
  return p.replace(/\.md$/, "");
}

function readIndex() {
  return readFile(INDEX_PATH, {
    encoding: "utf-8",
  })
    .then((it) => JSON.parse(it))
    .catch(() => ({}));
}

export async function buildFile(slug, options = {}) {
  let result = null;
  try {
    result = await processFile(slug, options);
  } catch (e) {
    console.error(`Failed to process '${slug}'.\nError:`, e);
  }
  if (result == null) {
    return;
  }

  let outPath = join(OUT_DIR, slug + ".json");
  await mkdir(dirname(outPath), { recursive: true });
  await writeFile(outPath, JSON.stringify(result), {
    encoding: "utf-8",
  });

  return result;
}

export async function build(options = {}) {
  const sources = await glob(join(IN_DIR, "**/*.md"), {
    cwd: process.cwd(),
  });

  let prevIndex = await readIndex();

  let updated = sources;
  if (!options.force) {
    updated = (
      await Promise.all(
        updated.map(async (file) => {
          let slug = fileSlug(file);
          let prev = prevIndex[slug]?.update;
          prev = prev && new Date(prev);
          let status = await getPostTimeInfo(slug);

          if (prev == null || prev <= status.update) {
            return file;
          }
        })
      )
    ).filter((it) => it != null);
    console.log("Found", updated.length, "updated markdown files.");
  } else {
    console.log("Found", updated.length, "markdown files.");
  }

  if (updated.length == 0) {
    console.log("Nothing to do; done.");
    return;
  }

  let results = await Promise.allSettled(
    updated.map(async (file) => {
      let slug = fileSlug(file);
      console.log(`- "${slug}"`);
      let result = await buildFile(slug, options);
      if (result == null) {
        return null;
      }
      return [slug, filterIndexData(result)];
    })
  );

  let builtFiles = results
    .filter((it) => it.status == "fulfilled" && it.value != null)
    .map((it) => it.value);
  console.log("Built", builtFiles.length, "posts!");
  builtFiles = Object.fromEntries(builtFiles);

  console.log(builtFiles);

  // update index
  let index = {
    ...prevIndex,
    ...builtFiles,
  };

  if (existsSync(INDEX_PATH)) {
    console.log("Updating index...");
  } else {
    console.log("Writing index...");
  }

  await writeFile(INDEX_PATH, JSON.stringify(index), {
    encoding: "utf-8",
  });

  console.log("Done!");
}

export async function watch(options = {}) {
  let index = await readIndex();

  let indexUpdate = Promise.resolve();
  async function updateIndex(mutation) {
    if (indexUpdate) {
      await indexUpdate;
    }
    let newIndex = {
      ...index,
      ...mutation,
    };
    indexUpdate = writeFile(INDEX_PATH, JSON.stringify(newIndex), {
      encoding: "utf-8",
    }).then(() => {
      index = newIndex;
    });
  }

  const ac = new AbortController();
  const { signal } = ac;

  process.once("SIGINT", () => ac.abort());
  process.once("SIGTERM", () => ac.abort());

  console.log("Watching for changes...");
  const watcher = watchFs(IN_DIR, { recursive: true });

  watcher.on("error", (err) => {
    console.error(`Watcher error: ${err}`);
  });
  watcher.on("change", async (event, file) => {
    if (event == "change") {
      if (!file.endsWith(".md")) {
        return;
      }
      console.log(`- '${file}' updated.`);
      let slug = fileSlug(file, null);
      let result = await buildFile(slug, options);

      updateIndex({
        [slug]: filterIndexData(result),
      });
    }
  });
  watcher.on("filename", async (event, file) => {
    if (event == "rename") {
      if (!file.endsWith(".md")) {
        return;
      }
      let slug = fileSlug(file, null);
      console.log(`- '${file}' deleted.`);

      updateIndex({
        [slug]: null,
      });
    } else if (event == "add") {
      if (!file.endsWith(".md")) {
        return;
      }
      let slug = fileSlug(file, null);
      console.log(`- '${file}' created.`);
      let result = await buildFile(slug, options);

      updateIndex({
        [slug]: filterIndexData(result),
      });
    }
  });

  signal.addEventListener("abort", async () => {
    watcher.close();
    console.log("Exiting...");
    await indexUpdate;
  });
}

export async function main() {
  let args = parseArguments(process.argv);

  let action = "build";
  if (args.build) {
    delete args["build"];
  }
  if (args.watch) {
    action = "watch";
    delete args["watch"];
  }

  const options = {};
  if (args.force) {
    options.force = true;
  }
  if (!args.dev) {
    options.deploy = true;
  }

  if (action == "build") {
    return await build(options);
  } else if (action == "watch") {
    console.log("Running initial build...");
    await build({ ...options, force: true });
    return await watch(options);
  } else {
    throw new Error(`Unknown action '${action}'`);
  }
}

export default main;
