import isAuthenticated from "@packages/middleware/isAuthenticated";
import express, { Router } from "express";
import {
  createPaymentIntent,
  createPaymentSession,
  getAdminOrders,
  getOrderDetails,
  getSellerOrders,
  getUserOrders,
  updateDeliveryStatus,
  verifyCouponCode,
  verifyingPaymentSession,
} from "../controllers/order.controller";
import { isAdmin, isSeller } from "@packages/middleware/authorizeRoles";

const router: Router = express.Router();

router.post("/create-payment-intent", isAuthenticated, createPaymentIntent);
router.post("/create-payment-session", isAuthenticated, createPaymentSession);
router.get("/verify-payment-session", isAuthenticated, verifyingPaymentSession);
router.get("/get-seller-orders", isAuthenticated, isSeller, getSellerOrders);
router.get("/get-order-details/:id", isAuthenticated, getOrderDetails); //remove the isSeller middleware, as we access the order details in both seller and admin page
router.put(
  "/update-status/:orderId",
  isAuthenticated,
  isSeller,
  updateDeliveryStatus
);
router.put("/verify-coupon", isAuthenticated, verifyCouponCode);
router.get("/get-user-orders", isAuthenticated, getUserOrders);
router.get("/get-admin-orders", isAuthenticated, isAdmin, getAdminOrders);
export default router;

// stripe sends request to the server
// inside our api gateway we added some security because of that stripe won't be able to send request to our server
// for create order we have to create in order-service , we will not send the request in our api gateway. we will send direct request in 6004
// order service is standalone server , it can work alone
// add code in main.ts
// app.post()
