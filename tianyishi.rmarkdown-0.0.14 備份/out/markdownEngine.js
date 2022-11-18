"use strict";
//// <https://github.com/microsoft/vscode/blob/master/extensions/markdown-language-features/src/markdownEngine.ts>
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
const util_1 = require("./util");
class MarkdownEngine {
    constructor() {
        this._slugCount = new Map();
        this.initMdIt();
    }
    initMdIt() {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.md) {
                const hljs = yield Promise.resolve().then(() => require("highlight.js"));
                const mdtl = yield Promise.resolve().then(() => require("markdown-it-task-lists"));
                const mdkt = yield Promise.resolve().then(() => require("@neilsustc/markdown-it-katex"));
                //// Make a deep copy as `macros` will be modified by KaTeX during initialization
                let userMacros = JSON.parse(JSON.stringify(vscode_1.workspace.getConfiguration("rmarkdown.katex").get("macros")));
                let katexOptions = { throwOnError: false };
                if (Object.keys(userMacros).length !== 0) {
                    katexOptions["macros"] = userMacros;
                }
                this.md = (yield Promise.resolve().then(() => require("markdown-it")))({
                    html: true,
                    highlight: (str, lang) => {
                        lang = normalizeHighlightLang(lang);
                        if (lang && hljs.getLanguage(lang)) {
                            try {
                                return `<div>${hljs.highlight(lang, str, true).value}</div>`;
                            }
                            catch (error) { }
                        }
                        return `<code><div>${this.md.utils.escapeHtml(str)}</div></code>`;
                    },
                })
                    .use(mdtl)
                    .use(mdkt, katexOptions);
                //// Conditional modules
                if (vscode_1.extensions.getExtension("bierner.markdown-footnotes") !== undefined) {
                    const mdfn = yield Promise.resolve().then(() => require("markdown-it-footnote"));
                    this.md = this.md.use(mdfn);
                }
                if (!vscode_1.workspace.getConfiguration("rmarkdown.print").get("validateUrls", true)) {
                    this.md.validateLink = () => true;
                }
                this.addNamedHeaders(this.md);
            }
        });
    }
    render(text, config) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.md === undefined) {
                yield this.initMdIt();
            }
            this.md.set({
                breaks: config.get("breaks", false),
                linkify: config.get("linkify", true),
            });
            this._slugCount = new Map();
            return this.md.render(text);
        });
    }
    addNamedHeaders(md) {
        const originalHeadingOpen = md.renderer.rules.heading_open;
        md.renderer.rules.heading_open = function (tokens, idx, options, env, self) {
            const title = tokens[idx + 1].children.reduce((acc, t) => acc + t.content, "");
            let slug = util_1.slugify(title);
            if (exports.mdEngine._slugCount.has(slug)) {
                exports.mdEngine._slugCount.set(slug, exports.mdEngine._slugCount.get(slug) + 1);
                slug += "-" + exports.mdEngine._slugCount.get(slug);
            }
            else {
                exports.mdEngine._slugCount.set(slug, 0);
            }
            tokens[idx].attrs = tokens[idx].attrs || [];
            tokens[idx].attrs.push(["id", slug]);
            if (originalHeadingOpen) {
                return originalHeadingOpen(tokens, idx, options, env, self);
            }
            else {
                return self.renderToken(tokens, idx, options, env, self);
            }
        };
    }
}
function normalizeHighlightLang(lang) {
    switch (lang && lang.toLowerCase()) {
        case "tsx":
        case "typescriptreact":
            return "jsx";
        case "json5":
        case "jsonc":
            return "json";
        case "c#":
        case "csharp":
            return "cs";
        default:
            return lang;
    }
}
exports.mdEngine = new MarkdownEngine();
//# sourceMappingURL=markdownEngine.js.map