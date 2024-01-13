/** @version practice @param {Function} cb  */
export function __makeDebounce(cb, delay = 1000) {
    /**@type {number | null}*/
    let timeoutID = null;

    return {
        correctlyDebounced: function (...args) {
            clearTimeout(timeoutID);
            timeoutID = setTimeout(() => {
                cb.apply(this, args);
                //  You could also write cb.bind(this)(...args); 
                //  Notice, for apply() we don't spread the arguments (i.e. three dots).
            }, delay);
        },

        /** @deprecated - Cannot use arrow function here, as we'll lose "this" context. */
        _incorrectlyDebounced1: (...args) => {
            clearTimeout(timeoutID);
            timeoutID = setTimeout(() => {
                cb.apply(this, args);
            }, delay);
        },

        /** @deprecated - Must handle "this" binding. */
        _incorrectlyDebounced2: function (...args) {
            clearTimeout(timeoutID);
            timeoutID = setTimeout(() => {
                cb(...args); // Not handling "this" binding.
            }, delay);
        },
    }
}


/** 
 * @version final
 * @param {Function} cb 
 * @param {number} [delay=1000] - Won't execute until delay milliseconds have passed since the 
 *          last time it is called.
 * @param {boolean} [immediateInvoke=false] - If true, the debounced function will have the following 
 *          feature: If we call it and it hasn't been called in recent "delay" milliseconds
 *          then it will immediately execute (i.e. doesn't wait for "delay" milliseconds) 
 *          BUT then it will ignore any calls for the following delay milliseconds. 
 */
export function makeDebounce(cb, delay = 1000, immediateInvoke = false) {
    let timerID = null;

    return function (...args) {
        clearTimeout(timerID); // <- It doesn't make timerID null or undefined.

        const isThereAnyActiveDelayedExecution = (timerID != null);

        if (immediateInvoke && isThereAnyActiveDelayedExecution === false) {
            cb.apply(this, args);
        }

        timerID = setTimeout(() => {
            if (!immediateInvoke) {
                cb.apply(this, args);
            }
            timerID = false;
        }, delay);
    }
}

/*
    BTW, a good link about Spread vs Rest. 
    https://stackoverflow.com/questions/37151966/what-is-spreadelement-in-ecmascript-documentation-is-it-the-same-as-spread-synt/37152508#37152508
*/