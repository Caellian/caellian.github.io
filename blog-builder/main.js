import { glob } from 'glob';
import { dirname, join, relative } from 'path';
import { mkdir, readFile, writeFile, stat } from 'fs/promises';
import { watch as watchFs } from 'fs';

import parseArguments from 'args-parser';
import simpleGit from 'simple-git';

import remarkGfm from 'remark-gfm'
import remarkParse from 'remark-parse'
import remarkRehype from 'remark-rehype'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMath from 'remark-math'

import rehypeMathjax from 'rehype-mathjax/chtml'
import rehypeMermaid from 'rehype-mermaid'
import rehypeStringify from 'rehype-stringify'

import { read } from 'to-vfile'
import { matter } from 'vfile-matter'
import { unified } from 'unified'
import rehypeTreeSitter from './rehype-codeblocks.js'

const PARSER = unified()
    .use(remarkParse)
    .use(remarkFrontmatter, ["yaml"])
    .use(remarkGfm)
    .use(remarkMath)
    .use(remarkRehype)
    .use(rehypeTreeSitter, {
        extraCaptures: [
            "function.macro",
            "variable.macro",
            "lifetime",
            "lifetime.label",
            "reference",
            "reference.keyword"
        ]
    })
    .use(rehypeMathjax, {
        chtml: {
            fontURL: '/mathjax/chtml/fonts/woff-v2'
        }
    })
    .use(rehypeMermaid)
    .use(rehypeStringify);

const IN_DIR = "./posts";
const OUT_DIR = "out";

const INDEX_PATH = join(OUT_DIR, "index.json");

/**
 * Returns create and modify dates for a given file.
 */
async function getGitInfo(slug) {
    let path = slug + ".md";

    let stats = await stat(join(IN_DIR, path));
    if (!stats) {
        return {
            date: null,
            update: null
        }
    }

    let git = simpleGit(IN_DIR, {
        baseDir: join(process.cwd(), IN_DIR)
    });
    let log = await git.log({
        file: path
    });

    let create = new Date(log.all.at(-1).date);
    let update = new Date(log.latest.date);

    return {
        create,
        update
    }
}

async function processFile(slug) {
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

    console.log(`- Processing '${slug}'`)
    const parsed = await PARSER.process(file);
    console.log(`  - '${slug}' done!'`)

    let {
        create,
        update
    } = await getGitInfo(slug);

    return {
        create,
        update,
        publish: metadata.title != null,
        ...metadata,
        content: String(parsed)
    }
}

function filterIndexData(post) {
    return {
        title: post?.title || "",
        summary: post?.summary || "",
        create: post?.create,
        update: post?.update,
        topic: post?.topic || "development",
        tags: post?.tags || [],
    }
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
        encoding: "utf-8"
    }).then(it => JSON.parse(it)).catch(() => ({}));
}

export async function buildFile(slug) {
    let result = null;
    try {
        result = await processFile(slug);
    } catch (e) {
        console.error(`Failed to process '${slug}'.\nError:`, e);
    }
    if (result == null) {
        return;
    }

    let outPath = join(OUT_DIR, slug + ".json");
    await mkdir(dirname(outPath), { recursive: true });
    await writeFile(outPath, JSON.stringify(result), {
        encoding: "utf-8"
    });

    return result;
}

export async function build(options = {}) {
    const sources = await glob(join(IN_DIR, "**/*.md"), {
        cwd: process.cwd(),
    })

    let prevIndex = await readIndex();

    let updated = sources;
    if (!options.force) {
        updated = (await Promise.all(updated.map(async file => {
            let slug = fileSlug(file);
            let prev = prevIndex[slug];
            let status = await getGitInfo(slug);

            if (prev == null || prev.update <= status.update) {
                return file;
            }
        }))).filter(it => it != null);
        console.log("Found", updated.length, "updated markdown files.")
    } else {
        console.log("Found", updated.length, "markdown files.")
    }

    if (updated.length == 0) {
        console.log("Nothing to do; done.")
        return;
    }

    let results = await Promise.allSettled(updated.map(async file => {
        let slug = fileSlug(file);
        let result = await buildFile(slug);
        if (result == null) {
            return null;
        }
        return [slug, filterIndexData(result)];
    }));

    let builtFiles = results.filter(it => it.status == "fulfilled" && it.value != null).map(it => it.value);
    console.log("Built", builtFiles.length, "posts!")
    builtFiles = Object.fromEntries(builtFiles);

    // update index
    let index = {
        ...prevIndex,
        ...builtFiles
    };

    console.log("Writing index...")

    await writeFile(INDEX_PATH, JSON.stringify(index), {
        encoding: "utf-8"
    });

    console.log("Done!")
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
            ...mutation
        };
        indexUpdate = writeFile(INDEX_PATH, JSON.stringify(newIndex), {
            encoding: "utf-8"
        }).then(() => {
            index = newIndex;
        });
    }

    const ac = new AbortController();
    const { signal } = ac;

    process.once("SIGINT", () => ac.abort());
    process.once("SIGTERM", () => ac.abort());


    console.log("Watching for changes...")
    const watcher = watchFs(IN_DIR, { recursive: true });

    watcher.on("error", (err) => {
        console.error(`Watcher error: ${err}`);
    });
    watcher.on("change", async (event, file) => {
        if (event == "change") {
            console.log(`- '${file}' updated.`)
            let slug = fileSlug(file, null);
            let result = await buildFile(slug);

            updateIndex({
                [slug]: filterIndexData(result)
            });
        }
    });
    watcher.on("filename", async (event, file) => {
        if (event == "rename") {
            let slug = fileSlug(file, null);
            console.log(`- '${file}' deleted.`)

            updateIndex({
                [slug]: null,
            })
        } else if (event == "add") {
            let slug = fileSlug(file, null);
            console.log(`- '${file}' created.`)
            let result = await buildFile(slug);

            updateIndex({
                [slug]: filterIndexData(result)
            });
        }
    });

    signal.addEventListener("abort", async () => {
        watcher.close();
        console.log("Exiting...");
        await indexUpdate;
    })
}

export async function main() {
    let args = parseArguments(process.argv);

    let action = "build";
    if (args.build) {
        delete args["build"];
    } if (args.watch) {
        action = "watch";
        delete args["watch"];
    }

    if (action == "build") {
        return await build(args);
    } else if (action == "watch") {
        return await watch(args);
    } else {
        throw new Error(`Unknown action '${action}'`);
    }
}

export default main;
