import { WebSocket } from "ws";
import http from "http";
/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from "express";
import { consumeKafkaMessages } from "./logger-consumer"; //Your Kafka consumer that listens for logs.

const app = express();

//we need websocket for real time logging data to admin dashboard, like tracking the user activities
// noServer: true → WebSocket server won’t listen on its own; it will attach to the HTTP server on demand.
// Don’t create and bind your own HTTP server, I’ll provide you one.”
// const wsServer = new WebSocket.Server({ port: 6008 });
// The WebSocket server itself creates and listens on a TCP port (6008 here).
// That means you’d have two separate servers:
// Express (HTTP server)
// WebSocket server
// 👉 Which is messy if you want both HTTP & WebSocket traffic on the same port
// noServer:trueThe WebSocket server does not listen on a port.
// Instead, you manually “upgrade” incoming HTTP requests to WebSocket.
const wsServer = new WebSocket.Server({ noServer: true });
// clients: Keeps track of all connected WebSocket clients (e.g., admin dashboards).
// to keep track of websocket client
export const clients = new Set<WebSocket>();

// handle incoming websocket connection
// When a new client connects, it gets added to the clients set.
// When a client disconnects, it’s removed.
wsServer.on("connection", (ws) => {
  console.log("New logger client connected");
  clients.add(ws);

  ws.on("close", () => {
    console.log("Logger client disconnected");
    clients.delete(ws);
  });
});

// HTTP upgrade event lets you hijack the request and "upgrade" it to a WebSocket connection.
// wsServer.handleUpgrade finalizes the handshake.
// Then emits the "connection" event to handle the client.
const server = http.createServer(app);

// server = your HTTP server (created with http.createServer(app)).
// "upgrade" = a special event in Node.js HTTP.
// It’s triggered when a client (usually a browser) says:
// “I want to upgrade this HTTP request to a WebSocket connection.”
// The callback receives:
// request: the incoming HTTP request object.
// socket: the raw TCP socket (low-level connection).
// head: the first packet of the upgraded stream (sometimes contains leftover data).
// 👉 This is where you decide whether to allow the upgrade.
// wsServer.handleUpgrade tells the ws WebSocket server:
// “Take this HTTP upgrade request and complete the WebSocket handshake.”
// If successful, it gives you a WebSocket object (ws) representing that connection.
// If not successful (wrong headers, bad upgrade), you should close the socket
// wsServer.emit("connection", ws, request);
// Normally, when you do new WebSocket.Server({ port }), the server automatically emits a "connection" event when a client connects.
// But since you’re using noServer: true, you have to manually emit that "connection" event after upgrading.
// This makes your earlier listenex/has connected, start treating it like a normal connection.”
// Full Flow
// Client sends an HTTP request with header:
// Connection: Upgrade and Upgrade: websocket.
// Node.js server triggers "upgrade" event.
// handleUpgrade checks & upgrades request → gives a ws object.
// You manually fire "connection" on wsServer, which runs your WebSocket connection logic.
server.on("upgrade", (request, socket, head) => {
  wsServer.handleUpgrade(request, socket, head, (ws) => {
    wsServer.emit("connection", ws, request);
  });
});

// Starts the server at PORT (default 6008).
server.listen(process.env.PORT || 6008, () => {
  console.log(`Listening at http://localhost:6008/api`);
});

// start kafka consumer
// why we need kafka here ?
// when any activity is performed by the user we send the log to this logger service, and websocket server sends this to admin dashboard, but if admin is not active we need to store that data somewhere to show later ,hence kafka comes to the rescue
// here in this project we are not storing logger data in db but for real wold we can process the data with kafka and filter the data with elastic search , for large volume of data we can store in these type of database like opensearch or elasticsearch
consumeKafkaMessages();
// 50 shops 50 products 50 users actions for recommendation system
