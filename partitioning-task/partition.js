/** 
 * Calculate average of 1...n and after calculation calls the callback with the result.
 * @see https://nodejs.org/en/guides/dont-block-the-event-loop/#partitioning.
 * @version correct
 */
function asyncAvgWithSetImmediate(n, cbAfterCalculatingAvg) {
    let sum = 0;
    function step(i, cb) {
        sum += i;
        if (i == n) {
            cb(sum);
            return;
        }
        // "Asynchronous recursion". (slower but doesn't block the event loop)
        setImmediate(step.bind(null /*no this context*/, i + 1, cb));
    }

    step(1, function afterCalculatingSum(sum) {
        const avg = sum / n;
        cbAfterCalculatingAvg(avg);
    })
}

/** @version bad @deprecated */
function asyncAvgWithNextTick(n, cbAfterCalculatingAvg) {
    let sum = 0;
    function step(i, cb) {
        sum += i;
        if (i == n) {
            cb(sum);
            return;
        }
        process.nextTick(step.bind(null /*no this context*/, i + 1, cb));
    }

    step(1, function afterCalculatingSum(sum) {
        const avg = sum / n;
        cbAfterCalculatingAvg(avg);
    })
}

function f1(){
    setTimeout(() => {
        console.log(
            "😊 I got executed gracefully, since asyncAvg doesn't block the event loop."
        );
    }, 10);
    asyncAvgWithSetImmediate(10_000_000, avg => {
        console.log(avg);
    }); 
}

function f2(){
    setTimeout(() => {
        console.log(
            "😞 I'm setTimeout BUT nextTick won't let me get executed on time."
        );
    }, 10);
    // n should be big enough to witness the issue.
    asyncAvgWithNextTick(30_000_000, avg => {
        console.log(avg);
    }); 
}


// f1();
f2();