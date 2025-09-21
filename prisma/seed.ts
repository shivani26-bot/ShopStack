import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { ObjectId } from "bson";

// import dotenv from "dotenv";
// dotenv.config();
const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL!;
  const adminPassword = process.env.ADMIN_PASSWORD!;

  // Check if admin already exists
  const existingAdmin = await prisma.users.findUnique({
    where: { email: adminEmail },
  });

  if (existingAdmin) {
    console.log("✅ Admin already exists:", existingAdmin.email);
    return;
  }

  // Hash password
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // Create admin
  const admin = await prisma.users.create({
    data: {
      name: "Super Admin",
      email: adminEmail,
      role: "admin",
      password: hashedPassword,
      imagesId: new ObjectId().toString(), // or uuid
    },
  });

  console.log("✅ Admin created:", admin.email);
}

main()
  .catch((e) => {
    console.error("❌ Error seeding admin:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

//   P2002 Unique constraint failed on the constraint: users_imagesId_key
// This is a Prisma-level error:
// Your users table has a unique field imagesId, but when you create the admin, you’re not providing a value, so Prisma is probably defaulting it to null.
// 👉 And if your schema says @unique, multiple rows with null are not allowed.

// The column imagesId in your users model is of type @db.ObjectId,
// generate a proper ObjectId.
// Prisma accepts new ObjectId() from the bson package

// npm install bson --legacy-peer-deps

// make a seed.ts file to seed the default admin in db
// npm run seed to insert the data in database , add the sedd script in package.json
