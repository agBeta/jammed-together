// @ts-ignore
Function.prototype.ourBind = function(thisContext, ...args) {
    //  We need to bind function to thisContext, so that all "this" keywords inside the function
    //  will automatically be bound to thisContext.

    const fnThatWeAreCurrentlyTryingToBind = this; // Why? We are writing this code in prototype.
    
    return function (...argsOfBoundFunction) {

        //  Don't do this:
        //  ->  thisContext.fn = fnThatWeAreCurrentlyTryingToBind;
        //  If function (function we are currently on and trying to bind), has a for(in) loop inside its
        //  implementation, then fn would appear in the loop, which isn't what we want.
        //  Another issue occurs if thisContext object already has a property "fn".
    
        const symbol = Symbol();
        thisContext[symbol] = fnThatWeAreCurrentlyTryingToBind;

        const ret = thisContext[symbol](...args, ...argsOfBoundFunction);
        //  Now we reach here, execution context of ret is already created. So we can safely:
        delete thisContext[symbol];
        return ret;
    };
}