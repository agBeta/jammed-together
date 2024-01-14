import test from "node:test";
import assert from "node:assert";
import path from "node:path";
import { walk } from "./walk.js";

test("walk", async () => {
    // Parent test ↖️ shouldn't finish before subtest execution finishes.
    await test("works", () => {
        const pathToTest = path.resolve(
            new URL(".", import.meta.url).pathname, "dir_for_test"
        )

        const result = walk(pathToTest);
        const resultRelative = result.map(p => p.slice(pathToTest.length));
        
        function contains(value) {
            assert.strictEqual(resultRelative.includes(value), true);
        }

        // If you want to write more robust assertions (that also works on Windows), use 'sep'.
        contains("/dir1");
        contains("/dir2");
        contains("/file1.txt");

        contains("/dir2/d2_f1.txt");

        contains("/dir1/d1_f1.txt");
        contains("/dir1/d1_f2.txt");
        contains("/dir1/dir1_1");

        contains("/dir1/dir1_1/d1_1_f1.txt");

        assert.strictEqual(resultRelative.includes("/"), false);
    });
});