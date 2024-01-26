function doSomethingHeavy(){
    const n = Math.floor(Math.random() * 1_000_000) + 100_000_000;
    let sum = 0;
    for (let i = 1; i <= n; i++) {
        sum += i;
    }
    return sum;
}

for (let i = 1; i <= 100; i++) {
    queueMicrotask(() => {
        doSomethingHeavy();
        console.log(`Finished heavy job: ${i}`);
        process.nextTick(() => {
            console.log(`executing nextTick callback of ${i}`);
        });
    });
}


// Completely accordant with Jake Archibald's talk

/* prints (UNlike timeout-experiment):
    Finished heavy job: 1
    Finished heavy job: 2
    Finished heavy job: 3
    ...
    Finished heavy job: 100
    executing nextTick callback of 1
    executing nextTick callback of 2
    ...
    executing nextTick callback of 100
*/