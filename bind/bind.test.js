import { describe, it } from "node:test";
import assert from "node:assert";

import "./bind.js"; // modifies Function prototype

describe("ourBind", () => {
    // Recall, if you use "test" (instead of it, describe), you must async/await.

    it("sanity", () => {
        assert.notStrictEqual(1, 2);
    });

    it("mutates Function prototype", () => {
        // @ts-expect-error
        assert.strictEqual(Function.prototype.ourBind == null, false);
    });

    it("works", () => {
        const obj1 = {
            foo: 42,
            f: function (num1, num2) {
                return this.foo + num1 + num2;
            }
        }

        const obj2 = {
            foo: 100,
            //  Another function with same name as obj1.f, which is completely different.
            //  We need this to make sure, ourBind doesn't mutate obj2.
            f: function (name) {
                return "Hi " + name;
            }
        };
        // @ts-expect-error
        const boundedFunction = obj1.f.ourBind(obj2, /*num1=*/10);
        let res = boundedFunction(/*num2=*/1000);

        assert.strictEqual(res, obj2.foo + 10 + 1000);
        assert.notStrictEqual(res, obj1/*<-*/.foo + 10 + 1000);

        // Make sure ourBind didn't change obj2.f
        const greeting = obj2.f("John");
        assert.strictEqual(greeting, "Hi John");
    });

    it("works for async functions", async () => {
        const obj1 = {
            foo: 49,
            bar: { baz: 400 },
            f: async function (num1) {
                const num1Doubled = await new Promise(
                    (resolve) => setTimeout(() => resolve(2 * num1), 50)
                );
                return this.foo + this.bar.baz + num1Doubled;
            }
        };

        const obj2 = {
            foo: 3,
            bar: { baz: 300 },
        }

        // @ts-expect-error
        const boundedFunction = obj1.f.ourBind(obj2);
        const res = await boundedFunction(1000);

        assert.strictEqual(res, 3 + 300 + 2 * 1000);
    });
});