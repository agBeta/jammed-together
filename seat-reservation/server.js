import express from "express";
import { createAction } from "./controllers.js";

const app = express();
const port = 8080;

app.post("/v1/reserve/:seatId", async (req, res) => {
    const seatId = req.params.seatId;
    const userId = JSON.parse(req.body);
    const { status, payload } = await createAction({ seatId, userId });
    res.status(status).send(payload);
});

app.listen(port, () => console.log("listening on", port));