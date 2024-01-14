## Queue
Most implementation out there use .shift() method on an array which is O(n).
There is slightly better implementation in https://www.javascripttutorial.net/javascript-queue/.
which uses object keys (instead of .shift()), but this also requires hashing and isn't really O(1).  

</br>

## Per-allocation
Comment by Cazineer in [this SO answer](https://stackoverflow.com/a/1247016): This answers is ancient and totally false. In Node, I can initialize an array const s = new Array(10000000) and do 10 million inserts and with the array literal [] it takes 23.6 seconds and with the constructor, 5.5 seconds.


## Time Complexity of Data Structures in JS

According to [This SO answer](https://stackoverflow.com/a/34292923), JavaScript **does not** give any complexity guarantees whatsoever, except for ES6 collections.

Also quoting from the answer: ... I know the access operator [] gives a seasoned programmer the impression that he's dealing with an O(1) lookup structure.  
Yes you are, this is a reasonable expectation. Engines employ all kinds of optimisations, from hidden classes over hashmaps to dynamic arrays, to meet these assumptions.

</br>

### `Array.indexOf` vs `Set.has`
https://stackoverflow.com/a/55057332.
While O(1) complexity isn't guaranteed, the specification requires the method to run in sublinear time. And Set.has(), generally, will perform better than Array.indexOf().

</br>

### ES6 Collections
According [ES docs about WeakMap](https://262.ecma-international.org/6.0/#sec-weakmap-objects):  
WeakMap objects *must* be implemented using either hash tables or other mechanisms that, on average, provide access times that are *sublinear* on the number of key/value pairs in the collection.

</br>
https://stackoverflow.com/questions/12241676/javascript-objects-as-hashes-is-the-complexity-greater-than-o1.


</br>

### Good link about Deterministic Hash tables:  
The API was designed to match the proposal for ECMAScript Map objects as of February 2012. https://wiki.mozilla.org/User:Jorend/Deterministic_hash_tables.