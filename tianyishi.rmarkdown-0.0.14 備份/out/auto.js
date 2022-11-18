"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const Knit_1 = require("./rmarkdown-core/commands/Knit");
const ServeBook_1 = require("./bookdown/commands/ServeBook");
const ServeSite_1 = require("./blogdown/commands/ServeSite");
const NewPost_1 = require("./blogdown/commands/NewPost");
function loadCommands(context) {
    context.subscriptions.push(vscode.commands.registerCommand("rmarkdown.rmarkdown-core.Knit", () => {
        new Knit_1.Knit().run();
    }));
    context.subscriptions.push(vscode.commands.registerCommand("rmarkdown.bookdown.serveBook", () => {
        new ServeBook_1.ServeBook().run();
    }));
    context.subscriptions.push(vscode.commands.registerCommand("rmarkdown.blogdown.ServeSite", () => {
        new ServeSite_1.ServeSite().run();
    }));
    context.subscriptions.push(vscode.commands.registerCommand("rmarkdown.blogdown.NewPost", () => {
        new NewPost_1.NewPost().run();
    }));
}
exports.loadCommands = loadCommands;
//# sourceMappingURL=auto.js.map