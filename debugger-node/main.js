const obj = {
    prop1: 123356,
    prop123: {
        name: "John",
        age: 35,
    }
};

function f(a){
    debugger;  // <----
    obj.prop123.age += a;
    return obj.prop123.age;
}

f(5);