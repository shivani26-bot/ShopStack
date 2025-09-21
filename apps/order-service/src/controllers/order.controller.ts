import crypto from "crypto";
import Stripe from "stripe";
import { NextFunction, Request, Response } from "express";
import { NotFoundError, ValidationError } from "@packages/error-handler";
import redis from "@packages/libs/redis";
import prisma from "@packages/libs/prisma";
import { Prisma } from "@prisma/client";
import { sendEmail } from "../utils/send-email";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});
// error: Cannot create a destination charge for connected accounts in GB because funds would be settled on the platform and the connected account is outside the platform's region. You may use the on_behalf_of parameter to have the charge settle in the connected account's country.
// Why you see this error
// You’re trying to create a destination charge for a connected account that is based in the UK (GB).
// But your platform account is in a different region (likely India or US).
// With destination charges, the money first settles in the platform’s account, then you transfer it to the connected account.
// Stripe does not allow settlement across regions — i.e., funds can’t settle in your platform’s country if the connected account is in another country.
// Use on_behalf_of instead of destination charges
// If your use case is that the connected account is the seller, and you just want to take an application fee:
// This way:
// Settlement happens in the connected account’s country (GB).
// Your platform still gets fees via application_fee_amount.

// PaymentIntent is an object that represents the lifecycle of a payment.
// It answers: Who is paying? How much are they paying? What currency? Who gets the money? Do we (platform) take a cut?
// Every time a customer tries to pay, Stripe requires you to create a PaymentIntent.
// It tracks the entire payment flow:
// Requires Payment Method (card not yet given)
// Processing (Stripe is handling the charge)
// Succeeded (money captured)
// Failed (card declined, insufficient funds, etc.)
// So, instead of charging directly, Stripe creates a PaymentIntent first, then confirms it once the card details are provided.

// Customer wants to buy headphones ($69.99):
// Backend: create a PaymentIntent for $69.99.
// Frontend: Stripe.js shows a secure card form.
// Customer enters card details → Stripe validates → PaymentIntent goes requires_confirmation.
// Stripe confirms → PaymentIntent goes succeeded.
// Money is split:
// $62.99 → Seller’s Stripe account
// $7 → Your platform fee (10%).
// create payment
// here seller account is in gb, and my stripe account is in us
export const createPaymentIntent = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  const { amount, sellerStripeAccountId, sessionId } = req.body;
  const customerAmount = Math.round(amount * 100); //Stripe needs the amount in cents, not dollars, $50 → 5000 cents.
  const platformFee = Math.floor(customerAmount * 0.1); //platform takes a commission (say 10%), you specify it here. customer pays $100 → seller gets $90, you (platform) keep $10.
  try {
    //     on_behalf_of & transfer_data.destination
    // These are Stripe Connect features:
    // on_behalf_of: indicates the seller is the actual merchant.
    // transfer_data.destination: tells Stripe where to deposit the funds (seller’s Stripe account).
    // Without this, all money would first land in your platform’s account.
    // With this, Stripe automatically splits money at checkout.
    const paymentIntent = await stripe.paymentIntents.create({
      amount: customerAmount, //total money customer pays (in cents)
      currency: "usd", //currency
      payment_method_types: ["card"], // only accept card payments
      application_fee_amount: platformFee, // Stripe Connect: your commission (platform cut)
      on_behalf_of: sellerStripeAccountId, // << tells Stripe to settle in seller’s account
      transfer_data: {
        destination: sellerStripeAccountId, //seller gets fund
      },
      metadata: {
        //Arbitrary data you store for reference.,sessionId, userId, orderId. Later, if Stripe sends you a webhook, you can link the payment back to your app’s order.
        sessionId,
        userId: req.user.id, // // store extra info for your app (very useful!)
      },
    });
    //     clientSecret
    // After creating the PaymentIntent, Stripe gives you a client_secret.
    // You send this client_secret back to frontend.
    // The frontend uses it with Stripe.js to confirm the card payment.
    res.send({ clientSecret: paymentIntent.client_secret });
  } catch (error) {
    next(error);
  }
};

//     Why This  is Used?
// Temporary checkout state: Avoids storing incomplete orders in DB.
// Concurrency-safe: If user tries multiple checkouts, only one valid session exists.
// Performance: Redis is fast and automatically handles expiry.
// Scalable: Can support multiple sellers (Stripe Connect).
//create payment session for security, custom logic not stripe logic
// creating a temporary payment session (stored in Redis) when a customer tries to checkout.
export const createPaymentSession = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { cart, selectedAddressId, coupon } = req.body; //frontend sends items user wants to buy, chosen shipping address and any discount applied
    const userId = req.user.id; //identifies the logged-in customer (from auth middleware).
    // Array.isArray() is a built-in JavaScript method used to check whether a given value is an array. returns true or false
    if (!cart || !Array.isArray(cart) || cart.length === 0) {
      return next(new ValidationError("Cart is empty or invalid"));
    }
    //getting the cart from frontend
    //     Suppose with an iPhone 14 Pro Max you are creating an order. You just created a payment session, but then you realize you don’t have money. You don’t want to continue the order, so you just leave it.
    // Within the next five minutes, you select another product — for example, a Samsung Galaxy S23. This time, you really want to purchase it.
    // Inside our application, since you already tried to purchase the iPhone a couple of minutes ago, you already have a valid session stored in Redis. We check your valid session from Redis, and then we check the cart items.
    // Previously, you had added the iPhone. This time, you are adding the Samsung Galaxy. We compare the product IDs. Since the items are not the same, we invalidate the previous session, delete it, and then create a new one for the Samsung Galaxy.
    // However, if you again select the iPhone 14 Pro Max this time, we will not delete the previous session. We will simply keep the existing one and not create a new session.
    // This is because the session is still valid, and the cart item is the same. There is no need to create a duplicate session when the product is the same. But if the product is different, we always create a new session.

    //  Normalize cart data to compare later.
    // Extract only id, quantity, price, shopId, selectedOptions.
    // Sort items by id so order doesn’t affect comparison.
    // Convert to JSON string → allows easy comparison with previous cart in Redis.
    const normalizedCart = JSON.stringify(
      //converts the sorted array into a string.
      cart
        .map((item: any) => ({
          //map(...) → creates a new array of cart items, picking only the fields you want.
          id: item.id,
          quantity: item.quantity,
          sale_price: item.sale_price,
          shopId: item.shopId,
          selectedOptions: item.selectedOptions || {},
        }))
        .sort((a, b) => a.id.localeCompare(b.id)) //sorts that array based on id.If your ids are numbers, you don’t need localeCompare, you can just do:.sort((a, b) => a.id - b.id)
    );

    // already created the session with the same product and same user, then don't create a new session instead give the same session to the user
    // 1 payment session is valid for 5 minutes, after 5 minutes it will expire
    //check for payment session, check if user already has payment session
    // one user can have multiple session
    //     For each session:
    // If it belongs to the same userId:
    // Compare cart from Redis with new cart.
    // If carts match → reuse session (don’t create a new one).
    // Return the same sessionId.
    // If carts are different → invalidate old session by deleting it.
    const keys = await redis.keys("payment-session:*"); //Check Redis for existing payment-session:*, Find all keys that start with "payment-session:" returns and array:["payment-session:123","payment-session:456","payment-session:789"]
    for (const key of keys) {
      const data = await redis.get(key); //retrieves the value stored at a given key.null (or undefined, depending on your Redis client) if the key doesn’t exist.
      if (data) {
        const session = JSON.parse(data); //convert to object
        if (session.userId === userId) {
          const existingCart = JSON.stringify(
            session.cart
              .map((item: any) => ({
                id: item.id,
                quantity: item.quantity,
                sale_price: item.sale_price,
                shopId: item.shopId,
                selectedOption: item.selectedOptions || {},
              }))
              .sort((a: any, b: any) => a.id.localeCompare(b.id))
          );
          if (existingCart === normalizedCart) {
            return res.status(200).json({ sessionId: key.split(":")[1] });
          } else {
            await redis.del(key); //delete the key invalidate
          }
        }
      }
    }

    // fetch selller and their stripe accounts to send the money, admin is only getting the platform fee
    // if we purchase 2 products from 2 different shops, fetch unique shops id
    const uniqueShopIds = [...new Set(cart.map((item: any) => item.shopId))]; //single order may contain items from multiple shops.Extract unique shop IDs from the cart.

    //fetch each shop information
    //     Fetch shop + seller info from DB.
    // Collect stripeAccountId (so platform can split payments between sellers).
    const shops = await prisma.shops.findMany({
      //Finds multiple shop records from the shops table.
      where: {
        id: { in: uniqueShopIds }, //Filters shops whose id is in the array uniqueShopIds.if uniqueShopIds = [2, 5, 8], it will only return shops with IDs 2, 5, and 8.
      },
      select: {
        id: true,
        sellerId: true,
        sellers: { select: { stripeId: true } }, //Controls which fields are returned from the query:
        // id: true → include shop’s id, sellerId: true → include the foreign key reference to the seller, sellers: { select: { stripeId: true } }, Follows the relation from shops → sellers, Selects only the seller’s stripeId
      },
    });

    //find the seller data
    const sellerData = shops.map((shop) => ({
      shopId: shop.id,
      sellerId: shop.sellerId,
      stripeAccountId: shop?.sellers?.stripeId,
    }));

    // calculate total
    const totalAmount = cart.reduce((total: number, item: any) => {
      return total + item.quantity * item.sale_price;
    }, 0);

    // create session payload
    const sessionId = crypto.randomUUID(); //random unique session id
    const sessionData = {
      //store all the session info
      userId,
      cart,
      sellers: sellerData,
      totalAmount,
      shippingAddressId: selectedAddressId || null,
      coupon: coupon || null,
    };

    //     Save session in Redis with 10 minutes expiry.
    // If user doesn’t complete payment in 10 mins → session auto-deletes.
    await redis.setex(
      `payment-session:${sessionId}`,
      600, //10 MINUTES
      JSON.stringify(sessionData)
    );
    // Frontend uses this sessionId in the next step (creating a PaymentIntent in Stripe and finaize the order).
    return res.status(201).json({ sessionId }); //Respond with the sessionId to frontend.
  } catch (error) {
    next(error);
  }
};

//verify payment session
export const verifyingPaymentSession = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //     Frontend passes sessionId in the query string (like /verify?sessionId=123).
    // If no sessionId → respond with 400 Bad Request.
    const sessionId = req.query.sessionId as string;
    if (!sessionId) {
      return res.status(400).json({ error: "Session ID is required." });
    }

    // fetch session from redis
    const sessionKey = `payment-session:${sessionId}`;
    const sessionData = await redis.get(sessionKey); //fetch the session data from Redis

    if (!sessionData) {
      return res.status(404).json({ error: "Session not found or expired." });
    }

    // parse and return session
    //we need this to load the stripe payment form
    const session = JSON.parse(sessionData); //converts the sessiondata to object

    //why we need session
    //     You mean when a user clicks "Proceed to Checkout", they are redirected to something like /payment.
    // But since /payment is just a static, predictable URL (anyone can type it in the browser), there’s no unique session or token attached to it. That makes it insecure — a user could technically bypass parts of the flow and land directly on the payment page.

    // That’s why you’re adding all this session validation logic:
    // Before letting the user proceed, you check if a valid session exists in Redis.
    // If yes → allow access to /payment.
    // If no → block access or redirect them back to the cart.

    // This ensures:
    // Only users with an active checkout flow can reach /payment.
    // Sessions tied to cart items prevent duplicate/unauthorized payment attempts.
    // If the cart item changes, the session updates accordingly.
    // ⚡ Basically, your /payment route becomes “protected,” and the session acts as the gatekeeper.
    // when you're clicking this proceed to check out it will take you suppose / payment , slash payment but slment is  completely like on predictable URL no session or nothing is there right , that's why I am doing all of this to secure our payment
    return res.status(200).json({ sucess: true, session });
  } catch (error) {
    return next(error);
  }
};

//create order
// stripe will call this route through their webhook
// Stripe webhook is a way for Stripe to notify your backend (server) when certain events happen in your Stripe account.
// Instead of you constantly checking Stripe (polling), Stripe pushes the event to your server in real-time.
// Example events:
// A customer makes a payment, A subscription renews or cancels,  A refund is issued, A payout is sent to your bank
export const createOrder = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //     Your server receives:
    // Raw body (JSON string of the event).
    // Header: stripe-signature=...
    // when you run:
    // const event = stripe.webhooks.constructEvent(
    //   rawBody,
    //   stripeSignature,
    //   process.env.STRIPE_WEBHOOK_SECRET
    // );
    // If it succeeds → you now have a safe, verified event object:
    // {
    //   "id": "evt_1Q2ABCDxyz",
    //   "object": "event",
    //   "type": "payment_intent.succeeded",
    //   "data": {
    //     "object": { "id": "pi_123", "amount": 5000, "status": "succeeded" }
    //   }
    // }

    // req.headers is just a plain JavaScript object containing all HTTP headers (converted to lowercase keys).
    // accessing the value of the stripe-signature header by its key.
    const stripeSignature = req.headers["stripe-signature"]; //Reads the Stripe-Signature header and the raw, unparsed request body.
    if (!stripeSignature) {
      return res.status(400).send("Missing Stripe Signature");
    }
    const rawBody = (req as any).rawBody; //raw request body (unparsed JSON)
    //     Stripe requires the raw body because it uses it to verify the HMAC signature.
    // ⚠️ If you pass a parsed object (via express.json() or bodyParser.json()), verification will fail.
    let event;
    try {
      //       Uses stripe.webhooks.constructEvent to authenticate the event.
      // If the signature/body don’t match your STRIPE_WEBHOOK_SECRET, it aborts with 400.
      //       This method:
      // Takes rawBody, stripeSignature, and your webhook secret.
      // Verifies the signature matches.The stripeSignature (from the Stripe-Signature header) must match a value that Stripe generates using your webhook signing secret and the raw request body.
      // If valid → returns a parsed event object.
      // If invalid → throws an error
      event = stripe.webhooks.constructEvent(
        rawBody,
        stripeSignature,
        process.env.STRIPE_WEBHOOK_SECRET! //Each webhook endpoint has its own secret key.
      );
    } catch (err: any) {
      console.log("webhook signature verification failed.", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // Handles only payment_intent.succeeded.
    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      // Pulls your own metadata back out: sessionId and userId that you attached when creating the PaymentIntent.
      const sessionId = paymentIntent.metadata.sessionId;
      const userId = paymentIntent.metadata.userId;
      const sessionKey = `payment-session:${sessionId}`;
      const sessionData = await redis.get(sessionKey);
      //       Fetches the session you saved during checkout.
      // If Redis doesn’t have it (expired/cleared), it exits gracefully (idempotency).
      // Parses it to get the cart, total, shipping address, etc.
      if (!sessionData) {
        console.warn("Session data expired or missing for ", sessionId);
        return res
          .status(200)
          .send("No session found, skipping order creation");
      }

      console.log("sessionData", sessionData);
      const { cart, totalAmount, shippingAddressId, coupon } =
        JSON.parse(sessionData);

      //fetch users full info
      const user = await prisma.users.findUnique({ where: { id: userId } });
      const name = user?.name!;
      const email = user?.email!;

      // check if one shop is there in cart or multiple shops
      //       reduce iterates through every item in cart.
      // acc (the accumulator) starts as {} (an empty object).

      // For each item:
      // Check if a key for item.shopId already exists in acc.
      // If not, create an empty array at that key.
      // Push the current item into the array for its shopId.
      // Return the acc object at the end.
      //       const cart = [
      //         { id: 1, name: "Shirt", shopId: "A" },
      //         { id: 2, name: "Pants", shopId: "B" },
      //         { id: 3, name: "Hat", shopId: "A" },
      //       ];
      // after running reduce:
      // const shopGrouped = {
      //   A: [
      //     { id: 1, name: "Shirt", shopId: "A" },
      //     { id: 3, name: "Hat",   shopId: "A" }
      //   ],
      //   B: [
      //     { id: 2, name: "Pants", shopId: "B" }
      //   ]
      // };

      const shopGrouped = cart.reduce((acc: any, item: any) => {
        if (!acc[item.shopId]) acc[item.shopId] = [];
        acc[item.shopId].push(item);
        return acc;
      }, {});

      //Create orders per shop, apply discounts, update inventory & analytics
      //  for...in loop is used to iterate over the keys (property names) of an object
      //       shopGrouped = {
      //   "shop1": [{ id: 1, quantity: 2, sale_price: 100 }],
      // };
      // coupon = {
      //   discountedProductId: 1,
      //   discountPercent: 10
      // };
      // shopGrouped = {
      //   shop1: [{ id: 1, quantity: 2, sale_price: 100 }],
      //   shop2: [{ id: 2, quantity: 1, sale_price: 200 }]
      // };

      // coupon = { discountedProductId: 1, discountPercent: 10 };
      // Shop1 → has item id=1 → discount applies → total reduced.
      // Shop2 → does not have item id=1 → no discount applied.
      // 👉 So effectively the coupon applies to only one shop’s items, but your code still loops through all shops.
      for (const shopId in shopGrouped) {
        const orderItems = shopGrouped[shopId];
        let orderTotal = orderItems.reduce(
          (sum: number, p: any) => sum + p.quantity * p.sale_price,
          0
        );

        // apply discount if applicable for that shop id
        // assumes only one coupon is passed,  for the entire order
        if (
          coupon &&
          coupon.discountedProductId &&
          orderItems.some((item: any) => item.id === coupon.discountedProductId)
        ) {
          const discountedItem = orderItems.find(
            (item: any) => item.id === coupon.discountedProductId
          );

          // If coupon.discountPercent > 0, apply a percentage discount.
          // Example: 20% off → price × qty × 20 / 100.
          // Otherwise, apply a flat discount amount (e.g., $50 off).
          if (discountedItem) {
            const discount =
              coupon.discountPercent > 0
                ? (discountedItem.sale_price *
                    discountedItem.quantity *
                    coupon.discountPercent) /
                  100
                : coupon.discountAmount;
            orderTotal -= discount;
          }
        }

        // create order per shop
        //         Persists the order and nested order items for this shop.
        // Stores shipping address ID and coupon info if present.
        const order = await prisma.orders.create({
          data: {
            userId,
            shopId,
            total: orderTotal,
            status: "Paid",
            shippingAddressId: shippingAddressId || null,
            couponCode: coupon?.code || null,
            discountAmount: coupon?.discountAmount || 0,
            items: {
              create: orderItems.map((item: any) => ({
                productId: item.id,
                quantity: item.quantity,
                price: item.sale_price,
                selectedOptions: item.selectedOptions,
              })),
            },
          },
        });

        // update product and analytics
        // orderItems is the array of products for that shop’s order.

        //         Takes id from the product and renames it as productId.
        // Also extracts the quantity.
        for (const item of orderItems) {
          const { id: productId, quantity } = item;
          await prisma.products.update({
            where: { id: productId }, //Finds the product by id.
            //Updates 2 fields:
            // stock → reduces (decrements) by the purchased quantity.
            // totalSales → increases (increments) by the purchased quantity
            data: {
              stock: { decrement: quantity },
              totalSales: { increment: quantity },
            },
          });

          // create a new record if none exists, otherwise update the existing one.
          await prisma.productAnalytics.upsert({
            where: { productId },
            create: {
              productId,
              shopId,
              purchases: quantity,
              lastViewedAt: new Date(),
            },
            update: {
              purchases: { increment: quantity },
            },
          });

          //Check if we already have an analytics record for this user.
          const existingAnalytics = await prisma.userAnalytics.findUnique({
            where: { userId },
          });

          //           Logs what the user did → here, a "purchase".
          // Includes which product & shop, and the exact timestamp.
          const newAction = {
            productId,
            shopId,
            action: "purchase",
            timestamp: Date.now(),
          };

          //           userAnalytics.actions is stored as a JSON array in DB.
          // If it exists → reuse it.
          // If not → start with an empty array [].
          const currentActions = Array.isArray(existingAnalytics?.actions)
            ? (existingAnalytics.actions as Prisma.JsonArray)
            : [];

          //             If user analytics exist:
          // Update lastVisited timestamp.
          // Append the new action to the existing actions array.
          // If no record exists:
          // Create a fresh record with actions = [newAction].
          if (existingAnalytics) {
            await prisma.userAnalytics.update({
              where: { userId },
              data: {
                lastVisited: new Date(),
                actions: [...currentActions, newAction],
              },
            });
          } else {
            await prisma.userAnalytics.create({
              data: {
                userId,
                lastVisited: new Date(),
                actions: [newAction],
              },
            });
          }
        }

        // send email to buyer
        await sendEmail(
          email,
          "Your ShopStack Order Confirmation",
          "order-confirmation",
          {
            name,
            cart,
            totalAmount: coupon?.discountAmount //final total (with coupon if any).
              ? totalAmount - coupon?.discountAmount
              : totalAmount,
            trackingUrl: `/order/${order.id}`,
          }
        );

        // create push notifications for sellers
        const createdShopIds = Object.keys(shopGrouped); //gives the key :["shop1", "shop2"]. These are the shop IDs that received an order.

        const sellerShops = await prisma.shops.findMany({
          where: { id: { in: createdShopIds } },
          // fetches id, sellerid, name
          select: {
            id: true,
            sellerId: true,
            name: true,
          },
        });

        // create notifications for sellers
        //         For each shop that has received at least one product in the order:
        // Pick the first product from that shop’s order list.
        //       shopGrouped = {
        // "shop1": [
        //   { id: 101, title: "Red Shoes", quantity: 2 },
        //   { id: 102, title: "Leather Bag", quantity: 1 }
        // ],
        // "shop2": [
        //   { id: 201, title: "Luxury Watch", quantity: 1 }
        // ]
        // };
        // sellerShops = [
        //   { id: "shop1", sellerId: "sellerA", name: "Fashion Hub" },
        //   { id: "shop2", sellerId: "sellerB", name: "TimeWorld" }
        // ];
        // buyer is: userId = "userX";   // Alice
        // sessionId = "order987";
        // notification created:
        // {
        //   "title": "🛒 New Order Received",
        //   "message": "A customer just ordered Red Shoes from your shop.",
        //   "creatorId": "userX",
        //   "receiverId": "sellerA",
        //   "redirect_link": "https://shopstack.com/order/order987"
        // }
        // {
        //   "title": "🛒 New Order Received",
        //   "message": "A customer just ordered Luxury Watch from your shop.",
        //   "creatorId": "userX",
        //   "receiverId": "sellerB",
        //   "redirect_link": "https://shopstack.com/order/order987"
        // }

        // Create a notification in the DB for that shop’s seller.
        for (const shop of sellerShops) {
          // Gets the first product ordered from that shop:
          const firstProduct = shopGrouped[shop.id][0];

          const productTitle = firstProduct?.title || "new item";

          await prisma.notifications.create({
            data: {
              title: "🛒 New Order Received",
              message: `A customer just ordered ${productTitle} from your shop.`,
              creatorId: userId,
              receiverId: shop.sellerId,
              redirect_link: `https://shopstack.com/order/${sessionId}`,
            },
          });
        }

        //we can also send email to seller after creating order (optional)

        // create notification for admin
        await prisma.notifications.create({
          data: {
            title: "📦 Platform Order Alert",
            message: `A new order was placed by ${name}`,
            creatorId: userId,
            receiverId: "admin",
            redirect_link: `https://shopstack.com/order/${sessionId}`,
          },
        });

        //delete session key
        //         Deletes the Redis payment session (no longer needed once order is created).
        // Returns 200 to Stripe to acknowledge receipt
        await redis.del(sessionKey);
      }
    }
    return res.status(200).json({ received: true });
  } catch (error) {
    console.log(error);
    return next(error);
  }
};

// step1 :create payment Session
// step 2: verify payment session
// step 3: create payment intent
// step 4 :create order

//get sellers order
export const getSellerOrders = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const shop = await prisma.shops.findUnique({
      where: {
        sellerId: req.seller.id,
      },
    });
    //fetch all orders for this shop
    const orders = await prisma.orders.findMany({
      where: {
        shopId: shop?.id,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    console.log(orders);
    return res.status(201).json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};

// get order details
export const getOrderDetails = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const orderId = req.params.id;
    const order = await prisma.orders.findUnique({
      where: {
        id: orderId,
      },
      include: {
        items: true,
      },
    });

    if (!order) {
      return next(new NotFoundError("Order not found with the id!"));
    }

    // fetch user shipping address
    const shippingAddress = order.shippingAddressId
      ? await prisma.address.findUnique({
          where: { id: order?.shippingAddressId },
        })
      : null;

    const coupon = order.couponCode
      ? await prisma?.discount_codes.findUnique({
          where: {
            discountCode: order.couponCode,
          },
        })
      : null;

    // fetch all products details in one go
    const productIds = order.items.map((item) => item.productId);

    const products = await prisma.products.findMany({
      where: {
        id: { in: productIds },
      },
      select: {
        id: true,
        title: true,
        images: true,
      },
    });

    // make a product map
    const productMap = new Map(products.map((p) => [p.id, p]));
    const items = order.items.map((item) => ({
      ...item,
      selectedOptions: item.selectedOptions,
      product: productMap.get(item.productId) || null,
    }));

    res.status(200).json({
      success: true,
      order: { ...order, items, shippingAddress, couponCode: coupon },
    });
  } catch (error) {
    next(error);
  }
};

//update order status
// in real world application people use delivery partner like dhl to update the order status, in real world we ask dhl for their api and make it dynamic and they gives the response
export const updateDeliveryStatus = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { orderId } = req.params;
    const { deliveryStatus } = req.body;
    if (!orderId || !deliveryStatus) {
      return res
        .status(400)
        .json({ error: "Missing order ID or delivery status." });
    }
    const allowedStatuses = [
      "Ordered",
      "Packed",
      "Shipped",
      "Out for Delivery",
      "Delivered",
    ];
    if (!allowedStatuses.includes(deliveryStatus)) {
      return next(new ValidationError("Invalid delivery status."));
    }

    const existingOrder = await prisma.orders.findUnique({
      where: { id: orderId },
    });

    if (!existingOrder) {
      return next(new NotFoundError("Order not found!"));
    }

    const updatedOrder = await prisma.orders.update({
      where: { id: orderId },
      data: { deliveryStatus, updatedAt: new Date() },
    });

    return res.status(200).json({
      sucess: true,
      message: "Delivery status updated successfully.",
      order: updatedOrder,
    });
  } catch (error) {
    return next(error);
  }
};

// verify coupon code
export const verifyCouponCode = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { couponCode, cart } = req.body;
    if (!couponCode || !cart || cart.length === 0) {
      return next(new ValidationError("Coupon code and cart are required!"));
    }

    // fetch discount code
    const discount = await prisma.discount_codes.findUnique({
      where: { discountCode: couponCode },
    });

    if (!discount) {
      return next(new ValidationError("Coupon code isn't valid!"));
    }

    // find matching product that includes this discount code
    const matchingProduct = cart.find((item: any) =>
      item.discount_codes?.some((d: any) => d === discount.id)
    );

    if (!matchingProduct) {
      return res.status(200).json({
        valid: false,
        discount: 0,
        discountAmount: 0,
        message: "No matching product found in cart for this coupon",
      });
    }

    let discountAmount = 0;
    const price = matchingProduct.sale_price * matchingProduct.quantity;

    if (discount.discountType === "percentage") {
      discountAmount = (price * discount.discountValue) / 100;
    } else if (discount.discountType === "flat") {
      discountAmount = discount.discountValue;
    }

    // prevent discountAmount from being greater than total price
    discountAmount = Math.min(discountAmount, price);

    res.status(200).json({
      valid: true,
      discount: discount.discountValue,
      discountAmount: discountAmount.toFixed(2),
      discountedProductId: matchingProduct.id,
      discountType: discount.discountType,
      message: "Discount applied to 1 eligible product",
    });
  } catch (error) {
    next(error);
  }
};

// get user orders
export const getUserOrders = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const orders = await prisma.orders.findMany({
      where: { userId: req.user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    res.status(201).json({ success: true, orders });
  } catch (error) {
    return next(error);
  }
};

// get admin orders
//we can see all the orders in the order table here
export const getAdminOrders = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    // fetch all orders
    const orders = await prisma.orders.findMany({
      include: { user: true, shop: true },
      orderBy: { createdAt: "desc" },
    });
    return res.status(200).json({ success: true, orders });
  } catch (error) {
    next(error);
  }
};
