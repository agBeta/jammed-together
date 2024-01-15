/**
 * fn should be of form (arg1,...,argN, cb)=>void, and cb should be (error, value)=>void.
 * @param {Function} fn 
 */
function makePromisified(fn) {
    return function (...args) {
        return new Promise((resolve, reject) => {
            function handle(error, value) {
                if (error) reject(error)
                else resolve(value);
            }
            fn.call(this, ...args, handle);
        });
    }
}

// -------------- test ---------------

function getSumAsync(a, b, callback) {
    if (typeof a !== "number" || typeof b !== "number") 
        return callback(new Error("arguments must be number"), null /*<- no value*/)
    const sum = a + b;
    return callback(null, sum, `sum is ${sum}`, `(3rd arg) at: ${Date.now()}`);
}

getSumAsync(2, 3, (error, value) => {
    console.log(value);
});

const getSumPromisified = makePromisified(getSumAsync);
getSumPromisified(2, 3).then(console.log);