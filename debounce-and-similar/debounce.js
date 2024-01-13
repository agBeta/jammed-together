/** 
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

    //  Not sure if using apply(..) is necessary or not. Everything works if we use bind(..) where 
    //  we are calling makeDebounce. Also checkout commit d9191f2.
    //  Also https://stackoverflow.com/questions/72794979/can-you-explain-why-debounce-does-this-binding.

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
            timerID = null;
        }, delay);
    }
}


//  BTW, checkout source code of https://www.npmjs.com/package/debounce for more general implementation.
/*
    BTW, a good link about Spread vs Rest. 
    https://stackoverflow.com/questions/37151966/what-is-spreadelement-in-ecmascript-documentation-is-it-the-same-as-spread-synt/37152508#37152508
*/