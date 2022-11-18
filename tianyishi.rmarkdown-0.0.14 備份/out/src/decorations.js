"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
const vscode_1 = require("vscode");
let decorTypes = {
    baseColor: vscode_1.window.createTextEditorDecorationType({
        dark: { color: "#EEFFFF" },
        light: { color: "000000" },
    }),
    gray: vscode_1.window.createTextEditorDecorationType({
        rangeBehavior: 1,
        dark: { color: "#636363" },
        light: { color: "#CCC" },
    }),
    lightBlue: vscode_1.window.createTextEditorDecorationType({
        color: "#4080D0",
    }),
    orange: vscode_1.window.createTextEditorDecorationType({
        color: "#D2B640",
    }),
    strikethrough: vscode_1.window.createTextEditorDecorationType({
        rangeBehavior: 1,
        textDecoration: "line-through",
    }),
    codeSpan: vscode_1.window.createTextEditorDecorationType({
        rangeBehavior: 1,
        border: "1px solid #454D51",
        borderRadius: "3px",
    }),
};
let decors = {};
for (const decorTypeName of Object.keys(decorTypes)) {
    decors[decorTypeName] = [];
}
let regexDecorTypeMapping = {
    "(~~.+?~~)": ["strikethrough"],
    "(?<!`)(`+)(?!`)(.*?)(?<!`)(\\1)(?!`)": ["codeSpan"],
};
let regexDecorTypeMappingPlainTheme = {
    // [alt](link)
    "(^|[^!])(\\[)([^\\]\\n]*(?!\\].*\\[)[^\\[\\n]*)(\\]\\(.+?\\))": ["", "gray", "lightBlue", "gray"],
    // ![alt](link)
    "(\\!\\[)([^\\]\\n]*(?!\\].*\\[)[^\\[\\n]*)(\\]\\(.+?\\))": ["gray", "orange", "gray"],
    // `code`
    "(?<!`)(`+)(?!`)(.*?)(?<!`)(\\1)(?!`)": ["gray", "baseColor", "gray"],
    // *italic*
    "(\\*)([^\\*\\`\\!\\@\\#\\%\\^\\&\\(\\)\\-\\=\\+\\[\\{\\]\\}\\\\\\|\\;\\:\\'\\\"\\,\\.\\<\\>\\/\\?\\s].*?[^\\*\\`\\!\\@\\#\\%\\^\\&\\(\\)\\-\\=\\+\\[\\{\\]\\}\\\\\\|\\;\\:\\'\\\"\\,\\.\\<\\>\\/\\?\\s])(\\*)": ["gray", "baseColor", "gray"],
    // _italic_
    "(_)([^\\*\\`\\!\\@\\#\\%\\^\\&\\(\\)\\-\\=\\+\\[\\{\\]\\}\\\\\\|\\;\\:\\'\\\"\\,\\.\\<\\>\\/\\?\\s].*?[^\\*\\`\\!\\@\\#\\%\\^\\&\\(\\)\\-\\=\\+\\[\\{\\]\\}\\\\\\|\\;\\:\\'\\\"\\,\\.\\<\\>\\/\\?\\s])(_)": ["gray", "baseColor", "gray"],
    // **bold**
    "(\\*\\*)([^\\*\\`\\!\\@\\#\\%\\^\\&\\(\\)\\-\\=\\+\\[\\{\\]\\}\\\\\\|\\;\\:\\'\\\"\\,\\.\\<\\>\\/\\?\\s].*?[^\\*\\`\\!\\@\\#\\%\\^\\&\\(\\)\\-\\=\\+\\[\\{\\]\\}\\\\\\|\\;\\:\\'\\\"\\,\\.\\<\\>\\/\\?\\s])(\\*\\*)": ["gray", "baseColor", "gray"],
};
function activate(context) {
    console.log("activating decoration");
    // workspace.onDidChangeConfiguration((event) => {
    //   if (event.affectsConfiguration("markdown.extension.syntax.decorations")) {
    //     window.showInformationMessage("Please reload VSCode to make setting `syntax.decorations` take effect.");
    //   }
    // });
    // if (!workspace.getConfiguration("rmarkdown.syntax").get<boolean>("decorations")) return;
    vscode_1.window.onDidChangeActiveTextEditor(updateDecorations, null, context.subscriptions);
    vscode_1.workspace.onDidChangeTextDocument((event) => {
        let editor = vscode_1.window.activeTextEditor;
        if (editor !== undefined && event.document === editor.document) {
            triggerUpdateDecorations(editor);
        }
    }, null, context.subscriptions);
    var timeout = null;
    function triggerUpdateDecorations(editor) {
        if (timeout) {
            clearTimeout(timeout);
        }
        timeout = setTimeout(() => updateDecorations(editor), 200);
    }
    // fisrt time
    let editor = vscode_1.window.activeTextEditor;
    if (editor) {
        updateDecorations(editor);
    }
}
exports.activate = activate;
function updateDecorations(editor) {
    console.log("updatting decoration");
    if (editor === undefined) {
        editor = vscode_1.window.activeTextEditor;
    }
    if (!utils_1.isRmarkdownEditor(editor)) {
        return;
    }
    const doc = editor.document;
    if (utils_1.isFileTooLarge(doc)) {
        return;
    }
    // Clean decorations
    for (const decorTypeName of Object.keys(decorTypes)) {
        decors[decorTypeName] = [];
    }
    // e.g. { "(~~.+?~~)": ["strikethrough"] }
    let appliedMappings = Object.assign(Object.assign({}, regexDecorTypeMappingPlainTheme), regexDecorTypeMapping);
    // workspace.getConfiguration("rmarkdown.syntax").get<boolean>("plainTheme") ? { ...regexDecorTypeMappingPlainTheme, ...regexDecorTypeMapping } : regexDecorTypeMapping;
    doc
        .getText()
        .split(/\r?\n/g)
        .forEach((lineText, lineNum) => {
        // For each line
        if (utils_1.isInFencedCodeBlock(doc, lineNum)) {
            return;
        }
        // Issue #412
        // Trick. Match `[alt](link)` and `![alt](link)` first and remember those greyed out ranges
        let noDecorRanges = [];
        for (const reText of Object.keys(appliedMappings)) {
            const decorTypeNames = appliedMappings[reText]; // e.g. ["strikethrough"] or ["gray", "baseColor", "gray"]
            const regex = new RegExp(reText, "g"); // e.g. "(~~.+?~~)"
            let match;
            while ((match = regex.exec(lineText)) !== null) {
                let startIndex = match.index;
                if (noDecorRanges.some((r) => (startIndex > r[0] && startIndex < r[1]) || (startIndex + match[0].length > r[0] && startIndex + match[0].length < r[1]))) {
                    continue;
                }
                for (let i = 0; i < decorTypeNames.length; i++) {
                    // Skip if in math environment (See `completion.ts`)
                    if (utils_1.mathEnvCheck(doc, new vscode_1.Position(lineNum, startIndex)) !== "") {
                        break;
                    }
                    const decorTypeName = decorTypeNames[i];
                    const caughtGroup = decorTypeName === "codeSpan" ? match[0] : match[i + 1];
                    if (decorTypeName === "gray" && caughtGroup.length > 2) {
                        noDecorRanges.push([startIndex, startIndex + caughtGroup.length]);
                    }
                    const range = new vscode_1.Range(lineNum, startIndex, lineNum, startIndex + caughtGroup.length);
                    startIndex += caughtGroup.length;
                    //// Needed for `[alt](link)` rule. And must appear after `startIndex += caughtGroup.length;`
                    if (decorTypeName.length === 0) {
                        continue;
                    }
                    decors[decorTypeName].push(range);
                }
            }
        }
    });
    for (const decorTypeName of Object.keys(decors)) {
        editor.setDecorations(decorTypes[decorTypeName], decors[decorTypeName]);
    }
}
//# sourceMappingURL=decorations.js.map