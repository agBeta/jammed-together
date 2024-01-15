import { nextTick } from 'node:process';

// Make sure you are on node >= 11.0.0

function f1(){
    Promise.resolve().then(() => console.log(2));
    queueMicrotask(() => console.log(3));
    nextTick(() => console.log(1));
    // prints:  2 -> 3 -> 1
}

function f2(){
    queueMicrotask(() => console.log("M"));
    Promise.resolve().then(() => console.log(2));
    nextTick(() => console.log(1));
    // prints:  M -> 2 -> 1
}

// f1();
f2();
