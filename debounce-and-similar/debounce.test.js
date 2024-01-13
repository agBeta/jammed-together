import test from "node:test";
import EventEmitter from "node:events";
import assert, { rejects } from "node:assert";
import { makeDebounce } from "./debounce.js";

//  For more transparency and simplicity, we're not using fake timers in this test suite.
//  So this test suite will take quite a while to finish, since it literally waits for some
//  time.

function justWait(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


test("debounce", { concurrency: false }, async () => {

    //  You may need to twiddle with following values based on your machine cpu, etc. But
    //  since native test-runner is really fast, these values should be fine.
    const delay = 600;
    const epsilon = 80;


    // For await see https://nodejs.org/api/test.html#extraneous-asynchronous-activity.
    await test("works", async (t) => {
        let value = 0;
        let cntCall = 0;
        const f = function (num = 1) {
            // t.diagnostic(`f1 (${num}) -- at ${Date.now()}`);
            value += num;
            cntCall++;
        }

        const fDebounced = makeDebounce(f, delay);
        fDebounced(4);
        // f shouldn't be called until delay:
        assert.strictEqual(cntCall, 0);
        assert.strictEqual(value, 0);

        await justWait(delay + epsilon); // <-- bad practice but ok.

        // Now delay has passed, so f should be executed by now:
        assert.strictEqual(cntCall, 1);
        assert.strictEqual(value, 4);

        fDebounced(8);
        // f shouldn't be called until delay:
        assert.strictEqual(value, 4);
        assert.strictEqual(cntCall, 1);
        // We call again to reset the waiting interval.
        await justWait(delay / 2);
        fDebounced(16);

        assert.strictEqual(cntCall, 1);
        assert.strictEqual(value, 4);

        await justWait(delay / 2 + epsilon);
        //  The call(16) was made less than delay ms ago. So even though the call(8) was made
        //  more than delay ms ago, but the waiting interval has been reset by call(16). So ...
        assert.strictEqual(cntCall, 1);
        assert.strictEqual(value, 4);

        await justWait(delay + epsilon);

        // The call(8) should be ignored (i.e. it's timeout should be cleared by call(16) ).
        assert.strictEqual(cntCall, 2);
        assert.strictEqual(value, 16 + 4);
    });


    await test("gracefully handles 'this' binding", async () => {
        const obj = new CustomClass();
        // If we don't bind, "this" would be undefined.
        const f = obj.addToThisValue.bind(obj);
        const ee = new EventEmitter();
        ee.on("add", f);
        ee.emit("add", 10);
        assert.strictEqual(obj.value, 10);

        ee.on("other", f);
        ee.emit("other", 5);
        await justWait(delay + epsilon);
        assert.strictEqual(obj.value, 15)
    });


    // await test("incorrect 1 debounce doesn't work", async () => {
    //     let cntCall = 0;
    //     const obj = {
    //         value: 0,
    //         f: function (num = 1) {
    //             cntCall++;
    //             this.value += num;
    //         }
    //     }

    //     const fDebounced = _makeDebounce_(obj.f.bind(obj), delay, "incorrect_1");

    //     //  fDebounced(4) below --> After "delay" ms, inside setTimeout, f() will be executed 
    //     //  and we used an arrow function inside cb(...), so property "value" doesn't exist 
    //     //  on "this", and (this.value += num) will throw an error. The error will be caught 
    //     //  inside f().
    //     fDebounced(4);
    //     await justWait(delay + epsilon);
        
    //     // f should be called,
    //     assert.strictEqual(cntCall, 1);
    //     // but should throw an error, since incorrect implementation doesn't handle "this" binding.
    //     assert.notStrictEqual(obj.value, 4);
    //     // assert.strictEqual(cntThrow, 1);
    // });
});


class CustomClass {
    constructor() {
        this.value = 0;
    }
    addToThisValue(number) {
        console.log(" 📢 ", this);
        console.log(" 🀄 ", number);
        this.value += number;
    }
}

// 🔷 Very good link:
// https://stackoverflow.com/questions/41431605/how-to-handle-errors-from-settimeout-in-javascript
// https://nodejs.org/api/assert.html#assertrejectsasyncfn-error-message.

//  Another very good link about "this" inside a controller:
//  https://stackoverflow.com/a/51980022