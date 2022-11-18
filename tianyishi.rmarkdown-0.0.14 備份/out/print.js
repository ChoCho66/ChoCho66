"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const path = require("path");
const vscode_1 = require("vscode");
const localize_1 = require("./localize");
const markdownEngine_1 = require("./markdownEngine");
const util_1 = require("./util");
let thisContext;
function activate(context) {
    thisContext = context;
    context.subscriptions.push(vscode_1.commands.registerCommand("rmarkdown.printToHtml", () => {
        print("html");
    }), vscode_1.workspace.onDidSaveTextDocument(onDidSave));
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
function onDidSave(doc) {
    if (doc.languageId === "markdown" && vscode_1.workspace.getConfiguration("rmarkdown.print", doc.uri).get("onFileSave")) {
        print("html");
    }
}
function print(type) {
    return __awaiter(this, void 0, void 0, function* () {
        const editor = vscode_1.window.activeTextEditor;
        if (!util_1.isMdEditor(editor)) {
            vscode_1.window.showErrorMessage(localize_1.default("noValidMarkdownFile"));
            return;
        }
        const doc = editor.document;
        if (doc.isDirty || doc.isUntitled) {
            doc.save();
        }
        vscode_1.window.setStatusBarMessage(localize_1.default("printing") + ` '${path.basename(doc.fileName)}' ` + localize_1.default("to") + ` '${type.toUpperCase()}' ...`, 1000);
        /**
         * Modified from <https://github.com/Microsoft/vscode/tree/master/extensions/markdown>
         * src/previewContentProvider MDDocumentContentProvider provideTextDocumentContent
         */
        let outPath = doc.fileName.replace(/\.\w+?$/, `.${type}`);
        outPath = outPath.replace(/^([cdefghij]):\\/, function (match, p1) {
            return `${p1.toUpperCase()}:\\`; // Capitalize drive letter
        });
        if (!outPath.endsWith(`.${type}`)) {
            outPath += `.${type}`;
        }
        let title = doc
            .getText()
            .split(/\r?\n/g)
            .find((lineText) => lineText.startsWith("#"));
        if (title) {
            title = title.replace(/^#+/, "").replace(/#+$/, "").trim();
        }
        let body = yield markdownEngine_1.mdEngine.render(doc.getText(), vscode_1.workspace.getConfiguration(rmarkdown.preview, ", doc.uri));));
        // Image paths
        const config = vscode_1.workspace.getConfiguration("rmarkdown", doc.uri);
        const configToBase64 = config.get("print.imgToBase64");
        const configAbsPath = config.get("print.absoluteImgPath");
        const imgTagRegex = /(<img[^>]+src=")([^"]+)("[^>]*>)/g; // Match '<img...src="..."...>'
        if (configToBase64) {
            body = body.replace(imgTagRegex, function (_, p1, p2, p3) {
                if (p2.startsWith("http") || p2.startsWith("data:")) {
                    return _;
                }
                const imgSrc = relToAbsPath(doc.uri, p2);
                try {
                    const imgExt = path.extname(imgSrc).slice(1);
                    const file = fs.readFileSync(imgSrc).toString("base64");
                    return `${p1}data:image/${imgExt};base64,${file}${p3}`;
                }
                catch (e) {
                    vscode_1.window.showWarningMessage(localize_1.default("unableToReadFile") + ` ${imgSrc}, ` + localize_1.default("revertingToImagePaths"));
                }
                if (configAbsPath) {
                    return `${p1}file:///${imgSrc}${p3}`;
                }
                else {
                    return _;
                }
            });
        }
        else if (configAbsPath) {
            body = body.replace(imgTagRegex, function (_, p1, p2, p3) {
                if (p2.startsWith("http") || p2.startsWith("data:")) {
                    return _;
                }
                const imgSrc = relToAbsPath(doc.uri, p2);
                // Absolute paths need `file:///` but relative paths don't
                return `${p1}file:///${imgSrc}${p3}`;
            });
        }
        const hasMath = hasMathEnv(doc.getText());
        const html = `<!DOCTYPE html>
    <html>
    <head>
        <meta charset="UTF-8">
        <title>${title ? title : ""}</title>
        ${getStyles(doc.uri, hasMath)}
        ${hasMath ? '<script src="https://cdn.jsdelivr.net/npm/katex-copytex@latest/dist/katex-copytex.min.js"></script>' : ""}
    </head>
    <body${config.get("print.theme") === "light" ? ' class="vscode-light"' : ""}>
        ${body}
    </body>
    </html>`;
        switch (type) {
            case "html":
                fs.writeFile(outPath, html, "utf-8", function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
                break;
            case "pdf":
                break;
        }
    });
}
function hasMathEnv(text) {
    // I'm lazy
    return text.includes("$");
}
function getMediaPath(mediaFile) {
    return thisContext.asAbsolutePath(path.join("media", mediaFile));
}
function wrapWithStyleTag(src) {
    if (src.startsWith("http")) {
        return `<link rel="stylesheet" href="${src}">`;
    }
    else {
        return `<style>\n${readCss(src)}\n</style>`;
    }
}
function readCss(fileName) {
    try {
        return fs.readFileSync(fileName).toString().replace(/\s+/g, " ");
    }
    catch (error) {
        let msg = error.message.replace("ENOENT: no such file or directory, open", localize_1.default("customStyle")) + localize_1.default("notFound");
        msg = msg.replace(/'([c-z]):/, function (_, g1) {
            return `'${g1.toUpperCase()}:`;
        });
        vscode_1.window.showWarningMessage(msg);
        return "";
    }
}
function getStyles(uri, hasMathEnv) {
    const katexCss = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.10.2/dist/katex.min.css" integrity="sha384-yFRtMMDnQtDRO8rLpMIKrtPCD5jdktao2TV19YiZYWMDkUR5GQZR/NOVTdquEx1j" crossorigin="anonymous">';
    const markdownCss = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Microsoft/vscode/extensions/markdown-language-features/mediarmarkdown.css">';
    const highlightCss = '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/Microsoft/vscode/extensions/markdown-language-features/media/highlight.css">';
    const copyTeXCss = '<link href="https://cdn.jsdelivr.net/npm/katex-copytex@latest/dist/katex-copytex.min.css" rel="stylesheet" type="text/css">';
    const baseCssPaths = ["checkbox.css"].map((s) => getMediaPath(s));
    const customCssPaths = getCustomStyleSheets(uri);
    return `${hasMathEnv ? katexCss : ""}
        ${markdownCss}
        ${highlightCss}
        ${hasMathEnv ? copyTeXCss : ""}
        ${baseCssPaths.map((cssSrc) => wrapWithStyleTag(cssSrc)).join("\n")}
        ${getPreviewSettingStyles()}
        ${customCssPaths.map((cssSrc) => wrapWithStyleTag(cssSrc)).join("\n")}`;
}
function getCustomStyleSheets(resource) {
    const styles = vscode_1.workspace.getConfiguration("markdown", resource)["styles"];
    if (styles && Array.isArray(styles) && styles.length > 0) {
        const root = vscode_1.workspace.getWorkspaceFolder(resource);
        return styles.map((s) => {
            if (!s || s.startsWith("http") || path.isAbsolute(s)) {
                return s;
            }
            if (root) {
                return path.join(root.uri.fsPath, s);
            }
            else {
                // Otherwise look relative to the markdown file
                return path.join(path.dirname(resource.fsPath), s);
            }
        });
    }
    return [];
}
function relToAbsPath(resource, href) {
    if (!href || href.startsWith("http") || path.isAbsolute(href)) {
        return href;
    }
    // Otherwise look relative to the markdown file
    return path.join(path.dirname(resource.fsPath), href);
}
function getPreviewSettingStyles() {
    const previewSettings = vscode_1.workspace.getConfiguration("markdown")["preview"];
    if (!previewSettings) {
        return "";
    }
    const { fontFamily, fontSize, lineHeight } = previewSettings;
    return `<style>
            body {
                ${fontFamily ? `font-family: ${fontFamily};` : ""}
                ${+fontSize > 0 ? `font-size: ${fontSize}px;` : ""}
                ${+lineHeight > 0 ? `line-height: ${lineHeight};` : ""}
            }
        </style>`;
}
//# sourceMappingURL=print.js.map