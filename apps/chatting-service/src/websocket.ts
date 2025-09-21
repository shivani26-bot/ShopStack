// kafka producer to produce our all messages, producer here is websocket, users send message through websocket server, and wesocket sends these messages to kafka server

import { getProducer, kafka } from "@packages/utils/kafka";
import redis from "@packages/libs/redis";
import { Server as HttpServer } from "http";
import { WebSocketServer, WebSocket } from "ws";
import { Producer } from "kafkajs";

// const producer = kafka.producer(); //Kafka producer instance (connected later).

let producer: Producer;

// use redis for seen and unseen message,redis: Used to track online status and possibly unseen message counts.
// active status comes from websocket network , when user and seller are connected through wesocket then its active status
const connectedUsers: Map<string, WebSocket> = new Map(); //Keeps track of which userId → WebSocket connection.
// These are in-memory. If server restarts, counts reset (could be moved to Redis later).
const unseenCounts: Map<string, number> = new Map(); //Tracks unread message counts (conversationId + user).

// when message type is marked as seen it means the message is seen otherwise unseen
// Defines the shape of messages sent over WebSocket.
// Optional type: used to distinguish special actions like "MARK_AS_SEEN".
type IncomingMessage = {
  type?: string;
  fromUserId: string; //who is sending the mesaage
  toUserId: string; //to whom message is sent
  messageBody: string;
  conversationId: string;
  senderType: string; //seller or user
};

// Creates a WebSocket server on top of the existing HTTP server.
// Why do we do this?
// Protocol Upgrade
// WebSockets start as an HTTP request (GET /chat with Upgrade: websocket header).
// The server upgrades the connection from HTTP → WebSocket.
// This can only happen if the WebSocket server is attached to an HTTP server.
// Single Port
// If you already have an Express/HTTP server running on :6006, attaching the WebSocket server means:
// Both normal HTTP requests and WebSocket connections run on the same port.
// Without this, you’d need a separate port just for WebSockets.
// Both your REST APIs (http://localhost:6006/api/...) and WebSocket connections (ws://localhost:6006) share the same port.
// Shared Auth / Middleware
// Since WebSocket handshake begins as HTTP, you can reuse:
// Authentication (JWT/session cookies)
// Middleware (CORS, logging, etc.)
// Example: A client sends cookies or a bearer token in the HTTP upgrade request → your HTTP server can verify before upgrading.

// Connects Kafka producer (so we can publish messages).
export async function createWebSocketServer(server: HttpServer) {
  const wss = new WebSocketServer({ server });
  // await producer.connect();
  producer = await getProducer();

  console.log("Kafka producer connected!");

  //   Every time a client connects, we get a ws socket.
  // registeredUserId is initially null. First message will "register" the user.
  wss.on("connection", (ws: WebSocket) => {
    console.log("New Websocket connection!");
    let registeredUserId: string | null = null;

    // Listens for incoming messages.
    // Converts Buffer to string
    ws.on("message", async (rawMessage) => {
      try {
        const messageStr = rawMessage.toString();
        // register the user on first plain message (non-JSON )
        //         If the first message is not JSON, it is treated as userId registration.
        // Example: "user_123" or "seller_99".
        // Save the ws connection in connectedUsers.
        // Write to Redis:
        // online:user:123 = 1
        // online:seller:99 = 1
        // Expire in 300s (if no heartbeat → status goes offline).
        if (!registeredUserId && !messageStr.startsWith("{")) {
          registeredUserId = messageStr;
          connectedUsers.set(registeredUserId, ws);
          console.log(`registered websocket for userId:${registeredUserId}`);

          const isSeller = registeredUserId.startsWith("seller_");
          const redisKey = isSeller
            ? `online:seller:${registeredUserId.replace("seller_", "")}`
            : `online:user:${registeredUserId}`;
          await redis.set(redisKey, "1"); //"1" here is just a string value being stored in Redis against the key."1" usually means "this user is online".
          await redis.expire(redisKey, 300);
          return;
        }

        // process json message,Parses proper chat messages.
        const data: IncomingMessage = JSON.parse(messageStr);

        // if its seen update
        // If client sends { type: "MARK_AS_SEEN" }, reset unseen count to 0.
        if (data.type === "MARK_AS_SEEN" && registeredUserId) {
          const seenKey = `${registeredUserId}_${data.conversationId}`;
          unseenCounts.set(seenKey, 0);
          return;
        }

        // regular message
        //         Validates required fields.
        // Extracts details of the message.
        const {
          fromUserId,
          toUserId,
          messageBody,
          conversationId,
          senderType,
        } = data;

        if (!data || !toUserId || !messageBody || !conversationId) {
          console.warn("Invalid message format:", data);
          return;
        }
        const now = new Date().toISOString();

        // Build the actual message to send to frontend + Kafka.
        // we can add a attachement field to send the picture, we can also send the attachment to kafka consumer, and from kafka consumer first we can upload the image to imagekit or cloud provider , we can add the image url inside the model or inside attachment array, in ui we can show that if its an attachemnt show the image
        const messagePayload = {
          conversationId,
          senderId: fromUserId,
          senderType,
          content: messageBody,
          createdAt: now,
        };

        const messageEvent = JSON.stringify({
          type: "NEW_MESSAGE",
          payload: messagePayload,
        });

        // determine key
        //         Example:
        // If senderType = "user" → receiver is seller_X, sender is user_Y.
        // If senderType = "seller" → receiver is user_X, sender is seller_Y.
        // This way both sides have unique IDs.

        const receiverKey =
          senderType === "user" ? `seller_${toUserId}` : `user_${toUserId}`;
        const senderKey =
          senderType === "user" ? `user_${fromUserId}` : `seller_${fromUserId}`;

        // update unseen count dynamically
        // Tracks how many unseen messages the receiver has.
        const unseenKey = `${receiverKey}_${conversationId}`;
        const prevCount = unseenCounts.get(unseenKey) || 0;
        unseenCounts.set(unseenKey, prevCount + 1);

        // send new message to receiver
        //         If receiver is online, send them the new message.
        // Also send updated unseen count.
        // If offline → message will still be in Kafka for persistence
        const receiverSocket = connectedUsers.get(receiverKey);
        if (receiverSocket && receiverSocket.readyState === WebSocket.OPEN) {
          receiverSocket.send(messageEvent);

          // also notify unseen counts
          receiverSocket.send(
            JSON.stringify({
              type: "UNSEEN_COUNT_UPDATE",
              payload: { conversationId, count: prevCount + 1 },
            })
          );

          console.log(`Delivered message + unseen count to ${receiverKey}`);
        } else {
          console.log(`User ${receiverKey} is offline. Message queued.`);
        }

        // echo back to sender
        // Sends the message back to the sender so they see their own sent message immediately.
        const senderSocket = connectedUsers.get(senderKey);
        if (senderSocket && senderSocket.readyState === WebSocket.OPEN) {
          senderSocket.send(messageEvent);
          console.log(`Echoed message to sender ${senderKey}`);
        }

        // push to kafka consumer
        // Publishes the message to Kafka.kafka can push the message to db
        await producer.send({
          topic: "chat.new_message", //create this topic in you confluent kafka server
          messages: [
            { key: conversationId, value: JSON.stringify(messagePayload) },
          ],
        });

        console.log(`message queued to kafka: ${conversationId}`);
      } catch (error) {
        console.log("Error processing WebSocket message:", error);
      }
    });

    //     When socket closes:
    // Remove from connectedUsers.
    // Mark offline in Redis. and delete that user status from redis
    ws.on("close", async () => {
      if (registeredUserId) {
        connectedUsers.delete(registeredUserId); //mp.delete(key) connectedUsers is map
        console.log(`Disconnected user ${registeredUserId}`);
        const isSeller = registeredUserId.startsWith("seller_");
        const redisKey = isSeller
          ? `online:seller:${registeredUserId.replace("seller_", "")}`
          : `online:user:${registeredUserId}`;
        await redis.del(redisKey);
      }
    });

    // Logs errors per connection
    ws.on("error", (err) => {
      console.error("WebSocket error:", err);
    });
    console.log("Websocket server ready");
  });
}

// Date.prototype.toISOString() converts a Date object into a string in ISO 8601 format (UTC).
// const now = new Date();
// console.log(now.toISOString());
// 2025-09-11T12:45:30.123Z
// 2025-09-11 → date
// T → separator
// 12:45:30.123 → time (HH:mm:ss.sss)
// Z → Zulu time (UTC)

// new Date().toString();
// You get something system-specific (e.g., "Thu Sep 11 2025 18:15:30 GMT+0530 (India Standard Time)").

// new Date() :Thu Sep 11 2025 17:36:23 GMT+0530 (India Standard Time)
// Creates a Date object (not a string).
// It represents an absolute moment in time internally as a timestamp (ms since Jan 1, 1970 UTC).

// toLocaleDateString()
// Gives only the date part, formatted based on your system’s locale (or one you pass in).
// console.log(new Date().toLocaleDateString())
// 11/09/2025

// console.log(new Date().toLocaleString())
// 11/09/2025, 17:39:05

// console.log(new Date().toLocaleTimeString())
//  17:39:48
