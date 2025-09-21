import cookieParser from "cookie-parser";
/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from "express";
import cors from "cors";
import { errorMiddleware } from "@packages/error-handler/error-middleware";
import router from "./routes/seller.route";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:3001"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  })
);

// Parses incoming JSON request bodies.Increases the default payload size limit (usually 100kb) to allow large JSON bodies (like images/base64, long blog posts, etc.).
app.use(express.json({ limit: "100mb" }));
// Parses URL-encoded data (e.g., from HTML forms).extended: true: Uses the qs library for rich parsing (objects/arrays). If set to false, it uses querystring and supports only simple key-value pairs.limit: "100mb": Same as above—supports large form data.
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());

app.get("/api", (req, res) => {
  res.send({ message: "Welcome to seller-service!" });
});

//routes
app.use("/api", router);
app.use(errorMiddleware);

const port = process.env.PORT || 6003;
const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
});
server.on("error", console.error);
