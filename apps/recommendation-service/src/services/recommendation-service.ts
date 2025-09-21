import * as tf from "@tensorflow/tfjs"; //// loads TensorFlow.js (pure JS) API
import { getUserActivity } from "./fetch-user-activity";
import { preProcessData } from "../utils/preProcessData";

// This function builds a small collaborative-filtering model: it learns low-dimensional embeddings for users and products, then learns to predict an affinity score for a (user, product) pair by taking a dot product of their embeddings and passing it through a sigmoid to produce a probability-like score. Training data are interaction events (view/cart/purchase) which you convert to numeric labels (weights). The model is trained to predict those weights.
// We want to suggest products to a user based on what they did before:
// If they viewed → weak interest
// If they added to cart → stronger interest
// If they purchased → strongest interest
// So we’re teaching the computer: “Look at a user and a product → guess how much the user likes it.”

// we need to preprocess our data before sending for ml purposes
// tf gives you model, layers, tensor ops. EMBEDDING_DIM controls capacity: larger → can represent richer relationships, but more params and risk of overfitting
// We’ll give each user and each product a “hidden ID card” (a vector of 50 numbers).
// The computer will learn what to put on those ID cards.
const EMBEDDING_DIM = 50; // dimensionality of user/product embedding vectors

// This just says what kind of data we expect:
// who (userId),
// what (productId),
// and what action they did (view, cart, etc.).
interface UserAction {
  userId: string;
  productId: string;
  actionType: "product_view" | "add_to_cart" | "add_to_wishlist" | "purchase";
}

interface Interaction {
  userId: string;
  productId: string;
  actionType: UserAction["actionType"];
}

interface RecommendedProduct {
  productId: string;
  score: number;
}

async function fetchUserActivity(userId: string): Promise<UserAction[]> {
  //   This just grabs what the user did.
  // If nothing is found, return empty list.
  const userActions = await getUserActivity(userId);
  return Array.isArray(userActions)
    ? (userActions as unknown as UserAction[])
    : [];
}

export const recommendProducts = async (
  userId: string,
  allProducts: any
): Promise<string[]> => {
  const userActions: UserAction[] = await fetchUserActivity(userId);
  if (userActions.length === 0) return [];
  const processedData = preProcessData(userActions, allProducts);
  if (!processedData || !processedData.interactions || !processedData.products)
    return [];

  const { interactions } = processedData as {
    interactions: Interaction[];
  };
  //   create mapping of user and product ids to numeric indices for tensor conversion
  //   in ml we cannot compare one product with another product
  //   Computers don’t understand names like "user123" or "productABC".
  // So we make maps:
  // "user123" → 0
  // "user456" → 1
  // "productABC" → 0
  // "productXYZ" → 1
  // This way we can feed numbers to the model.
  const userMap: Record<string, number> = {};
  const productMap: Record<string, number> = {};
  let userCount = 0;
  let productCount = 0;

  interactions.forEach(({ userId, productId }) => {
    if (!(userId in userMap)) userMap[userId] = userCount++;
    if (!(productId in productMap)) productMap[productId] = productCount++;
  });

  //   define model input layers
  // These are like empty boxes where we will drop user numbers and product numbers.
  const userInput = tf.input({
    shape: [1],
    dtype: "int32",
  }) as tf.SymbolicTensor;

  const productInput = tf.input({
    shape: [1],
    dtype: "int32",
  }) as tf.SymbolicTensor;

  //   create embedding layer (like lookup tables) to learn the relationships
  //   WE ARE using ml technique called collaborative filtering model here

  const userEmbedding = tf.layers
    .embedding({
      inputDim: userCount,
      outputDim: EMBEDDING_DIM,
    })
    .apply(userInput) as tf.SymbolicTensor;

  const productEmbedding = tf.layers
    .embedding({
      inputDim: productCount,
      outputDim: EMBEDDING_DIM,
    })
    .apply(productInput) as tf.SymbolicTensor;

  //   flatten the 2d embeddings into 1d feature vectors
  const userVector = tf.layers
    .flatten()
    .apply(userEmbedding) as tf.SymbolicTensor;
  const productVector = tf.layers
    .flatten()
    .apply(productEmbedding) as tf.SymbolicTensor;

  // dot product combines user and product vectors (user-product affinity )
  const merged = tf.layers
    .dot({ axes: 1 })
    .apply([userVector, productVector]) as tf.SymbolicTensor;

  // final layer : outputs probability of interactions
  const output = tf.layers
    .dense({ units: 1, activation: "sigmoid" })
    .apply(merged) as tf.SymbolicTensor;

  // compile the recommendation model
  const model = tf.model({
    inputs: [userInput, productInput],
    outputs: output,
  });

  model.compile({
    optimizer: tf.train.adam(),
    loss: "binaryCrossentropy",
    metrics: ["accuracy"],
  });

  //   convert user and product interactions into tensors for training
  const userTensor = tf.tensor1d(
    interactions.map((d) => userMap[d.userId] ?? 0),
    "int32"
  );

  const productTensor = tf.tensor1d(
    interactions.map((d) => productMap[d.productId] ?? 0),
    "int32"
  );

  //   assign  different scores based on action type
  const weightLabels = tf.tensor2d(
    interactions.map((d) => {
      switch (d.actionType) {
        case "purchase":
          return [1.0];
        case "add_to_cart":
          return [0.7];
        case "add_to_wishlist":
          return [0.5];
        case "product_view":
          return [0.1];

        default:
          return [0];
      }
    }),
    [interactions.length, 1]
  );

  //   tain the model, which user, which product and how much they like it
  await model.fit([userTensor, productTensor], weightLabels, {
    epochs: 5, //train five times of our data
    batchSize: 32, //process 32 samples at a time for efficiency
  });

  const productTensorall = tf.tensor1d(Object.values(productMap), "int32");

  const predictions = model.predict([
    tf.tensor1d([userMap[userId] ?? 0], "int32"),
    productTensorall,
  ]) as tf.Tensor;

  const scores = (await predictions.array()) as number[];
  //   we need to sort and select the top 10 recommended products based on score

  const recommendedProducts: RecommendedProduct[] = Object.keys(productMap)
    .map((productId, index) => ({ productId, score: scores[index] ?? 0 }))
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  return recommendedProducts.map((p) => p.productId);
};

// How training works — conceptually (summary)
// You provide many training examples of the form (userIndex, productIndex) -> label.
// Model: score = sigmoid( dense( dot( userEmbedding[userIndex], productEmbedding[productIndex] ) ) ).
// Loss is binary crossentropy between score and label.
// Backprop updates embedding rows for the specific user and product indices so that their dot product gets closer to the label (higher for purchases, lower for views).
// Over time embeddings cluster users/products by similarity so that predictions for unseen pairs reflect learned patterns.
