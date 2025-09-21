import jwt from "jsonwebtoken";
import { NextFunction, Response } from "express";
import prisma from "@packages/libs/prisma";

//checks if the request is coming from an authenticated user.
const isAuthenticated = async (req: any, res: Response, next: NextFunction) => {
  console.log("inside isauthenticated");
  try {
    // req.cookies["access_token"] and req.cookies.access_token are used to read a property from the cookies object
    // dot notation
    // req.cookies.access_token:Uses a literal property name (access_token). Only works if the property name is a valid JS identifier (letters, numbers, _, and $ — but cannot start with a number).
    // Fails if the cookie name has:Hyphens (-),Spaces,Special characters
    // req.cookies["access-token"] // ✅
    // req.cookies.access-token    // ❌ Syntax error

    // bracket notation :
    // Allows any string as the property name.
    // Must be used if the cookie name contains characters not valid in identifiers (like -, space, .).
    // Useful when the property name is stored in a variable:
    // const tokenName = "access_token";
    // req.cookies[tokenName]; // ✅ works

    //     req.cookies.access_token → if you stored the token in an HTTP-only cookie.
    // req.headers.authorization → if you sent the token as a Bearer token in headers (Authorization: Bearer <token>).
    const token =
      req.cookies["access_token"] ||
      req.cookies["seller-access-token"] ||
      req.headers.authorization?.split(" ")[1];
    if (!token)
      return res.status(401).json({ message: "Unauthorized! Token missing." });
    //verify token
    // Verifies the JWT using your ACCESS_TOKEN_SECRET.If valid → extracts the payload (id and role)
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET!) as {
      id: string;
      role: "user" | "seller" | "admin";
    };
    if (!decoded) {
      return res.status(401).json({ message: "Unauthorized! Invalid token." });
    }

    let account;
    if (decoded.role === "user" || decoded.role === "admin") {
      // Queries the database to check if a user with this id still exists.
      // This ensures that even if the token is valid, a deleted or deactivated user cannot access the system.
      account = await prisma.users.findUnique({
        where: { id: decoded.id },
      });
      // Attaches the authenticated user object to req.user.
      // This makes the user available in later middleware/controllers (e.g., you can access req.user.id inside your routes).
      console.log("account", account);
      req.user = account;
    } else if (decoded.role === "seller") {
      account = await prisma.sellers.findUnique({
        where: { id: decoded.id },
        include: { shop: true }, //tells Prisma: “Along with the seller, also fetch their related shop record(s).” From schema, we have a relation between sellers and shops
      });
      req.seller = account;
    }

    if (!account) {
      return res.status(401).json({ message: "Account not found!" });
    }
    req.role = decoded.role;
    return next(); //returns to the next function ie controller, as its called in router
  } catch (error) {
    console.log("error");
    return res
      .status(401)
      .json({ message: "Unauthorized! Token expired or invalid." });
  }
};

export default isAuthenticated;
