import test from "node:test";
import assert from "node:assert";
import { makeDebounce, } from "./debounce.js";


test("debounce (with fake timers)", { concurrency: false },  (t) => {

    const delay = 10000;
    const epsilon = 50;

    test("[TEST fails] works", () => {
        // ❗❗ Test fails, mock timer doesn't work as expected.

        let value = 0;
        let cntCall = 0;
        const f = function addToValue({ num1, num2 }){
            console.log("📢".repeat(5));
            cntCall++;
            value += num1 + num2;
        };

        t.mock.timers.enable();

        const fDebounced = makeDebounce(f, delay);
        fDebounced({ num1: 4, num2: 8 });

        // It should wait for delay milliseconds before executing f. So
        assert.strictEqual(value, 0);
        assert.strictEqual(cntCall, 0);
        t.mock.timers.tick(2 * delay + epsilon);
        assert.strictEqual(value, 12);
        assert.strictEqual(cntCall, 1);

        fDebounced({ num1: 16, num2: 32 });  // i1
        fDebounced({ num1: 64, num2: 128 });  // i2
        t.mock.timers.tick(delay / 2);  
        fDebounced({ num1: 256, num2: 512 });  // i3

        t.mock.timers.tick(delay / 2);
        // delay ms hasn't passed yet since last invoke (i3), so
        assert.strictEqual(cntCall, 1);

        t.mock.timers.tick(delay);

        // Only i3 should be executed.
        assert.strictEqual(cntCall, 2);
        assert.strictEqual(value, 12 + 256 + 512);
    });
});