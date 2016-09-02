/// <reference path="../d/ramda.d.ts"/>
/// <reference path="../d/node.d.ts"/>

import * as _ from "ramda";
import * as fs from "fs";
import * as path from "path";

let esprima = require("esprima");
let estraverse = require("estraverse");

function requires(code: string): string[] {
    let ast = esprima.parse(code);
    let requires: string[] = [];
    estraverse.traverse(ast, {
        enter: node => {
            if (node.type == "CallExpression" && node.callee.name == "require") {
                if (node.arguments > 1) {
                    throw "require 的參數大於 1";
                }
                if (node.arguments[0].type != "Literal") {
                    throw "require 的參數解析失敗";
                }
                requires.push(node.arguments[0].value);
            }
        }
    });
    return requires;
}

export function isa(path: string) {
    return path.toLowerCase().endsWith(".js");
}

export function dependencies(file: string): string[] {
    function deps(file: string, exists: string[]): string[] {
        let _deps = requires(fs.readFileSync(file, "utf-8"))
                    .map(dep => path.resolve(path.dirname(file), `${dep}.js`))
                    .filter(fs.existsSync)
                    .filter(dep => exists.indexOf(dep) == -1);
        return _.uniq(_deps.concat(_.flatten(_deps.map(d => deps(d, exists.concat(_deps))))));
    }
    return deps(file, []);
}
