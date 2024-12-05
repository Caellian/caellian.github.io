import { exec } from "node:child_process";
import path from "node:path";
import logger, { typeName } from "../logging/index.js";

/**
 * @typedef {string} FileName name of a file
 */
/**
 * @typedef {string} Commit A commit hash.
 */
/**
 * @typedef {import("child_process").ExecOptions} ExecOptions
 */
/**
 * @typedef {import("../env.js").Arguments} Arguments
 */
/**
 * Process signals.
 *
 * Copied from `NodeJS.Signals`.
 * @readonly
 * @enum {string}
 */
const Signal = Object.freeze({
  SIGABRT: "SIGABRT",
  SIGALRM: "SIGALRM",
  SIGBUS: "SIGBUS",
  SIGCHLD: "SIGCHLD",
  SIGCONT: "SIGCONT",
  SIGFPE: "SIGFPE",
  SIGHUP: "SIGHUP",
  SIGILL: "SIGILL",
  SIGINT: "SIGINT",
  SIGIO: "SIGIO",
  SIGIOT: "SIGIOT",
  SIGKILL: "SIGKILL",
  SIGPIPE: "SIGPIPE",
  SIGPOLL: "SIGPOLL",
  SIGPROF: "SIGPROF",
  SIGPWR: "SIGPWR",
  SIGQUIT: "SIGQUIT",
  SIGSEGV: "SIGSEGV",
  SIGSTKFLT: "SIGSTKFLT",
  SIGSTOP: "SIGSTOP",
  SIGSYS: "SIGSYS",
  SIGTERM: "SIGTERM",
  SIGTRAP: "SIGTRAP",
  SIGTSTP: "SIGTSTP",
  SIGTTIN: "SIGTTIN",
  SIGTTOU: "SIGTTOU",
  SIGUNUSED: "SIGUNUSED",
  SIGURG: "SIGURG",
  SIGUSR1: "SIGUSR1",
  SIGUSR2: "SIGUSR2",
  SIGVTALRM: "SIGVTALRM",
  SIGWINCH: "SIGWINCH",
  SIGXCPU: "SIGXCPU",
  SIGXFSZ: "SIGXFSZ",
  SIGBREAK: "SIGBREAK",
  SIGLOST: "SIGLOST",
  SIGINFO: "SIGINFO",
});

/**
 * @typedef GitResult a result type returned by {@link git}
 * @type {object}
 * @property {string} cmd git command that was executed
 * @property {string | null} stdout standard output content
 * @property {string | null} stderr standard error content
 * @property {number} code exit code
 * @property {Signal | null} signal signal (if any) that terminated the
 * process
 */
/**
 * Executes `git` command with provided arguments and options.
 * @param {string} command - git command to run
 * @param {string | string[] | Arguments | null} [gitArguments] - arguments to pass to git command
 * @param {ExecOptions} [execOptions] - options to pass to {@link exec}
 * @returns {Promise<GitResult>} result of calling the `git` command.
 */
export async function git(command, gitArguments = null, execOptions = {}) {
  logger.trace(
    { gitArguments, execOptions },
    "Running 'git %s ...args'",
    command
  );
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
  const result = await new Promise((resolve) => {
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
  return result;
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
 * @property {string} [previousPath] previous path to the file (if moved)
 */
/**
 * Parses output of git `status` subcommand.
 * @param {string} stdout - porcelain status command output
 * @returns {Record<FileName, FileStatus>} status information of listed files
 */
function parseGitStatus(stdout) {
  logger.trace("Parsing git status: %s", stdout);
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
      return [
        file,
        {
          index,
          workingTree,
          previousPath,
        },
      ];
    })
  );
}

/**
 * @param {FileName} file - querried file
 * @param {ExecOptions} [execOptions] - options to pass to {@link exec}
 * @returns {Promise<FileStatus | null>} status information of `file`
 */
export async function getFileStatus(file, execOptions = null) {
  logger.debug({ execOptions }, "Getting git file status for: %s", file);
  const DEFAULT = {
    index: GitStatus.UNMODIFIED,
    workingTree: GitStatus.UNMODIFIED,
  };
  let status = await git(
    "status",
    {
      porcelain: true,
      file,
    },
    execOptions || {
      cwd: path.dirname(file),
    }
  );
  if (status.code != 0) {
    logger.trace({ status }, "File not in git tree: %s", file);
    return null;
  }
  if (status.stdout.trim().length === 0) {
    logger.trace("Empty file status for: %s", file);
    return DEFAULT;
  }
  const parsedStatus = parseGitStatus(status.stdout);
  logger.trace({ parsedStatus }, "Parsed git file status");
  return /** @type {FileStatus} */ (Object.entries(parsedStatus).at(0).at(1));
}

/**
 * Returns a list of all commits that modified a `file`.
 * @param {FileName} file - querried file
 * @param {ExecOptions} [execOptions] - options to pass to {@link exec}
 * @returns {Promise<[Commit, Date, FileName][]>}
 */
export async function fileHistory(file, execOptions = null) {
  logger.debug({ execOptions }, "Getting git file history for: %s", file);
  let log = await git(
    "log",
    {
      submodule: true,
      follow: true,
      "name-status": true,
      pretty: 'format:"%H %ad"',
      date: "iso-strict",
      file: file,
    },
    execOptions || {
      cwd: path.dirname(file),
    }
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

/**
 * @param {Date} date
 * @param {ExecOptions} [execOptions] - options to pass to {@link exec}
 * @returns {Promise<Commit | null>}
 */
export async function getLastCommitForDate(date, execOptions = null) {
  if (date.toISOString === undefined) {
    throw new TypeError("provided argument not a Date; got: " + typeName(date));
  }
  logger.debug(
    { execOptions },
    "Getting last commit for date: %s",
    date.toISOString()
  );
  const log = await git(
    "log",
    {
      1: true,
      submodule: true,
      pretty: 'format:"%H"',
      date: "iso-strict",
      before: date.toISOString().split(".")[0],
    },
    execOptions
  );
  if (log.code !== 0) {
    logger.trace("No commit with date < %s found", date.toISOString());
    return null;
  }
  let commit = log.stdout.trim();
  if (commit.length === 0) {
    logger.trace("No commit with date < %s found", date.toISOString());
    return null;
  }
  logger.trace("Found commit %s for date < %s", commit);
  return commit;
}

/**
 * @param {Commit} commit
 * @param {ExecOptions} [execOptions]
 * @returns {Promise<Date>}
 */
export async function getCommitDate(commit, execOptions = null) {
  let date = await git(
    "log",
    ["-1", "--no-patch", "--date=iso-strict", "--format=%ad", commit],
    execOptions
  );
  if (date.code !== 0) {
    return null;
  }
  logger.debug(
    { execOptions },
    "Got date '%s' for commit: %s",
    date.stdout.trim(),
    commit
  );
  return new Date(date.stdout.trim());
}
