import test from "node:test";
import assert from "node:assert";
import { makeThrottle } from "./throttle.js";

function justWait(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

test("throttle", { concurrency: false }, async () => {
    const delay = 700;
    const epsilon = 80;

    await test("works", async () => {
        let value = 0;
        let cntCall = 0;
        const f = function(a, b) {
            value += a + b;
            cntCall++;
        }
        const fThrottled = makeThrottle(f, delay);
        fThrottled(4, 8);
        assert.strictEqual(cntCall, 1);
        assert.strictEqual(value, 12);

        fThrottled(8, 16);
        // It should not be executed until delay passes.
        assert.strictEqual(cntCall, 1);
        assert.strictEqual(value, 12);

        await justWait(delay / 2);
        fThrottled(32, 64);

        // The last call should be executed, but delay/2 ms later (not delay ms later).
        assert.strictEqual(cntCall, 1);
        await justWait(delay / 2 + epsilon);
        assert.strictEqual(cntCall, 2);
        assert.strictEqual(value, 12 + 32 + 64);
    });

    await test("works and handles 'this' binding", async () => {
        let cntCall = 0;
        const errors = [];

        const obj = {
            v_a_l_u_e: 0,
            f: function (a, b) {
                cntCall++;
                try {
                    if (typeof this === "undefined" || !this.hasOwnProperty("v_a_l_u_e")) 
                        throw new Error("Missing");
                    this.v_a_l_u_e += a + b;
                }
                catch (err) { errors.push(err); }
            }
        }

        obj.fThrottled = makeThrottle(obj.f, delay);
        obj.fThrottled(4, 8);
        obj.fThrottled(16, 32);
        // The first should be executed immediately and the second should wait for delay ms
        assert.strictEqual(cntCall, 1);
        assert.strictEqual(obj.v_a_l_u_e, 12);

        await justWait(delay + epsilon);
        assert.strictEqual(cntCall, 2);
        assert.strictEqual(obj.v_a_l_u_e, 12 + 16 + 32);

        await justWait(delay + epsilon);
        // Now delay ms has passed since last execution.
        obj.fThrottled(-16, -32);
        // It should be executed immediately
        assert.strictEqual(cntCall, 3);
        assert.strictEqual(obj.v_a_l_u_e, 12);
    });

    await test("cancel works", async () => {
        let value = 0;
        let cntCall = 0;
        const f = function({ num }) {
            value += num;
            cntCall++;
        }
        const fThrottled = makeThrottle(f, delay);
        fThrottled({ num: 4 });
        assert.strictEqual(cntCall, 1);
        assert.strictEqual(value, 4);

        fThrottled({ num: 8 });
        // It should not be executed until delay passes.
        assert.strictEqual(cntCall, 1);
        assert.strictEqual(value, 4);

        fThrottled({ num: 16 });
        assert.strictEqual(cntCall, 1);

        fThrottled.cancel();

        await justWait(delay + epsilon);
        // Cancel should prevent executing all calls since last execution 
        assert.strictEqual(cntCall, 1);
        assert.strictEqual(value, 4);
    });
});