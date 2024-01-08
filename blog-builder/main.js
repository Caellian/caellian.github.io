import { glob } from 'glob';
import { dirname, join, relative } from 'path';
import { mkdir, writeFile, stat } from 'fs/promises';

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

export async function main() {
    const sources = await glob(join(IN_DIR, "**/*.md"), {
        cwd: process.cwd(),
    })

    console.log("Processing", sources.length, "files...")

    let results = await Promise.allSettled(sources.map(async file => {
        let slug = relative(IN_DIR, file).replace(/\.md$/, "");

        const result = await processFile(slug);
        if (result == null) {
            return null;
        }

        let outPath = join(OUT_DIR, slug + ".json");
        await mkdir(dirname(outPath), { recursive: true });
        await writeFile(outPath, JSON.stringify(result), {
            encoding: "utf-8"
        });

        return [slug, {
            title: result?.title || "",
            summary: result?.summary || "",
            create: result?.create,
            update: result?.update,
            topic: result?.topic || "development",
            tags: result?.tags || [],
        }];
    }));

    const slugs = results.filter(it => it.status == "fulfilled" && it.value != null).map(it => it.value);
    console.log("Processed", slugs.length, "posts!")

    await writeFile(join(OUT_DIR, "index.json"), JSON.stringify(Object.fromEntries(slugs)), {
        encoding: "utf-8"
    });

    console.log("Done!")
}

export default main;
