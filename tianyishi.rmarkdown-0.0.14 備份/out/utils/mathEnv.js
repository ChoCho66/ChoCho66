"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
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
//# sourceMappingURL=mathEnv.js.map