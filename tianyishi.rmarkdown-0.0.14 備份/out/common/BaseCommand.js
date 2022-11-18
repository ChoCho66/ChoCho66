"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class BaseCommand {
    constructor() {
        this.init();
        // let fullCommandName = "rmarkdown.";
        // let commandName = this.constructor.name.replace(/Command$/, "");
        // if (subpackage !== undefined) {
        //   fullCommandName += subpackage + ".";
        // }
        // fullCommandName += commandName;
        // let disposable = vscode.commands.registerCommand(fullCommandName, this.run, this);
        // console.log("pushing: ", fullCommandName);
        // context.subscriptions.push(disposable);
    }
    init() { }
}
exports.BaseCommand = BaseCommand;
//# sourceMappingURL=BaseCommand.js.map