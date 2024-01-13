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
});