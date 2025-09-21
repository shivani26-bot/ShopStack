import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import {
  checkOtpRestrictions,
  handleForgotPassword,
  sendOtp,
  trackOtpRequests,
  validateResgistrationData,
  verifyForgotPasswordOtp,
  verifyOtp,
} from "../utils/auth.helper";
import prisma from "@packages/libs/prisma";
import {
  AuthError,
  NotFoundError,
  ValidationError,
} from "@packages/error-handler";
import bcrypt from "bcryptjs";
import { setCookie } from "../utils/cookies/setCookie";
import Stripe from "stripe";
import { sendLog } from "@packages/utils/logs/send-logs";

//setup stripe
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-07-30.basil",
});

export const userRegistration = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //validate the data
    validateResgistrationData(req.body, "user");
    const { name, email } = req.body;
    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      return next(new ValidationError("User already exists with this email!"));
    }

    //send otp
    //   restriction for user:
    //   if user is trying spamming with email, create an account send an otp, in real buisness we use paid services for sending email
    await checkOtpRestrictions(email, next);
    await trackOtpRequests(email, next);
    await sendOtp(name, email, "user-activation-mail");
    res.status(200).json({
      message: "OTP sent to email. Please verify your account.",
    });
  } catch (error) {
    return next(error);
  }
};

//verify user with otp
export const verifyUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, password, name } = req.body;
    if (!email || !otp || !password || !name) {
      //It does not go into your catch block, because no exception was thrown — you just called next directly.
      // The central error handler middleware (the one with (err, req, res, next)) is called right away.
      return next(new ValidationError("All fields are required!"));
    }
    const existingUser = await prisma.users.findUnique({ where: { email } });
    if (existingUser) {
      return next(new ValidationError("User already exists with this email!"));
    }
    await verifyOtp(email, otp, next);
    //     securely hash a password before storing it in a database.
    //     password → The plain-text password entered by the user.
    // 10 → The salt rounds (cost factor).
    // Higher number → more secure, but slower.
    // 10 is a common default in Node.js apps.
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.users.create({
      data: { name, email, password: hashedPassword },
    });
    res.status(201).json({
      success: true,
      message: "User registered successfully!",
    });
  } catch (error) {
    return next(error);
  }
};

//login user
// User logs in with credentials → server verifies password.
// Server issues:Access token (short-lived),Refresh token (long-lived)
// Client stores:
// Access token in memory or cookie.
// Refresh token in HttpOnly cookie.
// Client makes API requests using access token.
// If access token expires:
// Client calls /refresh-token endpoint with refresh token.
// Server verifies refresh token → issues a new access token.
// If refresh token expires → user must log in again.
export const loginUser = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("inside login");
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ValidationError("Email and password are required!"));
    }
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) return next(new AuthError("User doesnot exists!"));

    //verify password
    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      return next(new AuthError("Invalid email or password"));
    }

    //we are first checking which token is available in cookie in middleware
    // we should make sure when seller is logging in remove the user access_token and refresh_token, repeat the same for user login, remove seller-refresh-token and seller-access-token
    res.clearCookie("seller-access-token");
    res.clearCookie("seller-refresh-token");
    //generate access and refresh token
    // Access token is for API requests, refresh token is for getting a new access token without logging in again.
    //     Sent with every API request to access protected resources.
    // Allows stateless authentication: server doesn’t need to store session info.
    // Ensures requests are authorized based on the token.
    // GET /api/profile
    // Authorization: Bearer <ACCESS_TOKEN>
    const accessToken = jwt.sign(
      { id: user.id, role: "user" },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "15m" }
    );

    //long lived
    // Refresh token is only used to get new access tokens, not for accessing APIs directly.
    // Enables persistent login without forcing the user to re-enter credentials.
    // Reduces risk: access token is short-lived → even if stolen, it’s useless quickly.
    const refreshToken = jwt.sign(
      { id: user.id, role: "user" },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: "7d" }
    );

    //store the refresh and access token in an httpOnly secure cookie
    // setting cookies as HttpOnly & Secure so they’re not accessible to JavaScript in the browser
    // Prevent XSS from stealing tokens.
    // Never store refresh tokens in local storage (XSS risk). Use HttpOnly cookies.
    // Access tokens can be sent in Authorization headers (Bearer <token>).
    // Expired access tokens don’t force logout; refresh token keeps the session alive.
    // If refresh token is compromised, attacker can generate access tokens → monitor and revoke compromised refresh tokens server-side.
    setCookie(res, "refresh_token", refreshToken);
    setCookie(res, "access_token", accessToken);

    res.status(200).json({
      message: "Login successful!",
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    return next(error);
  }
};

// refresh token for user and seller
// Normally, JWTs are used for session management:
// Access Token – short-lived (e.g., 15 minutes), used to access protected routes.
// Refresh Token – long-lived (e.g., 7 days, 30 days), used to generate a new access token when the old one expires.
// Because access tokens are short-lived, users don’t need to log in again every 15 minutes — instead, they use the refresh token to get a new access token.

export const refreshToken = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    //search for refresh token from the requested browser,looks in browser cookie
    const refreshToken =
      req.cookies["refresh_token"] ||
      req.cookies["seller-refresh-token"] ||
      req.headers.authorization?.split(" ")[1];
    if (!refreshToken) {
      //if no refresh token then throw error
      throw new ValidationError("Unauthorized! No refresh token.");
    }
    // other wise verify the refresh token and typecast it as id and role format
    // verify the refresh token , extracts id and role from payload
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET as string
    ) as { id: string; role: string };

    //if invalid
    if (!decoded || !decoded.id || !decoded.role) {
      throw new JsonWebTokenError("Forbidden! Invalid refresh token.");
    }

    //ensure that user/seller is in database or not
    let account;
    if (decoded.role === "user" || decoded.role === "admin") {
      account = await prisma.users.findUnique({ where: { id: decoded.id } });
    } else if (decoded.role === "seller") {
      account = await prisma.sellers.findUnique({
        where: { id: decoded.id },
        include: { shop: true },
      });
    }
    if (!account) {
      throw new AuthError("Forbidden! User/Seller not found");
    }

    //generate new access token for user using id and role, this new token is valid for 15 minutes
    const newAccessToken = jwt.sign(
      { id: decoded.id, role: decoded.role },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "15m" } //JWT with a built-in expiry of 15 minutes.
      // After 15 minutes, this token is cryptographically invalid (even if it’s still stored in a cookie).
      // If someone tries to use it in an API call after 15m, jwt.verify() will reject it.
    );
    //set new cookie,sends the new access token back to the browser
    if (decoded.role === "user" || decoded.role === "admin") {
      setCookie(res, "access_token", newAccessToken);
    } else if (decoded.role === "seller") {
      setCookie(res, "seller-access-token", newAccessToken);
    }
    //add the role after generating a new access token
    req.role = decoded.role;
    return res.status(201).json({ success: true });
  } catch (error) {
    return next(error);
  }
};

//get logged in user
export const getUser = async (req: any, res: Response, next: NextFunction) => {
  try {
    const user = req.user;
    // source means from which service the log is coming, to help devops ,developers can track
    await sendLog({
      type: "success",
      message: `User data retreived ${user?.email}`,
      source: "auth-service",
    });
    res.status(201).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
//user forgot password
export const userForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await handleForgotPassword(req, res, next, "user");
};

//verify forgot password otp
export const verifyUserForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  await verifyForgotPasswordOtp(req, res, next);
};
// reset user password
export const resetUserPassword = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, newPassword } = req.body;
    if (!email || !newPassword) {
      return next(new ValidationError("Email and new password are required!"));
    }

    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) return next(new ValidationError("User not found!"));

    //compare new password with existing one
    // The ! tells TypeScript:
    // “I know for sure that user.password is not null or undefined here.”
    const isSamePassword = await bcrypt.compare(newPassword, user.password!);
    if (isSamePassword) {
      return next(
        new ValidationError("New password cannot be the same as old password!")
      );
    }

    // hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await prisma.users.update({
      where: { email },
      data: { password: hashedPassword },
    });
    res.status(200).json({ message: "Password reset successfully!" });
  } catch (error) {
    next(error);
  }
};

//register a new seller
export const registerSeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    validateResgistrationData(req.body, "seller");
    const { name, email } = req.body;
    const existingSeller = await prisma.sellers.findUnique({
      where: { email },
    });
    if (existingSeller)
      throw new ValidationError("Seller already exists with this email!");
    await checkOtpRestrictions(email, next);
    await trackOtpRequests(email, next);
    sendOtp(name, email, "seller-activation");
    res
      .status(200)
      .json({ message: "OTP sent to email. Please verify your account." });
  } catch (error) {
    next(error);
  }
};

//verify seller with OTP
export const verifySeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp, password, name, phone_number, country } = req.body;
    if (!email || !otp || !password || !name || !phone_number || !country) {
      return next(new ValidationError("All fields are required!"));
    }
    const existingSeller = await prisma.sellers.findUnique({
      where: { email },
    });
    if (existingSeller) {
      return next(new ValidationError("Seller already exists with this email"));
    }
    await verifyOtp(email, otp, next);
    //hash the password
    const hashedPassword = await bcrypt.hash(password, 10);
    //create the seller
    const seller = await prisma.sellers.create({
      data: { name, email, password: hashedPassword, country, phone_number },
    });
    res
      .status(201)
      .json({ seller, message: "Seller registered successfully!" });
  } catch (error) {
    next(error);
  }
};

//create new shop
export const createShop = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, bio, address, opening_hours, website, category, sellerId } =
      req.body;
    if (
      !name ||
      !bio ||
      !address ||
      !opening_hours ||
      !website ||
      !category ||
      !sellerId
    ) {
      return next(new ValidationError("All fields are required!"));
    }

    // : any, TypeScript doesn’t care what fields exist in shopData — you can assign anything.
    // without any ,shopData.website = website   // ❌ Error gives error,
    // TypeScript infers the type of shopData from the initial object literal: ie name, bio address, opening_hours ,sellerId, and it doesn't have website
    const shopData: any = {
      name,
      bio,
      address,
      opening_hours,
      category,
      sellerId,
    };
    if (website && website.trim() !== "") {
      shopData.website = website;
    }
    const shop = await prisma.shops.create({
      data: shopData,
    });
    res.status(201).json({ success: true, shop });
  } catch (error) {
    next(error);
  }
};

//create stripe connect account link
export const createStripeConnectLink = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { sellerId } = req.body;
    if (!sellerId) return next(new ValidationError("Seller ID is required!"));
    const seller = await prisma.sellers.findUnique({ where: { id: sellerId } });
    if (!seller) {
      return next(new ValidationError("Seller is not available with this id!"));
    }
    //if seller is present then create a stripe account for seller
    // API call creates a new Connected Account on Stripe,Connected accounts are used in Stripe Connect when you’re building a platform/marketplace (like your app with shops & sellers)
    // Your Stripe account = the platform (you).Each connected account = a seller/merchant who will receive payouts.
    // Stripe has 3 types of connected accounts: custom->fully controlled by you, express->Shared responsibility. Stripe handles onboarding flows (UI) and compliance.Standard → Seller has their own full Stripe account.
    // returns a Stripe Account object in JSON form.
    //     {
    //   "id": "acct_1Pv9Vb2eZvKYlo2C",   // Unique Stripe account ID for seller
    //   "object": "account",
    //   "capabilities": {
    //     "card_payments": "pending",  // Stripe still needs verification before enabling
    //     "transfers": "pending"
    //   },
    //   "charges_enabled": false,      // can't take payments yet
    //   "payouts_enabled": false,      // can't receive payouts yet
    //   "country": "GB",
    //   "default_currency": "gbp",
    //   "email": "seller@example.com",
    //   "type": "express",
    //   "details_submitted": false,    // seller hasn't finished onboarding
    //   "requirements": {
    //     "currently_due": [           // info/documents Stripe still needs
    //       "individual.first_name",
    //       "individual.last_name",
    //       "business_profile.mcc",
    //       "external_account"
    //     ],
    //     "past_due": [],
    //     "pending_verification": []
    //   },
    //   "created": 1724245533,         // timestamp
    //   "metadata": {}
    // }

    //you can check connected accounts on your stripe account
    console.log("seller", seller);
    const account = await stripe.accounts.create({
      type: "express",
      email: seller?.email,
      country: "GB", //country where the seller is legally located ,Uk, this will only reflect in ui while creating account
      capabilities: {
        //what this account is allowed to do.
        card_payments: { requested: true }, //Lets the seller accept payments via cards.
        transfers: { requested: true }, //Lets the seller receive payouts to their bank account.
      },
    });
    console.log("after creation ");
    //update the stripId to sellers table
    await prisma.sellers.update({
      where: { id: sellerId },
      data: { stripeId: account.id },
    });

    //for sellers we can create stripe account instantly using our platform, because they are partnered with us
    // creates a special onboarding link for your seller to finish setting up their Stripe Express account.
    // Without onboarding, Stripe doesn’t allow payouts/payments → sellers must submit ID docs, bank account, business details, etc.
    //  account: account.id The seller’s account you just created earlier (acct_123...).
    // refresh_url:If the seller abandons onboarding or something goes wrong, Stripe will send them back here. Usually, this points to a page that says "Something went wrong, please try again."
    // return_url: Where Stripe redirects the seller after successful onboarding. Typically a success page in your app.
    // type: "account_onboarding": Tells Stripe that this link is specifically for onboarding (not login, not account update).
    //     returns:{
    //   "object": "account_link",
    //   "created": 1724252937,
    //   "expires_at": 1724253237,
    //   "url": "https://connect.stripe.com/setup/s/acct_1Pv9Vb2eZvKYlo2C/12345abc"
    // }
    //  url → the magic onboarding link you must send the seller to.
    // It expires in 1 hour ⚠️ (Stripe requires you to generate a new link if the seller doesn’t finish in time).

    const accountLink = await stripe.accountLinks.create({
      account: account.id,
      refresh_url: `http://localhost:3000/success`,
      return_url: `http://localhost:3000/success`, //when seller is connecting his stripe connect account then it will authomatically redirect seller to this url
      type: "account_onboarding",
    });
    res.json({ url: accountLink.url });
  } catch (error) {
    return next(error);
  }
};

//login seller
export const loginSeller = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return next(new ValidationError("Email and password are required"));
    const seller = await prisma.sellers.findUnique({ where: { email } });
    if (!seller) return next(new ValidationError("Invalid email or password"));
    //verify password
    const isMatch = await bcrypt.compare(password, seller.password!);
    if (!isMatch)
      return next(new ValidationError("Invalid email or password!"));

    //we are first checking which token is available in cookie in middleware
    // we should make sure when seller is logging in remove the user access_token and refresh_token, repeat the same for user login, remove seller-refresh-token and seller-access-token
    res.clearCookie("access_token");
    res.clearCookie("refresh_token");

    //if everything goes right generate access and refresh token
    const accessToken = jwt.sign(
      { id: seller.id, role: "seller" },
      process.env.ACCESS_TOKEN_SECRET as string,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: seller.id, role: "seller" },
      process.env.REFRESH_TOKEN_SECRET as string,
      { expiresIn: "7d" }
    );

    // store refresh token and access token
    // the main website sill be shopstack.com, the seller will be seller.shopstack.com, we will be using same domain everywhere
    // if we use here same cookies then if we do login inside user, seller will automatically get logout because cookies name is same
    // to add the security we can add same cookie name, if we don't want the security ie you can login inside your user and seller account in same browser we can change the cookie name
    setCookie(res, "seller-refresh-token", refreshToken);
    setCookie(res, "seller-access-token", accessToken);
    res.status(200).json({
      message: "Login successfull!",
      seller: { id: seller.id, email: seller.email, name: seller.name },
    });
  } catch (error) {
    next(error);
  }
};

//get logged in seller
export const getSeller = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const seller = req.seller;

    // fetch followers count using correct field name
    const followersCount = await prisma.followers.count({
      where: { shopsId: seller.shop.id }, // 👈 match Prisma schema
    });

    res.status(200).json({
      success: true,
      seller: {
        ...seller,
        followers: followersCount,
      },
    });
  } catch (error) {
    next(error);
  }
};

// update user password
export const updateUserPassword = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword, confirmPassword } = req.body;
    if (!currentPassword || !newPassword || !confirmPassword) {
      return next(new ValidationError("All fields are required"));
    }
    if (newPassword !== confirmPassword) {
      return next(new ValidationError("New passwords donot match"));
    }
    if (currentPassword === newPassword) {
      return next(
        new ValidationError(
          "New password cannot be the same as the current password."
        )
      );
    }
    const user = await prisma.users.findUnique({ where: { id: userId } });
    if (!user || !user.password) {
      return next(new AuthError("user not found or password not set"));
    }

    const isPasswordCorrect = await bcrypt.compare(
      currentPassword,
      user.password
    );
    if (!isPasswordCorrect) {
      return next(new AuthError("current password is incorrect"));
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);

    await prisma.users.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return res.status(200).json({ message: "password updated successfully" });
  } catch (error) {
    next(error);
  }
};

// logout user
export const logOutUser = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  res.status(201).json({ success: true });
};

// only have a login API for admin, but no signup for admin.“Where does the admin account come from if no one can sign up as admin?”
// Seed Admin in the Database:This way, you have one pre-defined admin account that you use to log in.
// All other users come from normal signup flow and get role = "user" / "seller".
export const loginAdmin = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return next(new ValidationError("Email and password are required!"));
    }
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) return next(new AuthError("User doesn't exists!"));

    // verify password
    const isMatch = await bcrypt.compare(password, user.password!);
    if (!isMatch) {
      return next(new AuthError("Invalid email or password"));
    }

    const isAdmin = user.role === "admin";
    if (!isAdmin) {
      sendLog({
        type: "error",
        message: `Admin login failed for ${email}-not an admin`,
        source: "auth-service",
      });

      return next(new AuthError("Invalid access!"));
    }
    sendLog({
      type: "success",
      message: `Admin login successful: ${email}`,
      source: "auth-service",
    });

    //when admin is logged in seller can't be logged in
    res.clearCookie("seller-access-token");
    res.clearCookie("seller-refresh-token");

    // generate access and refresh token
    //     model users {
    //   id    String @id @default(auto()) @map("_id") @db.ObjectId
    // }
    // Prisma was storing your users.id as an ObjectId (MongoDB style).
    // When you did jwt.sign({ id: user.id }), jsonwebtoken stored it in the payload as a raw object (or not stringified correctly).
    // Later, in isAuthenticated, you called:await prisma.users.findUnique({ where: { id: decoded.id } });
    // But decoded.id was not in the exact format Prisma expected (ObjectId vs string).
    // By wrapping it with String(user.id) when signing, the token payload carries a plain string that Prisma can match against. ✅
    // Always store id in JWT as a string:
    const accessToken = jwt.sign(
      { id: String(user.id), role: "admin" },
      process.env.ACCESS_TOKEN_SECRET! as string,
      { expiresIn: "15m" }
    );

    const refreshToken = jwt.sign(
      { id: String(user.id), role: "admin" },
      process.env.REFRESH_TOKEN_SECRET! as string,
      { expiresIn: "7d" }
    );
    // store thr efresh and access token in an httponly secure cookie
    setCookie(res, "refresh_token", refreshToken);
    setCookie(res, "access_token", accessToken);
    res.status(200).json({
      message: "Login successful!",
      user: { id: user.id, email: user.email, name: user.name },
    });
  } catch (error) {
    next(error);
  }
};

export const getAdmin = async (req: any, res: Response, next: NextFunction) => {
  try {
    console.log("inside getadmin");
    const user = req.user;
    console.log(user);

    res.status(201).json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

export const logOutAdmin = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  res.clearCookie("access_token");
  res.clearCookie("refresh_token");
  res.status(201).json({ success: true });
};

export const logOutSeller = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  res.clearCookie("seller_access_token");
  res.clearCookie("seller_refresh_token");
  res.status(201).json({ success: true });
};

// we can also have other service for adding /deleting user address
// userId: (1)[
//   ({ id: 1, label: "Home", isDefault: true },
//   { id: 2, label: "Work", isDefault: false })
// ];
// Now user adds a new address (Parents) with isDefault = true.
// This snippet will:
// Find all addresses where userId = 1 and isDefault = true (→ “Home”).
// Update them to isDefault = false.
// after update:
// [
//   { id: 1, label: "Home", isDefault: false },
//   { id: 2, label: "Work", isDefault: false }
// ]
// Then the new Parents address is inserted with isDefault = true.
// [
//   { id: 1, label: "Home", isDefault: false },
//   { id: 2, label: "Work", isDefault: false },
//   { id: 3, label: "Parents", isDefault: true }
// ]

export const addUserAddress = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    //get the user id, user who wants to add the addresses
    const userId = req.user?.id;

    //     label → e.g. "Home", "Office"
    // name → recipient name
    // street, city, zip, country → address details
    // isDefault → whether this is the default address
    const { label, name, street, city, zip, country, isDefault } = req.body;
    if (!label || !name || !street || !city || !zip || !country)
      return next(new ValidationError("All fields are required"));
    // updateMany is a Prisma query that:
    // Finds all records in a table matching the where condition.
    // Updates them with the provided data.
    // Returns a count of how many rows were updated
    //     If the new address is marked as default,
    //   Looks at the address table.
    // Finds all addresses belonging to the current user (userId) that are already marked as default (isDefault: true).
    // Updates them to not default (isDefault: false).
    if (isDefault) {
      await prisma.address.updateMany({
        where: {
          userId,
          isDefault: true,
        },
        data: { isDefault: false },
      });
    }
    // Imagine a user can have multiple saved addresses:
    // Home
    // Work
    // Parents’ place

    // But usually you only want one default address at a time.
    // If the user marks a new address as default:
    // First, you must “reset” any other default addresses to false.
    // Then, when you create the new one, it becomes the only default address.
    //Saves the new address in the address table with the provided details
    const newAddress = await prisma.address.create({
      data: { userId, label, name, street, city, zip, country, isDefault },
    });

    res.status(201).json({ success: true, address: newAddress });
  } catch (error) {
    next(error);
  }
};

export const deleteUserAddress = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    const { addressId } = req.params;
    if (!addressId) {
      return next(new ValidationError("Address ID is required"));
    }
    const { label, name, street, city, zip, country, isDefault } = req.body;
    //     findFirst returns the first record that matches the filter (where condition).
    // If no record matches → returns null.
    // If multiple records match → it will return the first one based on natural DB order (or by orderBy if you specify).
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId,
      },
    });
    if (!existingAddress) {
      return next(new NotFoundError("Address not found or unauthorized"));
    }

    await prisma.address.delete({
      where: {
        id: addressId,
      },
    });
    res
      .status(200)
      .json({ success: true, message: "Address deleted successfully" });
  } catch (error) {
    next(error);
  }
};

export const getUserAddresses = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const userId = req.user?.id;
    //     findMany retrieves all rows that match the where condition.
    // Returns an array of objects.
    // If no record matches, it just returns an empty array (not null).
    const addresses = await prisma.address.findMany({
      where: {
        userId,
      },
      orderBy: {
        createdAt: "desc",
      },
    });
    res.status(200).json({
      success: true,
      addresses,
    });
  } catch (error) {
    next(error);
  }
};

// fetch layout data
export const getLayoutData = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const layout = await prisma.site_config.findFirst();
    return res.status(200).json({
      success: true,
      layout,
    });
  } catch (error) {
    return next(error);
  }
};
