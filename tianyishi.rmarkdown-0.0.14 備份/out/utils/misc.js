"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function isRmarkdownEditor(editor) {
    return editor && editor.document && editor.document.languageId === "rmarkdown";
}
exports.isRmarkdownEditor = isRmarkdownEditor;
/** Scheme `File` or `Untitled` */
exports.rmdDocSelector = [
    { language: "rmarkdown", scheme: "file" },
    { language: "rmarkdown", scheme: "untitled" },
];
//# sourceMappingURL=misc.js.map