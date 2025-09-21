"use server";
// This tells Next.js 13+ (App Router) that this file contains server-side code, not client-side.
// Only server components or server actions can access Node.js APIs like Kafka.
// Kafka producer cannot run in the browser, so this must be server-side.
import { getProducer, kafka } from "packages/utils/kafka";

// send kafka event from user-ui/src/store/index.tsx
console.log("insidetrack");
export async function sendKafkaEvent(eventData: {
  userId?: string;
  productId?: string;
  shopId?: string;
  action: string;
  device?: string;
  country?: string;
  city?: string;
}) {
  console.log("inside track user");
  try {
    const producer = await getProducer();
    console.log(eventData);
    console.log("myproducer", producer);
    await producer.send({
      topic: "user-events",
      messages: [{ value: JSON.stringify(eventData) }],
    });
  } catch (error) {
    console.log(error);
  }
  // finally {

  //   await producer.disconnect(); //disconnects every time
  // }
}

// Kafka producers are expensive to create and connect. Each connection to the broker takes time.
// If you disconnect after every send, then the next event has to reconnect, which adds latency and overhead.
// By using a singleton producer (getProducer()), you create the connection once and reuse it throughout your app.
// That’s why your finally block is commented out — you don’t want to disconnect after every single message.
// Every call to sendKafkaEvent() would create a producer → connect → send → disconnect.

// Problems:
// // Performance hit: connection setup for each message.
// Race conditions: multiple events sent in rapid succession could fail if the producer disconnects too early.
// Resource usage: Kafka brokers limit the number of connections.

// When should you disconnect?
// On app shutdown: For example, when Node.js receives SIGINT or SIGTERM.
// Graceful shutdown example:

// you’re using Next.js with the src/app/(routes) App Router, you can directly use server actions. That means your sendKafkaEvent can stay where it is (user-ui/src/actions/track-user.ts) with "use server"; at the top, and it will run only on the server.

// But ⚠️ the important bit: you cannot call it like a normal function inside Zustand or React components without making sure it runs server-side. If you do, Next will try to bundle it into the client, and you’ll never see console.log("inside track user").
