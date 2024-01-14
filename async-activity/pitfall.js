const arr = Array(2_000); // Array(20_000);
for (let i = 0; i < arr.length; i++) {
    arr[i] = i;
}

async function badPracticeProcess() {
    const startTimeOfProcess = Date.now();

    setImmediate(() => console.log(
        `I'm setImmediate that eventually got executed in next tick after ${Date.now() - startTimeOfProcess}`
    ));
    // On my machine the console log appears after 22 "seconds" for 20_000 (twenty thousand) array length.
    // On my machine the console log appears after 2 "seconds" for 2_000 (two thousand) array length.

    return await Promise.all(

        // 🔴 Synchronously creating 2_000 promises. Note, majority of them resolve at the same time.
        arr.map(async function doSomething(index) {
            let dummySum = 0; 
            // not a lightweight task (though, not that heavy)
            for (let i = 0; i < 1_000_000 - index; i++){ dummySum += i; }
            await new Promise((rs) => setTimeout(rs, 1000));
            return dummySum;
        })
    );
}

badPracticeProcess().then(console.log);

// 1) node --trace-event-categories=v8,node,node.async_hooks pitfall.js
// 2) open chrome://tracing and load the log file