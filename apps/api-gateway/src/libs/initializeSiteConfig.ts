import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const initializeSiteConfig = async () => {
  try {
    // method fetches the first record that matches the query.
    //  existingConfig will be an object with all columns of site_config (e.g., id, name, value, etc.),
    // or null if no record exists.
    const existingConfig = await prisma.site_config.findFirst();
    if (!existingConfig) {
      await prisma.site_config.create({
        data: {
          categories: [
            "Electronics",
            "Fashion",
            "Home & Kitchen",
            "Sports & Fitness",
          ],
          subCategories: {
            Electronics: [
              "Mobiles & Accessories",
              "Laptops & Computers",
              "Audio & Headphones",
              "Cameras",
              "Wearables",
              "Gaming",
            ],
            Fashion: [
              "Men's Clothing",
              "Women's Clothing",
              "Footwear",
              "Bags & Accessories",
              "Jewelry",
              "Watches",
            ],
            "Home & Kitchen": [
              "Furniture",
              "Home Decor",
              "Kitchen Appliances",
              "Cookware & Dining",
              "Bedding",
              "Storage & Organization",
            ],
            "Sports & Fitness": [
              "Exercise Equipment",
              "Outdoor Sports",
              "Team Sports",
              "Yoga & Wellness",
              "Cycling",
              "Running Gear",
            ],
          },
        },
      });
    }
  } catch (error) {
    console.log("Error initializing site config:", error);
  }
};

export default initializeSiteConfig;
