/**
 * @param {Function} cb 
 * @param {number} delay - Won't execute until delay milliseconds have passed since the 
 *          last time it is called.
 * @param {boolean} [immediateInvoke=false] - If true, the debounced function will have the following 
 *          feature: If we call it and it hasn't been called in recent "delay" milliseconds
 *          then it will immediately execute (i.e. doesn't wait for "delay" milliseconds) 
 *          BUT then it will ignore any calls for the following delay milliseconds.  
 */
export function makeDebounce(cb, delay, immediateInvoke = false) {
    // Read comments at the end of this file.
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
            timerID = null;
        }, delay);
    }
}

export function _makeIncorrectDebounce_1(cb, delay) {
    let timerID = null;
    return function (...args) {
        clearTimeout(timerID); 
        timerID = setTimeout(() => {
            cb(...args); //  <-- The only difference is here: ignoring "this" binding
            timerID = null;
        }, delay);
    }
}

export function _makeIncorrectDebounce_2(cb, delay) {
    let timerID = null;
    return function (...args) {
        clearTimeout(timerID); 
        timerID = setTimeout(function notArrowFunction(){
            //  The only difference is here: ↖️. Using function instead of arrow function. Arrow function 
            //  doesn't create its own execution context but inherits the this from the outer function.
            //  But plain(?) function above DOES change execution context.
            cb.apply(this, args); 
            timerID = null;
        }, delay);
    }
}

//  BTW, checkout source code of https://www.npmjs.com/package/debounce for more general implementation.

/*  See https://stackoverflow.com/questions/72794979/can-you-explain-why-debounce-does-this-binding.

    BTW, this is good example of how using "this" might cause bugs in event listener, specifically 
    controllers: https://stackoverflow.com/a/51980022
*/
/*  BTW, a good link about Spread vs Rest.
    https://stackoverflow.com/questions/37151966/what-is-spreadelement-in-ecmascript-documentation-is-it-the-same-as-spread-synt/37152508#37152508
*/
//  