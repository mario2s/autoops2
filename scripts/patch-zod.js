#!/usr/bin/env node
// zod@3.25.76 ships with an incomplete v3 compat layer — two helper files are
// referenced in v3/external.cjs and v3/types.cjs but missing from the package.
// We're pinned to 3.25.76 because @expo/cli (expo 55 and 56) declares
// "zod": "^3.25.76", and 3.25.76 is the latest stable 3.x release — there is
// no newer 3.x to upgrade to, and 4.x would break @expo/cli.
const fs = require("fs");
const path = require("path");

const helpersDir = path.join(__dirname, "../node_modules/zod/v3/helpers");

const typeAliases = path.join(helpersDir, "typeAliases.cjs");
if (!fs.existsSync(typeAliases)) {
  fs.writeFileSync(
    typeAliases,
    '"use strict";\nObject.defineProperty(exports, "__esModule", { value: true });\n'
  );
  console.log("patched: zod/v3/helpers/typeAliases.cjs");
}

const errorUtil = path.join(helpersDir, "errorUtil.cjs");
if (!fs.existsSync(errorUtil)) {
  fs.writeFileSync(
    errorUtil,
    `"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorUtil = void 0;
var errorUtil;
(function (errorUtil) {
    errorUtil.errToObj = (message) =>
        typeof message === "string" ? { message } : message || {};
    errorUtil.toString = (message) =>
        typeof message === "string" ? message : message === null || message === void 0 ? void 0 : message.message;
})(errorUtil = exports.errorUtil || (exports.errorUtil = {}));
`
  );
  console.log("patched: zod/v3/helpers/errorUtil.cjs");
}
