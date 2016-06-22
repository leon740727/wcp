/// <reference path="d/es6-shim.d.ts"/>
/// <reference path="d/node.d.ts"/>
/// <reference path="d/ramda.d.ts"/>

import * as fs from 'fs';
import * as child_process from 'child_process';
import * as path from 'path';
import {curry} from 'ramda';
import {Jsonable, Optional, Result, liftA2} from './m/types';

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

function sass(workdir: string, content: string): Promise<string>;
function sass(workdir: string): (content: string) => Promise<string>;
function sass() {
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

function main(watchdir: string, job: Map<string, Job>) {
    return fs.watch(watchdir, <any>{recursive: true}, (event, filename) => {
        let fpath = path.resolve(watchdir, filename);
        if (job.has(fpath)) {
            let workdir = path.dirname(fpath);
            console.log(filename + ' => ' + job.get(fpath).dst);
            let src = new Promise<string>((resolve, reject) => resolve(fs.readFileSync(fpath, 'utf-8')));
            if (filename.endsWith('.scss')) {
                src = src.then(sass(workdir));
            } else if (filename.endsWith('.js')) {
                src = src.then(browserify(workdir)).then(uglify(workdir));
            } else {
                src = src.then(x => new Promise<string>((resolve, reject) => reject('不支援的格式 ' + filename)));
            }
            src
            .then(res => fs.writeFileSync(job.get(fpath).dst, res, 'utf-8'))
            .catch(err => console.log(err));
        }
    });
}

let watchdir = Optional.of(process.argv.slice(2)[0]);
liftA2(main, o2e(watchdir, '請指定工作目錄'), o2e(watchdir.chain(loadIni), '找不到 wcp.ini 檔'))
.either(err => console.log(err), _ => console.log('開始...'));
