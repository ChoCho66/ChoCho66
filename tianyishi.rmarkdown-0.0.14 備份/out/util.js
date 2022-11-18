"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const vscode_1 = require("vscode");
function isRmarkdownEditor(editor) {
    return editor && editor.document && editor.document.languageId === "rmarkdown";
}
exports.isRmarkdownEditor = isRmarkdownEditor;
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
function isInFencedCodeBlock(doc, lineNum) {
    let textBefore = doc.getText(new vscode_1.Range(new vscode_1.Position(0, 0), new vscode_1.Position(lineNum, 0)));
    let matches = textBefore.match(/^```[\w \+]*$/gm);
    if (matches === null) {
        return false;
    }
    else {
        return matches.length % 2 !== 0;
    }
}
exports.isInFencedCodeBlock = isInFencedCodeBlock;
function mathEnvCheck(doc, pos) {
    const lineTextBefore = doc.lineAt(pos.line).text.substring(0, pos.character);
    const lineTextAfter = doc.lineAt(pos.line).text.substring(pos.character);
    if (/(^|[^\$])\$(|[^ \$].*)\\\w*$/.test(lineTextBefore) && lineTextAfter.includes("$")) {
        // Inline math
        return "inline";
    }
    else {
        const textBefore = doc.getText(new vscode_1.Range(new vscode_1.Position(0, 0), pos));
        const textAfter = doc.getText().substr(doc.offsetAt(pos));
        let matches;
        if ((matches = textBefore.match(/\$\$/g)) !== null && matches.length % 2 !== 0 && textAfter.includes("$$")) {
            // $$ ... $$
            return "display";
        }
        else {
            return "";
        }
    }
}
exports.mathEnvCheck = mathEnvCheck;
//# sourceMappingURL=util.js.map