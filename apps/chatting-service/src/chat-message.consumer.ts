import prisma from "@packages/libs/prisma";
import { incrementUnseenCount } from "@packages/libs/redis/message.redis";
import { kafka } from "@packages/utils/kafka";
import { Consumer, EachMessagePayload } from "kafkajs";
// this is kafka consumer file

// Defines what a chat message looks like when it arrives from Kafka before inserting into DB.
interface BufferedMessage {
  conversationId: string;
  senderId: string;
  senderType: string;
  content: string;
  createdAt: string;
}

const TOPIC = "chat.new_message"; //The Kafka topic this consumer listens to.
const GROUP_ID = "chat-message-db-writer"; //Group id for the consumer (important so Kafka knows how to distribute messages among multiple consumers).
const BATCH_INTERVAL_MS = 3000; //after 3 second insert data to db,Collect messages in memory for 3s, then insert in bulk into DB. (batch insert = fewer queries = faster).

let buffer: BufferedMessage[] = []; //Temporary in-memory store of incoming messages.
let flushTimer: NodeJS.Timeout | null = null; //A timer that controls when to flush (insert) messages to DB.

// initialize kafka consumer
export async function startConsumer() {
  // Create a Kafka consumer bound to this group
  const consumer: Consumer = kafka.consumer({ groupId: GROUP_ID });
  await consumer.connect(); //Connects to Kafka brokers.
  await consumer.subscribe({ topic: TOPIC, fromBeginning: false }); //Subscribes to the chat.new_message topic.// fromBeginning: false → only read new messages, not old ones
  console.log(`kafka consumer connected and subscribed to "${TOPIC}.`);

  //   START CONSUMING
  //   For each Kafka message:
  // Ignore if message.value is empty.
  // Parse JSON string into BufferedMessage.
  // Push it into the buffer.
  // If this was the first message and no timer is running → start a timer to flush in 3s.
  // 📌 So: it collects messages into a buffer instead of inserting one by one.
  await consumer.run({
    eachMessage: async ({ message }: EachMessagePayload) => {
      if (!message.value) return;
      try {
        const parsed: BufferedMessage = JSON.parse(message.value.toString());
        buffer.push(parsed);
        // if this is the first message in an empty array then start the timer
        if (buffer.length === 1 && !flushTimer) {
          flushTimer = setTimeout(flushBufferToDb, BATCH_INTERVAL_MS);
        }
      } catch (error) {
        console.log("Failed to parse kafka message:", error);
      }
    },
  });
}

// flush the buffer to database and reset the timer
// Copy all buffered messages into toInsert and empty the buffer.
// Stop the timer (reset it).
// If nothing to insert → return.
async function flushBufferToDb() {
  //   Removes the first N elements from buffer array
  // Returns those N elements as a new array
  // The original array is shortened
  const toInsert = buffer.splice(0, buffer.length);
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (toInsert.length === 0) return;
  try {
    //     Convert each Kafka message into DB format (prismaPayload).
    // Use prisma.message.createMany for a bulk insert (faster than one-by-one inserts).
    const prismaPayload = toInsert.map((msg) => ({
      conversationId: msg.conversationId,
      senderId: msg.senderId,
      senderType: msg.senderType,
      content: msg.content,
      createdAt: new Date(msg.createdAt),
    }));

    // do a batch insert
    await prisma.message.createMany({
      data: prismaPayload,
    });

    // redis  unseen counter (only if db insert successful)
    //     For each inserted message:
    // Determine receiver type (if sender is user → receiver is seller).
    // Increment unseen message counter for that receivertype in Redis.
    // Log how many were flushed.
    for (const msg of prismaPayload) {
      const receiverType = msg.senderType === "user" ? "seller" : "user";
      await incrementUnseenCount(receiverType, msg.conversationId);
    }

    console.log(`Flushed ${prismaPayload.length} messages to db and redis.`);
  } catch (err) {
    //     If DB insert fails:
    // Put messages back into buffer.
    // Restart flush timer to retry later.
    // So you never lose messages if DB is temporarily down.
    console.error("Error inserting messages to db:", err);
    buffer.unshift(...toInsert);
    if (!flushTimer) {
      flushTimer = setTimeout(flushBufferToDb, BATCH_INTERVAL_MS);
    }
  }
}

// ### 🔹 Kafka GroupId rules

// * A **`groupId`** is what Kafka uses to manage **consumer groups**.
// * Consumers **with the same `groupId`**:

//   * Share the work (messages are load-balanced across them).
//   * Each partition of the topic is assigned to only one consumer in the group.
// * Consumers **with different `groupId`s**:

//   * Each group gets **its own full copy** of the messages.
//   * Useful if you want multiple services to independently process the same topic.

// ---

// ### 🔹 Your case

// * You already have a `getConsumer()` helper that gives back a Kafka consumer tied to `groupId: "nodejs-group-1"`.
// * Now, you want to use Kafka for **chatting service** too.

// 👉 If the chatting service should have **its own independent consumption** of messages, then:

// * You **must** use a **different `groupId`** (e.g. `"chat-message-db-writer"` like in your previous code).
// * Otherwise, if you reuse `"nodejs-group-1"`, the chat service and your other service will **compete for messages** → some messages go to one, some to the other → chat consumer will miss data.

// ---

// ### 🔹 About `getConsumer()`

// * `getConsumer()` is just a convenience wrapper to **return a singleton consumer** for your app.
// * In your chat service, you don’t need to reuse the same `getConsumer()` if the `groupId` differs.
// * Instead, you can either:

//   1. Write a **new `getChatConsumer()`** with a different `groupId`.
//   2. Or just directly call `kafka.consumer({ groupId: "chat-message-db-writer" })` like you did in the chat consumer code.

// ---

// ### ✅ Recommendation

// Keep them **separate**:

// * **Service A** → `getConsumer()` with `"nodejs-group-1"`.
// * **Chat Service** → its own consumer with `"chat-message-db-writer"`.

// This way:

// * They both consume the same topic without interfering.
// * Chat service won’t miss messages.
// * You can scale each service independently.

// ---

// 👉 So to answer your question:
// No, it’s **not mandatory** to call your existing `getConsumer()` in the chatting service.
// Since the **`groupId` differs**, it’s safer to instantiate a new consumer (like in your current chat consumer code).

// What is NodeJS.Timeout?
// In Node.js, when you use setTimeout(), it doesn’t return a simple number (like in the browser).
// Instead, it returns a special Timeout object provided by Node.js

// NodeJS.Timeout is the type of the value returned by setTimeout() in Node.js.
// This object can be passed to clearTimeout() to cancel the timer.

// What is a Buffer?
// A Buffer is a special object in Node.js for handling raw binary data (sequences of bytes).
// Unlike normal JS strings (which are UTF-16), Buffers let you deal directly with bytes.
// They’re often used for files, streams, network packets, images, or any binary protocol.
// Think of it like an array of integers (0–255), but optimized for binary operations
// Create buffer from string
// const buf1 = Buffer.from("Hello", "utf-8");
// console.log(buf1); // <Buffer 48 65 6c 6c 6f>
// console.log(buf1.toString()); // "Hello"

// // Create buffer of fixed size (filled with zeros)
// const buf2 = Buffer.alloc(5);
// console.log(buf2); // <Buffer 00 00 00 00 00>

// // Unsafe (may contain old memory, faster)
// const buf3 = Buffer.allocUnsafe(5);
// console.log(buf3); // random bytes

// Why Buffers are needed?
// Because JavaScript by default has:
// Strings → human-readable text
// Typed Arrays → introduced later, but Node.js originally needed binary handling

// So Node.js introduced Buffer to efficiently handle:
// File I/O
// TCP/UDP sockets
// Streaming video/audio
// Encryption/Hashing

// const buf = Buffer.from("ABC");

// // Length in bytes
// console.log(buf.length); // 3

// // Access individual bytes
// console.log(buf[0]); // 65 ('A')
// console.log(buf[1]); // 66 ('B')

// // Modify buffer
// buf[0] = 97; // change 'A' → 'a'
// console.log(buf.toString()); // "aBC"

// // Slice buffer
// const slice = buf.slice(1, 3);
// console.log(slice.toString()); // "BC"

// const fs = require("fs");

// fs.readFile("example.txt", (err, data) => {
//   if (err) throw err;
//   console.log(data);             // Buffer <...>
//   console.log(data.toString());  // Convert Buffer → string
// });

// Array.splice(start, deleteCount)
// start → index to begin removing elements
// deleteCount → how many elements to remove
// Returns → an array of removed elements
// Mutates the original array

// Array.unshift() in JavaScript.
// What it does
// Adds one or more elements to the beginning of an array.
// Shifts existing elements to higher indexes.
// Returns the new length of the array.

// let arr = [2, 3, 4];

// arr.unshift(1);
// console.log(arr);   // [1, 2, 3, 4]

// arr.unshift(-2, -1, 0);
// console.log(arr);   // [-2, -1, 0, 1, 2, 3, 4]
