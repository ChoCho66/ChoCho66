"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
const vscode = require("vscode");
const rmarkdown_1 = require("./rmarkdown");
const decorations = require("./decorations");
// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
    console.log("rmarkdown extension activated");
    decorations.activate(context);
    let rmd = new rmarkdown_1.Rmarkdown();
    context.subscriptions.push(vscode.commands.registerCommand("rmarkdown_vscode.knit", () => {
        rmd.knit();
    }));
    vscode.languages.setLanguageConfiguration("rmarkdown", {
        wordPattern: /(-?\d*\.\d\w*)|([^\!\@\#\%\^\&\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s\，\。\《\》\？\；\：\‘\“\’\”\（\）\【\】\、]+)/g,
    });
}
exports.activate = activate;
// this method is called when your extension is deactivated
function deactivate() { }
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map