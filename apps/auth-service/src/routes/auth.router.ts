import { isAdmin, isSeller } from "@packages/middleware/authorizeRoles";
import express, { Router } from "express";
import {
  loginUser,
  userRegistration,
  verifyUser,
  refreshToken,
  resetUserPassword,
  userForgotPassword,
  verifyUserForgotPassword,
  getUser,
  registerSeller,
  verifySeller,
  createShop,
  loginSeller,
  createStripeConnectLink,
  getSeller,
  logOutUser,
  updateUserPassword,
  logOutAdmin,
  logOutSeller,
  loginAdmin,
  getAdmin,
  getUserAddresses,
  addUserAddress,
  deleteUserAddress,
  getLayoutData,
} from "../controller/auth.controller";
import isAuthenticated from "@packages/middleware/isAuthenticated";

const router: Router = express.Router();
router.post("/user-registration", userRegistration);
router.post("/verify-user", verifyUser);
router.post("/login-user", loginUser);
router.post("/refresh-token", refreshToken); //for both user and seller
router.get("/logged-in-user", isAuthenticated, getUser);
router.post("/forgot-password-user", userForgotPassword);
router.post("/reset-password-user", resetUserPassword);
router.post("/verify-forgot-password-otp", verifyUserForgotPassword);
router.post("/seller-registration", registerSeller);
router.post("/verify-seller", verifySeller);
router.post("/create-shop", createShop);
router.post("/create-stripe-link", createStripeConnectLink);
router.post("/login-seller", loginSeller);
router.get("/logout-seller", isAuthenticated, logOutSeller);
router.get("/logged-in-seller", isAuthenticated, isSeller, getSeller);
router.get("/logout-user", isAuthenticated, logOutUser);
router.post("/login-admin", loginAdmin);
router.get("/logout-admin", isAuthenticated, logOutAdmin);
router.get("/logged-in-admin", isAuthenticated, isAdmin, getAdmin);
router.post("/change-password", isAuthenticated, updateUserPassword);
router.get("/shipping-addresses", isAuthenticated, getUserAddresses);
router.post("/add-address", isAuthenticated, addUserAddress);
router.delete("/delete-address/:addressId", isAuthenticated, deleteUserAddress);
router.get("/get-layouts", getLayoutData);
export default router;

// we have user token right now, we have to check the user information from that token. hence we need Middleware, from which we are going to check the user info and display the user firsname on ui
// if user is logged in it will redirect the user to /profile not /login
