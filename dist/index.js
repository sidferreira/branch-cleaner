#!/usr/bin/env node

// src/utils/exec.ts
import { execSync, spawn, spawnSync } from "child_process";

// node_modules/.pnpm/chalk@6.0.0/node_modules/chalk/source/utilities.js
function stringReplaceAll(string, substring, postfix) {
  let index = string.indexOf(substring);
  if (index === -1) {
    return string;
  }
  const substringLength = substring.length;
  let endIndex = 0;
  let returnValue = "";
  do {
    returnValue += string.slice(endIndex, index) + substring + postfix;
    endIndex = index + substringLength;
    index = string.indexOf(substring, endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}
function stringEncaseCRLFWithFirstIndex(string, prefix, postfix, index) {
  let endIndex = 0;
  let returnValue = "";
  do {
    const isGotCR = string[index - 1] === "\r";
    returnValue += string.slice(endIndex, isGotCR ? index - 1 : index) + prefix + (isGotCR ? "\r\n" : "\n") + postfix;
    endIndex = index + 1;
    index = string.indexOf("\n", endIndex);
  } while (index !== -1);
  returnValue += string.slice(endIndex);
  return returnValue;
}

// node_modules/.pnpm/chalk@6.0.0/node_modules/chalk/source/vendor/ansi-styles/index.js
var ANSI_BACKGROUND_OFFSET = 10;
var ANSI_UNDERLINE_OFFSET = 20;
var wrapAnsi16 = (offset = 0) => (code) => `\x1B[${code + offset}m`;
var wrapAnsi256 = (offset = 0) => (code) => `\x1B[${38 + offset};5;${code}m`;
var wrapAnsi16m = (offset = 0) => (red, green, blue) => `\x1B[${38 + offset};2;${red};${green};${blue}m`;
var wrapUnderlineAnsi = (code) => `\x1B[58;5;${code < 90 ? code - 30 : code - 90 + 8}m`;
var styles = {
  modifier: {
    reset: [0, 0],
    // 21 isn't widely supported and 22 does the same thing
    bold: [1, 22],
    dim: [2, 22],
    italic: [3, 23],
    underline: [4, 24],
    // Extended underline styles (`SGR 4:x` sub-parameters). Not in upstream `ansi-styles`.
    underlineDouble: ["4:2", 24],
    underlineCurly: ["4:3", 24],
    underlineDotted: ["4:4", 24],
    underlineDashed: ["4:5", 24],
    overline: [53, 55],
    inverse: [7, 27],
    hidden: [8, 28],
    strikethrough: [9, 29]
  },
  color: {
    black: [30, 39],
    red: [31, 39],
    green: [32, 39],
    yellow: [33, 39],
    blue: [34, 39],
    magenta: [35, 39],
    cyan: [36, 39],
    white: [37, 39],
    // Bright color
    blackBright: [90, 39],
    gray: [90, 39],
    // Alias of `blackBright`
    grey: [90, 39],
    // Alias of `blackBright`
    redBright: [91, 39],
    greenBright: [92, 39],
    yellowBright: [93, 39],
    blueBright: [94, 39],
    magentaBright: [95, 39],
    cyanBright: [96, 39],
    whiteBright: [97, 39]
  },
  bgColor: {
    bgBlack: [40, 49],
    bgRed: [41, 49],
    bgGreen: [42, 49],
    bgYellow: [43, 49],
    bgBlue: [44, 49],
    bgMagenta: [45, 49],
    bgCyan: [46, 49],
    bgWhite: [47, 49],
    // Bright color
    bgBlackBright: [100, 49],
    bgGray: [100, 49],
    // Alias of `bgBlackBright`
    bgGrey: [100, 49],
    // Alias of `bgBlackBright`
    bgRedBright: [101, 49],
    bgGreenBright: [102, 49],
    bgYellowBright: [103, 49],
    bgBlueBright: [104, 49],
    bgMagentaBright: [105, 49],
    bgCyanBright: [106, 49],
    bgWhiteBright: [107, 49]
  },
  // Underline color (`SGR 58`/`59`). Not in upstream `ansi-styles`.
  underlineColor: {
    underlineBlack: ["58;5;0", 59],
    underlineRed: ["58;5;1", 59],
    underlineGreen: ["58;5;2", 59],
    underlineYellow: ["58;5;3", 59],
    underlineBlue: ["58;5;4", 59],
    underlineMagenta: ["58;5;5", 59],
    underlineCyan: ["58;5;6", 59],
    underlineWhite: ["58;5;7", 59],
    // Bright color
    underlineBlackBright: ["58;5;8", 59],
    underlineGray: ["58;5;8", 59],
    // Alias of `underlineBlackBright`
    underlineGrey: ["58;5;8", 59],
    // Alias of `underlineBlackBright`
    underlineRedBright: ["58;5;9", 59],
    underlineGreenBright: ["58;5;10", 59],
    underlineYellowBright: ["58;5;11", 59],
    underlineBlueBright: ["58;5;12", 59],
    underlineMagentaBright: ["58;5;13", 59],
    underlineCyanBright: ["58;5;14", 59],
    underlineWhiteBright: ["58;5;15", 59]
  }
};
var modifierNames = Object.keys(styles.modifier);
var foregroundColorNames = Object.keys(styles.color);
var backgroundColorNames = Object.keys(styles.bgColor);
var underlineColorNames = Object.keys(styles.underlineColor);
var colorNames = [...foregroundColorNames, ...backgroundColorNames];
function assembleStyles() {
  const codes = /* @__PURE__ */ new Map();
  for (const [groupName, group] of Object.entries(styles)) {
    for (const [styleName, style] of Object.entries(group)) {
      styles[styleName] = {
        open: `\x1B[${style[0]}m`,
        close: `\x1B[${style[1]}m`
      };
      group[styleName] = styles[styleName];
      codes.set(Number.parseInt(style[0], 10), style[1]);
    }
    Object.defineProperty(styles, groupName, {
      value: group,
      enumerable: false
    });
  }
  Object.defineProperty(styles, "codes", {
    value: codes,
    enumerable: false
  });
  styles.color.close = "\x1B[39m";
  styles.bgColor.close = "\x1B[49m";
  styles.underlineColor.close = "\x1B[59m";
  styles.color.ansi = wrapAnsi16();
  styles.color.ansi256 = wrapAnsi256();
  styles.color.ansi16m = wrapAnsi16m();
  styles.bgColor.ansi = wrapAnsi16(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi256 = wrapAnsi256(ANSI_BACKGROUND_OFFSET);
  styles.bgColor.ansi16m = wrapAnsi16m(ANSI_BACKGROUND_OFFSET);
  styles.underlineColor.ansi = wrapUnderlineAnsi;
  styles.underlineColor.ansi256 = wrapAnsi256(ANSI_UNDERLINE_OFFSET);
  styles.underlineColor.ansi16m = wrapAnsi16m(ANSI_UNDERLINE_OFFSET);
  Object.defineProperties(styles, {
    rgbToAnsi256: {
      value(red, green, blue) {
        if (red === green && green === blue) {
          if (red < 8) {
            return 16;
          }
          if (red > 248) {
            return 231;
          }
          return Math.round((red - 8) / 247 * 24) + 232;
        }
        return 16 + 36 * Math.round(red / 255 * 5) + 6 * Math.round(green / 255 * 5) + Math.round(blue / 255 * 5);
      },
      enumerable: false
    },
    hexToRgb: {
      value(hex) {
        const matches = /[\da-f]{6}|[\da-f]{3}/i.exec(hex.toString(16));
        if (!matches) {
          return [0, 0, 0];
        }
        let [colorString] = matches;
        if (colorString.length === 3) {
          colorString = [...colorString].map((character) => character + character).join("");
        }
        const integer = Number.parseInt(colorString, 16);
        return [
          /* eslint-disable no-bitwise -- We need the speed */
          integer >> 16 & 255,
          integer >> 8 & 255,
          integer & 255
          /* eslint-enable no-bitwise */
        ];
      },
      enumerable: false
    },
    hexToAnsi256: {
      value: (hex) => styles.rgbToAnsi256(...styles.hexToRgb(hex)),
      enumerable: false
    },
    ansi256ToAnsi: {
      value(code) {
        if (code < 8) {
          return 30 + code;
        }
        if (code < 16) {
          return 90 + (code - 8);
        }
        let red;
        let green;
        let blue;
        if (code >= 232) {
          red = ((code - 232) * 10 + 8) / 255;
          green = red;
          blue = red;
        } else {
          code -= 16;
          const remainder = code % 36;
          red = Math.floor(code / 36) / 5;
          green = Math.floor(remainder / 6) / 5;
          blue = remainder % 6 / 5;
        }
        const value = Math.max(red, green, blue) * 2;
        if (value === 0) {
          return 30;
        }
        let result = 30 + (Math.round(blue) << 2 | Math.round(green) << 1 | Math.round(red));
        if (value === 2) {
          result += 60;
        }
        return result;
      },
      enumerable: false
    },
    rgbToAnsi: {
      value: (red, green, blue) => styles.ansi256ToAnsi(styles.rgbToAnsi256(red, green, blue)),
      enumerable: false
    },
    hexToAnsi: {
      value: (hex) => styles.ansi256ToAnsi(styles.hexToAnsi256(hex)),
      enumerable: false
    }
  });
  return styles;
}
var ansiStyles = assembleStyles();
var ansi_styles_default = ansiStyles;

// node_modules/.pnpm/chalk@6.0.0/node_modules/chalk/source/vendor/supports-color/index.js
import process2 from "process";
import os from "os";
import tty from "tty";
function hasFlag(flag, argv = globalThis.Deno ? globalThis.Deno.args : process2.argv) {
  const prefix = flag.startsWith("-") ? "" : flag.length === 1 ? "-" : "--";
  const position = argv.indexOf(prefix + flag);
  const terminatorPosition = argv.indexOf("--");
  return position !== -1 && (terminatorPosition === -1 || position < terminatorPosition);
}
var { env } = process2;
var flagForceColor;
if (hasFlag("no-color") || hasFlag("no-colors") || hasFlag("color=false") || hasFlag("color=never")) {
  flagForceColor = 0;
} else if (hasFlag("color") || hasFlag("colors") || hasFlag("color=true") || hasFlag("color=always")) {
  flagForceColor = 1;
}
function hasNumericForceColor() {
  return /^\d+$/.test(env.FORCE_COLOR);
}
function envForceColor() {
  if (!("FORCE_COLOR" in env)) {
    return;
  }
  if (env.FORCE_COLOR === "false") {
    return 0;
  }
  if (env.FORCE_COLOR === "true" || env.FORCE_COLOR.length === 0) {
    return 1;
  }
  if (!hasNumericForceColor()) {
    return;
  }
  return Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3);
}
function translateLevel(level) {
  if (level === 0) {
    return false;
  }
  return {
    level,
    hasBasic: true,
    has256: level >= 2,
    has16m: level >= 3
  };
}
function _supportsColor(haveStream, { streamIsTTY, sniffFlags = true } = {}) {
  const noFlagForceColor = envForceColor();
  if (noFlagForceColor !== void 0) {
    flagForceColor = noFlagForceColor;
  }
  const forceColor = sniffFlags ? flagForceColor : noFlagForceColor;
  if (forceColor === 0) {
    return 0;
  }
  if (sniffFlags) {
    if (hasFlag("color=16m") || hasFlag("color=full") || hasFlag("color=truecolor")) {
      return 3;
    }
    if (hasFlag("color=256")) {
      return 2;
    }
  }
  if (forceColor !== void 0 && hasNumericForceColor()) {
    return forceColor;
  }
  if ("TF_BUILD" in env && "AGENT_NAME" in env) {
    return 1;
  }
  if (haveStream && !streamIsTTY && forceColor === void 0) {
    return 0;
  }
  const min = forceColor || 0;
  if (env.TERM === "dumb") {
    return min;
  }
  if (process2.platform === "win32") {
    const osRelease = os.release().split(".");
    if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10586) {
      return Number(osRelease[2]) >= 14931 ? 3 : 2;
    }
    return 1;
  }
  if ("CI" in env) {
    if (["GITHUB_ACTIONS", "GITEA_ACTIONS", "CIRCLECI"].some((key) => key in env)) {
      return 3;
    }
    if (["TRAVIS", "APPVEYOR", "GITLAB_CI", "BUILDKITE", "DRONE"].some((sign) => sign in env) || env.CI_NAME === "codeship") {
      return 1;
    }
    return min;
  }
  if ("TEAMCITY_VERSION" in env) {
    return /^(?:9\.0*[1-9]\d*\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
  }
  if (env.COLORTERM === "truecolor") {
    return 3;
  }
  if (env.TERM === "xterm-kitty") {
    return 3;
  }
  if (env.TERM === "xterm-ghostty") {
    return 3;
  }
  if (env.TERM === "wezterm") {
    return 3;
  }
  if ("TERM_PROGRAM" in env) {
    const version = Number.parseInt((env.TERM_PROGRAM_VERSION || "").split(".", 1)[0], 10);
    switch (env.TERM_PROGRAM) {
      case "iTerm.app": {
        return version >= 3 ? 3 : 2;
      }
      case "Apple_Terminal": {
        return 2;
      }
    }
  }
  if (/-256(?:color)?$/i.test(env.TERM)) {
    return 2;
  }
  if (/^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)) {
    return 1;
  }
  if ("COLORTERM" in env) {
    return 1;
  }
  return min;
}
function createSupportsColor(stream, options = {}) {
  const level = _supportsColor(stream, {
    streamIsTTY: stream && stream.isTTY,
    ...options
  });
  return translateLevel(level);
}
var supportsColor = {
  stdout: createSupportsColor({ isTTY: tty.isatty(1) }),
  stderr: createSupportsColor({ isTTY: tty.isatty(2) })
};
var supports_color_default = supportsColor;

// node_modules/.pnpm/chalk@6.0.0/node_modules/chalk/source/index.js
var { stdout: stdoutColor, stderr: stderrColor } = supports_color_default;
var GENERATOR = /* @__PURE__ */ Symbol("GENERATOR");
var STYLER = /* @__PURE__ */ Symbol("STYLER");
var IS_EMPTY = /* @__PURE__ */ Symbol("IS_EMPTY");
var LEVEL = /* @__PURE__ */ Symbol("LEVEL");
var styles2 = /* @__PURE__ */ Object.create(null);
var assertValidLevel = (level) => {
  if (!Number.isSafeInteger(level) || level < 0 || level > 3) {
    throw new Error("The `level` should be an integer from 0 to 3");
  }
};
var levelDescriptor = {
  enumerable: true,
  get() {
    return this[LEVEL];
  },
  set(level) {
    assertValidLevel(level);
    this[LEVEL] = level;
  }
};
var applyOptions = (object, options = {}) => {
  if (options.level !== void 0) {
    assertValidLevel(options.level);
  }
  const colorLevel = stdoutColor ? stdoutColor.level : 0;
  object[LEVEL] = options.level === void 0 ? colorLevel : options.level;
};
var chalkFactory = (options) => {
  const chalk2 = (...strings) => strings.join(" ");
  applyOptions(chalk2, options);
  Object.setPrototypeOf(chalk2, createChalk.prototype);
  return chalk2;
};
function createChalk(options) {
  return chalkFactory(options);
}
Object.setPrototypeOf(createChalk.prototype, Function.prototype);
for (const [styleName, style] of Object.entries(ansi_styles_default)) {
  styles2[styleName] = {
    get() {
      const builder = createBuilder(this, createStyler(style.open, style.close, this[STYLER]), this[IS_EMPTY]);
      Object.defineProperty(this, styleName, { value: builder });
      return builder;
    }
  };
}
styles2.visible = {
  get() {
    const builder = createBuilder(this, this[STYLER], true);
    Object.defineProperty(this, "visible", { value: builder });
    return builder;
  }
};
var createModelConverters = (model, type) => {
  const style = ansi_styles_default[type];
  if (model === "rgb") {
    const ansi2 = (red, green, blue) => style.ansi(ansi_styles_default.rgbToAnsi(red, green, blue));
    const ansi256 = (red, green, blue) => style.ansi256(ansi_styles_default.rgbToAnsi256(red, green, blue));
    return [ansi2, ansi2, ansi256, style.ansi16m];
  }
  if (model === "hex") {
    const ansi2 = (hex) => style.ansi(ansi_styles_default.hexToAnsi(hex));
    const ansi256 = (hex) => style.ansi256(ansi_styles_default.hexToAnsi256(hex));
    return [ansi2, ansi2, ansi256, (hex) => style.ansi16m(...ansi_styles_default.hexToRgb(hex))];
  }
  const ansi = (code) => style.ansi(ansi_styles_default.ansi256ToAnsi(code));
  return [ansi, ansi, style.ansi256, style.ansi256];
};
var usedModels = ["rgb", "hex", "ansi256"];
for (const model of usedModels) {
  const capitalizedModel = model[0].toUpperCase() + model.slice(1);
  for (const [styleName, type] of [
    [model, "color"],
    ["bg" + capitalizedModel, "bgColor"],
    ["underline" + capitalizedModel, "underlineColor"]
  ]) {
    const { close } = ansi_styles_default[type];
    const converters = createModelConverters(model, type);
    styles2[styleName] = {
      get() {
        const styleFunction = function(first, second, third) {
          const open = converters[this.level](first, second, third);
          return createBuilder(this, createStyler(open, close, this[STYLER]), this[IS_EMPTY]);
        };
        Object.defineProperty(this, styleName, { value: styleFunction });
        return styleFunction;
      }
    };
  }
}
var proto = Object.defineProperties(
  () => {
  },
  {
    ...styles2,
    level: {
      enumerable: true,
      get() {
        return this[GENERATOR].level;
      },
      set(level) {
        this[GENERATOR].level = level;
      }
    }
  }
);
var createStyler = (open, close, parent) => {
  let openAll;
  let closeAll;
  if (parent === void 0) {
    openAll = open;
    closeAll = close;
  } else {
    openAll = parent.openAll + open;
    closeAll = close + parent.closeAll;
  }
  return {
    open,
    close,
    openAll,
    closeAll,
    parent
  };
};
var createBuilder = (self, _styler, _isEmpty) => {
  const builder = (...arguments_) => {
    if (arguments_.length === 1) {
      return applyStyle(builder, "" + arguments_[0]);
    }
    if (arguments_.length === 2) {
      return applyStyle(builder, arguments_[0] + " " + arguments_[1]);
    }
    return applyStyle(builder, arguments_.join(" "));
  };
  Object.setPrototypeOf(builder, proto);
  builder[GENERATOR] = self[GENERATOR] ?? self;
  builder[STYLER] = _styler;
  builder[IS_EMPTY] = _isEmpty;
  return builder;
};
var applyStyle = (self, string) => {
  if (self[GENERATOR][LEVEL] <= 0 || !string) {
    return self[IS_EMPTY] ? "" : string;
  }
  let styler = self[STYLER];
  if (styler === void 0) {
    return string;
  }
  const { openAll, closeAll } = styler;
  if (string.includes("\x1B")) {
    while (styler !== void 0) {
      string = stringReplaceAll(string, styler.close, styler.open);
      styler = styler.parent;
    }
  }
  const lfIndex = string.indexOf("\n");
  if (lfIndex !== -1) {
    string = stringEncaseCRLFWithFirstIndex(string, closeAll, openAll, lfIndex);
  }
  return openAll + string + closeAll;
};
Object.defineProperties(createChalk.prototype, { ...styles2, level: levelDescriptor });
var chalk = createChalk();
var chalkStderr = createChalk({ level: stderrColor ? stderrColor.level : 0 });
var source_default = chalk;

// src/utils/logger.ts
var tag = "";
var logger = {
  log: (...args) => {
    console.log(...args);
  },
  info: (...args) => {
    console.info(tag, ...args);
  },
  warn: (...args) => {
    console.log(tag, source_default.yellow("Warning:"), ...args);
  },
  error: (...args) => {
    console.log(tag, source_default.red("Error:"), ...args);
  },
  debug: (...args) => {
    console.log(tag, source_default.grey(...args));
  },
  setCommandVersion: (version) => {
    tag = source_default.bgGrey(source_default.black(version));
  }
};

// src/utils/exec.ts
function run(cmd, args) {
  const result = spawnSync(cmd, args, { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(
      `\`${cmd} ${args.join(" ")}\` failed (exit ${result.status}):
${result.stderr}`
    );
  }
  return result.stdout;
}
function runAsync(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args);
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString("utf8");
    });
    child.on("error", reject);
    child.on("close", (code) => {
      if (code === 0) resolve(stdout);
      else
        reject(
          new Error(
            `\`${cmd} ${args.join(" ")}\` failed (exit ${code}):
${stderr}`
          )
        );
    });
  });
}
function ensurePrereqs() {
  try {
    execSync("git rev-parse --is-inside-work-tree", { stdio: "ignore" });
  } catch {
    logger.error("Must be run from inside a git repository.");
    process.exit(1);
  }
  try {
    execSync("gh auth status", { stdio: "ignore" });
  } catch {
    logger.error("GitHub CLI not authenticated. Run `gh auth login` first.");
    process.exit(1);
  }
}

// src/github/pr.ts
var PR_JSON_FIELDS = "number,title,state,headRefName,closedAt,mergedAt,url,author,isDraft";
function isAuthor(value) {
  if (typeof value !== "object" || value === null) return false;
  const v = value;
  return typeof v.login === "string";
}
function isPullRequest(value) {
  if (typeof value !== "object" || value === null) return false;
  const v = value;
  return typeof v.number === "number" && typeof v.title === "string" && (v.state === "OPEN" || v.state === "CLOSED" || v.state === "MERGED") && typeof v.headRefName === "string" && (v.closedAt === null || typeof v.closedAt === "string") && (v.mergedAt === null || typeof v.mergedAt === "string") && typeof v.url === "string" && isAuthor(v.author) && typeof v.isDraft === "boolean";
}
function parsePrList(output) {
  const parsed = JSON.parse(output);
  if (!Array.isArray(parsed)) {
    throw new Error("Unexpected gh output: expected an array.");
  }
  const prs = [];
  for (const item of parsed) {
    if (isPullRequest(item)) prs.push(item);
  }
  return prs;
}
function pickBestPr(prs) {
  if (prs.length === 0) return null;
  const rank = (s) => s === "MERGED" ? 0 : s === "CLOSED" ? 1 : 2;
  return [...prs].sort((a, b) => {
    const r = rank(a.state) - rank(b.state);
    return r !== 0 ? r : b.number - a.number;
  })[0];
}
function getViewerLogin() {
  return run("gh", ["api", "user", "--jq", ".login"]).trim();
}
function fetchMyClosedPrs(days, now = Date.now()) {
  const since = new Date(now - days * 24 * 60 * 60 * 1e3).toISOString().slice(0, 10);
  const output = run("gh", [
    "pr",
    "list",
    "--author",
    "@me",
    "--state",
    "all",
    "--search",
    `closed:>=${since}`,
    "--json",
    PR_JSON_FIELDS,
    "--limit",
    "200"
  ]);
  return parsePrList(output);
}
async function lookupPrsForBranch(branch) {
  const output = await runAsync("gh", [
    "pr",
    "list",
    "--head",
    branch,
    "--state",
    "all",
    "--json",
    PR_JSON_FIELDS,
    "--limit",
    "10"
  ]);
  return parsePrList(output);
}

// src/utils/concurrency.ts
async function mapWithConcurrency(items, concurrency, fn) {
  const results = new Array(items.length);
  let cursor = 0;
  const workerCount = Math.max(1, Math.min(concurrency, items.length));
  const workers = Array.from({ length: workerCount }, async () => {
    while (true) {
      const i = cursor;
      cursor += 1;
      if (i >= items.length) return;
      results[i] = await fn(items[i], i);
    }
  });
  await Promise.all(workers);
  return results;
}

// src/utils/text.ts
var eqi = (a, b) => a.toLowerCase() === b.toLowerCase();
var lc = (s) => s.toLowerCase();

// src/utils/time.ts
var DAY_MS = 24 * 60 * 60 * 1e3;
var DAY_SECONDS = 24 * 60 * 60;
function humanizeDaysAgo(iso, now = Date.now()) {
  if (iso === null) return "";
  const days = Math.floor((now - Date.parse(iso)) / DAY_MS);
  if (days <= 0) return "today";
  if (days === 1) return "1d ago";
  return `${days}d ago`;
}
function daysSinceUnix(unixSeconds, now = Date.now()) {
  return Math.floor((now / 1e3 - unixSeconds) / DAY_SECONDS);
}

// src/candidates.ts
var PROTECTED_BRANCHES = /* @__PURE__ */ new Set(["main", "master"]);
var CATEGORY_ORDER = {
  "mine-closed": 0,
  "review-closed": 1,
  "orphan-only": 2,
  stale: 3,
  "local-only": 4,
  "mine-draft": 5,
  "review-draft": 6,
  "review-open": 7,
  "mine-open": 8
};
function reasonForPr(pr, viewer, now = Date.now()) {
  const isMine = eqi(pr.author.login, viewer);
  const owner = isMine ? "(mine)" : `by ${pr.author.login}`;
  if (pr.state === "OPEN") {
    if (pr.isDraft) {
      return {
        reason: `PR #${pr.number} draft ${owner}`,
        category: isMine ? "mine-draft" : "review-draft"
      };
    }
    return {
      reason: `PR #${pr.number} open ${owner}`,
      category: isMine ? "mine-open" : "review-open"
    };
  }
  const when = humanizeDaysAgo(pr.mergedAt ?? pr.closedAt, now);
  const verb = pr.state === "MERGED" ? "merged" : "closed";
  return {
    reason: `PR #${pr.number} ${verb} ${when} ${owner}`,
    category: isMine ? "mine-closed" : "review-closed"
  };
}
async function buildCandidates(branches, myPrs, viewer, remoteBranches, staleDays, deps) {
  const now = deps.now ?? Date.now();
  const concurrency = deps.concurrency ?? 5;
  const myPrByHead = /* @__PURE__ */ new Map();
  for (const pr of myPrs) {
    if (pr.state === "OPEN") continue;
    const key = lc(pr.headRefName);
    const existing = myPrByHead.get(key);
    if (existing === void 0 || pr.number > existing.number) {
      myPrByHead.set(key, pr);
    }
  }
  const filtered = branches.filter(
    (b) => !b.isCurrent && !PROTECTED_BRANCHES.has(b.name)
  );
  const unmatched = filtered.filter((b) => !myPrByHead.has(lc(b.name)));
  const lookupResults = /* @__PURE__ */ new Map();
  if (unmatched.length > 0) {
    logger.info(
      `Looking up PRs for ${unmatched.length} unmatched branch(es) (${concurrency} in parallel)\u2026`
    );
    let completed = 0;
    const pairs = await mapWithConcurrency(
      unmatched,
      concurrency,
      async (branch) => {
        try {
          const prs = await deps.lookupPrsForBranch(branch.name);
          completed += 1;
          logger.debug(`  [${completed}/${unmatched.length}] ${branch.name}`);
          return [branch.name, pickBestPr(prs)];
        } catch (err) {
          completed += 1;
          const msg = err instanceof Error ? err.message : String(err);
          logger.warn(
            `  [${completed}/${unmatched.length}] lookup failed for ${branch.name}: ${msg}`
          );
          return [branch.name, null];
        }
      }
    );
    for (const [name, pr] of pairs) {
      lookupResults.set(name, pr);
    }
  }
  const candidates = [];
  for (const branch of filtered) {
    const remoteExists = remoteBranches.has(lc(branch.name));
    const isOrphan = branch.track.includes("gone");
    const hasUpstream = branch.upstream.length > 0;
    const age = daysSinceUnix(branch.lastCommitUnix, now);
    const myPr = myPrByHead.get(lc(branch.name));
    const fallbackPr = lookupResults.get(branch.name) ?? null;
    const pr = myPr ?? fallbackPr;
    let reason = null;
    let category = null;
    if (pr !== null && pr !== void 0) {
      ({ reason, category } = reasonForPr(pr, viewer, now));
      if (isOrphan) reason = `${reason} \xB7 orphan`;
    } else if (isOrphan) {
      reason = "orphaned (remote gone)";
      category = "orphan-only";
    } else if (!hasUpstream) {
      reason = `local-only (never pushed), last commit ${age}d ago`;
      category = "local-only";
    } else if (age >= staleDays) {
      reason = `stale: last commit ${age}d ago, no PR`;
      category = "stale";
    }
    if (reason !== null && category !== null) {
      candidates.push({
        branch: branch.name,
        reason,
        remoteExists,
        category,
        prNumber: pr?.number ?? null,
        prUrl: pr?.url ?? null
      });
    }
  }
  candidates.sort((a, b) => {
    const c = CATEGORY_ORDER[a.category] - CATEGORY_ORDER[b.category];
    return c !== 0 ? c : a.branch.localeCompare(b.branch);
  });
  return candidates;
}

// src/cli/args.ts
function printHelpAndExit(code) {
  logger.log(`Usage: npx branch-cleaner [--days=N] [--stale-days=N]

Surfaces local branches that are safe to delete:
  \u2022 Your own PRs merged or closed in the last --days days (bulk lookup)
  \u2022 Other branches whose PR (yours or someone else's) is matched via per-branch
    lookup \u2014 handles old branches, review checkouts, and abandoned work
  \u2022 Local branches whose remote tracking ref is gone (orphan)
  \u2022 Branches with no matching PR whose last commit is older than --stale-days

You toggle which to remove; the script prints a ready-to-paste \`git branch -D\`
command. Nothing is deleted automatically.

Options:
  --days=N         Date window for your closed PRs (default: 30)
  --stale-days=N   Age cutoff for "no PR + old commit" (default: 30)
  -h, --help       Show this message`);
  process.exit(code);
}
function parseArgs(argv = process.argv.slice(2)) {
  let days = 30;
  let staleDays = 30;
  for (const arg of argv) {
    const daysMatch = arg.match(/^--days=(\d+)$/);
    const staleMatch = arg.match(/^--stale-days=(\d+)$/);
    if (daysMatch !== null) {
      days = Number(daysMatch[1]);
    } else if (staleMatch !== null) {
      staleDays = Number(staleMatch[1]);
    } else if (arg === "-h" || arg === "--help") {
      printHelpAndExit(0);
    } else {
      logger.error(`Unknown argument: ${arg}`);
      printHelpAndExit(1);
    }
  }
  return { days, staleDays };
}

// src/git/branches.ts
var LOCAL_BRANCH_FORMAT = "%(refname:short)|%(upstream:short)|%(upstream:track)|%(committerdate:unix)";
function parseLocalBranches(output, currentBranch) {
  return output.split("\n").filter((line) => line.length > 0).map((line) => {
    const [name = "", upstream = "", track = "", ts = "0"] = line.split("|");
    return {
      name,
      upstream,
      track,
      isCurrent: name === currentBranch,
      lastCommitUnix: Number(ts)
    };
  });
}
function parseRemoteBranches(output) {
  return new Set(
    output.split("\n").filter((line) => line.length > 0).map((line) => lc(line.replace(/^origin\//, "")))
  );
}
function getCurrentBranch() {
  return run("git", ["rev-parse", "--abbrev-ref", "HEAD"]).trim();
}
function listLocalBranches(currentBranch) {
  const output = run("git", [
    "for-each-ref",
    "refs/heads",
    `--format=${LOCAL_BRANCH_FORMAT}`
  ]);
  return parseLocalBranches(output, currentBranch);
}
function listRemoteBranches() {
  const output = run("git", [
    "for-each-ref",
    "refs/remotes/origin",
    "--format=%(refname:short)"
  ]);
  return parseRemoteBranches(output);
}

// src/ui/output.ts
function formatMultiline(cmd, items) {
  if (items.length === 1) return `  ${cmd} ${items[0]}`;
  const indent = " ".repeat(cmd.length + 3);
  return items.map((item, i) => {
    const prefix = i === 0 ? `  ${cmd} ` : indent;
    const suffix = i === items.length - 1 ? "" : " \\";
    return `${prefix}${item}${suffix}`;
  }).join("\n");
}

// src/ui/picker.ts
import { emitKeypressEvents } from "readline";

// src/ui/ansi.ts
var ANSI = {
  clear: "\x1B[2J\x1B[H",
  hideCursor: "\x1B[?25l",
  showCursor: "\x1B[?25h",
  reset: "\x1B[0m",
  bold: "\x1B[1m",
  dim: "\x1B[2m",
  invert: "\x1B[7m",
  yellow: "\x1B[33m",
  cyan: "\x1B[36m"
};
function hyperlink(text, url) {
  return `\x1B]8;;${url}\x1B\\${text}\x1B]8;;\x1B\\`;
}
function decorateReason(c) {
  if (c.prNumber === null || c.prUrl === null) return c.reason;
  const link = hyperlink(`#${c.prNumber}`, c.prUrl);
  return c.reason.replace(`#${c.prNumber}`, `${ANSI.cyan}${link}${ANSI.reset}`);
}

// src/ui/picker.ts
function restoreTty() {
  process.stdout.write(ANSI.showCursor);
  if (process.stdin.isTTY) {
    try {
      process.stdin.setRawMode(false);
    } catch {
    }
  }
}
async function pickBranches(candidates) {
  if (!process.stdin.isTTY) {
    logger.error("Interactive selection requires a TTY.");
    process.exit(1);
  }
  const selected = /* @__PURE__ */ new Set();
  let cursor = 0;
  const PAGE_SIZE = 20;
  const totalPages = Math.max(1, Math.ceil(candidates.length / PAGE_SIZE));
  const branchWidth = Math.max(20, ...candidates.map((c) => c.branch.length));
  const reasonWidth = Math.max(...candidates.map((c) => c.reason.length));
  const render = () => {
    const page = Math.floor(cursor / PAGE_SIZE);
    const start = page * PAGE_SIZE;
    const end = Math.min(start + PAGE_SIZE, candidates.length);
    const lines = [];
    lines.push(
      `${ANSI.bold}Local branch cleanup${ANSI.reset} \u2014 ${candidates.length} candidate(s) \xB7 ${ANSI.dim}page ${page + 1}/${totalPages}${ANSI.reset}`
    );
    lines.push(
      `${ANSI.dim}\u2191/\u2193 move \xB7 \u2190/\u2192 page \xB7 space toggle \xB7 a toggle-all \xB7 enter confirm \xB7 q quit${ANSI.reset}`
    );
    lines.push("");
    for (let i = start; i < end; i += 1) {
      const c = candidates[i];
      const mark = selected.has(i) ? "[x]" : "[ ]";
      const reasonPad = " ".repeat(Math.max(0, reasonWidth - c.reason.length));
      const remote = c.remoteExists ? `${ANSI.yellow}\u2691remote${ANSI.reset}` : "";
      const row = `${mark} ${c.branch.padEnd(branchWidth)} ${ANSI.dim}\xB7${ANSI.reset} ${decorateReason(c)}${reasonPad}  ${remote}`;
      lines.push(i === cursor ? `${ANSI.invert}${row}${ANSI.reset}` : row);
    }
    process.stdout.write(ANSI.clear + lines.join("\n") + "\n");
  };
  return new Promise((resolve) => {
    emitKeypressEvents(process.stdin);
    process.stdin.setRawMode(true);
    process.stdout.write(ANSI.hideCursor);
    render();
    const cleanup = () => {
      process.stdin.setRawMode(false);
      process.stdout.write(ANSI.showCursor);
      process.stdin.pause();
      process.stdin.removeListener("keypress", onKey);
    };
    const onKey = (_str, key) => {
      if (key.ctrl === true && key.name === "c") {
        cleanup();
        restoreTty();
        logger.log("\nCancelled.");
        process.exit(0);
      }
      switch (key.name) {
        case "up":
          cursor = (cursor - 1 + candidates.length) % candidates.length;
          break;
        case "down":
          cursor = (cursor + 1) % candidates.length;
          break;
        case "left": {
          const offset = cursor % PAGE_SIZE;
          const page = Math.floor(cursor / PAGE_SIZE);
          const newPage = (page - 1 + totalPages) % totalPages;
          cursor = Math.min(newPage * PAGE_SIZE + offset, candidates.length - 1);
          break;
        }
        case "right": {
          const offset = cursor % PAGE_SIZE;
          const page = Math.floor(cursor / PAGE_SIZE);
          const newPage = (page + 1) % totalPages;
          cursor = Math.min(newPage * PAGE_SIZE + offset, candidates.length - 1);
          break;
        }
        case "space":
          if (selected.has(cursor)) selected.delete(cursor);
          else selected.add(cursor);
          break;
        case "a":
          if (selected.size === candidates.length) selected.clear();
          else candidates.forEach((_, i) => selected.add(i));
          break;
        case "return":
          cleanup();
          resolve(
            [...selected].sort((a, b) => a - b).map((i) => candidates[i])
          );
          return;
        case "q":
        case "escape":
          cleanup();
          resolve([]);
          return;
        default:
          return;
      }
      render();
    };
    process.stdin.on("keypress", onKey);
  });
}

// src/index.ts
async function main() {
  const { days, staleDays } = parseArgs();
  ensurePrereqs();
  process.on("SIGINT", () => {
    restoreTty();
    logger.log("\nCancelled.");
    process.exit(0);
  });
  logger.info("Fetching remote refs (git fetch --prune)\u2026");
  run("git", ["fetch", "--prune"]);
  logger.info(`Loading your PRs closed in last ${days} day(s)\u2026`);
  const myPrs = fetchMyClosedPrs(days);
  const viewer = getViewerLogin();
  const currentBranch = getCurrentBranch();
  const branches = listLocalBranches(currentBranch);
  const remoteBranches = listRemoteBranches();
  const candidates = await buildCandidates(
    branches,
    myPrs,
    viewer,
    remoteBranches,
    staleDays,
    { lookupPrsForBranch }
  );
  if (candidates.length === 0) {
    logger.log("Nothing to clean up. \u2728");
    return;
  }
  const picked = await pickBranches(candidates);
  if (picked.length === 0) {
    logger.log("No branches selected.");
    return;
  }
  const names = picked.map((p) => p.branch);
  const remoteStillExists = picked.filter((p) => p.remoteExists).map((p) => p.branch);
  logger.log("\nRun this to delete the selected branches:\n");
  logger.log(`${formatMultiline("git branch -D", names)}
`);
  if (remoteStillExists.length > 0) {
    logger.warn(
      `remote branch still exists for: ${remoteStillExists.join(", ")}`
    );
    logger.log("\nIf you also want to delete them on origin:\n");
    logger.log(
      `${formatMultiline("git push origin --delete", remoteStillExists)}
`
    );
  }
}
main().catch((err) => {
  const message = err instanceof Error ? err.message : String(err);
  logger.error(`
${message}`);
  process.exit(1);
});
