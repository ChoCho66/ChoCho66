"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const sizeLimit = 50000; // ~50 KB
let fileSizesCache = {};
function isFileTooLarge(document) {
    const filePath = document.uri.fsPath;
    if (!filePath || !fs.existsSync(filePath)) {
        return false;
    }
    const version = document.version;
    if (fileSizesCache.hasOwnProperty(filePath) && fileSizesCache[filePath][0] === version) {
        return fileSizesCache[filePath][1];
    }
    else {
        const isTooLarge = fs.statSync(filePath)["size"] > sizeLimit;
        fileSizesCache[filePath] = [version, isTooLarge];
        return isTooLarge;
    }
}
exports.isFileTooLarge = isFileTooLarge;
//# sourceMappingURL=sizeCheck.js.map