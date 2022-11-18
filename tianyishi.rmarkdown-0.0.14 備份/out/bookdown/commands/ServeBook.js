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
//// @ts-nocheck
const r_helper_1 = require("r-helper");
const vscode = require("vscode");
const BaseCommand_1 = require("../../common/BaseCommand");
const verbatimOutput_1 = require("../../utils/verbatimOutput");
const child_process_1 = require("child_process");
// __title__ = "Bookdown: Serve Book";
class ServeBook extends BaseCommand_1.BaseCommand {
    init() {
        this._outputChannel = vscode.window.createOutputChannel("Bookdown");
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            let p = child_process_1.spawn(r_helper_1.Rscript(r_helper_1.Rcall("bookdown::serve_book()")), { cwd: vscode.workspace.workspaceFolders[0].uri.path, shell: true });
            console.log(p);
            verbatimOutput_1.verbatimOutput(p, this._outputChannel);
        });
    }
}
exports.ServeBook = ServeBook;
//# sourceMappingURL=ServeBook.js.map