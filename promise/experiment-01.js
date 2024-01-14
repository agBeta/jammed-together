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

// f1();
// f2();
f3();