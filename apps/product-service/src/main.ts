import swaggerUi from "swagger-ui-express";
import express from "express";
import cors from "cors";
import { errorMiddleware } from "@packages/error-handler/error-middleware";
import cookieParser from "cookie-parser";
import router from "./routes/product.router";

const swaggerDocument = require("./swagger-output.json");
const app = express();
app.use(
  cors({
    origin: ["http://localhost:3000"],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  })
);
// Parses incoming JSON request bodies.Increases the default payload size limit (usually 100kb) to allow large JSON bodies (like images/base64, long blog posts, etc.).
app.use(express.json({ limit: "100mb" }));
// Parses URL-encoded data (e.g., from HTML forms).extended: true: Uses the qs library for rich parsing (objects/arrays). If set to false, it uses querystring and supports only simple key-value pairs.limit: "100mb": Same as above—supports large form data.
app.use(express.urlencoded({ limit: "100mb", extended: true }));
app.use(cookieParser());
app.get("/", (req, res) => {
  res.send({ message: "Hello  producg API" });
});

//swaggerui setup
// swaggerUi.serve → Middleware that serves the Swagger UI static assets (HTML, CSS, JS).
// swaggerUi.setup(swaggerDocument) → Initializes Swagger UI with your generated Swagger JSON object (swaggerDocument, which is the swagger-output.json you created).
// Result → If you visit http://localhost:6001/api-docs in your browser, you should see an interactive Swagger documentation page.
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));
//swaggerui route
// This gives you a raw JSON version of your Swagger docs at /docs-json.
// This can be useful if you want other tools (Postman, other Swagger UIs, etc.) to read your documentation file directly via HTTP.
app.get("/docs-json", (req, res) => {
  res.json(swaggerDocument);
});
//routes
app.use("/api", router);
app.use(errorMiddleware);

const port = process.env.PORT || 6002;
const server = app.listen(port, () => {
  console.log(`Product service is running at http://localhost:${port}/api`);
  console.log(`Swagger Docs available at http://localhost:${port}/api-docs`);
});
server.on("error", (err) => {
  console.log("server error: ", err);
});

// server here is an instance of a Node.js HTTP server created when you call app.listen(...).
// It inherits from Node's EventEmitter, so you can attach event listeners like on("error").
// Without it, if an error occurs while starting the server, the app might crash without a helpful message.
