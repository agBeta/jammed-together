import EventEmitter from "node:events";

function performScenario(ee){
    ee.on("greeting", /*--->*/ async (name) => {
        console.log("hello", name);
        await new Promise((rs) => setTimeout(rs, 100)); // <-- commenting out this line doesn't change outcome
        // Fail deliberately
        throw new Error("deliberate");
    })
    ee.on("error", (err) => {
        console.log("📢 📢 📢 Caught the error");
    });
    
    ee.emit("greeting", "John")
}

const badEE = new EventEmitter({ captureRejections: false });
const goodEE = new EventEmitter({ captureRejections: true });

// performScenario(badEE);
performScenario(goodEE);