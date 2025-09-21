import { kafka } from "@packages/utils/kafka";
import { clients } from "./main"; //holds all active WebSocket clients (admin dashboards).
import { WebSocket } from "ws";

// Creates a Kafka consumer with a specific consumer group ID.
// Group ID ensures messages in the "logs" topic are distributed among consumers in this group.
const consumer = kafka.consumer({ groupId: "log-events-group" });
// Temporary buffer for logs received from Kafka.
// Instead of sending logs immediately, you store them here.
const logQueue: string[] = [];

// websocket processing function for logs
// Runs periodically to send buffered logs.
// Steps:
// Skip if queue is empty.
// Copy all logs and clear queue.
// Send each log to each connected WebSocket client (client.send(log)).
// 👉 This batching helps prevent sending 1 WebSocket frame per log
const processLogs = () => {
  if (logQueue.length === 0) return;
  console.log(`processing ${logQueue.length} logs in batch`);
  const logs = [...logQueue];
  logQueue.length = 0;

  clients.forEach((client) => {
    logs.forEach((log) => {
      // If client.send(log) fails (client disconnected but not cleaned up), it may throw.
      if (client.readyState === WebSocket.OPEN) {
        client.send(log);
      }
      // client.send(log);
    });
  });
};

// Every 3 seconds, send all buffered logs to clients in a batch.
setInterval(processLogs, 3000);

// consume log messages from kafka
// consumer.connect() → connect to Kafka cluster.
// consumer.subscribe() → subscribe to "logs" topic.
// fromBeginning: false → only read new messages, not old ones.
// consumer.run() → continuously poll messages.
// For each Kafka message:
// Skip if no value.
// Convert to string.
// Push into logQueue.
export const consumeKafkaMessages = async () => {
  await consumer.connect();
  await consumer.subscribe({ topic: "logs", fromBeginning: false });

  await consumer.run({
    eachMessage: async ({ message }) => {
      if (!message.value) return;
      const log = message.value.toString();
      logQueue.push(log);
    },
  });
};

// start kafka consumer
// If it crashes, logs error to console.
consumeKafkaMessages().catch(console.error);
