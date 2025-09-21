import cookieParser from "cookie-parser";
/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from "express";
import router from "./routes/recommendatation.routes";
import { errorMiddleware } from "@packages/error-handler/error-middleware";

const app = express();
app.use(express.json({ limit: "100mb" }));
app.use(express.urlencoded({ limit: "100mb", extended: true }));
// Parses cookies attached to the client request (req.cookies).
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send({ message: "Welcome to recommendation-service!" });
});

// routes
app.use("/api", router);
app.use(errorMiddleware);

const port = process.env.PORT || 6007;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on("error", console.error);
