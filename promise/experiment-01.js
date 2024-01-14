function f1(){
    setTimeout(() => console.log("timeout"), 0);
    setImmediate(() => console.log("immediate"));
    // immediate -> timeout
}

function f2() {
    let numberOfImmediateOnesExecuted = 0;
    const N = 200_000;

    for (let i = 1; i <= N; i++) {
        setTimeout(() => {
            if (numberOfImmediateOnesExecuted < N) {
                console.log("Some timeout function executed while there is still immediate functions pending.");
                // Log above won't appear in console.
                process.exit(0);
            }
        }, 0);
        setImmediate(() => {
            numberOfImmediateOnesExecuted++;
        });
    }
}


function f3(){
    setTimeout(() => console.log("1"), 4.7);
    setTimeout(() => console.log("2"), 1);
    setTimeout(() => console.log("3"), 4);
    setTimeout(() => console.log("4"), 0);
    //? prints 2 -> 4 -> 1 -> 3.  🔷
}

function f3_when_busy(){
    setTimeout(() => console.log("1"), 4.7);
    setTimeout(() => console.log("2"), 1);
    setTimeout(() => console.log("3"), 4);
    setTimeout(() => console.log("4"), 0);
    let sum = 0;
    //  You can change number below based on your hardware. The point is to make sure 'for' below takes
    //  more than a few milliseconds.
    for (let i = 0; i < 2_000_000_000; i++) {
        sum += i;
    }
    // Let's console.log sum to assure that no optimization happens behind the scenes.
    console.log(sum);

    // prints: the same result as f3().
}

// f1();
// f2();
// f3();
f3_when_busy();