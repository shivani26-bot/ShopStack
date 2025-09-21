import cookieParser from "cookie-parser";

/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from "express";
import { createWebSocketServer } from "./websocket";
import { startConsumer } from "./chat-message.consumer";
import router from "./routes/chat.routes";

const app = express();
app.use(express.json());
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send({ message: "Welcome to chatting-service!" });
});

// routes
app.use("/api", router);

const port = process.env.PORT || 6006;

const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
//connect the websocket server
// websocket server will run on 6006 but url will be wss://localhost:6006
createWebSocketServer(server);

// start the kafka consumer
startConsumer().catch((error: any) => {
  console.log(error);
});

server.on("error", console.error);
