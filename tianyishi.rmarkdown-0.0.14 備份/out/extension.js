"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const decorations = require("./rmarkdown-core/decorations");
const listEditing = require("./rmarkdown-core/listEditing");
const formatting = require("./rmarkdown-core/formatting");
const tableFormatter = require("./rmarkdown-core/tableFormatter");
const auto_1 = require("./auto");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    console.log("rmarkdown extension activated!!!");
    decorations.activate(context);
    listEditing.activate(context);
    formatting.activate(context);
    tableFormatter.activate(context);
    auto_1.loadCommands(context);
    vscode.languages.setLanguageConfiguration("rmarkdown", {
        wordPattern: /(-?\d*\.\d\w*)|([^\!\@\#\%\^\&\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s\，\。\《\》\？\；\：\‘\“\’\”\（\）\【\】\、]+)/g,
    });
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map