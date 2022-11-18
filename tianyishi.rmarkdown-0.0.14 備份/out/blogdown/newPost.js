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
// @ts-nocheck
const vscode = require("vscode");
const MultistepInput_1 = require("../common/MultistepInput");
const BaseCommand_1 = require("../common/BaseCommand");
const fs_1 = require("fs");
const path_1 = require("path");
const slugify_1 = require("../utils/slugify");
const { readdir, writeFile } = fs_1.promises;
// const extOptions = [
//   { label: "Rmd", ext: ".Rmd" },
//   { label: "md", ext: ".md" },
// ];
// always Rmd, always today
class newPostCommand extends BaseCommand_1.BaseCommand {
    constructor() {
        super(...arguments);
        this.TITLE = "Blogdown: New Post";
        this.TotalSteps = 4;
    }
    init() {
        this.subextension = "blogdown";
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            const state = { projectDir: vscode.workspace.workspaceFolders[0].uri.path };
            if (!(yield MultistepInput_1.MultiStepInput.run((input) => this.setTitle(input, state)))) {
                // command cancelled
                return;
            }
            const slug = slugify_1.slugify(state.title);
            const newPostPath = path_1.join(state.category, slug + ".Rmd");
            simpleNewPostGenerator(state.archetype, newPostPath, state);
            vscode.workspace.openTextDocument(newPostPath).then((document) => vscode.window.showTextDocument(document));
        });
    }
    setTitle(input, state) {
        return __awaiter(this, void 0, void 0, function* () {
            state.title = yield input.showInputBox({
                title: this.TITLE,
                step: input.CurrentStepNumber,
                totalSteps: this.TotalSteps,
                prompt: "The Title to be Displayed",
                placeholder: "Hello Blogdown",
                ignoreFocusOut: true,
                value: "",
                //value: typeof state.host === "string" ? state.host : "",
                validate: (value) => __awaiter(this, void 0, void 0, function* () { return (!value || !value.trim() ? "Title is required" : ""); }),
            });
            return (input) => this.setAuthor(input, state);
        });
    }
    setAuthor(input, state) {
        return __awaiter(this, void 0, void 0, function* () {
            state.author = yield input.showInputBox({
                title: this.TITLE,
                step: input.CurrentStepNumber,
                totalSteps: this.TotalSteps,
                prompt: "Author",
                placeholder: "your name goes here",
                ignoreFocusOut: true,
                value: typeof state.author === "string" ? state.author : "",
                validate: (value) => __awaiter(this, void 0, void 0, function* () { return (!value || !value.trim() ? "Author is required" : ""); }),
            });
            return (input) => this.setCategory(input, state);
        });
    }
    setCategory(input, state) {
        return __awaiter(this, void 0, void 0, function* () {
            const categories = yield getCategories(state.projectDir);
            const active = undefined; // TODO: last used; most used
            state.category = yield input.showQuickPick({
                title: this.TITLE,
                step: input.CurrentStepNumber,
                totalSteps: this.TotalSteps,
                placeholder: 'Category (which subdirectory of "content")',
                ignoreFocusOut: true,
                items: categories,
                activeItem: active,
                convert: (value) => __awaiter(this, void 0, void 0, function* () { return value.fullPath; }),
            });
            return (input) => this.setArchetype(input, state);
        });
    }
    setArchetype(input, state) {
        return __awaiter(this, void 0, void 0, function* () {
            // first need the databases
            const archetypes = yield getArchetypes(state.projectDir);
            const active = undefined; // TODO: last used; most used
            state.archetype = yield input.showQuickPick({
                title: this.TITLE,
                step: input.CurrentStepNumber,
                totalSteps: this.TotalSteps,
                placeholder: 'Archetype (in the "archetypes" directory',
                ignoreFocusOut: true,
                items: archetypes,
                activeItem: active,
                convert: (value) => __awaiter(this, void 0, void 0, function* () { return value.fullPath; }),
            });
        });
    }
}
exports.newPostCommand = newPostCommand;
function getCategories(projectDir) {
    return __awaiter(this, void 0, void 0, function* () {
        const categoriesParentDir = path_1.join(projectDir, "content");
        const categories = yield (yield readdir(categoriesParentDir, { withFileTypes: true })).filter((p) => p.isDirectory).map((p) => p.name);
        return Array.from(categories, (cat) => {
            return { label: cat, fullPath: path_1.join(categoriesParentDir, cat) };
        });
    });
}
function getArchetypes(projectDir) {
    return __awaiter(this, void 0, void 0, function* () {
        const archetypesDir = path_1.join(projectDir, "archetypes");
        const archetypes = yield (yield readdir(archetypesDir, { withFileTypes: true })).filter((p) => p.isFile && p.name.slice(p.name.length - 2) === "md").map((p) => p.name);
        return Array.from(archetypes, (arc) => {
            return { label: arc, fullPath: path_1.join(archetypesDir, arc) };
        });
    });
}
function simpleNewPostGenerator(src, dst, options) {
    const archetypeLines = fs_1.readFileSync(src, "utf8").split(/\r?\n/g);
    if (archetypeLines[0] !== "---") {
        throw Error("Archetypes files must have YAML frontmatter");
    }
    let n = 0; // number of '---'s
    let content = archetypeLines
        .map((line) => {
        if (n === 2) {
            return line;
        }
        else if (line.slice(0, 3) === "---") {
            n++;
            return line;
        }
        let m = line.match(/^[a-z]+/);
        if (m !== null) {
            switch (m[0]) {
                case "title": {
                    return "title: " + options.title;
                }
                case "author": {
                    return "author: " + options.author;
                }
                case "date": {
                    return "date: " + new Date().toISOString().slice(0, 10);
                }
            }
        }
        return line;
    })
        .join("\n");
    fs_1.writeFileSync(dst, content, "utf8");
}
//# sourceMappingURL=newPost.js.map