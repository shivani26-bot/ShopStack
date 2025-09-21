/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import { errorMiddleware } from "@packages/error-handler/error-middleware";
import router from "./routes/order.route";
import { createOrder } from "./controllers/order.controller";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  })
);
// Stripe calls this endpoint.
//must receive application json data request
//only for stripe, so that it can communicate with our server properly
// When a request hits this endpoint, Express will run the listed middleware functions in order.
// Express (with express.json()) parses JSON requests into JavaScript objects automatically.
// But for Stripe webhooks, we need the raw request body (unparsed bytes) to verify the signature.
// This middleware tells Express:
// “Don’t parse JSON into an object. Instead, keep it raw (as a Buffer).”
// Only do this for requests with Content-Type: application/json.
// After bodyParser.raw, req.body is a raw Buffer, not a parsed JSON object.
// Stripe’s constructEvent() needs this raw body to verify the signature.
// This middleware saves that raw body into req.rawBody so your createOrder controller can access it.
app.post(
  "/api/create-order",
  bodyParser.raw({ type: "application/json" }),
  (req, res, next) => {
    (req as any).rawBody = req.body;
    next();
  },
  createOrder //Finally, the request gets passed into your custom controller (createOrder).
);

app.use(express.json({ limit: "100mb" }));
app.use(cookieParser());

app.get("/", (req, res) => {
  res.send({ message: "Welcome to order-service!" });
});

// routes
app.use("/api", router);
app.use(errorMiddleware);

const port = process.env.PORT || 6004;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on("error", console.error);
