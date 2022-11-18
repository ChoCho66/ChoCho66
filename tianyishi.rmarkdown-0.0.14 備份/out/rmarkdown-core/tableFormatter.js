"use strict";
// https://github.github.com/gfm/#tables-extension-
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const utils_1 = require("../utils");
//// This module can only be referenced with ECMAScript imports/exports by turning on the 'esModuleInterop' flag and referencing its default export.
//import * as GraphemeSplitter from "grapheme-splitter";
const GraphemeSplitter = require("grapheme-splitter");
const splitter = new GraphemeSplitter();
function activate(_) {
    let registration;
    function registerFormatterIfEnabled() {
        const isEnabled = true; //workspace.getConfiguration().get("rmarkdown.rmarkdown-core.tableFormatter.enabled", true);
        if (isEnabled && !registration) {
            registration = vscode_1.languages.registerDocumentFormattingEditProvider(utils_1.rmdDocSelector, new RmarkdownDocumentFormatter());
        }
        else if (!isEnabled && registration) {
            registration.dispose();
            registration = undefined;
        }
    }
    registerFormatterIfEnabled();
    vscode_1.workspace.onDidChangeConfiguration((event) => {
        if (event.affectsConfiguration("markdown.extension.tableFormatter.enabled")) {
            registerFormatterIfEnabled();
        }
    });
}
exports.activate = activate;
function deactivate() { }
exports.deactivate = deactivate;
class RmarkdownDocumentFormatter {
    provideDocumentFormattingEdits(document, options, token) {
        let edits = [];
        let tables = this.detectTables(document.getText());
        if (tables !== null) {
            tables.forEach((table) => {
                edits.push(new vscode_1.TextEdit(this.getRange(document, table), this.formatTable(table, document, options)));
            });
            return edits;
        }
        else {
            return [];
        }
    }
    detectTables(text) {
        const lineBreak = "\\r?\\n";
        const contentLine = "\\|?.*\\|.*\\|?";
        const leftSideHyphenComponent = "(?:\\|? *:?-+:? *\\|)";
        const middleHyphenComponent = "(?: *:?-+:? *\\|)*";
        const rightSideHyphenComponent = "(?: *:?-+:? *\\|?)";
        const multiColumnHyphenLine = leftSideHyphenComponent + middleHyphenComponent + rightSideHyphenComponent;
        //// GitHub issue #431
        const singleColumnHyphenLine = "(?:\\| *:?-+:? *\\|)";
        const hyphenLine = "[ \\t]*(?:" + multiColumnHyphenLine + "|" + singleColumnHyphenLine + ")[ \\t]*";
        const tableRegex = new RegExp(contentLine + lineBreak + hyphenLine + "(?:" + lineBreak + contentLine + ")*", "g");
        return text.match(tableRegex);
    }
    getRange(document, text) {
        let documentText = document.getText();
        let start = document.positionAt(documentText.indexOf(text));
        let end = document.positionAt(documentText.indexOf(text) + text.length);
        return new vscode_1.Range(start, end);
    }
    /**
     * Return the indentation of a table as a string of spaces by reading it from the first line.
     * In case of `markdown.extension.table.normalizeIndentation` is `enabled` it is rounded to the closest multiple of
     * the configured `tabSize`.
     */
    getTableIndentation(text, options) {
        let doNormalize = vscode_1.workspace.getConfiguration("markdown.extension.tableFormatter").get("normalizeIndentation");
        let indentRegex = new RegExp(/^(\s*)\S/u);
        let match = text.match(indentRegex);
        let spacesInFirstLine = match[1].length;
        let tabStops = Math.round(spacesInFirstLine / options.tabSize);
        let spaces = doNormalize ? " ".repeat(options.tabSize * tabStops) : " ".repeat(spacesInFirstLine);
        return spaces;
    }
    formatTable(text, doc, options) {
        let indentation = this.getTableIndentation(text, options);
        let rows = [];
        let rowsNoIndentPattern = new RegExp(/^\s*(\S.*)$/gmu);
        let match = null;
        while ((match = rowsNoIndentPattern.exec(text)) !== null) {
            rows.push(match[1].trim());
        }
        // Desired width of each column
        let colWidth = [];
        // Alignment of each column
        let colAlign = [];
        // Regex to extract cell content.
        // Known issue: `\\|` is not correctly parsed as a valid delimiter
        let fieldRegExp = new RegExp(/(?:((?:\\\||`.*?`|[^\|])*)\|)/gu);
        let cjkRegex = /[\u3000-\u9fff\uff01-\uff60]/g;
        let lines = rows.map((row, num) => {
            // Normalize
            if (row.startsWith("|")) {
                row = row.slice(1);
            }
            if (!row.endsWith("|")) {
                row = row + "|";
            }
            let field = null;
            let values = [];
            let i = 0;
            while ((field = fieldRegExp.exec(row)) !== null) {
                let cell = field[1].trim();
                values.push(cell);
                //// Calculate `colWidth`
                //// Ignore length of dash-line to enable width reduction
                if (num !== 1) {
                    //// Treat CJK characters as 2 English ones because of Unicode stuff
                    const numOfUnicodeChars = splitter.countGraphemes(cell);
                    const width = cjkRegex.test(cell) ? numOfUnicodeChars + cell.match(cjkRegex).length : numOfUnicodeChars;
                    colWidth[i] = colWidth[i] > width ? colWidth[i] : width;
                }
                i++;
            }
            return values;
        });
        // Normalize the num of hyphen, use Math.max to determine minimum length based on dash-line format
        lines[1] = lines[1].map((cell, i) => {
            if (/:-+:/.test(cell)) {
                //:---:
                colWidth[i] = Math.max(colWidth[i], 5);
                colAlign[i] = "c";
                return ":" + "-".repeat(colWidth[i] - 2) + ":";
            }
            else if (/:-+/.test(cell)) {
                //:---
                colWidth[i] = Math.max(colWidth[i], 4);
                colAlign[i] = "l";
                return ":" + "-".repeat(colWidth[i] - 1);
            }
            else if (/-+:/.test(cell)) {
                //---:
                colWidth[i] = Math.max(colWidth[i], 4);
                colAlign[i] = "r";
                return "-".repeat(colWidth[i] - 1) + ":";
            }
            else if (/-+/.test(cell)) {
                //---
                colWidth[i] = Math.max(colWidth[i], 3);
                colAlign[i] = "l";
                return "-".repeat(colWidth[i]);
            }
            else {
                colAlign[i] = "l";
            }
        });
        return lines
            .map((row) => {
            let cells = row.map((cell, i) => {
                const desiredWidth = colWidth[i];
                let jsLength = splitter
                    .splitGraphemes(cell + " ".repeat(desiredWidth))
                    .slice(0, desiredWidth)
                    .join("").length;
                if (cjkRegex.test(cell)) {
                    jsLength -= cell.match(cjkRegex).length;
                }
                return this.alignText(cell, colAlign[i], jsLength);
            });
            return indentation + "| " + cells.join(" | ") + " |";
        })
            .join(doc.eol === vscode_1.EndOfLine.LF ? "\n" : "\r\n");
    }
    alignText(text, align, length) {
        if (align === "c" && length > text.length) {
            return (" ".repeat(Math.floor((length - text.length) / 2)) + text + " ".repeat(length)).slice(0, length);
        }
        else if (align === "r") {
            return (" ".repeat(length) + text).slice(-length);
        }
        else {
            return (text + " ".repeat(length)).slice(0, length);
        }
    }
}
//# sourceMappingURL=tableFormatter.js.map