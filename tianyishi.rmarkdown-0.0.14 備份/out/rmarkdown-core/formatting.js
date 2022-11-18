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
const vscode_1 = require("vscode");
const listEditing_1 = require("./listEditing");
function activate(context) {
    context.subscriptions.push(vscode_1.commands.registerCommand("rmarkdown.editing.toggleBold", toggleBold), vscode_1.commands.registerCommand("rmarkdown.editing.toggleItalic", toggleItalic), vscode_1.commands.registerCommand("rmarkdown.editing.toggleStrikethrough", toggleStrikethrough), vscode_1.commands.registerCommand("rmarkdown.editing.toggleHeadingUp", toggleHeadingUp), vscode_1.commands.registerCommand("rmarkdown.editing.toggleHeadingDown", toggleHeadingDown), vscode_1.commands.registerCommand("rmarkdown.editing.toggleList", toggleList), vscode_1.commands.registerCommand("rmarkdown.editing.paste", paste));
}
exports.activate = activate;
/**
 * Here we store Regexp to check if the text is the single link.
 */
const singleLinkRegex = createLinkRegex();
// Return Promise because need to chain operations in unit tests
function toggleBold() {
    return styleByWrapping("**");
}
function toggleItalic() {
    return styleByWrapping("_");
}
function toggleStrikethrough() {
    return styleByWrapping("~~");
}
function toggleHeadingUp() {
    return __awaiter(this, void 0, void 0, function* () {
        let editor = vscode_1.window.activeTextEditor;
        let lineIndex = editor.selection.active.line;
        let lineText = editor.document.lineAt(lineIndex).text;
        return yield editor.edit((editBuilder) => {
            if (!lineText.startsWith("#")) {
                // Not a heading
                editBuilder.insert(new vscode_1.Position(lineIndex, 0), "# ");
            }
            else if (!lineText.startsWith("######")) {
                // Already a heading (but not level 6)
                editBuilder.insert(new vscode_1.Position(lineIndex, 0), "#");
            }
        });
    });
}
function toggleHeadingDown() {
    let editor = vscode_1.window.activeTextEditor;
    let lineIndex = editor.selection.active.line;
    let lineText = editor.document.lineAt(lineIndex).text;
    editor.edit((editBuilder) => {
        if (lineText.startsWith("# ")) {
            // Heading level 1
            editBuilder.delete(new vscode_1.Range(new vscode_1.Position(lineIndex, 0), new vscode_1.Position(lineIndex, 2)));
        }
        else if (lineText.startsWith("#")) {
            // Heading (but not level 1)
            editBuilder.delete(new vscode_1.Range(new vscode_1.Position(lineIndex, 0), new vscode_1.Position(lineIndex, 1)));
        }
    });
}
var MathBlockState;
(function (MathBlockState) {
    // State 1: not in any others states
    MathBlockState[MathBlockState["NONE"] = 0] = "NONE";
    // State 2: $|$
    MathBlockState[MathBlockState["INLINE"] = 1] = "INLINE";
    // State 3: $$ | $$
    MathBlockState[MathBlockState["SINGLE_DISPLAYED"] = 2] = "SINGLE_DISPLAYED";
    // State 4:
    // $$
    // |
    // $$
    MathBlockState[MathBlockState["MULTI_DISPLAYED"] = 3] = "MULTI_DISPLAYED";
})(MathBlockState || (MathBlockState = {}));
function getMathState(editor, cursor) {
    if (getContext(editor, cursor, "$") === "$|$") {
        return MathBlockState.INLINE;
    }
    else if (getContext(editor, cursor, "$$ ", " $$") === "$$ | $$") {
        return MathBlockState.SINGLE_DISPLAYED;
    }
    else if (editor.document.lineAt(cursor.line).text === "" && cursor.line > 0 && editor.document.lineAt(cursor.line - 1).text === "$$" && cursor.line < editor.document.lineCount - 1 && editor.document.lineAt(cursor.line + 1).text === "$$") {
        return MathBlockState.MULTI_DISPLAYED;
    }
    else {
        return MathBlockState.NONE;
    }
}
/**
 * Modify the document, change from `oldMathBlockState` to `newMathBlockState`.
 * @param editor
 * @param cursor
 * @param oldMathBlockState
 * @param newMathBlockState
 */
function setMathState(editor, cursor, oldMathBlockState, newMathBlockState) {
    // Step 1: Delete old math block.
    editor
        .edit((editBuilder) => {
        let rangeToBeDeleted;
        switch (oldMathBlockState) {
            case MathBlockState.NONE:
                rangeToBeDeleted = new vscode_1.Range(cursor, cursor);
                break;
            case MathBlockState.INLINE:
                rangeToBeDeleted = new vscode_1.Range(new vscode_1.Position(cursor.line, cursor.character - 1), new vscode_1.Position(cursor.line, cursor.character + 1));
                break;
            case MathBlockState.SINGLE_DISPLAYED:
                rangeToBeDeleted = new vscode_1.Range(new vscode_1.Position(cursor.line, cursor.character - 3), new vscode_1.Position(cursor.line, cursor.character + 3));
                break;
            case MathBlockState.MULTI_DISPLAYED:
                rangeToBeDeleted = new vscode_1.Range(new vscode_1.Position(cursor.line - 1, 0), new vscode_1.Position(cursor.line + 1, 2));
                break;
        }
        editBuilder.delete(rangeToBeDeleted);
    })
        .then(() => {
        // Step 2: Insert new math block.
        editor
            .edit((editBuilder) => {
            let newCursor = editor.selection.active;
            let stringToBeInserted;
            switch (newMathBlockState) {
                case MathBlockState.NONE:
                    stringToBeInserted = "";
                    break;
                case MathBlockState.INLINE:
                    stringToBeInserted = "$$";
                    break;
                case MathBlockState.SINGLE_DISPLAYED:
                    stringToBeInserted = "$$  $$";
                    break;
                case MathBlockState.MULTI_DISPLAYED:
                    stringToBeInserted = "$$\n\n$$";
                    break;
            }
            editBuilder.insert(newCursor, stringToBeInserted);
        })
            .then(() => {
            // Step 3: Move cursor to the middle.
            let newCursor = editor.selection.active;
            let newPosition;
            switch (newMathBlockState) {
                case MathBlockState.NONE:
                    newPosition = newCursor;
                    break;
                case MathBlockState.INLINE:
                    newPosition = newCursor.with(newCursor.line, newCursor.character - 1);
                    break;
                case MathBlockState.SINGLE_DISPLAYED:
                    newPosition = newCursor.with(newCursor.line, newCursor.character - 3);
                    break;
                case MathBlockState.MULTI_DISPLAYED:
                    newPosition = newCursor.with(newCursor.line - 1, 0);
                    break;
            }
            editor.selection = new vscode_1.Selection(newPosition, newPosition);
        });
    });
}
const transTable = [MathBlockState.NONE, MathBlockState.INLINE, MathBlockState.MULTI_DISPLAYED, MathBlockState.SINGLE_DISPLAYED];
const reverseTransTable = new Array(...transTable).reverse();
function toggleList() {
    const editor = vscode_1.window.activeTextEditor;
    const doc = editor.document;
    let batchEdit = new vscode_1.WorkspaceEdit();
    editor.selections.forEach((selection) => {
        if (selection.isEmpty) {
            toggleListSingleLine(doc, selection.active.line, batchEdit);
        }
        else {
            for (let i = selection.start.line; i <= selection.end.line; i++) {
                toggleListSingleLine(doc, i, batchEdit);
            }
        }
    });
    return vscode_1.workspace.applyEdit(batchEdit).then(() => listEditing_1.fixMarker());
}
function toggleListSingleLine(doc, line, wsEdit) {
    const lineText = doc.lineAt(line).text;
    const indentation = lineText.trim().length === 0 ? lineText.length : lineText.indexOf(lineText.trim());
    const lineTextContent = lineText.substr(indentation);
    if (lineTextContent.startsWith("- ")) {
        wsEdit.replace(doc.uri, new vscode_1.Range(line, indentation, line, indentation + 2), "* ");
    }
    else if (lineTextContent.startsWith("* ")) {
        wsEdit.replace(doc.uri, new vscode_1.Range(line, indentation, line, indentation + 2), "+ ");
    }
    else if (lineTextContent.startsWith("+ ")) {
        wsEdit.replace(doc.uri, new vscode_1.Range(line, indentation, line, indentation + 2), "1. ");
    }
    else if (/^\d\. /.test(lineTextContent)) {
        wsEdit.replace(doc.uri, new vscode_1.Range(line, indentation + 1, line, indentation + 2), ")");
    }
    else if (/^\d\) /.test(lineTextContent)) {
        wsEdit.delete(doc.uri, new vscode_1.Range(line, indentation, line, indentation + 3));
    }
    else {
        wsEdit.insert(doc.uri, new vscode_1.Position(line, indentation), "- ");
    }
}
function paste() {
    return __awaiter(this, void 0, void 0, function* () {
        const editor = vscode_1.window.activeTextEditor;
        const selection = editor.selection;
        if (selection.isSingleLine && !isSingleLink(editor.document.getText(selection))) {
            const text = yield vscode_1.env.clipboard.readText();
            if (isSingleLink(text)) {
                return vscode_1.commands.executeCommand("editor.action.insertSnippet", { snippet: `[$TM_SELECTED_TEXT$0](${text})` });
            }
        }
        return vscode_1.commands.executeCommand("editor.action.clipboardPasteAction");
    });
}
/**
 * Creates Regexp to check if the text is a link (further detailes in the isSingleLink() documentation).
 *
 * @return Regexp
 */
function createLinkRegex() {
    // unicode letters range(must not be a raw string)
    const ul = "\\u00a1-\\uffff";
    // IP patterns
    const ipv4_re = "(?:25[0-5]|2[0-4]\\d|[0-1]?\\d?\\d)(?:\\.(?:25[0-5]|2[0-4]\\d|[0-1]?\\d?\\d)){3}";
    const ipv6_re = "\\[[0-9a-f:\\.]+\\]"; // simple regex (in django it is validated additionally)
    // Host patterns
    const hostname_re = "[a-z" + ul + "0-9](?:[a-z" + ul + "0-9-]{0,61}[a-z" + ul + "0-9])?";
    // Max length for domain name labels is 63 characters per RFC 1034 sec. 3.1
    const domain_re = "(?:\\.(?!-)[a-z" + ul + "0-9-]{1,63}(?<!-))*";
    const tld_re = "" +
        "\\." + // dot
        "(?!-)" + // can't start with a dash
        "(?:[a-z" +
        ul +
        "-]{2,63}" + // domain label
        "|xn--[a-z0-9]{1,59})" + // or punycode label
        "(?<!-)" + // can't end with a dash
        "\\.?"; // may have a trailing dot
    const host_re = "(" + hostname_re + domain_re + tld_re + "|localhost)";
    const pattern = "" +
        "^(?:[a-z0-9\\.\\-\\+]*)://" + // scheme is not validated (in django it is validated additionally)
        "(?:[^\\s:@/]+(?::[^\\s:@/]*)?@)?" + // user: pass authentication
        "(?:" +
        ipv4_re +
        "|" +
        ipv6_re +
        "|" +
        host_re +
        ")" +
        "(?::\\d{2,5})?" + // port
        "(?:[/?#][^\\s]*)?" + // resource path
        "$"; // end of string
    return new RegExp(pattern, "i");
}
/**
 * Checks if the string is a link. The list of link examples you can see in the tests file
 * `test/linksRecognition.test.ts`. This code ported from django's
 * [URLValidator](https://github.com/django/django/blob/2.2b1/django/core/validators.py#L74) with some simplifyings.
 *
 * @param text string to check
 *
 * @return boolean
 */
function isSingleLink(text) {
    return singleLinkRegex.test(text);
}
exports.isSingleLink = isSingleLink;
function styleByWrapping(startPattern, endPattern) {
    if (endPattern === undefined) {
        endPattern = startPattern;
    }
    let editor = vscode_1.window.activeTextEditor;
    let selections = editor.selections;
    let batchEdit = new vscode_1.WorkspaceEdit();
    let shifts = [];
    let newSelections = selections.slice();
    selections.forEach((selection, i) => {
        let cursorPos = selection.active;
        const shift = shifts.map(([pos, s]) => (selection.start.line === pos.line && selection.start.character >= pos.character ? s : 0)).reduce((a, b) => a + b, 0);
        if (selection.isEmpty) {
            // No selected text
            if (startPattern !== "~~" && getContext(editor, cursorPos, startPattern) === `${startPattern}text|${endPattern}`) {
                // `**text|**` to `**text**|`
                let newCursorPos = cursorPos.with({ character: cursorPos.character + shift + endPattern.length });
                newSelections[i] = new vscode_1.Selection(newCursorPos, newCursorPos);
                return;
            }
            else if (getContext(editor, cursorPos, startPattern) === `${startPattern}|${endPattern}`) {
                // `**|**` to `|`
                let start = cursorPos.with({ character: cursorPos.character - startPattern.length });
                let end = cursorPos.with({ character: cursorPos.character + endPattern.length });
                wrapRange(editor, batchEdit, shifts, newSelections, i, shift, cursorPos, new vscode_1.Range(start, end), false, startPattern);
            }
            else {
                // Select word under cursor
                let wordRange = editor.document.getWordRangeAtPosition(cursorPos);
                if (wordRange === undefined) {
                    wordRange = selection;
                }
                // One special case: toggle strikethrough in task list
                const currentTextLine = editor.document.lineAt(cursorPos.line);
                if (startPattern === "~~" && /^\s*[\*\+\-] (\[[ x]\] )? */g.test(currentTextLine.text)) {
                    wordRange = currentTextLine.range.with(new vscode_1.Position(cursorPos.line, currentTextLine.text.match(/^\s*[\*\+\-] (\[[ x]\] )? */g)[0].length));
                }
                wrapRange(editor, batchEdit, shifts, newSelections, i, shift, cursorPos, wordRange, false, startPattern);
            }
        }
        else {
            // Text selected
            wrapRange(editor, batchEdit, shifts, newSelections, i, shift, cursorPos, selection, true, startPattern, endPattern);
        }
    });
    return vscode_1.workspace.applyEdit(batchEdit).then(() => {
        editor.selections = newSelections;
    });
}
/**
 * Add or remove `startPattern`/`endPattern` according to the context
 * @param editor
 * @param options The undo/redo behavior
 * @param cursor cursor position
 * @param range range to be replaced
 * @param isSelected is this range selected
 * @param startPtn
 * @param endPtn
 */
function wrapRange(editor, wsEdit, shifts, newSelections, i, shift, cursor, range, isSelected, startPtn, endPtn) {
    if (endPtn === undefined) {
        endPtn = startPtn;
    }
    let text = editor.document.getText(range);
    const prevSelection = newSelections[i];
    const ptnLength = (startPtn + endPtn).length;
    let newCursorPos = cursor.with({ character: cursor.character + shift });
    let newSelection;
    if (isWrapped(text, startPtn, endPtn)) {
        // remove start/end patterns from range
        wsEdit.replace(editor.document.uri, range, text.substr(startPtn.length, text.length - ptnLength));
        shifts.push([range.end, -ptnLength]);
        // Fix cursor position
        if (!isSelected) {
            if (!range.isEmpty) {
                // means quick styling
                if (cursor.character === range.end.character) {
                    newCursorPos = cursor.with({ character: cursor.character + shift - ptnLength });
                }
                else {
                    newCursorPos = cursor.with({ character: cursor.character + shift - startPtn.length });
                }
            }
            else {
                // means `**|**` -> `|`
                newCursorPos = cursor.with({ character: cursor.character + shift + startPtn.length });
            }
            newSelection = new vscode_1.Selection(newCursorPos, newCursorPos);
        }
        else {
            newSelection = new vscode_1.Selection(prevSelection.start.with({ character: prevSelection.start.character + shift }), prevSelection.end.with({ character: prevSelection.end.character + shift - ptnLength }));
        }
    }
    else {
        // add start/end patterns around range
        wsEdit.replace(editor.document.uri, range, startPtn + text + endPtn);
        shifts.push([range.end, ptnLength]);
        // Fix cursor position
        if (!isSelected) {
            if (!range.isEmpty) {
                // means quick styling
                if (cursor.character === range.end.character) {
                    newCursorPos = cursor.with({ character: cursor.character + shift + ptnLength });
                }
                else {
                    newCursorPos = cursor.with({ character: cursor.character + shift + startPtn.length });
                }
            }
            else {
                // means `|` -> `**|**`
                newCursorPos = cursor.with({ character: cursor.character + shift + startPtn.length });
            }
            newSelection = new vscode_1.Selection(newCursorPos, newCursorPos);
        }
        else {
            newSelection = new vscode_1.Selection(prevSelection.start.with({ character: prevSelection.start.character + shift }), prevSelection.end.with({ character: prevSelection.end.character + shift + ptnLength }));
        }
    }
    newSelections[i] = newSelection;
}
function isWrapped(text, startPattern, endPattern) {
    if (endPattern === undefined) {
        endPattern = startPattern;
    }
    return text.startsWith(startPattern) && text.endsWith(endPattern);
}
function getContext(editor, cursorPos, startPattern, endPattern) {
    if (endPattern === undefined) {
        endPattern = startPattern;
    }
    let startPositionCharacter = cursorPos.character - startPattern.length;
    let endPositionCharacter = cursorPos.character + endPattern.length;
    if (startPositionCharacter < 0) {
        startPositionCharacter = 0;
    }
    let leftText = editor.document.getText(new vscode_1.Range(cursorPos.line, startPositionCharacter, cursorPos.line, cursorPos.character));
    let rightText = editor.document.getText(new vscode_1.Range(cursorPos.line, cursorPos.character, cursorPos.line, endPositionCharacter));
    if (rightText === endPattern) {
        if (leftText === startPattern) {
            return `${startPattern}|${endPattern}`;
        }
        else {
            return `${startPattern}text|${endPattern}`;
        }
    }
    return "|";
}
//# sourceMappingURL=formatting.js.map