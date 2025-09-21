//use prisma client:A type-safe, auto-generated database client
// This is what you use in your code to query and manipulate your database.

import { PrismaClient } from "@prisma/client";

// singleton pattern to ensure that:
// You reuse the same PrismaClient instance across your entire application

//This is TypeScript magic.
// You're extending the global scope (globalThis) to declare a prismadb property of type PrismaClient.
// This makes global.prismadb known to TypeScript, so it doesn't complain when you use it later.

declare global {
  namespace globalThis {
    var prismadb: PrismaClient;
  }
}

//Creates a new instance of PrismaClient.opens a new connection to your database.
// const prisma = new PrismaClient();

// // stores the prisma instance on the global object, so it can be reused in other modules.
// if (process.env.NODE_ENV === "production") global.prismadb = prisma;
const prisma = global.prismadb ?? new PrismaClient();
if (process.env.NODE_ENV !== "production") global.prismadb = prisma;

export default prisma;

// global is a global object in Node.js, like window in browsers. It exists everywhere.
// We’re creating a property on it called prismadb and assigning the PrismaClient instance to it.
// Wherever you are in your codebase (any file), you can now access the Prisma client using global.prismadb, without creating a new one.
// Why this is useful
// In development mode, tools like Next.js, Vite, or ts-node-dev hot-reload your files.
// That means your PrismaClient code can run multiple times, and if you do this:
// Each time it reloads, it creates a new connection. That can lead to:
// Too many open DB connections
// Errors like: PrismaClientInitializationError: already connected

// In development, the Prisma client is stored globally on the first run, then reused on future reloads.
// In production, it creates a new instance every time (as expected).
