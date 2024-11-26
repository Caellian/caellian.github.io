import { exec } from "child_process";

/**
 * @typedef SHA commit sha
 * @type {string}
 *
 * @typedef FileName name of a file
 * @type {string}
 */

/**
 * @typedef GitResult a result type returned by {@link git}
 * @type {object}
 * @property {string} cmd git command that was executed
 * @property {string?} stdout standard output content
 * @property {string?} stderr standard error content
 * @property {number} code exit code
 * @property {Node.Signal | null} signal signal (if any) that terminated the
 * process
 */

/**
 * Executes `git` command with provided arguments and options
 *
 * @argument {string} command git command to run
 * @argument {string | [string] | Object.<string, (boolean|string|number)> |
 * null} gitArguments arguments to pass to git command
 * @argument {import("child_process").ExecOptions?} execOptions options to pass to {@link exec}
 * @returns {Promise<GitResult>} result of calling the `git` command.
 */
export async function git(command, gitArguments = null, execOptions = {}) {
  if (command == null) {
    throw new Error("no git command specified");
  }

  let file = null;
  let args = "";
  if (gitArguments != null) {
    if (Array.isArray(gitArguments)) {
      args = gitArguments.join(" ");
    } else if (typeof gitArguments === "string") {
      args = gitArguments;
    } else if (typeof gitArguments === "object") {
      if (gitArguments.file != null) {
        file = gitArguments.file;
        delete gitArguments["file"];
      }
      args = Object.entries(gitArguments)
        .map(([k, v]) => {
          let value = "";
          if (
            typeof v === "boolean" ||
            (typeof v === "string" && v.length == 0)
          ) {
            // treat as flag; pass empty value
          } else {
            value = `=${v.toString()}`;
          }
          if (k.length == 1) {
            return `-${k}${value}`;
          } else {
            return `--${k}${value}`;
          }
        })
        .join(" ");
    } else {
      throw new Error("invalid git arguments");
    }
  }
  let cmd = `git ${command} ${args}`;
  if (file != null) {
    if (typeof file === "string") {
      cmd += " -- " + file;
    } else if (Array.isArray(file)) {
      cmd += " -- " + file.join(" ");
    } else {
      throw new Error("invalid git file argument");
    }
  }
  return await new Promise((resolve) => {
    exec(cmd, execOptions || {}, (error, stdout, stderr) => {
      if (error != null) {
        resolve({
          cmd,
          stdout: stdout || error.stdout || null,
          stderr: stderr || error.stderr || null,
          code: error.code,
          signal: error.signal || null,
        });
      } else {
        resolve({
          cmd,
          stdout,
          stderr,
          code: 0,
          signal: null,
        });
      }
    });
  });
}

/**
 * Git status value
 * @readonly
 * @enum {string}
 */
export const GitStatus = Object.freeze({
  UNMODIFIED: " ",
  MODIFIED: "M",
  TYPE_CHANGED: "T",
  ADDED: "A",
  DELETED: "D",
  RENAMED: "R",
  COPIED: "C",
  UPDATED: "U",
});

/**
 * @typedef FileStatus status of a file tracked by git
 * @type {object}
 * @property {GitStatus} index status of file in index
 * @property {GitStatus} workingTree status of file in working tree
 * @property {string?} previousPath previous path to the file (if moved)
 */

/**
 * Parses output of git `status` subcommand.
 *
 * @param {string} stdout porcelain status command output
 * @returns {Object.<FileName, FileStatus>} status information of listed files
 */
export function parseGitStatus(stdout) {
  return Object.fromEntries(
    stdout.split("\n").map((line) => {
      let index = line.at(0);
      let workingTree = line.at(1);
      let file = line.slice(3).trim();
      let previousPath = null;
      if (file.includes("->")) {
        let [origPath, newPath] = file.split("->");
        file = newPath;
        previousPath = origPath;
      }
      return (
        file,
        {
          index,
          workingTree,
          previousPath,
        }
      );
    })
  );
}

/**
 * Returns a list of all commits that modified a file with `path`.
 *
 * @argument {string} path file path
 * @argument {import("child_process").ExecOptions?} execOptions options to pass to {@link exec}
 * @returns {[SHA, Date, FileName]}
 */
export async function fileHistory(path, execOptions) {
  let log = await git(
    "log",
    {
      submodule: true,
      follow: true,
      "name-status": true,
      pretty: 'format:"%H %ad"',
      date: "iso-strict",
      file: path,
    },
    execOptions
  );
  if (log.code != 0) {
    return [];
  }

  return log.stdout
    .trim()
    .split("\n\n")
    .filter((it) => it.trim().length != 0)
    .map((edit) => {
      const [shadate, namespec] = edit.split("\n");
      const [sha, date] = shadate.split(" ");
      const name = namespec.split("\t").at(-1);
      return [sha, new Date(date), name];
    });
}
