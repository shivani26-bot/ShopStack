import redis from ".";

// Builds a Redis key like:
// unseen:user_123
// unseen:seller_456
// redis.incr(key) → increases the counter by 1.
// Returns the new count.
// 👉 Used when: a new message is received and the receiver hasn’t read it yet.
export const incrementUnseenCount = async (
  receiverType: "user" | "seller",
  conversationId: string
) => {
  const key = `unseen:${receiverType}_${conversationId}`;
  const count = await redis.incr(key);
  return count;
};

// Reads the unseen count from Redis for that receiver & conversation.
// redis.get(key) returns a string (e.g., "3"), so you convert it into a number with parseInt.
// If key doesn’t exist → return 0.
// 👉 Used when: you want to show a badge/notification count in the UI.
export const getUnseenCount = async (
  receiverType: "user" | "seller",
  conversationId: string
): Promise<number> => {
  const key = `unseen:${receiverType}_${conversationId}`;
  const count = await redis.get(key);
  return parseInt(count || "0");
};

// Deletes the unseen counter from Redis.
// Effectively resets unseen count back to 0.
// 👉 Used when: user opens the chat/conversation and reads the messages.
export const clearUnseenCount = async (
  receiverType: "user" | "seller",
  conversationId: string
) => {
  const key = `unseen:${receiverType}_${conversationId}`;
  await redis.del(key);
};

// You’re building a chat service where each conversation can have a number of unseen (unread) messages for a given receiver (user or seller).
// You’re storing that counter in Redis because:

// Redis is fast (in-memory)
// Good for counters and ephemeral data
// Doesn’t need complex DB queries just to count unseen messages
