/** 
 * @param {number} size 
 * @param {Object} [param1={}] 
 * @param {boolean} [param1.overwriteIfFilled=false] 
 */
export function makeRingBuffer(size, { overwriteIfFilled = false } = {}) {

    if (!Number.isInteger(size) || size <= 1 || size >= 2_000_000) {
        throw new Error("size must be an integer greater than 1 and less than 2e6.");
    }

    const arr = new Array(size); // WeakMap? no. maybe later.

    // Why do we need this? See flush() implementation.
    const isFlushed = new Array(size);
    for (let i = 0; i < size; i++) isFlushed[i] = true;

    let lastInsertIndex = -1;
    let nextReadIndex = 0;

    return Object.freeze({
        insert,
        flush
    });

    function insert(newItem) {
        // console.log("inserting ", newItem);
        lastInsertIndex = (lastInsertIndex + 1) % size;
        // console.log("⤵️ read:", nextReadIndex, " -- ", "insert:", lastInsertIndex);

        if (lastInsertIndex === nextReadIndex && isFlushed[nextReadIndex] === false) {
            if (overwriteIfFilled) {
                // nextReadIndex should always point to oldest value. So:
                nextReadIndex = (nextReadIndex + 1) % size;
                arr[lastInsertIndex] = newItem;
                isFlushed[lastInsertIndex] = false;
            } else {
                // Before throwing an error we should correct lastInsertIndex.
                lastInsertIndex = (lastInsertIndex - 1 + size) % size;
                throw new Error("Ring buffer is filled. Cannot insert new item.");
            }
        }
        else {
            arr[lastInsertIndex] = newItem;
            isFlushed[lastInsertIndex] = false;
        }

        // console.log();
    }

    function flush(cnt = 1) {
        if (lastInsertIndex === -1) {
            // Nothing has been inserted so far.
            return [];
        }
        const ret = [];
        for (let i = 0; i < cnt; i++) {
            // console.log("⏫ read:", nextReadIndex, " -- ", "insert:", lastInsertIndex);
            if (isFlushed[nextReadIndex]) break;
            ret.push(arr[nextReadIndex]);
            //  If didn't have isFlushed[] array, we would have to use ret.push(...arr[nextReadIndex]), which
            //  would degrade the performance if we have large objects.
            //  Now, we don't have to (and SHOULD NOT) set arr[nextReadIndex] to null. But ...
            //  BUT this object never gets garbage collected unless it's overwritten. Ring buffers are 
            //  usually used when there is quite a lot of data coming in. So by this assumption, our
            //  current choice is better than setting arr[..] to null and copying the object to ret.push().
            isFlushed[nextReadIndex] = true;

            if (nextReadIndex === lastInsertIndex) {
                //  No more data to read. But we must move nextRead. Think about it: we have flushed 
                //  current index, so next time (assuming new data will be inserted) we should read the
                //  next index.
                nextReadIndex = (nextReadIndex + 1) % size;
                break;
            }
            nextReadIndex = (nextReadIndex + 1) % size;
        }
        return ret;
    }
}