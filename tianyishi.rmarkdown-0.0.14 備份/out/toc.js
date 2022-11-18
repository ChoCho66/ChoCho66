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
const path = require("path");
const stringSimilarity = require("string-similarity");
const vscode_1 = require("vscode");
const util_1 = require("./util");
/**
 * Workspace config
 */
const docConfig = { tab: "  ", eol: "\r\n" };
const tocConfig = { startDepth: 1, endDepth: 6, listMarker: "-", orderedList: false, updateOnSave: false, plaintext: false, tabSize: 2 };
function activate(context) {
    context.subscriptions.push(vscode_1.commands.registerCommand("rmarkdown.toc.create", createToc), vscode_1.commands.registerCommand("rmarkdown.toc.update", updateToc), vscode_1.workspace.onWillSaveTextDocument(onWillSave), vscode_1.languages.registerCodeLensProvider(util_1.mdDocSelector, new TocCodeLensProvider()));
}
exports.activate = activate;
function createToc() {
    return __awaiter(this, void 0, void 0, function* () {
        let editor = vscode_1.window.activeTextEditor;
        if (!util_1.isMdEditor(editor)) {
            return;
        }
        let toc = yield generateTocText(editor.document);
        yield editor.edit(function (editBuilder) {
            editBuilder.delete(editor.selection);
            editBuilder.insert(editor.selection.active, toc);
        });
    });
}
function updateToc() {
    return __awaiter(this, void 0, void 0, function* () {
        const editor = vscode_1.window.activeTextEditor;
        if (!util_1.isMdEditor(editor)) {
            return;
        }
        const doc = editor.document;
        const tocRangesAndText = yield detectTocRanges(doc);
        const tocRanges = tocRangesAndText[0];
        const newToc = tocRangesAndText[1];
        yield editor.edit((editBuilder) => {
            for (const tocRange of tocRanges) {
                if (tocRange !== null) {
                    const oldToc = getText(tocRange).replace(/\r?\n|\r/g, docConfig.eol);
                    if (oldToc !== newToc) {
                        const unchangedLength = commonPrefixLength(oldToc, newToc);
                        const newStart = doc.positionAt(doc.offsetAt(tocRange.start) + unchangedLength);
                        const replaceRange = tocRange.with(newStart);
                        if (replaceRange.isEmpty) {
                            editBuilder.insert(replaceRange.start, newToc.substring(unchangedLength));
                        }
                        else {
                            editBuilder.replace(replaceRange, newToc.substring(unchangedLength));
                        }
                    }
                }
            }
        });
    });
}
function normalizePath(path) {
    return path.replace(/\\/g, "/").toLowerCase();
}
//// Returns a list of user defined excluded headings for the given document.
function getExcludedHeadings(doc) {
    const configObj = vscode_1.workspace.getConfiguration("rmarkdown.toc").get("omittedFromToc");
    if (typeof configObj !== "object" || configObj === null) {
        vscode_1.window.showErrorMessage(`\`omittedFromToc\` must be an object (e.g. \`{"README.md": ["# Introduction"]}\`)`);
        return [];
    }
    const docWorkspace = vscode_1.workspace.getWorkspaceFolder(doc.uri);
    let omittedTocPerFile = {};
    for (const filePath in configObj) {
        if (configObj.hasOwnProperty(filePath)) {
            let normedPath;
            //// Converts paths to absolute paths if a workspace is opened
            if (docWorkspace !== undefined && !path.isAbsolute(filePath)) {
                normedPath = normalizePath(path.join(docWorkspace.uri.fsPath, filePath));
            }
            else {
                normedPath = normalizePath(filePath);
            }
            omittedTocPerFile[normedPath] = [...(omittedTocPerFile[normedPath] || []), ...configObj[filePath]];
        }
    }
    const currentFile = normalizePath(doc.fileName);
    const omittedList = omittedTocPerFile[currentFile] || [];
    if (!Array.isArray(omittedList)) {
        vscode_1.window.showErrorMessage(`\`omittedFromToc\` attributes must be arrays (e.g. \`{"README.md": ["# Introduction"]}\`)`);
        return [];
    }
    return omittedList.map((heading) => {
        const matches = heading.match(/^ *(#+) +(.*)$/);
        if (matches === null) {
            vscode_1.window.showErrorMessage(`Invalid entry "${heading}" in \`omittedFromToc\``);
            return { level: -1, text: "" };
        }
        const [, sharps, name] = matches;
        return {
            level: sharps.length,
            text: name,
        };
    });
}
function generateTocText(doc) {
    return __awaiter(this, void 0, void 0, function* () {
        loadTocConfig();
        const orderedListMarkerIsOne = vscode_1.workspace.getConfiguration("rmarkdown.orderedList").get("marker") === "one";
        let toc = [];
        let tocEntries = buildToc(doc);
        if (tocEntries === null || tocEntries === undefined || tocEntries.length < 1)
            return "";
        let startDepth = Math.max(tocConfig.startDepth, Math.min.apply(null, tocEntries.map((h) => h.level)));
        let order = new Array(tocConfig.endDepth - startDepth + 1).fill(0); // Used for ordered list
        let anchorOccurances = {};
        let ignoredDepthBound = null;
        const excludedHeadings = getExcludedHeadings(doc);
        tocEntries.forEach((entry) => {
            if (entry.level <= tocConfig.endDepth && entry.level >= startDepth) {
                let relativeLvl = entry.level - startDepth;
                //// `[text](link)` → `text`
                let entryText = entry.text.replace(/\[([^\]]*)\]\([^\)]*\)/, (_, g1) => g1);
                let slug = util_1.slugify(util_1.extractText(entryText));
                if (anchorOccurances.hasOwnProperty(slug)) {
                    anchorOccurances[slug] += 1;
                    slug += "-" + String(anchorOccurances[slug]);
                }
                else {
                    anchorOccurances[slug] = 0;
                }
                // Filter out used excluded headings.
                const isExcluded = excludedHeadings.some(({ level, text }) => level === entry.level && text === entry.text);
                const isOmittedSubHeading = ignoredDepthBound !== null && entry.level > ignoredDepthBound;
                if (isExcluded) {
                    // Keep track of the latest omitted heading's depth to also omit its subheadings.
                    ignoredDepthBound = entry.level;
                }
                else if (!isOmittedSubHeading) {
                    // Reset ignore bound (not ignored sub heading anymore).
                    ignoredDepthBound = null;
                    let row = [docConfig.tab.repeat(relativeLvl), (tocConfig.orderedList ? (orderedListMarkerIsOne ? "1" : ++order[relativeLvl]) + "." : tocConfig.listMarker) + " ", tocConfig.plaintext ? entryText : `[${entryText}](#${slug})`];
                    toc.push(row.join(""));
                    if (tocConfig.orderedList)
                        order.fill(0, relativeLvl + 1);
                }
            }
        });
        while (/^[ \t]/.test(toc[0])) {
            toc = toc.slice(1);
        }
        return toc.join(docConfig.eol);
    });
}
/**
 * Returns an array of TOC ranges.
 * If no TOC is found, returns an empty array.
 * @param doc a TextDocument
 */
function detectTocRanges(doc) {
    return __awaiter(this, void 0, void 0, function* () {
        let tocRanges = [];
        const newTocText = yield generateTocText(doc);
        const fullText = doc.getText();
        let listRegex = /(^|\r?\n)((?:[-+*]|[0-9]+[.)]) .*(?:\r?\n[ \t]*(?:[-+*]|[0-9]+[.)]) .*)*)/g;
        let match;
        while ((match = listRegex.exec(fullText)) !== null) {
            //// #525 <!-- no toc --> comment
            const listStartPos = doc.positionAt(match.index + match[1].length);
            if (listStartPos.line > 0 && doc.lineAt(listStartPos.line - 1).text.includes("no toc")) {
                continue;
            }
            const listText = match[2];
            //// Sanity checks
            const firstLine = listText.split(/\r?\n/)[0];
            if (vscode_1.workspace.getConfiguration("rmarkdown.toc").get("plaintext")) {
                //// A lazy way to check whether it is a link
                if (firstLine.includes("](")) {
                    continue;
                }
            }
            else {
                //// GitHub issue #304 & #549
                if (!(firstLine.includes("](#") && firstLine.trim().split(" ")[1].startsWith("["))) {
                    continue;
                }
            }
            if (radioOfCommonPrefix(newTocText, listText) + stringSimilarity.compareTwoStrings(newTocText, listText) > 0.5) {
                tocRanges.push(new vscode_1.Range(listStartPos, doc.positionAt(listRegex.lastIndex)));
            }
        }
        return [tocRanges, newTocText];
    });
}
function commonPrefixLength(s1, s2) {
    let minLength = Math.min(s1.length, s2.length);
    for (let i = 0; i < minLength; i++) {
        if (s1[i] !== s2[i]) {
            return i;
        }
    }
    return minLength;
}
function radioOfCommonPrefix(s1, s2) {
    let minLength = Math.min(s1.length, s2.length);
    let maxLength = Math.max(s1.length, s2.length);
    let prefixLength = commonPrefixLength(s1, s2);
    if (prefixLength < minLength) {
        return prefixLength / minLength;
    }
    else {
        return minLength / maxLength;
    }
}
function onWillSave(e) {
    if (!tocConfig.updateOnSave)
        return;
    if (e.document.languageId == "markdown") {
        e.waitUntil(updateToc());
    }
}
function loadTocConfig() {
    let tocSectionCfg = vscode_1.workspace.getConfiguration("rmarkdown.toc");
    let tocLevels = tocSectionCfg.get("levels");
    let matches;
    if ((matches = tocLevels.match(/^([1-6])\.\.([1-6])$/))) {
        tocConfig.startDepth = Number(matches[1]);
        tocConfig.endDepth = Number(matches[2]);
    }
    tocConfig.orderedList = tocSectionCfg.get("orderedList");
    tocConfig.listMarker = tocSectionCfg.get("unorderedList.marker");
    tocConfig.plaintext = tocSectionCfg.get("plaintext");
    tocConfig.updateOnSave = tocSectionCfg.get("updateOnSave");
    // Load workspace config
    let activeEditor = vscode_1.window.activeTextEditor;
    docConfig.eol = activeEditor.document.eol === vscode_1.EndOfLine.CRLF ? "\r\n" : "\n";
    let tabSize = Number(activeEditor.options.tabSize);
    if (vscode_1.workspace.getConfiguration("rmarkdown.list", activeEditor.document.uri).get("indentationSize") === "adaptive") {
        tabSize = tocConfig.orderedList ? 3 : 2;
    }
    let insertSpaces = activeEditor.options.insertSpaces;
    if (insertSpaces) {
        docConfig.tab = " ".repeat(tabSize);
    }
    else {
        docConfig.tab = "\t";
    }
}
function getText(range) {
    return vscode_1.window.activeTextEditor.document.getText(range);
}
function buildToc(doc) {
    let lines = doc
        .getText()
        .replace(/^( {0,3}|\t)```[\W\w]+?^( {0,3}|\t)```/gm, "") //// Remove code blocks (and #603)
        .replace(/<!-- omit in (toc|TOC) -->/g, "&lt; omit in toc &gt;") //// Escape magic comment
        .replace(/<!--[\W\w]+?-->/, "") //// Remove comments
        .replace(/^---[\W\w]+?(\r?\n)---/, "") //// Remove YAML front matter
        .split(/\r?\n/g);
    lines.forEach((lineText, i, arr) => {
        //// Transform setext headings to ATX headings
        if (i < arr.length - 1 &&
            lineText.match(/^ {0,3}\S.*$/) &&
            lineText.replace(/[ -]/g, "").length > 0 && //// #629
            arr[i + 1].match(/^ {0,3}(=+|-{2,}) *$/)) {
            arr[i] = (arr[i + 1].includes("=") ? "# " : "## ") + lineText;
        }
        //// Ignore headings following `<!-- omit in toc -->`
        if (i > 0 && arr[i - 1] === "&lt; omit in toc &gt;") {
            arr[i] = "";
        }
    });
    const toc = lines
        .filter((lineText) => {
        return (lineText.trim().startsWith("#") &&
            !lineText.startsWith("    ") && //// The opening `#` character may be indented 0-3 spaces
            lineText.includes("# ") &&
            !lineText.includes("&lt; omit in toc &gt;"));
    })
        .map((lineText) => {
        lineText = lineText.replace(/^ +/, "");
        const matches = /^(#+) (.*)/.exec(lineText);
        const entry = {
            level: matches[1].length,
            text: matches[2].replace(/#+$/, "").trim(),
        };
        return entry;
    });
    return toc;
}
exports.buildToc = buildToc;
class TocCodeLensProvider {
    provideCodeLenses(document, _) {
        let lenses = [];
        return detectTocRanges(document).then((tocRangesAndText) => {
            const tocRanges = tocRangesAndText[0];
            const newToc = tocRangesAndText[1];
            for (let tocRange of tocRanges) {
                let status = getText(tocRange).replace(/\r?\n|\r/g, docConfig.eol) === newToc ? "up to date" : "out of date";
                lenses.push(new vscode_1.CodeLens(tocRange, {
                    arguments: [],
                    title: `Table of Contents (${status})`,
                    command: "",
                }));
            }
            return lenses;
        });
    }
}
//# sourceMappingURL=toc.js.map