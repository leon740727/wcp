declare module "ramda" {
    interface Functor<T> {
        map<R>(f: (a:T)=>R): Functor<R>;
    }

    function add(a: number, b: number): number;
    function add(a: number): (b: number) => number;
    function append<T>(i: T, data: T[]): T[];
    function append<T>(i: T): (data: T[]) => T[];
    function compose<T1,T2,T3>(a: (p: T2) => T3, b: (p: T1) => T2): (p: T1) => T3;
    function compose<T1,T2,T3,T4>(a:(p:T3)=>T4, b:(p:T2)=>T3, c:(p:T1)=>T2): (p:T1) => T4;
    function compose<T1,T2,T3,T4,T5>(a:(p:T4)=>T5, b:(p:T3)=>T4, c:(p:T2)=>T3, d:(p:T1)=>T2): (p:T1) => T5;
    function concat<T>(a: T[], b: T[]): T[];
    function concat<T>(a: T[]): (b: T[]) => T[];
    function concat(a: string, b: string): string;
    function concat(a: string): (b: string) => string;
    function curry(f: any): any;
    function filter<T>(check: (i: T) => boolean, data: T[]): T[];
    function filter<T>(check: (i: T) => boolean): (data: T[]) => T[];
    function flip(f: any): any;
    function head<T>(list: T[]): T;
    function head(str: string): string;
    function indexOf<T>(target: T, data: T[]): number;
    function indexOf<T>(target: T): (data: T[]) => number;
    function join(sep: string, data: string[]): string;
    function join(sep: string): (data: string[]) => string;
    function last<T>(list: T[]): T;
    function last(str: string): string;
    function map<T, R>(f: (p:T)=>R, data: T[]): R[];
    function map<T, R>(f: (p:T)=>R): (p: T[]) => R[];
    function map<T, R>(f: (p:T)=>R, data: Functor<T>): Functor<R>;
    function map<T, R>(f: (p:T)=>R): (p: Functor<T>) => Functor<R>;
    function reduce<T>(f: (acc: T, p: T) => T, init: T, data: T[]): T;
    function reduce<T>(f: (acc: T, p: T) => T, init: T): (data: T[]) => T;
    function replace(re: any, to: string, data: string): string;
    function replace(re: any, to: string): (data: string) => string;
    function prop(field: string, obj: {}): any;
    function prop(field: string): (obj: {}) => any;
    function sortBy<T1, T2>(f: (a: T1) => T2, data: T1[]): T1[];
    function sortBy<T1, T2>(f: (a: T1) => T2): (data: T1[]) => T1[];
    function split(sep: string, data: string): string[];
    function split(sep: string): (data: string) => string[];
    function toLower(data: string): string;
    function sort<T>(by: (a: T, b: T) => number, data: T[]): T[];
    function sort<T>(by: (a: T, b: T) => number): (data: T[]) => T[];
    function splitEvery<T>(count: number, list: T[]): T[][];
    function splitEvery<T>(count: number): (list: T[]) => T[][];
    function tail<T>(data: T[]): T[];
    function tail(data: string): string;
    function trim(str: string): string;
    function zip<T,R>(a: T[], b: R[]): [[T, R]];
    function zip<T,R>(a: T[]): (b: R[]) => [[T, R]];
}
