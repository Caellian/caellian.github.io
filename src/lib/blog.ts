import { glob } from "glob";
import { compile } from "mdsvex";
import { promises as fs } from "fs";
import path from "path";
import NodeGit from "nodegit";

interface Preprocessed {
  code: string;
  data?: Record<string, unknown>;
  map?: string;
}

export interface PostRSSInfo {
  title: string;
  description?: string;
  url: string;
  published: Date;
}

export interface PostInfo extends PostRSSInfo {
  last_updated: Date;
  blog_path: string;
  post_path: string;
  tags: string[];
  previous?: string;
  next?: string;
}

const EXTENSIONS = ["md", "svx"];

export class Blog {
  _files: string[] | null;
  _posts: Post[] | null;

  /**
   * @param path relative to environment cwd (project root)
   */
  constructor(public path: string) {
    if (!this.path.endsWith("/")) {
      this.path += "/";
    }
    this._files = null;
    this._posts = null;
  }

  async postFiles() {
    if (this._files) {
      return this._files;
    }

    return (this._files = (
      await glob(EXTENSIONS.map((ext) => this.path + "**/*." + ext))
    )
      .map((path) => path.substring(this.path.length).replace(/^\//, ""))
      .filter((path) => path != "README.md"));
  }

  async getRepo() {
    return await NodeGit.Repository.open(this.path);
  }

  async posts() {
    if (this._posts) {
      return this._posts;
    }
    return (this._posts = (await this.postFiles()).map(
      (path) => new Post(this, path)
    ));
  }

  async getPost(slug: string) {
    for (const ext of EXTENSIONS) {
      const tried = `${slug}.${ext}`;
      try {
        await fs.access(path.join(this.path, tried));
      } catch (err) {
        continue;
      }
      return new Post(this, tried);
    }
    for (const post of await this.posts()) {
      if ((await post.slug()) === slug) {
        return post;
      }
    }
    return undefined;
  }
}

export const BLOG = new Blog("posts");

export interface PostChange {
  date: Date;
  summary?: string;
}

export class Post {
  _compiled: Preprocessed | null;
  _history: PostChange[] | null;
  _tags: string[] | null;
  _title: string | null;

  constructor(public blog: Blog, public path: string) {
    this._compiled = null;
    this._history = null;
    this._tags = null;
    this._title = null;
  }

  fullPath() {
    return path.join(this.blog.path, this.path);
  }

  fileName() {
    return this.path
      .split("/")
      .pop()
      ?.replace(/\.\w+$/, "") as string;
  }

  async compile() {
    if (this._compiled) return this._compiled;

    const content = await fs.readFile(this.fullPath(), "utf-8");
    this._compiled = (await compile(content)) as Preprocessed;
    return this._compiled;
  }

  async content() {
    return (await this.compile()).code;
  }

  async frontmatter() {
    return ((await this.compile()).data?.fm || {}) as Record<string, unknown>;
  }

  async title() {
    if (this._title) {
      return this._title;
    }

    const fm = await this.frontmatter();
    return (this._title = (fm.title as string) || this.fileName());
  }

  async description() {
    const fm = await this.frontmatter();
    return (fm.description || fm.desc) as string | undefined;
  }

  async tags() {
    if (this._tags) {
      return this._tags;
    }

    const fm_tags = (await this.frontmatter()).tags as
      | string[]
      | string
      | undefined;

    if (fm_tags) {
      if (Array.isArray(fm_tags)) {
        return (this._tags = fm_tags.filter((it) => typeof it === "string"));
      } else if (typeof fm_tags === "string") {
        return (this._tags = fm_tags.split(",").map((it) => it.trim()));
      }
    }

    return [];
  }

  async slug() {
    return (
      ((await this.frontmatter()).slug as string) ||
      this.path.replace(/\.\w+$/, "")
    );
  }

  async history() {
    if (this._history) {
      return this._history;
    }

    const repo = await this.blog.getRepo();
    const revwalk = NodeGit.Revwalk.create(repo);
    const head = await repo.getHeadCommit();
    revwalk.push(head.id());
    revwalk.sorting(NodeGit.Revwalk.SORT.TIME | NodeGit.Revwalk.SORT.REVERSE);

    const entries = await revwalk.fileHistoryWalk(this.path, 1000);

    this._history = [];
    for (const e of entries) {
      const commit = await repo.getCommit(e.commit);
      const date = commit.date();

      let summary: string | undefined = commit.body();
      if (summary) {
        summary = summary.replace(/^Signed-off-by:[\w ]+<[^>]+>/g, "");
      }
      if (summary === null || summary === "") {
        summary = undefined;
      }

      this._history.push({
        date,
        summary,
      });
    }

    if (this._history.length === 0) {
      const stat = await fs.stat(this.fullPath());
      this._history.push({
        date: stat.mtime,
      });
    }

    return this._history;
  }

  async rssInfo() {
    return {
      title: await this.title(),
      description: await this.description(),
      url: await this.slug(),
      published: (await this.history())[0].date,
    } as PostRSSInfo;
  }

  async info() {
    const result = (await this.rssInfo()) as PostInfo;
    const fm = await this.frontmatter();

    result.blog_path = this.blog.path;
    result.post_path = this.path;
    result.last_updated = (await this.history())[-1]?.date || result.published;
    result.tags = await this.tags();
    result.previous = (fm.previous || fm.prev) as string | undefined;
    result.next = fm.next as string | undefined;
    return result;
  }
}
