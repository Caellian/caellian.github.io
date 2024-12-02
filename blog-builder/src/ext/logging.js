import pino from "pino";
import { getCallSites, getTopCallSite } from "./stack.js";

/**
 * @typedef {import("fs").PathLike} LogLevel
 * @readonly
 */

const transport = process.env.CI
  ? {
      target: "./github-transport.js",
    }
  : {
      target: "pino-pretty",
      options: {
        messageFormat: "{file}:{line}:{column}: {msg}",
        ignore:
          "pid,hostname,method,file,line,endLine,column,title,target,showStackTrace",
        customLevels: {
          fatal: 60,
          error: 50,
          warn: 40,
          notice: 35,
          info: 30,
          debug: 20,
          trace: 10,
        },
      },
    };

/**
 * @returns {pino.Level | CustomLevels}
 */
function getLogLevel() {
  if (process.env.BLOG_BUILDER_LOG) {
    // @ts-ignore
    return process.env.BLOG_BUILDER_LOG;
  }
  if (process.env.CI) {
    return process.env.RUNNER_DEBUG ? "debug" : "info";
  }
  return "info";
}

/**
 * @typedef {"notice"} CustomLevels
 */
/**
 * @typedef {pino.Logger<CustomLevels> & {summary: pino.LogFn}} Logger
 */
/**
 * @type {Logger}
 */
export const logger = Object.assign(
  // @ts-ignore
  pino(
    {
      level: getLogLevel(),
      customLevels: {
        notice: 35,
      },
      timestamp: pino.stdTimeFunctions.isoTime,
      mixin: (base, _level, _logger) => {
        const result = {};
        if (base.file == null && base.target != "summary") {
          let trace = getTopCallSite("pino");
          Object.assign(result, {
            method: trace.functionName,
            file: trace.scriptName,
            line: trace.lineNumber,
            column: trace.column,
          });
          result.file = result.file?.split("blog-builder")?.at(-1).slice(1);
          if (result.file?.startsWith("node_modules")) {
            result.file.replace("node_modules/", "npm:");
          }
          if (base.line != null) {
            delete result["line"];
            delete result["column"];
          } else if (base.column != null) {
            delete result["column"];
          }
        }

        if (base.showStackTrace) {
          result["stackTrace"] = getCallSites(null, "pino").map((t) => {
            return `${t.scriptName}:${t.lineNumber}:${t.column}:${t.functionName}`;
          });
        }

        return result;
      },
      hooks: {
        logMethod: (args, method, _level) => {
          if (
            !process.env.CI &&
            typeof args[0] === "object" &&
            args[0]?.target === "summary"
          ) {
            return;
          }
          method.apply(logger, args);
        },
      },
    },
    pino.transport(transport)
  ),
  {
    /**
     * @param {object} [table]
     * @param {string} [message]
     * @param {...?} [format]
     * @returns {void}
     */
    summary: (table, message = undefined, ...format) => {
      return logger.info(
        { ...(typeof table === "object" ? table : {}), target: "summary" },
        typeof table === "object" ? message : table,
        ...((typeof table === "object" ? format : message) || [])
      );
    },
  }
);

export default logger;
