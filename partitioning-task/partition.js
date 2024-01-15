/** 
 * Calculate average of 1...n and after calculation calls the callback with the result.
 * @see https://nodejs.org/en/guides/dont-block-the-event-loop/#partitioning.
 */
function asyncAvg(n, cbAfterCalculatingAvg) {
    let sum = 0;
    function step(i, cb) {
        sum += i;
        if (i == n) {
            cb(sum);
            return;
        }
        // "Asynchronous recursion".
        setImmediate(step.bind(null /*no this context*/, i + 1, cb));
    }

    step(1, function afterCalculatingSum(sum) {
        const avg = sum / n;
        cbAfterCalculatingAvg(avg);
    })
}

asyncAvg(1000, avg => {
    console.log(avg);
});