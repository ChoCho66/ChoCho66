"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const sizeOf = require("image-size");
const path = require("path");
const vscode_1 = require("vscode");
const toc_1 = require("./toc");
const util_1 = require("./util");
function activate(context) {
    context.subscriptions.push(vscode_1.languages.registerCompletionItemProvider(util_1.mdDocSelector, new MdCompletionItemProvider(), "(", "\\", "/", "[", "#"));
}
exports.activate = activate;
class MdCompletionItemProvider {
    constructor() {
        // Suffixes explained:
        // \cmd         -> 0
        // \cmd{$1}     -> 1
        // \cmd{$1}{$2} -> 2
        //
        // Use linebreak to mimic the structure of the KaTeX [Support Table](https://katex.org/docs/supported.html)
        this.accents1 = [
            "tilde",
            "mathring",
            "widetilde",
            "overgroup",
            "utilde",
            "undergroup",
            "acute",
            "vec",
            "Overrightarrow",
            "bar",
            "overleftarrow",
            "overrightarrow",
            "breve",
            "underleftarrow",
            "underrightarrow",
            "check",
            "overleftharpoon",
            "overrightharpoon",
            "dot",
            "overleftrightarrow",
            "overbrace",
            "ddot",
            "underleftrightarrow",
            "underbrace",
            "grave",
            "overline",
            "overlinesegment",
            "hat",
            "underline",
            "underlinesegment",
            "widehat",
            "widecheck",
        ];
        this.delimiters0 = ["lparen", "rparen", "lceil", "rceil", "uparrow", "lbrack", "rbrack", "lfloor", "rfloor", "downarrow", "updownarrow", "langle", "rangle", "lgroup", "rgroup", "Uparrow", "vert", "ulcorner", "urcorner", "Downarrow", "Vert", "llcorner", "lrcorner", "Updownarrow", "lvert", "rvert", "lVert", "rVert", "backslash", "lang", "rang", "lt", "gt"];
        this.delimeterSizing0 = ["left", "big", "bigl", "bigm", "bigr", "middle", "Big", "Bigl", "Bigm", "Bigr", "right", "bigg", "biggl", "biggm", "biggr", "Bigg", "Biggl", "Biggm", "Biggr"];
        this.greekLetters0 = [
            "Alpha",
            "Beta",
            "Gamma",
            "Delta",
            "Epsilon",
            "Zeta",
            "Eta",
            "Theta",
            "Iota",
            "Kappa",
            "Lambda",
            "Mu",
            "Nu",
            "Xi",
            "Omicron",
            "Pi",
            "Sigma",
            "Tau",
            "Upsilon",
            "Phi",
            "Chi",
            "Psi",
            "Omega",
            "varGamma",
            "varDelta",
            "varTheta",
            "varLambda",
            "varXi",
            "varPi",
            "varSigma",
            "varUpsilon",
            "varPhi",
            "varPsi",
            "varOmega",
            "alpha",
            "beta",
            "gamma",
            "delta",
            "epsilon",
            "zeta",
            "eta",
            "theta",
            "iota",
            "kappa",
            "lambda",
            "mu",
            "nu",
            "xi",
            "omicron",
            "pi",
            "rho",
            "sigma",
            "tau",
            "upsilon",
            "phi",
            "chi",
            "psi",
            "omega",
            "varepsilon",
            "varkappa",
            "vartheta",
            "thetasym",
            "varpi",
            "varrho",
            "varsigma",
            "varphi",
            "digamma",
        ];
        this.otherLetters0 = ["imath", "nabla", "Im", "Reals", "jmath", "partial", "image", "wp", "aleph", "Game", "Bbbk", "weierp", "alef", "Finv", "N", "Z", "alefsym", "cnums", "natnums", "beth", "Complex", "R", "gimel", "ell", "Re", "daleth", "hbar", "real", "eth", "hslash", "reals"];
        this.annotation1 = ["cancel", "overbrace", "bcancel", "underbrace", "xcancel", "not =", "sout", "boxed", "tag", "tag*"];
        this.verticalLayout0 = ["atop"];
        this.verticalLayout2 = ["stackrel", "overset", "underset", "raisebox"];
        this.overlap1 = ["mathllap", "mathrlap", "mathclap", "llap", "rlap", "clap", "smash"];
        this.spacing0 = ["thinspace", "medspace", "thickspace", "enspace", "quad", "qquad", "negthinspace", "negmedspace", "nobreakspace", "negthickspace"];
        this.spacing1 = ["kern", "mkern", "mskip", "hskip", "hspace", "hspace*", "phantom", "hphantom", "vphantom"];
        this.logicAndSetTheory0 = ["forall", "complement", "therefore", "emptyset", "exists", "subset", "because", "empty", "exist", "supset", "mapsto", "varnothing", "nexists", "mid", "to", "implies", "in", "land", "gets", "impliedby", "isin", "lor", "leftrightarrow", "iff", "notin", "ni", "notni", "neg", "lnot"];
        this.bigOperators0 = ["sum", "prod", "bigotimes", "bigvee", "int", "coprod", "bigoplus", "bigwedge", "iint", "intop", "bigodot", "bigcap", "iiint", "smallint", "biguplus", "bigcup", "oint", "oiint", "oiiint", "bigsqcup"];
        this.binaryOperators0 = [
            "cdot",
            "gtrdot",
            "pmod",
            "cdotp",
            "intercal",
            "pod",
            "centerdot",
            "land",
            "rhd",
            "circ",
            "leftthreetimes",
            "rightthreetimes",
            "amalg",
            "circledast",
            "ldotp",
            "rtimes",
            "And",
            "circledcirc",
            "lor",
            "setminus",
            "ast",
            "circleddash",
            "lessdot",
            "smallsetminus",
            "barwedge",
            "Cup",
            "lhd",
            "sqcap",
            "bigcirc",
            "cup",
            "ltimes",
            "sqcup",
            "bmod",
            "curlyvee",
            "times",
            "boxdot",
            "curlywedge",
            "mp",
            "unlhd",
            "boxminus",
            "div",
            "odot",
            "unrhd",
            "boxplus",
            "divideontimes",
            "ominus",
            "uplus",
            "boxtimes",
            "dotplus",
            "oplus",
            "vee",
            "bullet",
            "doublebarwedge",
            "otimes",
            "veebar",
            "Cap",
            "doublecap",
            "oslash",
            "wedge",
            "cap",
            "doublecup",
            "pm",
            "plusmn",
            "wr",
        ];
        this.fractions0 = ["over", "above"];
        this.fractions2 = ["frac", "dfrac", "tfrac", "cfrac", "genfrac"];
        this.binomialCoefficients0 = ["choose"];
        this.binomialCoefficients2 = ["binom", "dbinom", "tbinom", "brace", "brack"];
        this.mathOperators0 = ["arcsin", "cotg", "ln", "det", "arccos", "coth", "log", "gcd", "arctan", "csc", "sec", "inf", "arctg", "ctg", "sin", "lim", "arcctg", "cth", "sinh", "liminf", "arg", "deg", "sh", "limsup", "ch", "dim", "tan", "max", "cos", "exp", "tanh", "min", "cosec", "hom", "tg", "Pr", "cosh", "ker", "th", "sup", "cot", "lg", "argmax", "argmin", "limits"];
        this.mathOperators1 = ["operatorname"];
        this.sqrt1 = ["sqrt"];
        this.relations0 = [
            "eqcirc",
            "lesseqgtr",
            "sqsupset",
            "eqcolon",
            "lesseqqgtr",
            "sqsupseteq",
            "Eqcolon",
            "lessgtr",
            "Subset",
            "eqqcolon",
            "lesssim",
            "subset",
            "approx",
            "Eqqcolon",
            "ll",
            "subseteq",
            "sube",
            "approxeq",
            "eqsim",
            "lll",
            "subseteqq",
            "asymp",
            "eqslantgtr",
            "llless",
            "succ",
            "backepsilon",
            "eqslantless",
            "lt",
            "succapprox",
            "backsim",
            "equiv",
            "mid",
            "succcurlyeq",
            "backsimeq",
            "fallingdotseq",
            "models",
            "succeq",
            "between",
            "frown",
            "multimap",
            "succsim",
            "bowtie",
            "ge",
            "owns",
            "Supset",
            "bumpeq",
            "geq",
            "parallel",
            "supset",
            "Bumpeq",
            "geqq",
            "perp",
            "supseteq",
            "circeq",
            "geqslant",
            "pitchfork",
            "supseteqq",
            "colonapprox",
            "gg",
            "prec",
            "thickapprox",
            "Colonapprox",
            "ggg",
            "precapprox",
            "thicksim",
            "coloneq",
            "gggtr",
            "preccurlyeq",
            "trianglelefteq",
            "Coloneq",
            "gt",
            "preceq",
            "triangleq",
            "coloneqq",
            "gtrapprox",
            "precsim",
            "trianglerighteq",
            "Coloneqq",
            "gtreqless",
            "propto",
            "varpropto",
            "colonsim",
            "gtreqqless",
            "risingdotseq",
            "vartriangle",
            "Colonsim",
            "gtrless",
            "shortmid",
            "vartriangleleft",
            "cong",
            "gtrsim",
            "shortparallel",
            "vartriangleright",
            "curlyeqprec",
            "in",
            "sim",
            "vcentcolon",
            "curlyeqsucc",
            "Join",
            "simeq",
            "vdash",
            "dashv",
            "le",
            "smallfrown",
            "vDash",
            "dblcolon",
            "leq",
            "smallsmile",
            "Vdash",
            "doteq",
            "leqq",
            "smile",
            "Vvdash",
            "Doteq",
            "leqslant",
            "sqsubset",
            "doteqdot",
            "lessapprox",
            "sqsubseteq",
        ];
        this.negatedRelations0 = [
            "gnapprox",
            "ngeqslant",
            "nsubseteq",
            "precneqq",
            "gneq",
            "ngtr",
            "nsubseteqq",
            "precnsim",
            "gneqq",
            "nleq",
            "nsucc",
            "subsetneq",
            "gnsim",
            "nleqq",
            "nsucceq",
            "subsetneqq",
            "gvertneqq",
            "nleqslant",
            "nsupseteq",
            "succnapprox",
            "lnapprox",
            "nless",
            "nsupseteqq",
            "succneqq",
            "lneq",
            "nmid",
            "ntriangleleft",
            "succnsim",
            "lneqq",
            "notin",
            "ntrianglelefteq",
            "supsetneq",
            "lnsim",
            "notni",
            "ntriangleright",
            "supsetneqq",
            "lvertneqq",
            "nparallel",
            "ntrianglerighteq",
            "varsubsetneq",
            "ncong",
            "nprec",
            "nvdash",
            "varsubsetneqq",
            "ne",
            "npreceq",
            "nvDash",
            "varsupsetneq",
            "neq",
            "nshortmid",
            "nVDash",
            "varsupsetneqq",
            "ngeq",
            "nshortparallel",
            "nVdash",
            "ngeqq",
            "nsim",
            "precnapprox",
        ];
        this.arrows0 = [
            "circlearrowleft",
            "leftharpoonup",
            "rArr",
            "circlearrowright",
            "leftleftarrows",
            "rarr",
            "curvearrowleft",
            "leftrightarrow",
            "restriction",
            "curvearrowright",
            "Leftrightarrow",
            "rightarrow",
            "Darr",
            "leftrightarrows",
            "Rightarrow",
            "dArr",
            "leftrightharpoons",
            "rightarrowtail",
            "darr",
            "leftrightsquigarrow",
            "rightharpoondown",
            "dashleftarrow",
            "Lleftarrow",
            "rightharpoonup",
            "dashrightarrow",
            "longleftarrow",
            "rightleftarrows",
            "downarrow",
            "Longleftarrow",
            "rightleftharpoons",
            "Downarrow",
            "longleftrightarrow",
            "rightrightarrows",
            "downdownarrows",
            "Longleftrightarrow",
            "rightsquigarrow",
            "downharpoonleft",
            "longmapsto",
            "Rrightarrow",
            "downharpoonright",
            "longrightarrow",
            "Rsh",
            "gets",
            "Longrightarrow",
            "searrow",
            "Harr",
            "looparrowleft",
            "swarrow",
            "hArr",
            "looparrowright",
            "to",
            "harr",
            "Lrarr",
            "twoheadleftarrow",
            "hookleftarrow",
            "lrArr",
            "twoheadrightarrow",
            "hookrightarrow",
            "lrarr",
            "Uarr",
            "iff",
            "Lsh",
            "uArr",
            "impliedby",
            "mapsto",
            "uarr",
            "implies",
            "nearrow",
            "uparrow",
            "Larr",
            "nleftarrow",
            "Uparrow",
            "lArr",
            "nLeftarrow",
            "updownarrow",
            "larr",
            "nleftrightarrow",
            "Updownarrow",
            "leadsto",
            "nLeftrightarrow",
            "upharpoonleft",
            "leftarrow",
            "nrightarrow",
            "upharpoonright",
            "Leftarrow",
            "nRightarrow",
            "upuparrows",
            "leftarrowtail",
            "nwarrow",
            "leftharpoondown",
            "Rarr",
        ];
        this.extensibleArrows1 = ["xleftarrow", "xrightarrow", "xLeftarrow", "xRightarrow", "xleftrightarrow", "xLeftrightarrow", "xhookleftarrow", "xhookrightarrow", "xtwoheadleftarrow", "xtwoheadrightarrow", "xleftharpoonup", "xrightharpoonup", "xleftharpoondown", "xrightharpoondown", "xleftrightharpoons", "xrightleftharpoons", "xtofrom", "xmapsto", "xlongequal"];
        this.classAssignment1 = ["mathbin", "mathclose", "mathinner", "mathop", "mathopen", "mathord", "mathpunct", "mathrel"];
        this.color2 = ["color", "textcolor", "colorbox"];
        this.font0 = ["rm", "bf", "it", "sf", "tt"];
        this.font1 = ["mathrm", "mathbf", "mathit", "mathnormal", "textbf", "textit", "textrm", "bold", "Bbb", "textnormal", "boldsymbol", "mathbb", "text", "bm", "frak", "mathsf", "mathtt", "mathfrak", "textsf", "texttt", "mathcal", "mathscr"];
        this.size0 = ["Huge", "huge", "LARGE", "Large", "large", "normalsize", "small", "footnotesize", "scriptsize", "tiny"];
        this.style0 = ["displaystyle", "textstyle", "scriptstyle", "scriptscriptstyle", "limits", "nolimits", "verb"];
        this.symbolsAndPunctuation0 = [
            "cdots",
            "LaTeX",
            "ddots",
            "TeX",
            "ldots",
            "nabla",
            "vdots",
            "infty",
            "dotsb",
            "infin",
            "dotsc",
            "checkmark",
            "dotsi",
            "dag",
            "dotsm",
            "dagger",
            "dotso",
            "sdot",
            "ddag",
            "mathellipsis",
            "ddagger",
            "Box",
            "Dagger",
            "lq",
            "square",
            "angle",
            "blacksquare",
            "measuredangle",
            "rq",
            "triangle",
            "sphericalangle",
            "triangledown",
            "top",
            "triangleleft",
            "bot",
            "triangleright",
            "colon",
            "bigtriangledown",
            "backprime",
            "bigtriangleup",
            "pounds",
            "prime",
            "blacktriangle",
            "mathsterling",
            "blacktriangledown",
            "blacktriangleleft",
            "yen",
            "blacktriangleright",
            "surd",
            "diamond",
            "degree",
            "Diamond",
            "lozenge",
            "mho",
            "blacklozenge",
            "diagdown",
            "star",
            "diagup",
            "bigstar",
            "flat",
            "clubsuit",
            "natural",
            "copyright",
            "clubs",
            "sharp",
            "circledR",
            "diamondsuit",
            "heartsuit",
            "diamonds",
            "hearts",
            "circledS",
            "spadesuit",
            "spades",
            "maltese",
        ];
        // \cmd
        let c1 = Array.from(new Set([
            ...this.delimiters0,
            ...this.delimeterSizing0,
            ...this.greekLetters0,
            ...this.otherLetters0,
            ...this.spacing0,
            ...this.verticalLayout0,
            ...this.logicAndSetTheory0,
            ...this.bigOperators0,
            ...this.binaryOperators0,
            ...this.binomialCoefficients0,
            ...this.fractions0,
            ...this.mathOperators0,
            ...this.relations0,
            ...this.negatedRelations0,
            ...this.arrows0,
            ...this.font0,
            ...this.size0,
            ...this.style0,
            ...this.symbolsAndPunctuation0,
        ])).map((cmd) => {
            let item = new vscode_1.CompletionItem("\\" + cmd, vscode_1.CompletionItemKind.Function);
            item.insertText = cmd;
            return item;
        });
        // \cmd{$1}
        let c2 = Array.from(new Set([...this.accents1, ...this.annotation1, ...this.overlap1, ...this.spacing1, ...this.mathOperators1, ...this.sqrt1, ...this.extensibleArrows1, ...this.font1, ...this.classAssignment1])).map((cmd) => {
            let item = new vscode_1.CompletionItem("\\" + cmd, vscode_1.CompletionItemKind.Function);
            item.insertText = new vscode_1.SnippetString(`${cmd}\{$1\}`);
            return item;
        });
        // \cmd{$1}{$2}
        let c3 = Array.from(new Set([...this.verticalLayout2, ...this.binomialCoefficients2, ...this.fractions2, ...this.color2])).map((cmd) => {
            let item = new vscode_1.CompletionItem("\\" + cmd, vscode_1.CompletionItemKind.Function);
            item.insertText = new vscode_1.SnippetString(`${cmd}\{$1\}\{$2\}`);
            return item;
        });
        let envSnippet = new vscode_1.CompletionItem("\\begin", vscode_1.CompletionItemKind.Snippet);
        envSnippet.insertText = new vscode_1.SnippetString("begin{${1|aligned,alignedat,array,bmatrix,Bmatrix,cases,darray,dcases,gathered,matrix,pmatrix,vmatrix,Vmatrix|}}\n\t$2\n\\end{$1}");
        // Import macros from configurations
        let resource = null;
        if (vscode_1.workspace.workspaceFolders !== undefined) {
            resource = vscode_1.workspace.workspaceFolders[0].uri;
        }
        let configMacros = vscode_1.workspace.getConfiguration("rmarkdown.katex", resource).get("macros");
        var macroItems = [];
        for (const cmd in configMacros) {
            if (configMacros.hasOwnProperty(cmd)) {
                const expansion = configMacros[cmd];
                let item = new vscode_1.CompletionItem(cmd, vscode_1.CompletionItemKind.Function);
                // Find the number of arguments in the expansion
                let numArgs = 0;
                for (let i = 1; i < 10; i++) {
                    if (!expansion.includes(`#${i}`)) {
                        numArgs = i - 1;
                        break;
                    }
                }
                item.insertText = new vscode_1.SnippetString(cmd.slice(1) + [...Array(numArgs).keys()].map((i) => `\{$${i + 1}\}`).join(""));
                macroItems.push(item);
            }
        }
        this.mathCompletions = [...c1, ...c2, ...c3, envSnippet, ...macroItems];
        // Sort
        this.mathCompletions.forEach((item) => {
            item.sortText = item.label.replace(/[a-zA-Z]/g, (c) => {
                if (/[a-z]/.test(c)) {
                    return `0${c}`;
                }
                else {
                    return `1${c.toLowerCase()}`;
                }
            });
        });
        let excludePatterns = ["**/node_modules", "**/bower_components", "**/*.code-search"];
        if (vscode_1.workspace.workspaceFolders !== undefined) {
            const configExclude = vscode_1.workspace.getConfiguration("search", vscode_1.workspace.workspaceFolders[0].uri).get("exclude");
            for (const key in configExclude) {
                if (configExclude.hasOwnProperty(key) && configExclude[key] === true) {
                    excludePatterns.push(key);
                }
            }
        }
        excludePatterns = Array.from(new Set(excludePatterns));
        this.EXCLUDE_GLOB = "{" + excludePatterns.join(",") + "}";
    }
    provideCompletionItems(document, position, _token, _context) {
        const lineTextBefore = document.lineAt(position.line).text.substring(0, position.character);
        const lineTextAfter = document.lineAt(position.line).text.substring(position.character);
        let matches;
        matches = lineTextBefore.match(/\\+$/);
        if (/!\[[^\]]*?\]\([^\)]*$/.test(lineTextBefore) || /<img [^>]*src="[^"]*$/.test(lineTextBefore)) {
            /* ┌─────────────┐
                     │ Image paths │
                     └─────────────┘ */
            if (vscode_1.workspace.getWorkspaceFolder(document.uri) === undefined)
                return [];
            //// 🤔 better name?
            let typedDir;
            if (/!\[[^\]]*?\]\([^\)]*$/.test(lineTextBefore)) {
                //// `![](dir_here|)`
                typedDir = lineTextBefore.substr(lineTextBefore.lastIndexOf("](") + 2);
            }
            else {
                //// `<img src="dir_here|">`
                typedDir = lineTextBefore.substr(lineTextBefore.lastIndexOf('="') + 2);
            }
            const basePath = getBasepath(document, typedDir);
            const isRootedPath = typedDir.startsWith("/");
            return vscode_1.workspace.findFiles("**/*.{png,jpg,jpeg,svg,gif}", this.EXCLUDE_GLOB).then((uris) => {
                let items = uris.map((imgUri) => {
                    const label = path.relative(basePath, imgUri.fsPath).replace(/\\/g, "/");
                    let item = new vscode_1.CompletionItem(label.replace(/ /g, "%20"), vscode_1.CompletionItemKind.File);
                    //// Add image preview
                    let dimensions;
                    try {
                        dimensions = sizeOf(imgUri.fsPath);
                    }
                    catch (error) {
                        console.error(error);
                        return item;
                    }
                    const maxWidth = 318;
                    if (dimensions.width > maxWidth) {
                        dimensions.height = Number((dimensions.height * maxWidth) / dimensions.width);
                        dimensions.width = maxWidth;
                    }
                    item.documentation = new vscode_1.MarkdownString(`![${label}](${imgUri.fsPath.replace(/ /g, "%20")}|width=${dimensions.width},height=${dimensions.height})`);
                    item.sortText = label.replace(/\./g, "{");
                    return item;
                });
                if (isRootedPath) {
                    return items.filter((item) => !item.label.startsWith(".."));
                }
                else {
                    return items;
                }
            });
        }
        else if ((matches = lineTextBefore.match(/\\+$/)) !== null && matches[0].length % 2 !== 0) {
            /* ┌────────────────┐
                     │ Math functions │
                     └────────────────┘ */
            if (util_1.mathEnvCheck(document, position) === "") {
                return [];
            }
            else {
                return this.mathCompletions;
            }
        }
        else if (/\[[^\]]*?\]\[[^\]]*$/.test(lineTextBefore)) {
            /* ┌───────────────────────┐
                     │ Reference link labels │
                     └───────────────────────┘ */
            let startIndex = lineTextBefore.lastIndexOf("[");
            const range = new vscode_1.Range(position.with({ character: startIndex + 1 }), position);
            return new Promise((res, _) => {
                const lines = document.getText().split(/\r?\n/);
                const usageCounts = lines.reduce((useCounts, currentLine) => {
                    let match;
                    const pattern = /\[[^\]]+\]\[([^\]]*?)\]/g;
                    while ((match = pattern.exec(currentLine)) !== null) {
                        let usedRef = match[1];
                        if (!useCounts.has(usedRef)) {
                            useCounts.set(usedRef, 0);
                        }
                        useCounts.set(usedRef, useCounts.get(usedRef) + 1);
                    }
                    return useCounts;
                }, new Map());
                let refLabels = lines.reduce((prev, curr) => {
                    let match;
                    if ((match = /^\[([^\]]*?)\]: (\S*)( .*)?/.exec(curr)) !== null) {
                        const ref = match[1];
                        let item = new vscode_1.CompletionItem(ref, vscode_1.CompletionItemKind.Reference);
                        const usages = usageCounts.get(ref) || 0;
                        item.documentation = new vscode_1.MarkdownString(match[2]);
                        item.detail = usages === 1 ? `1 usage` : `${usages} usages`;
                        // Prefer unused items
                        item.sortText = usages === 0 ? `0-${ref}` : (item.sortText = `1-${ref}`);
                        item.range = range;
                        prev.push(item);
                    }
                    return prev;
                }, []);
                res(refLabels);
            });
        }
        else if (/\[[^\]]*\]\(#[^\)]*$/.test(lineTextBefore)) {
            /* ┌───────────────────────────┐
                     │ Anchor tags from headings │
                     └───────────────────────────┘ */
            let startIndex = lineTextBefore.lastIndexOf("(");
            let endPosition = position;
            let addClosingParen = false;
            if (/^([^\) ]+\s*|^\s*)\)/.test(lineTextAfter)) {
                // try to detect if user wants to replace a link (i.e. matching closing paren and )
                // Either: ... <CURSOR> something <whitespace> )
                //     or: ... <CURSOR> <whitespace> )
                //     or: ... <CURSOR> )     (endPosition assignment is a no-op for this case)
                // in every case, we want to remove all characters after the cursor and before that first closing paren
                endPosition = position.with({ character: +endPosition.character + lineTextAfter.indexOf(")") });
            }
            else {
                // If no closing paren is found, replace all trailing non-white-space chars and add a closing paren
                // distance to first non-whitespace or EOL
                const toReplace = lineTextAfter.search(/(?<=^\S+)(\s|$)/);
                endPosition = position.with({ character: +endPosition.character + toReplace });
                addClosingParen = true;
            }
            const range = new vscode_1.Range(position.with({ character: startIndex + 1 }), endPosition);
            return new Promise((res, _) => {
                const toc = toc_1.buildToc(document);
                const headingCompletions = toc.reduce((prev, curr) => {
                    let item = new vscode_1.CompletionItem("#" + util_1.slugify(curr.text), vscode_1.CompletionItemKind.Reference);
                    if (addClosingParen) {
                        item.insertText = item.label + ")";
                    }
                    item.documentation = curr.text;
                    item.range = range;
                    prev.push(item);
                    return prev;
                }, []);
                res(headingCompletions);
            });
        }
        else if (/\[[^\]]*?\]\([^\)]*$/.test(lineTextBefore)) {
            /* ┌────────────┐
                     │ File paths │
                     └────────────┘ */
            //// Should be after anchor completions
            if (vscode_1.workspace.getWorkspaceFolder(document.uri) === undefined)
                return [];
            const typedDir = lineTextBefore.substr(lineTextBefore.lastIndexOf("](") + 2);
            const basePath = getBasepath(document, typedDir);
            const isRootedPath = typedDir.startsWith("/");
            return vscode_1.workspace.findFiles("**/*", this.EXCLUDE_GLOB).then((uris) => {
                let items = uris.map((uri) => {
                    const label = path.relative(basePath, uri.fsPath).replace(/\\/g, "/").replace(/ /g, "%20");
                    let item = new vscode_1.CompletionItem(label, vscode_1.CompletionItemKind.File);
                    item.sortText = label.replace(/\./g, "{");
                    return item;
                });
                if (isRootedPath) {
                    return items.filter((item) => !item.label.startsWith(".."));
                }
                else {
                    return items;
                }
            });
        }
        else {
            return [];
        }
    }
}
/**
 * @param doc
 * @param dir The dir already typed in the src field, e.g. `[alt text](dir_here|)`
 */
function getBasepath(doc, dir) {
    if (dir.includes("/")) {
        dir = dir.substr(0, dir.lastIndexOf("/") + 1);
    }
    else {
        dir = "";
    }
    let root = vscode_1.workspace.getWorkspaceFolder(doc.uri).uri.fsPath;
    const rootFolder = vscode_1.workspace.getConfiguration("rmarkdown.completion", doc.uri).get("root", "");
    if (rootFolder.length > 0 && fs.existsSync(path.join(root, rootFolder))) {
        root = path.join(root, rootFolder);
    }
    const basePath = path.join(dir.startsWith("/") ? root : path.dirname(doc.uri.fsPath), dir);
    return basePath;
}
//# sourceMappingURL=completion.js.map