function f1(){
    new Promise((resolve, reject) => {
        throw new Error("This error will be caught below.");
    }).catch(e => {
        console.log(" 📢 ".repeat(5), "caught!");
    });
}

function f2(){
    // Bad practice. Mixing Promise and async/await. Anyway...
    new Promise(async /*<--*/(resolve, reject) => {
        throw new Error("This error will NOT get caught by catch below.")
    }).catch(e => {
        console.log(" 🗣️ ".repeat(5), "caught!");
    });
}

// f1();
f2();