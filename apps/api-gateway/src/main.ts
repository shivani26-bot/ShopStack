/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express, { Request } from "express";
import cors from "cors";
import proxy from "express-http-proxy";
import morgan from "morgan";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";
import swaggerUi from "swagger-ui-express";
import axios from "axios";
import cookieParser from "cookie-parser";
import * as path from "path";
import initializeSiteConfig from "./libs/initializeSiteConfig";

const app = express();
// origin	Specifies which origins are allowed to access your backend. Here, only requests from http://localhost:3000 (likely your frontend app) are allowed.
// allowedHeaders	Specifies which headers can be used in the actual request. Here, the client can send Authorization and Content-Type headers.
// credentials	When set to true, this allows cookies or credentials (like Authorization headers or TLS client certificates) to be sent in cross-origin requests. This must be paired with credentials: "include" on the frontend fetch or axios requests.
// do not using wildcard '*' in origin with credentials: true — that’s invalid.
app.use(
  cors({
    origin: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:3002",
    ],
    allowedHeaders: ["Authorization", "Content-Type"],
    credentials: true,
  })
);

app.use(morgan("dev"));
// Parses incoming JSON request bodies.Increases the default payload size limit (usually 100kb) to allow large JSON bodies (like images/base64, long blog posts, etc.).
app.use(express.json({ limit: "100mb" }));
// Parses URL-encoded data (e.g., from HTML forms).extended: true: Uses the qs library for rich parsing (objects/arrays). If set to false, it uses querystring and supports only simple key-value pairs.limit: "100mb": Same as above—supports large form data.
app.use(express.urlencoded({ limit: "100mb", extended: true }));
// Parses cookies attached to the client request (req.cookies).
app.use(cookieParser());
// Tells Express to trust the first proxy (like in Heroku, Nginx, etc.)
app.set("trust proxy", 1);

//apply rate limiting
// Dynamic limit:
// This means that each IP or user (depending on your keyGenerator) is allowed a certain number of requests per 15-minute window.
// If they exceed the  max limit , further requests within that window will be blocked.
// After 15 minutes, the count resets, and they can send requests again.

// If req.user exists (authenticated), allow up to 1000 requests.
// If not authenticated, allow only 100 requests.

// standardHeaders: true: Sends RateLimit-* headers (standardized).
// legacyHeaders: true: Also includes legacy X-RateLimit-* headers (for compatibility with older clients).
// You can disable legacyHeaders if you only need modern clients

//req.ip gives the IP
// ipKeyGenerator(req.ip) properly normalizes and returns a safe key
// keyGenerator: (req: any) => req.ip
// req.ip returns a raw IP, e.g.:
// IPv4: "192.168.0.5" ✅
// IPv6: "::ffff:192.168.0.5" ❌ or "2001:0db8:85a3:0000:0000:8a2e:0370:7334" ❌
// IPv6 addresses may differ in format but refer to the same machine, allowing bypassing the rate limiter
// ::1 vs 0:0:0:0:0:0:0:1 — these are the same IP, but the naive key generator treats them as different keys, allowing abuse.
// Key used to track requests: Each unique IP gets its own rate count.
// You can customize this to use req.user.id for per-user limits if needed
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, //The rate limit is applied per 15-minute window.
  max: (req: any) => (req.user ? 1000 : 100),
  message: { error: "To many requests, please try again later!" },
  standardHeaders: true,
  legacyHeaders: true,
  keyGenerator: (req) => ipKeyGenerator(req.ip ?? ""), //safe,handles IPv4 + IPv6 safely
});

console.log("welcome to api gateway");
app.use(limiter); //applies globally
app.get("/gateway-health", (req, res) => {
  res.send({ message: "welcome to api-gateway" });
});

app.use("/recommendation", proxy("http://localhost:6007"));
app.use("/chatting", proxy("http://localhost:6006"));
app.use("/admin", proxy("http://localhost:6005"));
app.use("/order", proxy("http://localhost:6004"));
app.use("/seller", proxy("http://localhost:6003"));
app.use("/product", proxy("http://localhost:6002"));
app.use("/", proxy("http://localhost:6001"));

const port = process.env.PORT || 8080;

const server = app.listen(port, () => {
  console.log(`Listening at http://localhost:${port}/api`);
  try {
    //as the websites load initialize this
    //we should  not keep fetching categories in auth service , hence make  a different project folder for that, use nx
    initializeSiteConfig();
    console.log("Site config initialized successfully!");
  } catch (error) {
    console.error("Failed to initialize site config:", error);
  }
});

server.on("error", console.error);
