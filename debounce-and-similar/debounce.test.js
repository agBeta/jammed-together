import test from "node:test";
import assert, { rejects } from "node:assert";
import {
    makeDebounce,
    _makeIncorrectDebounce_1,
    _makeIncorrectDebounce_2,
} from "./debounce.js";

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
        const f = function (num) {
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


    await test("incorrect 1 doesn't work", async () => {
        let cntCall = 0;
        const errors = [];
        const obj = {
            //  Since inside f, "this" could be anything which may even have property "value", it's
            //  recommended to use a unique key name (instead of "value"). We could use Symbol(), but
            //  for simplicity we just use something like below.
            //  // value: 0,
            v_a_l_u_e: 0,
            f: function (num) {
                cntCall++;
                try {
                    if (typeof this === "undefined" || !this.hasOwnProperty("v_a_l_u_e")) {
                        throw new Error("Missing");
                    }
                    this.v_a_l_u_e += num;
                }
                catch (err) {
                    errors.push(err);
                    //  This ↖️ is our simple way of checking if "this" binding failed or not. We don't 
                    //  write this test case using assert.rejects() or throws(), as it's difficult to
                    //  bubble up the error from inside of setTimeout.
                }
            }
        }
        // Adding new property to obj (without using 'obj.f.bind(obj)' )
        obj.fDebounced = _makeIncorrectDebounce_1(obj.f, delay);

        //  fDebounced(4) below --> After "delay" ms, inside setTimeout, f() will be executed 
        //  which will execute cb(...) without "this" binding, so property "value" doesn't exist 
        //  on "this", and (this.value += num) will throw an error. The error will be caught 
        //  inside f().
        obj.fDebounced(4);
        await justWait(delay + epsilon);

        // f should be called,
        assert.strictEqual(cntCall, 1);
        // but should throw an error, since incorrect implementation doesn't handle "this" binding.
        assert.notStrictEqual(obj.v_a_l_u_e, 4);
        assert.strictEqual(errors.length, 1);
    });

    await test("correct debounce gracefully handles 'this' binding", async () => {
        // Same procedure as the previous test.
        let cntCall = 0;
        const errors = [];

        const obj = {
            v_a_l_u_e: 0,
            f: function (num) {
                cntCall++;
                try { this.v_a_l_u_e += num; }
                catch (err) { errors.push(err); }
            }
        }
        obj.fDebounced = makeDebounce(obj.f, delay);
        obj.fDebounced(4);
        await justWait(delay + epsilon);

        assert.strictEqual(cntCall, 1);
        assert.strictEqual(obj.v_a_l_u_e, 4);
        assert.strictEqual(errors.length, 0);
    });


    await test("incorrect 2 also doesn't work", async () => {
        let cntCall = 0;
        const errors = [];

        const obj = {
            v_a_l_u_e: 0,
            f: function (num) {
                cntCall++;
                try { 
                    if (typeof this === "undefined" || !this.hasOwnProperty("v_a_l_u_e")) {
                        throw new Error("Missing");
                    }
                    this.v_a_l_u_e += num; 
                }
                catch (err) { errors.push(err); }
            }
        }
        obj.fDebounced = _makeIncorrectDebounce_2(obj.f, delay);
        obj.fDebounced(4);
        await justWait(delay + epsilon);

        assert.strictEqual(cntCall, 1);
        assert.notStrictEqual(obj.v_a_l_u_e, 4);
        assert.strictEqual(errors.length, 1);
    });
});


// 🔷 Very good link:
// https://stackoverflow.com/questions/41431605/how-to-handle-errors-from-settimeout-in-javascript
// https://nodejs.org/api/assert.html#assertrejectsasyncfn-error-message.
