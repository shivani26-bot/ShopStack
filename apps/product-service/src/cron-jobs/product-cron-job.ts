import prisma from "@packages/libs/prisma";
import cron from "node-cron";

// to start the cronjob include this in main.ts file
// run after every 1 hour
// Runs the task at minute 0 of every hour (e.g., 1:00, 2:00, 3:00 …).
cron.schedule("0 * * * *", async () => {
  try {
    const now = new Date(); //current timestamp
    //delete products where `deletedAt is older thatn 24 hours
    // const deletedProducts = await prisma.products.deleteMany({
    //   where: {
    //     isDeleted: true,
    //     deletedAt: { lte: now },
    //   },
    // });
    // console.log(
    //   `${deletedProducts.count} expired products permanently deleted`
    // );
    // Permanently deletes all products that:
    // isDeleted: true (soft deleted earlier).
    // deletedAt <= now (deletion grace period expired).
    await prisma.products.deleteMany({
      where: {
        isDeleted: true,
        deletedAt: { lte: now },
      },
    });
  } catch (error) {
    console.log(error);
  }
});

// Example Timeline

// t = 0h → User deletes a product → DB: { isDeleted: true, deletedAt: now+24h }.
// t = 5h → User restores → DB: { isDeleted: false, deletedAt: null }.
// t = 24h → Cron runs → If product wasn’t restored → permanently deleted.
