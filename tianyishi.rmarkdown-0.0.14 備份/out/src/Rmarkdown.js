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
const path_1 = require("path");
const vscode = require("vscode");
const child_process_1 = require("child_process");
//import { render, renderSync } from "rmarkdown";
class Rmarkdown {
    constructor() {
        this._outputChannel = vscode.window.createOutputChannel("Knit");
    }
    knit() {
        return __awaiter(this, void 0, void 0, function* () {
            this._initialize();
            this._outputChannel.show();
            const command = `Rscript -e 'rmarkdown::render("${this._filename}", "all")'`;
            this._outputChannel.appendLine("[R Markdown] " + command);
            let p = child_process_1.spawn(command, [], { cwd: this._dirname, shell: true });
            p.stdout.on("data", (data) => {
                this._outputChannel.append(data.toString());
            });
            p.stderr.on("data", (data) => {
                this._outputChannel.append(data.toString());
            });
        });
    }
    _initialize() {
        this._fullpath = vscode.window.activeTextEditor.document.fileName;
        this._filename = path_1.basename(this._fullpath);
        this._dirname = path_1.dirname(this._fullpath);
    }
}
exports.Rmarkdown = Rmarkdown;
//# sourceMappingURL=Rmarkdown.js.map