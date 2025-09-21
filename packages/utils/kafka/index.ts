import { Consumer, Kafka, Producer } from "kafkajs";

// go to confluent.io, create topics , create api keys , api key and secret as sasl username and password, go to cluster setting to find bootstrap server as brokers
// to find the client id go to client create a nodejs client a file will be downloaded with all the details including client id, while creating client you can choose existing or new api key, one topics to  which you want to receive messages
// console.log(
//   "kafkakeys",
//   process.env.SASL_USERNAME,
//   process.env.SASL_PASSWORD,
//   process.env.BOOTSTRAP_SERVERS
// );

// Kafka client creation
export const kafka = new Kafka({
  clientId: process.env.CLIENT_ID!, //A name for your client or the backend server you are working on for ex: nodejs is client here, used for logging and monitoring., get it from confluent website under client section for node.js project,similarly we can choose for other environments as well like java etc
  brokers: [process.env.BOOTSTRAP_SERVERS!], //The Kafka brokers your client connects to
  ssl: { rejectUnauthorized: true },
  sasl: {
    mechanism: "plain", // e.g. "plain"
    username: process.env.SASL_USERNAME!,
    password: process.env.SASL_PASSWORD!,
  },
  connectionTimeout: 55000, //How long to wait for connections or requests before failing.
  requestTimeout: 55000,
});

//ssl: secure socket layer
// SSL is a protocol that encrypts data between client and server.
// It ensures:
// Data sent between your app and Kafka brokers is encrypted.
// The broker you’re connecting to is trusted.
// rejectUnauthorized: true means the client will reject connections to brokers with invalid certificates.
//  SSL keeps your data secure over the network.

//SASL (Simple Authentication and Security Layer)
// SASL is a protocol for authenticating clients to Kafka.
// Kafka supports multiple mechanisms like:
// "plain" → simple username/password authentication (often over SSL)."scram-sha-256" or "scram-sha-512" → hashed password authentication."gssapi" → Kerberos-based authentication.
// mechanism: "plain" → use plain text username/password.
// Important: When using "plain", always pair with SSL, otherwise credentials are sent in plaintext over the network.

// SSL → encrypts the connection so no one can sniff traffic.
// SASL → authenticates the client with the broker.

// singleton pattern for Kafka producers and consumers in Node.js
// variables store the single instance of the Kafka producer and consumer.

// type is of Producer or Consumer
// Initially null because no connection exists yet.
let producerInstance: Producer | null = null;
let consumerInstance: Consumer | null = null;

/**
 * Singleton producer
 * Why singleton?
You generally only want one producer/consumer per app, because Kafka producers/consumers are heavyweight connections.
Reusing the same instance avoids unnecessary connections.
 */
export async function getProducer(): Promise<Producer> {
  // if producerInstance doesn’t exist, it:
  // Creates a new Kafka producer (kafka.producer()).
  // Connects it to the Kafka cluster (await producerInstance.connect()).
  // Returns the single producer instance.
  if (!producerInstance) {
    producerInstance = kafka.producer();
    await producerInstance.connect();
  }
  return producerInstance;
}

/**
 * Singleton consumer
 * Kafka consumers belong to a consumer group, identified by groupId.
 * Purpose: Load balancing and fault tolerance.
 * | Rule                                                          | Explanation                                                                          |
| ------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Each partition is consumed by **only one consumer per group** | Prevents duplicate processing within the same group.                                 |
| Multiple consumers in the **same group** share partitions     | Each consumer gets a subset of partitions to consume.                                |
| Different groups can consume the **same topic independently** | Each group gets all messages, useful for multiple services processing the same data. |
Topic orders has 4 partitions: 0, 1, 2, 3.
Consumer group Group A has 2 consumers: Consumer 1 and Consumer 2.
| Partition | Assigned Consumer |
| --------- | ----------------- |
| 0         | Consumer 1        |
| 1         | Consumer 2        |
| 2         | Consumer 1        |
| 3         | Consumer 2        |
o:

Consumer 1 handles partitions 0 and 2
Consumer 2 handles partitions 1 and 3
 */

// all consumers created through getConsumer() will belong to the same group,
export async function getConsumer(): Promise<Consumer> {
  if (!consumerInstance) {
    consumerInstance = kafka.consumer({
      groupId: "nodejs-group-1", // correct key is `groupId`
    });
    await consumerInstance.connect();
  }
  return consumerInstance;
}

// how to get the brokers:
// go to confluent.io, sigup using google account,
// got to home, go to environments, click on add cloud environment
// create cluster inside environment, choose free plan, give your account details and launch the cluster
// Go to connectors
// Go to api keys -> create key->my account-> you will get api key and secret key
// Go to topics-> create new topic (give topic name)
// give name user-events to the topic , as we are tracking user events here, partitions:6

// Go to cluster settings copy bootstrap server url and paste in brokers here

// producers send messages to kafka consumers receive the messages from kafka
// topic is category or channel of messages, it's inside kafka distributed system
// when we add item to wishlist or deleting a product , we can create a topic here,
// each topic is split into partition to handle more data and speed. partition allow parallel processing across multiple machine
// broker is kafka server that store data and handle all request, its like a main server
// multiple broker means main kafka cluster
// offset: kafka keeps track of each consumer  each in the topic using an offset
// no need to read the same message twice
