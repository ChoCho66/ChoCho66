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
const common_1 = require("../../common");
const utils_1 = require("../../utils");
const vscode = require("vscode");
const rmarkdown_helper_1 = require("rmarkdown-helper");
// __title__ = "Knit to All Formats";
class Knit extends common_1.BaseCommand {
    init() {
        this._outputChannel = vscode.window.createOutputChannel("Knit");
        this._fullpath = vscode.window.activeTextEditor.document.fileName;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            this._outputChannel.show();
            // const command = `Rscript -e 'rmarkdown::render("${this._filename}", "all")'`;
            // this._outputChannel.appendLine("[R Markdown] " + command);
            // let p = spawn(command, [], { cwd: this._dirname, shell: true });
            let p = rmarkdown_helper_1.render(this._fullpath);
            // p.stdout.on("data", (data) => {
            //   this._outputChannel.append(data.toString());
            // });
            // p.stderr.on("data", (data) => {
            //   this._outputChannel.append(data.toString());
            // });
            utils_1.verbatimOutput(p, this._outputChannel);
        });
    }
}
exports.Knit = Knit;
//# sourceMappingURL=Knit.js.map