import { Stream } from "stream";
import { once } from "events";
import split from "split2";
import SonicBoom from "sonic-boom";

const FORMAT = {
  summary(chunk) {
    let message = chunk.msg;
    let table = FORMAT.objectTable.call(this, chunk);
    return `${message}${table}\n`;
  },
  log(chunk) {
    let message = chunk.msg;

    /**
     * @type {*}
     */
    let props = {
      file: chunk.file,
      line: chunk.line,
      col: chunk.column,
      endLine: chunk.endLine,
      title: chunk.title,
    };
    props = Object.entries(props)
      .filter(([_, v]) => !!v)
      .map(([k, v]) => {
        return k + "=" + v;
      })
      .join(",");

    let prefixed = FORMAT.levelPropsPrefix.call(this, chunk.level, props);

    let variables = "";
    for (const variable in chunk) {
      if (this.hideVariables.includes(variable)) {
        continue;
      }
      variables += `\t${variable}: ${JSON.stringify(chunk[variable])}\n`;
    }

    return prefixed(message) + variables;
  },
  levelPropsPrefix(level, props) {
    return (message) => {
      if (level >= 50) {
        return `::error ${props}::${message}\n`;
      } else if (level >= 40) {
        return `::warning ${props}::${message}\n`;
      } else if (level >= 35) {
        return `::notice ${props}::${message}\n`;
      } else if (level >= 30) {
        return `${message}\n`;
      } else if (level >= 20) {
        return `::debug::${message}\n`;
      } else if (level >= 10 && this.traceAsDebug) {
        return `::debug::${message}\n`;
      }
    };
  },
  objectTable(object) {
    let tableRawH = "";
    let tableRawA = "";
    let tableRawV = "";
    for (const col in object) {
      if (this.tableHide.includes(col)) {
        continue;
      }
      if (typeof col !== "string") {
        continue;
      }
      if (tableRawH.length == 0) {
        tableRawH += "|";
        tableRawA += "|";
        tableRawV += "|";
      }
      let value = String(object[col]);
      let w = Math.max(col.length, value.length) + 2;
      let hPad = w - col.length;
      let vPad = w - value.length;
      tableRawH += " ".repeat(Math.floor(hPad / 2));
      tableRawH += col;
      tableRawH += " ".repeat(Math.ceil(hPad / 2));
      tableRawH += "|";
      tableRawA += ":" + "-".repeat(w - 2) + ":|";
      tableRawV += " ".repeat(Math.floor(vPad / 2));
      tableRawV += value;
      tableRawV += " ".repeat(Math.ceil(vPad / 2));
      tableRawV += "|";
    }
    let tableRaw = "";
    if (tableRawH.length > 0) {
      tableRaw =
        "\n\n" + tableRawH + "\n" + tableRawA + "\n" + tableRawV + "\n";
    }

    return tableRaw;
  },
};

/**
 * @typedef {object} GitHubTransportOptions
 * @property {string | number} [summaryDestination]
 * @property {string | number} [destination]
 * @property {string[] | string} [tableHide] List of log object items to hide from tables.
 *
 * A string can be comma separated to produce many items (equivalent to `string[]`).
 * @property {string[] | string} [ignore] List of log object items to hide from logged variables.
 *
 * A string can be comma separated to produce many items (equivalent to `string[]`).
 * @property {boolean} [traceAsDebug]
 */

/**
 * @param {GitHubTransportOptions} [options={}]
 * @returns {Promise<Stream>}
 */
export default async function transport(options = {}) {
  // @ts-ignore
  const summaryOut = new SonicBoom({
    dest:
      options.summaryDestination ||
      process.env.GITHUB_STEP_SUMMARY ||
      "./summary.md",
    sync: true,
  });
  // @ts-ignore
  const logOut = new SonicBoom({
    dest: options.destination || 1,
    sync: true,
  });
  await Promise.all([once(summaryOut, "ready"), once(logOut, "ready")]);

  if (typeof options.tableHide == "string") {
    options.tableHide = options.tableHide
      .split(",")
      .filter((it) => it.length != 0)
      .map((it) => it.trim());
  }
  let summaryFormat = FORMAT.summary.bind({
    tableHide: options.tableHide || [
      "level",
      "time",
      "pid",
      "hostname",
      "target",
      "msg",
      "file",
      "line",
      "endLine",
      "column",
      "method",
      "title",
    ],
  });
  let logFormat = FORMAT.log.bind({
    traceAsDebug: options.traceAsDebug || false,
    hideVariables: options.ignore || [
      "level",
      "time",
      "pid",
      "hostname",
      "target",
      "msg",
      "file",
      "line",
      "endLine",
      "column",
      "method",
      "title",
    ],
  });

  let orchestrator = new Stream.Writable({
    objectMode: true,
    // @ts-ignore
    write(chunk, _enc, cb) {
      if (chunk.target === "summary") {
        let summaryChunk = summaryFormat(chunk);
        summaryOut.write(summaryChunk);
        cb();
      } else {
        let logChunk = logFormat(chunk);
        logOut.write(logChunk);
        cb();
      }
    },
    final(cb) {
      summaryOut.end(cb);
    },
  });
  let parser = split(JSON.parse, {
    autoDestroy: true,
  });
  parser.pipe(orchestrator);
  return parser;
}
