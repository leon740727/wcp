/// <reference path="d/es6-shim.d.ts"/>
/// <reference path="d/node.d.ts"/>
/// <reference path="d/ramda.d.ts"/>

import * as fs from 'fs';
import * as child_process from 'child_process';
import * as path from 'path';
import {curry, head} from 'ramda';
import {Jsonable, Optional, Result, liftA3} from './m/types';
import * as scss from "./m/type-scss";
import * as js from "./m/type-js";

class Job {
    src: string;
    dst: string;
    constructor(src: string, dst: string) {
        this.src = src;
        this.dst = dst;
    }
    static restore(data: Jsonable, watchdir: string) {
        return new Job(
            path.resolve(watchdir, data['src']),
            path.resolve(watchdir, data['dst']));
    }
}

function o2e<T>(o: Optional<T>, err: string): Result<string, T> {
    return o.map(Result.ok).or_else(Result.fail(err));
}

function pipe(src: string, command: string, args: string[], workdir: string) {
    return new Promise<string>((resolve, reject) => {
        let cmd = child_process.spawn(command, args, {cwd: workdir});
        let data = '';
        let err = '';
        cmd.stdin.write(src);
        cmd.stdin.end();
        cmd.stdout.on('data', d => data += d);
        cmd.stderr.on('data', e => err += e);
        cmd.on('close', code => {
            if (code == 0) {
                resolve(data);
            } else {
                reject(err);
            }
        });
    });
}

function browserify(workdir: string, content: string): Promise<string>;
function browserify(workdir: string): (content: string) => Promise<string>;
function browserify() {
    function exec(workdir: string, content: string) {
        return pipe(content, 'browserify', ['-'], workdir);       // browserify - 代表從 stdin 讀資料
    }
    return curry(exec).apply(null, arguments);
}

function uglify(workdir: string, content: string): Promise<string>;
function uglify(workdir: string): (content: string) => Promise<string>;
function uglify() {
    function exec(workdir: string, content: string) {
        return pipe(content, 'uglifyjs', ['--compress', '--mangle'], workdir);
    }
    return curry(exec).apply(null, arguments);
}

function sassify(workdir: string, content: string): Promise<string>;
function sassify(workdir: string): (content: string) => Promise<string>;
function sassify() {
    function exec(workdir: string, content: string) {
        return pipe(content, 'sass', ['-s', '--scss'], workdir);
    }
    return curry(exec).apply(null, arguments);
}

function loadIni(watchdir: string): Optional<Map<string, Job>> {
    let ini = path.join(watchdir, 'wcp.ini');
    if (fs.existsSync(ini)) {
        let content = fs.readFileSync(ini, 'utf-8');
        let jobs = (<Jsonable[]>JSON.parse(content)).map(data => Job.restore(data, watchdir));
        return Optional.of(new Map(jobs.map(j => <[string, Job]>[j.src, j])));
    } else {
        return Optional.empty();
    }
}

function compile(src: string, dst: string, needUglify: boolean) {
    let workdir = path.dirname(src);
    console.log(src + ' => ' + dst);
    if (src.endsWith('.js')) {
        fs.writeFileSync(dst, "document.body.innerHTML= 'js 未準備就緒';", 'utf-8');
    }
    let data = new Promise<string>((resolve, reject) => resolve(fs.readFileSync(src, 'utf-8')));
    if (src.endsWith('.scss')) {
        data = data.then(sassify(workdir));
    } else if (src.endsWith('.js')) {
        data = data.then(browserify(workdir));
        if (needUglify) {
            data = data.then(uglify(workdir));
        }
    } else {
        data = data.then(x => new Promise<string>((resolve, reject) => reject(`不支援的格式:${src}`)));
    }
    data
    .then(res => fs.writeFileSync(dst, res, 'utf-8'))
    .catch(err => console.log(err));
}

function main(watchdir: string, job: Map<string, Job>, needUglify: boolean) {
    return fs.watch(watchdir, <any>{recursive: true}, (event, filename) => {
        let fpath = path.resolve(watchdir, filename);
        if (job.has(fpath)) {
            compile(fpath, job.get(fpath).dst, needUglify);
        } else if (scss.isa(fpath)) {
            // 被依賴的 .scss 有變動時，相關的 Job 也要重新 compile
            Array.from(job.values())
            .filter(j => scss.isa(j.src))
            .filter(j => scss.dependencies(j.src).indexOf(fpath) != -1)
            .forEach(j => compile(j.src, j.dst, needUglify));
        } else if (js.isa(fpath)) {
            Array.from(job.values())
            .filter(j => js.isa(j.src) && fs.existsSync(j.src))
            .filter(j => js.dependencies(j.src).indexOf(fpath) != -1)
            .forEach(j => compile(j.src, j.dst, needUglify));
        }
    });
}

let args = process.argv.slice(2);
let options = args.filter(arg => arg.startsWith("-"));
let needUglify = options.some(o => o == "-u");
let watchdir = Optional.of(head(args.filter(arg => !arg.startsWith("-"))));
liftA3(main, o2e(watchdir, '請指定工作目錄'), o2e(watchdir.chain(loadIni), '找不到 wcp.ini 檔'), Result.ok(needUglify))
.either(err => console.log(err), _ => console.log('開始...'));
