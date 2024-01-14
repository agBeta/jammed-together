import { promisify } from "util";
const sleep = promisify(setTimeout);

// HELO MLONTREAL

sleep(50).then(() => process.stdout.write("A"));

new Promise((resolve) => {
    process.stdout.write("H");
    resolve("O");
})
.then(message => {
    process.stdout.write(message);
})
.finally(() => {
    process.stdout.write("M");
});

queueMicrotask(() => process.stdout.write(" "));

process.nextTick(() => process.stdout.write("L"));

setTimeout(() => process.stdout.write("L"), 100);

setImmediate(() => process.stdout.write("O"));

process.stdout.write("E");

foo();

async function foo() {
    process.stdout.write("L");
    for (const returnedValue of await Promise.all([
        doPrintSleepReturn(20, "N", /*return=*/"R"),
        doPrintSleepReturn(10, "T", /*return=*/"E"),
    ])) {
        process.stderr.write(returnedValue);
    }
};


// ---------------------
async function doPrintSleepReturn(timeToSleep, stringToPrint, valueToReturn) {
    setImmediate(() => process.stdout.write(stringToPrint));
    await sleep(timeToSleep);
    return valueToReturn;
}