import { promisify } from "util";
const sleep = promisify(setTimeout);

new Promise((resolve) => {
    console.log("1"); // runs immediately
    resolve("4");
})
.then(message => {
    console.log(message); // prints 4
    //  synchronously goes to finally block below
    //  But for some strange reason, queueMicrotask precedes 6.
})
.finally(() => console.log("6") );

queueMicrotask(() => console.log("5🔥") /* <-- Why?! */);
process.nextTick(() => console.log("7"));

// Order of the following two lines matter. They will both execute in the same tick (even same phase?).
sleep(50).then(() => console.log("13"));
setTimeout(() => console.log("End"), 50);

setImmediate(() => console.log("8"));

console.log("2");

foo();

async function foo() {
    console.log("3");
    for (const returnedValue of await Promise.all/*<---*/([
        doPrintSleepReturn(20, "9", /*return=*/"11"),
        doPrintSleepReturn(10, "10", /*return=*/"12"),
    ])) {
        console.log(returnedValue);
    }
};


// ---------------------
async function doPrintSleepReturn(timeToSleep, stringToPrint, valueToReturn) {
    setImmediate(() => console.log(stringToPrint));
    await sleep(timeToSleep);
    return valueToReturn;
}

// ---------------------

// Credit to: Broken promises by James Snell.
