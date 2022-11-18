"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class A {
    constructor() {
        this.init();
        this.load();
    }
    init() { }
    load() {
        console.log("hello from " + this.opt);
    }
}
exports.A = A;
class B extends A {
    init() {
        this.opt = "sex";
    }
}
new B();
//# sourceMappingURL=b.js.map