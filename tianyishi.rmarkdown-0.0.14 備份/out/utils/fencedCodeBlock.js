"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
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
//# sourceMappingURL=fencedCodeBlock.js.map