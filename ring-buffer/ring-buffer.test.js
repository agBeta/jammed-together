import test from "node:test";
import assert from "node:assert";
import { makeRingBuffer } from "./ring-buffer.js";

test("works", () => {
    const rb = makeRingBuffer(6);
    let res;

    rb.insert("hi");
    rb.insert("how are you");

    res = rb.flush(1);
    assert.strictEqual(res.length, 1);
    assert.strictEqual(res[0], "hi");

    rb.insert("hi again");
    res = rb.flush(2);
    assert.strictEqual(res.length, 2);
    assert.strictEqual(res[0], "how are you");
    assert.strictEqual(res[1], "hi again");

    // Let's check if it goes round correctly
    rb.insert("a");
    rb.insert("b");
    rb.insert("c");
    rb.insert("d");
    rb.insert("e");
    rb.insert("f");
    // It shouldn't throw an error.

    res = rb.flush(3);
    assert.strictEqual(res.length, 3);
    assert.strictEqual(res[0], "a");
    assert.strictEqual(res[1], "b");
    assert.strictEqual(res[2], "c");
});

test("works when we flush more than we already have inside", () => {
    const rb = makeRingBuffer(6);
    let res;

    res = rb.flush();
    assert.strictEqual(res.length, 0);

    rb.insert("a");
    res = rb.flush(3);
    assert.strictEqual(res.length, 1);
    assert.strictEqual(res[0], "a");

    rb.insert("b");
    rb.insert("c");
    res = rb.flush(10);
    assert.strictEqual(res.length, 2);
    assert.strictEqual(res[0], "b");
    assert.strictEqual(res[1], "c");
})

test("works when we flush more than whole size", () => {
    const rb = makeRingBuffer(4);
    let res;

    rb.insert("a");
    rb.insert("b");
    rb.insert("c");
    rb.insert("d");

    res = rb.flush(6);
    assert.strictEqual(res.length, 4);
    assert.strictEqual(res[0], "a");
    assert.strictEqual(res[1], "b");
    assert.strictEqual(res[2], "c");
    assert.strictEqual(res[3], "d");

    res = rb.flush();
    assert.strictEqual(res.length, 0);
});

test("throws error when filled", () => {
    const rb = makeRingBuffer(4);

    rb.insert("a");
    rb.insert("b");
    rb.insert("c");
    rb.insert("d");

    assert.throws(() => {
        rb.insert("e");
    }, { message: /fill/i });

    // Let's flush and re-fill again.
    rb.flush(4);
    rb.insert("a");
    rb.insert("b");
    rb.insert("c");
    rb.insert("d");

    assert.throws(() => {
        rb.insert("again");
    }, { message: /fill/i });
});

test("works when overwriteIfFilled=true", () => {
    const rb = makeRingBuffer(4, { overwriteIfFilled: true });
    let res;
    rb.insert("a");
    rb.insert("b");
    rb.insert("c");
    rb.insert("d");

    assert.doesNotThrow(() => {
        rb.insert("e");
        rb.insert("f");
    });

    res = rb.flush(4);
    assert.strictEqual(res.length, 4);
    // If we enable overwrite, then ring buffer will return result from oldest to newest.
    assert.strictEqual(res[0], "c"); // <--
    assert.strictEqual(res[1], "d");
    assert.strictEqual(res[2], "e");
    assert.strictEqual(res[3], "f");

    // rb is empty now.
    const objects = [
        { prop1: "a" },
        { prop1: "b" },
        {
            prop1: "hi", inner: {
                veryInner: { prop123: "hi_3" }
            }
        },
        {
            prop1: "hi", inner: {
                veryInner: { prop123: "hi_4" }
            }
        },
        {
            prop1: "hi", inner: {
                veryInner: { prop123: "hi_5" }
            }
        },
        {
            prop1: "hi", inner: {
                veryInner: { prop123: "hi_6" }
            }
        }
    ];

    rb.insert(objects[0]);
    rb.insert(objects[1]);
    rb.insert(objects[2]);
    rb.insert(objects[3]);
    rb.insert(objects[4]);
    rb.insert(objects[5]);

    res = rb.flush(2);
    // first two elements are overwritten in 
    assert.deepStrictEqual(res[0], objects[2]);
    assert.deepStrictEqual(res[1], objects[3]);

    res = rb.flush(100);
    assert.strictEqual(res.length, 2);
    assert.deepStrictEqual(res[0], objects[4]);
    assert.deepStrictEqual(res[1], objects[5]);

    // Let's make sure we haven't mutated objects.
    assert.deepStrictEqual(objects[0], { prop1: "a" });
    // assert.strictEqual(1, 2);
})

// doesn't throw error when overwrite = false