// we don't need any traditional apis for kafka service , it's not on rest api

import { getConsumer } from "@packages/utils/kafka";
import {
  updateShopAnalytics,
  updateUserAnalytics,
} from "./services/analytics.service";

// temporary event storage where we are storing the event
// suppose at the same time 10000 users visiting our product details page
// our kafka server will receive 10000 request. but we don't want to insert that
// at the same time in our database. we will wait for some time let say 3 seconds
// in that 3 seconds we will add all the request inside this event queue
// suppose in 3 seconds 20,000 or 10000 requests are coming we will store all of them in event queue
// after 3 seconds we will add all that request , insert to database  with the same time and same request
// this is called batch processing
// / Event queue batching

// eventQueue stores all Kafka messages temporarily.
// processQueue() is a function that processes all queued events in a batch.
// Steps inside processQueue():
// Copy the current queue to avoid race conditions.
// Clear the queue before processing.
// Iterate through events:
// Special handling for "shop_visit".
// For other valid actions (add_to_cart, etc.), call updateUserAnalytics().
// Try/catch ensures that one failed event does not stop the rest.

// Every 3 seconds, processQueue() runs automatically.
// This batches Kafka events, reducing DB calls instead of processing each event immediately.

// why batch processing ?
// Reduce the number of database calls
// Every event could trigger a DB write.
// If you process every event immediately, you might end up with hundreds or thousands of DB operations per second, which is very inefficient.
// Batching example:
// Instead of 100 events → 100 DB calls
// Batch 100 events → 1 bulk DB call
// This improves performance and reduces DB load.

// Kafka messages → [eventQueue] → processQueue (every 3s) → Database
// Batching allows you to:Process multiple events in parallel using Promise.all if needed.
// Some analytics can be aggregated at the batch level:
// Count total add_to_cart events in the batch.
// Calculate total shop_visit events in 3 seconds.
// If one event fails, it doesn’t block others.
// You can log failed events and retry them later in the next batch.
// Committing offsets after batch ensures messages are not lost.

// Assumptions
// Topic: user-events
// Partitions: 2 (Partition 0 and Partition 1)
// Consumer: singleton, batch processing every 3 seconds
// Event types: add_to_cart, shop_visit, etc.

// Step 1: First 3 seconds – 3 events sent
// Events produced:
// | Event | Action        |
// | ----- | ------------- |
// | E1    | add\_to\_cart |
// | E2    | shop\_visit   |
// | E3    | product-view  |

// Kafka partitions
// Assume partition assignment:
// | Partition | Event |
// | --------- | ----- |
// | 0         | E1    |
// | 1         | E2    |
// | 0         | E3    |

// Offsets in Kafka partitions:
// | Partition | Offset | Event |
// | --------- | ------ | ----- |
// | 0         | 0      | E1    |
// | 0         | 1      | E3    |
// | 1         | 0      | E2    |

// Consumer receives messages
// eachMessage callback runs for each record.
// Each message is pushed to eventQueue
// eventQueue = [E1, E2, E3]

// Step 2: After 3 seconds – processQueue runs
// processQueue() copies queue and clears it:
// events = [E1, E2, E3]
// eventQueue = []

// Each event is processed:
// Update DB analytics for each action
// Handle shop_visit specifically if needed
// Kafka offsets are committed after each message (or you can commit after batch).
// At the end of step 2:
// eventQueue is empty
// Kafka partitions now have committed offsets:
// | Partition | Last committed offset |
// | --------- | --------------------- |
// | 0         | 1 (E3)                |
// | 1         | 0 (E2)                |

// Step 3: Next 5 events sent (during next 3 seconds)
// Events produced:
// | Event | Action                 |
// | ----- | ---------------------- |
// | E4    | add\_to\_wishlist      |
// | E5    | remove\_from\_wishlist |
// | E6    | product-view           |
// | E7    | shop\_visit            |
// | E8    | add\_to\_cart          |

// Kafka partitions (example assignment)
// | Partition | Event |
// | --------- | ----- |
// | 0         | E4    |
// | 1         | E5    |
// | 0         | E6    |
// | 1         | E7    |
// | 0         | E8    |
// Offsets in Kafka partitions:
// | Partition | Offset | Event |
// | --------- | ------ | ----- |
// | 0         | 2      | E4    |
// | 0         | 3      | E6    |
// | 0         | 4      | E8    |
// | 1         | 1      | E5    |
// | 1         | 2      | E7    |
// Consumer receives messages
// Each message goes to eventQueue:
// eventQueue = [E4, E5, E6, E7, E8]
// Step 4: After next 3 seconds – processQueue runs again

// Copy queue and clear it:
// events = [E4, E5, E6, E7, E8]
// eventQueue = []
// Process each event → update DB analytics
// Commit offsets in Kafka:

// | Partition | Last committed offset |
// | --------- | --------------------- |
// | 0         | 4 (E8)                |
// | 1         | 2 (E7)                |

// at each step:
// | Stage                     | eventQueue            | Kafka partition offsets        |
// | ------------------------- | --------------------- | ------------------------------ |
// | First 3 sec (events sent) | \[E1, E2, E3]         | 0:1 (E3), 1:0 (E2)             |
// | After first batch         | \[]                   | 0:1 (E3), 1:0 (E2) (committed) |
// | Next 3 sec (events sent)  | \[E4, E5, E6, E7, E8] | 0:4 (E8), 1:2 (E7)             |
// | After second batch        | \[]                   | 0:4 (E8), 1:2 (E7) (committed) |
// eventQueue: temporary in-memory queue in your app. Cleared after each batch.
// Kafka partitions: store all events per partition. Offset is per partition.
// Offsets: tracked to know where the consumer left off.
// Batching: reduces DB calls → queue is processed every 3 seconds.

// why we commit offsets
// Committing an offset
// Committing an offset means telling Kafka:
// “I have successfully processed all messages up to this offset in this partition. You can mark it as read.”
// Kafka stores this info per consumer group per partition.
// When a consumer restarts, it will resume reading from the last committed offset.

// Example

// Partition 0 has records:
// | Offset | Event |
// | ------ | ----- |
// | 0      | E1    |
// | 1      | E2    |
// | 2      | E3    |
// Consumer reads E1 → E2 → E3
// After processing E2, it can commit offset 2
// If the consumer crashes and restarts:
// Kafka will start sending messages from offset 2 + 1 = 3

// Why commit offsets?
// Avoid reprocessing messages
// Once committed, Kafka knows this message is processed.
// Recover after failure
// If the consumer crashes, it resumes from the last committed offset, not the beginning of the topic.
// Flexible batching
// You can commit after each message or after a batch (like your 3-second queue).
const eventQueue: any[] = [];
const processQueue = async () => {
  if (eventQueue.length === 0) return;
  const events = [...eventQueue];
  //clear the queue before processing
  eventQueue.length = 0;

  for (const event of events) {
    if (event.action === "shop_visit") {
      //user visited a shop
      //update the shop analytics
      try {
        await updateShopAnalytics(event);
      } catch (error) {
        console.log("Error processing shop analytics:", error);
      }
    }
    const validActions = [
      "add_to_wishlist",
      "add_to_cart",
      "product_view",
      "remove_from_wishlist",
      "remove_from_cart",
    ];
    if (!event.action || !validActions.includes(event.action)) continue;
    try {
      await updateUserAnalytics(event); //if event.action is in validActions then update user analytics
    } catch (error) {
      console.log("Error processing event:", error);
    }
  }
};

// after every 3 seconds we want to run the action
setInterval(processQueue, 3000); //3000ms=3s

// kafka consumer for user events
// this consumer will receives all request from kafka producer
export async function consumeKafkaMessages() {
  try {
    const consumer = await getConsumer(); //returns kafka consumer
    // console.log("myconsumer", consumer);
    // connect to the kafka broker
    // await consumer.subscribe({ topics: ["user-events"] }); //topic name should be same as in kafka cluster on confluentic.io topic:"user-events"
    //listen to kafka topic
    await consumer.subscribe({
      topic: "user-events",
      fromBeginning: false, // same as "earliest"only consume new messages arriving after subscription, not old messages.true would mean read all messages from the start.
    });
    await consumer.run({
      //starts a loop that listens for messages from Kafk
      //for each message we store it inside the queue
      eachMessage: async ({ topic, partition, message }) => {
        //destructured,topic of the message,the partition where the message resides,the actual Kafka message
        if (!message.value) return;
        // console.log("conmsg", message);
        //         Kafka messages are stored as Buffer, so we convert to string first.
        // JSON.parse() converts it to an object.
        // eventQueue.push(event) → adds the message to the in-memory queue for batch processing.
        const event = JSON.parse(message.value.toString());
        console.log("Consumed event:", event);
        eventQueue.push(event);
        // ✅ commit after processing
        //         Tells Kafka that this message is successfully processed.
        // message.offset → index of the message in the partition.
        // Number(message.offset) + 1 → the next offset Kafka should send if the consumer restarts.
        // Committing after pushing to queue ensures no message is lost.
        await consumer.commitOffsets([
          { topic, partition, offset: (Number(message.offset) + 1).toString() },
        ]);
      },
    });

    // gracefully shutdown
    //     Listens for process termination signals (CTRL+C or docker stop).
    // Disconnects the consumer from Kafka cleanly.
    // Prevents dangling connections or uncommitted offsets.
    // Calls process.exit(0) to end the Node.js process.
    const shutdown = async () => {
      console.log("Disconnecting consumer...");
      await consumer.disconnect();
      process.exit(0);
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    console.error("❌ Error starting consumer:", error);
  }
}
// console.log("Before calling consumer...");

//first this runs
consumeKafkaMessages().catch(console.error);
// console.log("After calling consumer...");
// it automatically takes the default port 9092 where the kafka servers run
