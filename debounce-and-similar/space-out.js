/** @param {Function} fn @param {number} delay  */
export function makeSpaceOutQueue(fn, delay, context) {
    
    //  For simplicity we're using an array list. It's recommended to use a queue 
    //  data structure.

    /**@type {{ context: any, args: any[] }[]}*/
    const queue = [];
    let timer = null;

    function processQueue() {
        const task = queue.shift();
        if (task != null) {
            fn.apply(task.context, task.args);
        }
        if (queue.length === 0) {
            clearInterval(timer);
            timer = null;
        }
    }

    return function(...args) {
        queue.push({
            context: context || this,
            args: args,
        });
        if (!timer) {
            processQueue(); // start immediately on the first invocation
            timer = setInterval(processQueue, delay);
        }
    }
}


//  Credit to Dan Dascalescu's answer in comments of this link:
//  https://stackoverflow.com/questions/23072815/throttle-javascript-function-calls-but-with-queuing-dont-discard-calls