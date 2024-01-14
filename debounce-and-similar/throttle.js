/** 
 * @param {Function} fn 
 * @param {number} delay - If cb hasn't been executed within last delay ms, it will
 *          execute immediately. Otherwise, it waits until delay ms passes since last
 *          execution, and then it will execute cb with the most recent arguments.
 */
export function makeThrottle(fn, delay) {
    // Read comments at the end of this file
    let timerIDOfMostRecentScheduledExecution;
    let lastTimeCbExecuted = 0;

    const throttled = function(...args) {
        const waitRemaining = delay - (Date.now() - lastTimeCbExecuted);

        if (waitRemaining <= 0) {
            lastTimeCbExecuted = Date.now();
            fn.apply(this, args);
        }
        else {
            clearTimeout(timerIDOfMostRecentScheduledExecution);
            timerIDOfMostRecentScheduledExecution = setTimeout(() => {
                lastTimeCbExecuted = Date.now();
                fn.apply(this, args);
            }, waitRemaining);
        }
    }

    throttled.cancel = function() {
        clearTimeout(timerIDOfMostRecentScheduledExecution);
    }

    return throttled;
}

//  In many cases, receiving the trailing call is very important in order to get the 
//  last viewport size or whatever it is you're trying to do.