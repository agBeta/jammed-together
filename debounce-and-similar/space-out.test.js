import test from "node:test";
import assert from "node:assert";
import { makeSpaceOutQueue } from "./space-out.js";
import { escape } from "node:querystring";


function justWait(ms = 1000) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


test("debounce", { concurrency: false }, async () => {

    const delay = 600;
    const epsilon = 40;

    await test("works", async (t) => {
        let value = 0;
        let cntCall = 0;
        const f = function (n1, { n2 }) {
            value += n1 + n2;
            cntCall++;
        }
        const fSpacedOut = makeSpaceOutQueue(f, delay);
        fSpacedOut(1, { n2: 2 });
        // It should be invoked immediately
        assert.strictEqual(cntCall, 1);
        assert.strictEqual(value, 3);

        fSpacedOut(4, { n2: 8 });
        fSpacedOut(16, { n2: 32 });
        // It shouldn't be invoked until but rather be queued up and spaced out in time.
        assert.strictEqual(cntCall, 1);

        await justWait(delay + epsilon);
        assert.strictEqual(cntCall, 2);
        assert.strictEqual(value, 3 + 12);

        await justWait(epsilon);
        // delay hasn't passed since last invocation. So
        assert.strictEqual(cntCall, 2);

        await justWait(delay + epsilon);
        assert.strictEqual(cntCall, 3);
        assert.strictEqual(value, 3 + 12 + 48);

        // Let's wait a bit more to make sure it won't get invoked again.
        await justWait(delay + epsilon);
        assert.strictEqual(cntCall, 3);

        //  Now if invoke f again, it should be invoked immediately, because more
        //  than delay ms have passed from lsat invocation of f.
        fSpacedOut(-1, { n2: -2 });
        assert.strictEqual(cntCall, 4);
        assert.strictEqual(value, 63 - 3);
    });



    await test("works and handles 'this' binding", async () => {
        let cntCall = 0;
        const errors = [];
        const __obj = {
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

        const obj = { v_a_l_u_e: 100 };  
        const fSpacedOut = makeSpaceOutQueue(__obj.f, delay, /*context=*/obj);

        fSpacedOut(1, 2);
        assert.strictEqual(cntCall, 1);
        assert.strictEqual(errors.length, 0);
        assert.strictEqual(obj.v_a_l_u_e, 103);
        assert.strictEqual(__obj.v_a_l_u_e, 0);

        fSpacedOut(4, 8);
        // Shouldn't be invoked until delay ms
        assert.strictEqual(cntCall, 1);

        await justWait(delay - epsilon);
        // Still shouldn't be called;
        assert.strictEqual(cntCall, 1);

        await justWait(2 * epsilon);
        assert.strictEqual(cntCall, 2);
        assert.strictEqual(errors.length, 0);
        assert.strictEqual(obj.v_a_l_u_e, 103 + 4 + 8);
    });
});
