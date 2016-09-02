/// <reference path="../d/ramda.d.ts"/>

import * as _ from "ramda";
import * as fs from "fs";
import * as path from "path";
import {Optional} from "./types";

const reImport = /^@import\s+(["'])(.+)\1/;

export function isa(path: string) {
    return path.toLowerCase().endsWith(".scss");
}

function _dependencies(scss: string): string[] {
    function depFromLine(line: string): Optional<string> {
        return Optional.of(line.match(reImport)).map(res => res[2]);
    }
    function deps(scss: string, exists: string[]): string[] {
        let excludes = new Set(exists);
        let lines = fs.readFileSync(scss, "utf-8").split("\n");
        let imports = Optional.cat(lines.map(l => depFromLine(l).map(p => path.resolve(path.dirname(scss), `${p}.scss`))));
        let targets = imports.filter(i => ! excludes.has(i));
        return targets.concat(_.flatten(targets.map(t => deps(t, exists.concat(targets)))));
    }
    return deps(scss, []);
}
export let dependencies: (scss: string) => string[] = _.memoize(_dependencies);
