import {
  AuthError,
  NotFoundError,
  ValidationError,
} from "@packages/error-handler";
import { imagekit } from "@packages/libs/imagekit";
import prisma from "@packages/libs/prisma";
import { Prisma } from "@prisma/client";
import { NextFunction, Request, Response } from "express";

//get product categories
export const getCategories = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const config = await prisma.site_config.findFirst();
    if (!config) {
      return res.status(404).json({ message: "Categories not found" });
    }
    return res.status(200).json({
      categories: config.categories,
      subCategories: config.subCategories,
    });
  } catch (error) {
    return next(error);
  }
};

// create discount codes
export const createDiscountCodes = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { public_name, discountType, discountValue, discountCode } = req.body;
    const isDiscountCodeExists = await prisma.discount_codes.findUnique({
      where: { discountCode },
    });

    // we can't create same discount code for different type
    if (isDiscountCodeExists) {
      return next(
        new ValidationError(
          "Discount code already available please use a differnet code!"
        )
      );
    }
    const discount_code = await prisma.discount_codes.create({
      data: {
        public_name,
        discountType,
        discountValue: parseFloat(discountValue),
        discountCode,
        sellerId: req.seller.id,
      },
    });
    return res.status(201).json({ success: true, discount_code });
  } catch (error) {
    next(error);
  }
};

//get discount codes
export const getDiscountCodes = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    //find all the discount codes related with the seller
    const discount_codes = await prisma.discount_codes.findMany({
      where: {
        sellerId: req.seller.id,
      },
    });
    return res.status(200).json({ success: true, discount_codes });
  } catch (error) {
    next(error);
  }
};

// delete discount code
export const deleteDiscountCode = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.params; //extract the discount code id from the URL
    const sellerId = req.seller?.id; //logged-in seller’s id

    // discount code must need to be owned by the seller,if ownership matches then only we can delete
    const discountCode = await prisma.discount_codes.findUnique({
      where: { id }, //look up the discount code in the DB by its id.
      select: { id: true, sellerId: true }, //select ensures you only fetch the fields you actually need (id and sellerId) instead of the whole record — efficient! ✅
    });
    if (!discountCode) {
      return next(new NotFoundError("Discount code not found")); //Express sees it as an error and skips all normal route handlers until it finds an error-handling middleware (the one with signature (err, req, res, next)).
    }
    if (discountCode.sellerId !== sellerId) {
      return next(new ValidationError("Unauthorized access!"));
    }
    await prisma.discount_codes.delete({ where: { id } });
    return res
      .status(200)
      .json({ message: "Discount code successfully deleted" });
  } catch (error) {
    next(error);
  }
};

//upload product image
//inisde our imagekit dashboard/media library, under products folder we can see our image
export const uploadProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fileName } = req.body; //here filename is in base64 format
    //refer file upload section in the documentation :https://github.com/imagekit-developer/imagekit-nodejs?tab=readme-ov-file#file-upload
    //returns an object
    const response = await imagekit.upload({
      file: fileName,
      fileName: `product-${Date.now()}.jpg`,
      folder: "/products", //file path, inside products folder image iwl lbe stored
    });
    console.log("imagekitres", response);
    res.status(201).json({ file_url: response.url, fileId: response.fileId }); //fileId to delete the picture in future
  } catch (error) {
    next(error);
  }
};

// delete product image
export const deleteProductImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { fileId } = req.body;
    const response = await imagekit.deleteFile(fileId);
    res.status(201).json({ success: true, response });
  } catch (error) {
    next(error);
  }
};

//create product
export const createProduct = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      title,
      short_description,
      detailed_description,
      warranty,
      custom_specifications,
      slug,
      tags,
      cash_on_delivery,
      brand,
      video_url,
      category,
      colors = [],
      sizes = [],
      discountCodes,
      stock,
      sale_price,
      regular_price,
      subCategory,
      customProperties = [],
      images = [],
    } = req.body;

    console.log("reqbody", req.body);
    if (
      !title ||
      !slug ||
      !short_description ||
      !category ||
      !subCategory ||
      !sale_price ||
      !images ||
      !tags ||
      !stock ||
      !regular_price
    ) {
      return next(new ValidationError("Missing required fields"));
    }

    // if (!title) return next(new ValidationError("Title is required"));
    // if (!slug) return next(new ValidationError("Slug is required"));
    // if (!short_description)
    //   return next(new ValidationError("Short description is required"));
    // if (!category) return next(new ValidationError("Category is required"));
    // if (!subCategory)
    //   return next(new ValidationError("Sub-category is required"));
    // if (!sale_price) return next(new ValidationError("Sale price is required"));
    // if (!images || images.length === 0)
    //   return next(new ValidationError("At least one image is required"));
    // if (!tags) return next(new ValidationError("Tags are required"));
    // if (!stock) return next(new ValidationError("Stock is required"));
    // if (!regular_price)
    //   return next(new ValidationError("Regular price is required"));

    if (!req.seller.id) {
      return next(new AuthError("Only seller can create products!"));
    }

    //check the slug, if slug is available in database or not
    // design product database in schema.prisma
    const slugChecking = await prisma.products.findUnique({
      where: {
        slug,
      },
    });

    if (slugChecking) {
      return next(
        new ValidationError("Slug alreay exist! Please use a different slug!")
      );
    }

    const newProduct = await prisma.products.create({
      data: {
        title, //name of product
        short_description,
        detailed_description,
        warranty,
        cashOnDelivery: cash_on_delivery, //Boolean flag if COD available. mapping here, cash_on_delivery comes from frontend and cashOnDelivery is in backend database
        slug,
        shopId: req.seller?.shop?.id!, //Links product to seller’s shop.
        tags: Array.isArray(tags) ? tags : tags.split(","), //Array of tags for search/filter. If user enters comma-separated string → split into array.
        brand,
        video_url,
        category,
        subCategory,
        colors: colors || [],
        discount_codes: discountCodes.map((codeId: string) => codeId), //returns array
        sizes: sizes || [],
        stock: parseInt(stock),
        sale_price: parseFloat(sale_price),
        regular_price: parseFloat(regular_price),
        custom_properties: customProperties || {},
        custom_specifications: custom_specifications || {},
        images: {
          create: images
            .filter((img: any) => img && img.fileId && img.file_url)
            .map((image: any) => ({
              file_id: image.fileId,
              url: image.file_url,
            })),
        },
      },
      include: { images: true },
    });

    // Prisma assumes you have a relation between products and images (likely Product → Images one-to-many).
    // Here, instead of inserting images separately, you create related records at the same time.
    // Steps:
    // .filter(...) → Only keep valid images with fileId and file_url.
    // .map(...) → Convert each image into { file_id, url }.
    // create: [...] → Prisma creates child records in images table linked to this new product.
    // each product can have multiple images attached.

    //     By default, Prisma only returns the product itself.
    // With include: { images: true }, Prisma also fetches all related images (from the images table).

    //     {
    //   "id": "123",
    //   "title": "iPhone 15 Pro",
    //   "short_description": "Latest iPhone",
    //   "sale_price": 1200,
    //   "images": [
    //     { "id": "img1", "file_id": "abc123", "url": "https://cdn.com/img1.jpg" },
    //     { "id": "img2", "file_id": "xyz456", "url": "https://cdn.com/img2.jpg" }
    //   ]
    // }

    res.status(201).json({ success: true, newProduct });
  } catch (error) {
    next(error);
  }
};

// get logged in seller products
export const getShopProducts = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    //while creating our product we are adding our shopid as well
    const products = await prisma.products.findMany({
      where: {
        shopId: req?.sellers?.shop?.id, //logged in seller shop id
      },
      include: {
        images: true,
      },
    });
    res.status(201).json({ success: true, products });
  } catch (error) {
    next(error);
  }
};

// delete product
//we are not instantly deleting the product, its very good security
// we can run cron jobs to delete the data from database after 24 hours
// This API endpoint soft-deletes a product — meaning it does not permanently remove it right away.
// Instead:
// It marks it as isDeleted = true.
// It sets a deletedAt timestamp for 24 hours in the future.
// The product can be restored within this 24-hour window.
export const deleteProduct = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params;
    const sellerId = req.seller?.shop?.id; //Ensures only the shop owner (seller) can delete their own product.
    const product = await prisma.products.findUnique({
      where: { id: productId },
      select: { id: true, shopId: true, isDeleted: true }, //Only return id, shopId, and isDeleted.
    });
    if (!product) {
      return next(new ValidationError("Product not found"));
    }
    if (product.shopId !== sellerId) {
      //Prevents someone else’s product from being deleted.
      return next(new ValidationError("Unauthorized action"));
    }
    if (product.isDeleted) {
      //If the product is already in deleted state → no need to delete again.
      return next(new ValidationError("Product is already deleted"));
    }

    //     Update the product record:
    // isDeleted = true → marks it deleted.
    // deletedAt = now + 24 hours → schedules when it will be permanently removed.
    const deletedProduct = await prisma.products.update({
      where: { id: productId },
      data: {
        isDeleted: true,
        deletedAt: new Date(Date.now() + 24 * 60 * 60 * 1000), //If you want deletedAt to be 24 hours from now:Date.now() gives current timestamp in milliseconds.
      },
    });
    return res.status(200).json({
      message:
        "Product is scheduled for deletion in 24 hours.You can restore it withing this time period",
      deletedAt: deletedProduct.deletedAt, //deletedAt timestamp (useful if frontend wants to show countdown).
    });
  } catch (error) {
    next(error);
  }
};

// restore product
// It restores a soft-deleted product:
// Makes isDeleted = false.
// Clears the scheduled deletion time (deletedAt = null).
export const restoreProduct = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { productId } = req.params; //product to restore
    console.log("pid", productId);
    const sellerId = req.seller?.shop?.id; //logged-in seller’s shop ID.
    const product = await prisma.products.findUnique({
      where: { id: productId },
      select: { id: true, shopId: true, isDeleted: true }, //Only return id, shopId, and isDeleted.
    });
    if (!product) {
      return next(new ValidationError("Product not found"));
    }
    if (product.shopId !== sellerId) {
      return next(new ValidationError("Unauthorized action"));
    }
    if (!product.isDeleted) {
      //if the product is not deleted, no need to restore.
      return res
        .status(400)
        .json({ message: "Product is not in deleted state." });
    }
    await prisma.products.update({
      //Sets product back to active state
      where: { id: productId },
      data: {
        isDeleted: false,
        deletedAt: null,
      },
    });
    return res.status(200).json({
      message: "Product successfully restored!",
    });
  } catch (error) {
    return res.status(500).json({ message: "Error restoring product", error });
  }
};

//get all products
// fetches products from your database using Prisma with server-side pagination + sorting.
export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  //server side pagination
  try {
    // Reads page and limit from query params (/products?page=2&limit=10).
    // Defaults: page = 1, limit = 20.
    // Example: page=2, limit=20 → skip=20 → fetch rows 21–40.
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit; //skip tells Prisma how many rows to skip → (page - 1) * limit.
    const type = req.query.type;
    // Only includes products where either starting_date is null OR ending_date is null.
    // Basically filters out products with both dates set.
    const baseFilter = {}; //to fetch all the products
    //this inside basefilter  was causing error
    // OR: [
    //         { starting_date: null },
    //         {
    //           ending_date: null,
    //         },
    //       ],
    // If query param ?type=latest → sort by createdAt (newest first).
    // Otherwise → sort by totalSales (best-selling first).
    // Prisma generates the type productsOrderByWithRelationInput based on the actual fields in your schema.
    // If there’s no totalSales field in your products model, { totalSales: "desc" } is invalid.
    const orderBy: Prisma.productsOrderByWithRelationInput =
      type === "latest"
        ? { createdAt: "desc" as Prisma.SortOrder }
        : { totalSales: "desc" as Prisma.SortOrder };

    //fetch data in parallel
    //     Runs 3 queries at once:
    // Products list (with pagination + includes related images and Shop).
    // Total count of all products (needed to calculate total pages).
    // Top 10 products (ignores pagination, just fetches best/top/latest).
    const [products, total, top10Products] = await Promise.all([
      prisma.products.findMany({
        skip,
        take: limit,
        include: { images: true, Shop: true },
        where: baseFilter,
        orderBy: { totalSales: "desc" },
      }),
      prisma.products.count({ where: baseFilter }),
      prisma.products.findMany({ take: 10, where: baseFilter, orderBy }),
    ]);

    // console.log("productstotal", products, total);
    //     returns response products → current paginated results
    // top10Products → either latest 10 or top 10 sales
    // total → total number of products in DB
    // currentPage + totalPages → helps frontend render pagination UI
    return res.status(200).json({
      products,
      top10By: type === "latest" ? "latest" : "topSales",
      top10Products,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    next(error);
  }
};

//get all events or product on offers
export const getAllEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const basefilter = {
      // AND: [{ starting_date: { not: null } }, { ending_date: { not: null } }],
    };

    const [events, total, top10BySales] = await Promise.all([
      prisma.products.findMany({
        skip,
        take: limit,
        where: basefilter,
        include: {
          images: true,
          Shop: true,
        },
        orderBy: {
          totalSales: "desc",
        },
      }),
      prisma.products.count({ where: basefilter }),
      prisma.products.findMany({
        where: basefilter,
        take: 10,
        orderBy: {
          totalSales: "desc",
        },
      }),
    ]);
    res.status(200).json({
      events,
      top10BySales,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error) {
    res.status(500).json({ message: "failed to fetch events" });
  }
};
// get product details by slug
export const getProductDetails = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const product = await prisma.products.findUnique({
      where: {
        slug: req.params.slug!,
      },
      include: {
        //include the product images and shop details in the response
        images: true,
        Shop: true,
      },
    });
    return res.status(201).json({ success: true, product });
  } catch (error) {
    return next(error);
  }
};

// get filtered products
// fetching products with filters (price, category, color, size, pagination) using Prisma ORM.
export const getFilteredProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // Reads filters from the query string (req.query)
    const {
      priceRange = [0, 10000],
      categories = [],
      colors = [],
      sizes = [],
      page = 1,
      limit = 12,
    } = req.query;
    console.log("reqquery", req.query); //{ priceRange: '69.99,1199', page: '1', limit: '5' }
    //  Parse values into usable formats
    const parsedPriceRange =
      typeof priceRange === "string"
        ? priceRange.split(",").map(Number) //convert into array of numbers
        : [0, 10000];
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    //using same models for product and events
    // skip is used for pagination:
    // If page = 2, limit = 12 → skip = 12 (skip first 12 records)
    const skip = (parsedPage - 1) * parsedLimit;

    //   PRISMA RUNS: WHERE sale_price >= 69.99
    // AND sale_price <= 1199
    // AND starting_date IS NULL
    // starting_date: null → This is forcing Prisma to only fetch products whose starting_date is NULL.
    // If most products in your DB have a value in starting_date, you’ll always get []
    //  Ensures sale_price falls between the selected price range.

    //  means filters is just an object with string keys and values of any type.
    const filters: Record<string, any> = {
      sale_price: {
        gte: parsedPriceRange[0],
        lte: parsedPriceRange[1],
      },
      // starting_date: null,
    };
    // filter based on category
    // request contains categories (e.g. categories=Electronics,Fashion), this adds:filters.category = { in: ["Electronics", "Fashion"] }
    // prisma runs: WHERE category IN ("Electronics", "Fashion")
    // Array.isArray(categories)
    // This method checks whether the value is really an array.
    // Array.isArray("Electronics,Fashion"); // false
    // Array.isArray(["Electronics", "Fashion"]); // true
    // filters.category will always end up as an array
    if (categories && (categories as string[]).length > 0) {
      filters.category = {
        in: Array.isArray(categories)
          ? categories ///if it's already an array → use it directly
          : String(categories).split(","), //if it's a string → split it by comma
      };
    }

    // filter based on colors
    // hasSome → matches products that have at least one of these colors
    //  Example: if colors=["red","blue"], Prisma will only return products where:
    // colors contains "red" OR "blue"
    if (colors && (colors as string[]).length > 0) {
      filters.colors = {
        hasSome: Array.isArray(colors) ? colors : [colors],
      };
    }

    // filter based on category
    if (sizes && (sizes as string[]).length > 0) {
      filters.sizes = {
        hasSome: Array.isArray(sizes) ? sizes : [sizes],
      };
    }

    //query database with prisma
    // run two queries in parallel: findMany → fetches paginated products with applied filters (and includes related images + Shop).
    // count → gets total number of matching products.
    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where: filters,
        skip,
        take: parsedLimit,
        include: { images: true, Shop: true },
      }),
      prisma.products.count({ where: filters }),
    ]);

    //pagination info, If total = 50 and limit = 12 → totalPages = 5.
    const totalPages = Math.ceil(total / parsedLimit);

    return res.json({
      products,
      pagination: { total, page: parsedPage, totalPages },
    });
  } catch (error) {
    return next(error);
  }
};

// get filtered offers
export const getFilteredEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const {
      priceRange = [0, 10000],
      categories = [],
      colors = [],
      sizes = [],
      page = 1,
      limit = 12,
    } = req.query;

    const parsedPriceRange =
      typeof priceRange === "string"
        ? priceRange.split(",").map(Number)
        : [0, 10000];
    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    //using same models for product and events
    const skip = (parsedPage - 1) * parsedLimit;
    const filters: Record<string, any> = {
      sale_price: {
        gte: parsedPriceRange[0],
        lte: parsedPriceRange[1],
      },
      // NOT: {
      // starting_date: null,
      // },
    };
    // filter based on category
    if (categories && (categories as string[]).length > 0) {
      filters.category = {
        in: Array.isArray(categories)
          ? categories
          : String(categories).split(","),
      };
    }

    // filter based on colors
    if (colors && (colors as string[]).length > 0) {
      filters.colors = {
        hasSome: Array.isArray(colors) ? colors : [colors],
      };
    }

    // filter based on category
    if (sizes && (sizes as string[]).length > 0) {
      filters.sizes = {
        hasSome: Array.isArray(sizes) ? sizes : [sizes],
      };
    }

    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where: filters,
        skip,
        take: parsedLimit,
        include: { images: true, Shop: true },
      }),
      prisma.products.count({ where: filters }),
    ]);

    const totalPages = Math.ceil(total / parsedLimit);

    return res.json({
      products,
      pagination: { total, page: parsedPage, totalPages },
    });
  } catch (error) {
    return next(error);
  }
};

// get filtered shops
export const getFilteredShops = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { categories = [], countries = [], page = 1, limit = 12 } = req.query;

    const parsedPage = Number(page);
    const parsedLimit = Number(limit);

    //using same models for product and events
    const skip = (parsedPage - 1) * parsedLimit;
    const filters: Record<string, any> = {};
    // filter based on category
    if (categories && String(categories).length > 0) {
      filters.category = {
        in: Array.isArray(categories)
          ? categories
          : String(categories).split(","),
      };
    }

    // filter based on countries
    // for shop user can filter by countries
    if (countries && String(countries).length > 0) {
      filters.country = {
        in: Array.isArray(countries) ? countries : String(countries).split(","),
      };
    }
    console.log("filters", filters);
    const [shops, total] = await Promise.all([
      prisma.shops.findMany({
        where: filters,
        skip,
        take: parsedLimit,

        include: { sellers: true, products: true }, // followers: true,
      }),
      prisma.shops.count({ where: filters }),
    ]);
    console.log("filtershops", shops);

    const totalPages = Math.ceil(total / parsedLimit);

    return res.json({
      shops,
      pagination: { total, page: parsedPage, totalPages },
    });
  } catch (error) {
    return next(error);
  }
};

// search products
export const searchProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const query = req.query.q as string; //Reads the q query parameter (like /search?q=shoes). cast it to string
    if (!query || query.trim().length === 0) {
      return res.status(400).json({ message: "Search query is required." });
    }
    const products = await prisma.products.findMany({
      where: {
        //         Matches products where:
        // title contains the query (case-insensitive), OR
        // short_description contains the query (case-insensitive).
        OR: [
          {
            title: { contains: query, mode: "insensitive" },
          },
          {
            short_description: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
      select: {
        //return only id,title,slug
        id: true,
        title: true,
        slug: true,
      },
      take: 10, //Limit results to max 10 products
      orderBy: {
        createdAt: "desc", //Sort results by createdAt in descending order (newest first).
      },
    });

    return res.status(200).json({ products });
  } catch (error) {
    return next(error);
  }
};

// top 10 shops to display on homepage
// fetch the top 10 shops ranked by their total sales.
export const topShops = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // aggregate total sales per shop from orders
    //     Groups rows in the orders table by shopId.
    // Sums up the total field (likely the order amount).
    // Orders results by total sales (descending).
    // Takes only the top 10 shops.
    const topShopsData = await prisma.orders.groupBy({
      by: ["shopId"],
      _sum: {
        total: true,
      },
      orderBy: {
        _sum: {
          total: "desc",
        },
      },
      take: 10,
    });

    // fetching corresponding shop details
    // Extracts the shopIds from the first query.
    const shopIds = topShopsData.map((item) => item.shopId);
    console.log("shopIds", shopIds);
    //     Fetches shop details (name, avatar, banner, address, ratings, category) from the shops table.
    // Only includes shops that appear in the top sales list.
    const shops = await prisma.shops.findMany({
      where: {
        id: {
          in: shopIds,
        },
      },
      select: {
        id: true,
        name: true,
        avatar: true,
        coverBanner: true,
        address: true,
        // address: true,
        ratings: true,
        // followers: true,
        category: true,
      },
    });

    // merge sales with shop data
    //     Loops through each shop.
    // Finds the corresponding sales data (from step 1).
    // Adds a new field: totalSales.
    //     find() is an Array method in JavaScript.
    // It returns the first element in the array that satisfies a provided callback function.
    // If no element matches, it returns undefined.
    const enrichedShops = shops.map((shop) => {
      const salesData = topShopsData.find((s: any) => s.shopId === shop.id);
      return {
        ...shop,
        totalSales: salesData?._sum.total ?? 0,
      };
    });
    //  enrichedShops looks like:
    //  {
    //   "id": "shop1",
    //   "name": "Cool Electronics",
    //   "avatar": "...",
    //   "coverBanner": "...",
    //   "ratings": 4.5,
    //   "category": "Electronics",
    //   "totalSales": 5000
    // }

    //     Sorts shops again by totalSales (safe in case Prisma findMany returned unordered shops).
    // Slices to ensure only top 10 are included.
    // Returns them as JSON to the client
    const top10Shops = enrichedShops
      .sort((a, b) => b.totalSales - a.totalSales)
      .slice(0, 10);

    return res.status(200).json({ shops: top10Shops });
  } catch (error) {
    console.log("Error fetching top shops:", error);
    return next(error);
  }
};

// return res.status(...)...
// Exits the function immediately after sending the response.
// Ensures no more code in that function runs.
// Prevents "Can't set headers after they are sent" errors (which happen if you accidentally send multiple responses).

// res.status(...)...
// Sends the response, but does not exit the function.
// Any code after it will still run.
// Dangerous if you accidentally send another response later.

// Only skip return if it’s literally the last line of your function
