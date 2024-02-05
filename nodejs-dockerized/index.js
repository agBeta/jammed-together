import express from "express";

const app = express();

app.get("/", (req, res) => {
    res.writeHead(200, {
        "Content-Type": "text/html; charset=utf-8"
    });
    res.end("<h1>Hi There 🌷</h1>");
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`listening on port ${port}`));