import { NextFunction, Request, Response } from "express";
import { ValidationError } from "@packages/error-handler";
import crypto from "crypto";
import { sendEmail } from "./sendMail";
import redis from "@packages/libs/redis";
import prisma from "@packages/libs/prisma";
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// ^: Start of string$: End of string
// username part:
// [...]: A character set, ^ (inside set): Negation (not these characters)
// \s: Any whitespace character (space, tab, etc.)
// @: The actual @ symbol
// [^\s@]+: One or more characters that are not whitespace or @
// \. :Escaped dot (.) — because . in regex means "any character", so we escape it to mean a literal dot.
// ✅ Represents the dot between domain and TLD (e.g., gmail.**com**)

export const validateResgistrationData = (
  data: any,
  userType: "user" | "seller"
) => {
  const { name, email, password, phone_number, country } = data;
  if (
    !name ||
    !email ||
    !password ||
    (userType === "seller" && (!phone_number || !country))
  ) {
    throw new ValidationError("Missing required fields!");
  }
  if (!emailRegex.test(email)) {
    throw new ValidationError("Invalid email format");
  }
};

//use redis:secondary or cache database, store data which we don't want for long term
// after sending email, when we again try to send email, first we check otp restriction, from here we will check user email status

// When someone tries to send OTP requests repeatedly, we need to prevent spamming. For example, imagine a user sends an OTP at 3:47 a.m., then again at 3:48 a.m., and again at 3:49 a.m. This means the user is sending requests back-to-back every minute. If this continues, it's a clear indication of potential abuse.
// To prevent this kind of spamming, we implement a limit. If a user sends OTP requests three times in a short period (e.g., one request per minute for three consecutive minutes), we temporarily lock further OTP requests for that user.
// After hitting this limit, any further OTP request from the same email will be blocked for the next 1 hour. Instead of sending the OTP, we respond with a message like:
// "Too many OTP requests. Please wait one hour before trying again."
// This adds a layer of security and helps protect our system from abuse. Many platforms that rely on email verification suffer from spam attacks, so adding these rate limits and temporary locks is essential to ensure system stability and prevent misuse.
export const checkOtpRestrictions = async (
  email: string,
  next: NextFunction
) => {
  // Takes a user’s email (to identify them in Redis keys).
  // Takes next (from Express middleware) to either continue the request or pass an error.
  // This function is meant to check Redis for certain OTP restrictions before allowing an OTP request or verification.

  // otp_lock :entering wrong otp for more than three times, may be you are not the real owner of the account, trying to hack user account , in such cases lock the otp
  // Checks if Redis has a key like otp_lock:user@example.com.
  // If it exists → means the account is locked due to too many wrong OTP attempts.
  // Calls next() with a ValidationError (Express way of returning an error to middleware/route handler).
  // Effect: Blocks the request and sends error response "Account locked due to multiple failed attempts...".
  if (await redis.get(`otp_lock:${email}`)) {
    throw new ValidationError(
      "Account locked due to multiple failed attemps: Try again after 30 minutes"
    );
  }

  //   Checks if Redis has a key like otp_spam_lock:user@example.com.
  // This means the user has requested OTPs too many times in a short span → anti-spamming measure.
  // If found → block the request for 1 hour.
  if (await redis.get(`otp_spam_lock:${email}`)) {
    throw new ValidationError(
      "Too many OTP requests! Please wait 1 hour before requesting again."
    );
  }

  //    Checks if Redis has otp_cooldown:user@example.com.
  // This means the user must wait a short cooldown period (like 1 minute) before they can request another OTP.
  // This prevents rapid OTP spamming even if total requests are under the hourly limit
  if (await redis.get(`otp_cooldown:${email}`)) {
    throw new ValidationError(
      "Please wait 1minute before requesting a new OTP!"
    );
  }
};

export const trackOtpRequests = async (email: string, next: NextFunction) => {
  // Creates a Redis key name like otp_request_count:user@example.com to store the count of OTP requests for that specific email.
  const otpRequestKey = `otp_request_count:${email}`;
  // Fetches the current OTP request count from Redis.If it doesn’t exist, defaults to "0".Parses it into a number.
  let otpRequests = parseInt((await redis.get(otpRequestKey)) || "0");
  // If the count is 2 or more, it means the user is spamming OTP requests.Sets a new key otp_spam_lock:<email> with "locked", expiring in 3600 seconds (1 hour).
  if (otpRequests >= 2) {
    await redis.set(`otp_spam_lock:${email}`, "locked", "EX", 3600); //lock for 1 hour

    // Immediately sends an error response using next() to stop further processing.
    throw new ValidationError(
      "Too many OTP requests! Please wait 1 hour before requesting again."
    );
  }
  // Updates the OTP request count, setting expiry to 1 hour.
  await redis.set(otpRequestKey, otpRequests + 1, "EX", 3600); //tracking requests for 1 hour
};
// while sending otp send user info in redis
// email and otp need to be stored in redis
export const sendOtp = async (
  name: string,
  email: string,
  template: string
) => {
  // 4 digit random integers
  const otp = crypto.randomInt(1000, 9999).toString();
  await sendEmail(email, "Verify Your Email", template, { name, otp });
  //store the otp for 5 minutes in the redis database
  await redis.set(`otp:${email}`, otp, "EX", 300);
  await redis.set(`otp_cooldown:${email}`, "true", "EX", 60); //cooldown of 1 minute, can request next otp after 1 minute
};

export const verifyOtp = async (
  email: string,
  otp: string,
  next: NextFunction
) => {
  // Retrieves the OTP stored in Redis for this email.
  const storedOtp = await redis.get(`otp:${email}`);
  // If there’s no OTP in Redis: Either it was never generated, or it expired.
  // Immediately stop and send a ValidationError saying it's invalid or expired.
  if (!storedOtp) {
    //     throw stops execution in verifyOtp immediately
    // As soon as you throw, no further lines in that function run.
    // The error propagates up to the calling function (verifyUser)
    // In your case:
    // await verifyOtp(email, otp, next);
    //     Since you didn’t wrap verifyOtp in a try/catch inside itself, the thrown error bubbles up.
    // verifyUser has a try/catch around the call
    // throw: lets the error bubble to the nearest catch
    // return next(error): directly calls Express' error handler without needing a catch in the caller.
    // throw in verifyOtp → catch in verifyUser → next(error) → Express error handler.
    // If you used return next(error) inside verifyOtp instead of throwing, it would bypass the catch in verifyUser and go straight to the error handler.
    throw new ValidationError("Invalid or expired OTP!");
  }
  // failedAttemptsKey is a Redis key to track how many times this user has entered a wrong OTP.
  const failedAttemptsKey = `otp_attempts:${email}`;
  // Fetches the current failed attempts count from Redis (defaulting to 0 if not found).
  const failedAttempts = parseInt((await redis.get(failedAttemptsKey)) || "0");
  //   Entered OTP is wrong
  // If user has already failed 2 times:
  // Lock their account (otp_lock) for 30 minutes.
  // Delete the OTP so they can’t keep guessing.
  // Return an error saying the account is locked.
  // Else:
  // Increment failed attempts by 1 (expire in 5 minutes).
  // Return error telling them how many tries remain.
  if (storedOtp !== otp) {
    if (failedAttempts >= 2) {
      await redis.set(`otp_lock:${email}`, "locked", "EX", 1800); //lock for 30 minutes
      await redis.del(`otp:${email}`);
      // return next(new ValidationError(...)) → Immediately stops execution in this function and sends the error to your central error handler.
      throw new ValidationError(
        "Too many failed attempts. Your account is locked for 30 minutes!"
      );
    }
    await redis.set(failedAttemptsKey, failedAttempts + 1, "EX", 300); //expires in 5 minutes

    throw new ValidationError(
      `Incorrect OTP. ${2 - failedAttempts} attempts left.`
    );
  }
  // OTP is correct
  // Remove both:
  // The OTP itself (otp:${email}).
  // Any failed attempts tracking (otp_attempts:${email}).
  // This prevents re-use and cleans up Redis.
  await redis.del(`otp:${email}`, failedAttemptsKey);
};

// User clicks “Forgot Password” on the login page.
// User enters their email.
// Backend calls handleForgotPassword:
// Checks if the email exists in DB.
// Sends OTP to that email.
// User receives OTP in email.
// User enters OTP in the app to verify identity.
// If OTP is valid, backend allows password reset.
export const handleForgotPassword = async (
  req: Request,
  res: Response,
  next: NextFunction,
  userType: "user" | "seller"
) => {
  try {
    const { email } = req.body;

    if (!email) throw new ValidationError("Email is required!");
    //find user/seller in db
    //     If userType is "user", it searches the users table for a record with that email using Prisma ORM.
    // You could extend this logic for "seller" if needed.
    const user =
      userType === "user"
        ? await prisma.users.findUnique({ where: { email } })
        : await prisma.sellers.findUnique({ where: { email } });

    if (!user) throw new ValidationError(`${userType} not found!`);

    //check otp restrictions
    await checkOtpRestrictions(email, next);
    await trackOtpRequests(email, next);

    //generate otp and send email
    //     Without OTP verification, anyone could reset anyone else’s password just by knowing their email.
    // OTP acts as proof that the person requesting the reset has access to the email account.

    await sendOtp(
      user.name,
      email,
      userType === "user"
        ? "forgot-password-user-mail"
        : "forgot-password-seller-mail"
    );
    res
      .status(200)
      .json({ message: "OTP sent to email. Please verify your account." });
  } catch (error) {
    next(error);
  }
};

export const verifyForgotPasswordOtp = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, otp } = req.body;
    if (!email || !otp)
      throw new ValidationError("Email and OTP are required!");
    await verifyOtp(email, otp, next);
    res
      .status(200)
      .json({ message: "OTP verified. You can now reset your password." });
  } catch (error) {
    next(error);
  }
};
