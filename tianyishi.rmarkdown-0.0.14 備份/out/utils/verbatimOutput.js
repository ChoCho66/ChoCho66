"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chalk = require("chalk");
function verbatimOutput(p, outputChannel) {
    outputChannel.show();
    p.stdout.on("data", (data) => {
        outputChannel.append(data.toString());
    });
    p.stderr.on("data", (data) => {
        outputChannel.append(chalk.red(data.toString()));
    });
}
exports.verbatimOutput = verbatimOutput;
//# sourceMappingURL=verbatimOutput.js.map