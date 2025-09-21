import { ValidationError } from "@packages/error-handler";
import prisma from "@packages/libs/prisma";
import { NextFunction, Request, Response } from "express";

// get all products for admin
export const getAllProducts = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("admin getproducts");
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [products, totalProducts] = await Promise.all([
      prisma.products.findMany({
        // where: { starting_date: null },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          sale_price: true,
          stock: true,
          createdAt: true,
          category: true,
          ratings: true,
          images: { select: { url: true }, take: 1 },
          Shop: {
            select: { name: true },
          },
        },
      }),
      //count the products
      //   where: { starting_date: null }
      prisma.products.count({}),
    ]);

    const totalPages = Math.ceil(totalProducts / limit);
    res.status(200).json({
      success: true,
      data: products,
      meta: { totalProducts, currentPage: page, totalPages },
    });
  } catch (error) {
    next(error);
  }
};

// get all events
export const getAllEvents = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [events, totalEvents] = await Promise.all([
      prisma.products.findMany({
        // where: { starting_date:{ not: null }},
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          slug: true,
          sale_price: true,
          stock: true,
          createdAt: true,
          category: true,
          ratings: true,
          images: { select: { url: true }, take: 1 },
          Shop: {
            select: { name: true },
          },
        },
      }),
      //count the products
      //   where: { starting_date:{ not: null} }
      prisma.products.count({}),
    ]);

    const totalPages = Math.ceil(totalEvents / limit);
    res.status(200).json({
      success: true,
      data: events,
      meta: { totalEvents, currentPage: page, totalPages },
    });
  } catch (error) {
    next(error);
  }
};

// get all admins
export const getAllAdmins = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    //find all the users whose role is admin
    const admins = await prisma.users.findMany({ where: { role: "admin" } });

    res.status(201).json({ success: true, admins });
  } catch (error) {
    next(error);
  }
};

// add new admin, only admin can do this
export const addNewAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { email, role } = req.body;
    const isUser = await prisma.users.findUnique({ where: { email } });
    // random emails that aren’t in your DB will fail.
    if (!isUser) {
      return next(new ValidationError("Something went wrong!"));
    }

    const updateRole = await prisma.users.update({
      where: { email },
      data: { role },
    });
    res.status(201).json({ success: true, updateRole });
  } catch (error) {
    next(error);
  }
};

// fetch all customization
export const getAllCustomizations = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const config = await prisma.site_config.findFirst();

    return res.status(200).json({
      categories: config?.categories || [],
      subCategories: config?.subCategories || {},
      logo: config?.logo || null,
      banner: config?.banner || null,
    });
  } catch (error) {
    return next(error);
  }
};

// get all users
export const getAllUsers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [users, totalUsers] = await Promise.all([
      prisma.users.findMany({
        // where: { starting_date: null },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      }),

      prisma.products.count(),
    ]);

    const totalPages = Math.ceil(totalUsers / limit);
    res.status(200).json({
      success: true,
      data: users,
      meta: { totalUsers, currentPage: page, totalPages },
    });
  } catch (error) {
    next(error);
  }
};

// get all sellers
export const getAllSellers = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const [sellers, totalSellers] = await Promise.all([
      prisma.sellers.findMany({
        // where: { starting_date: null },
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          shop: {
            select: {
              name: true,
              avatar: true,
              address: true,
            },
          },
        },
      }),

      prisma.products.count(),
    ]);

    const totalPages = Math.ceil(totalSellers / limit);
    res.status(200).json({
      success: true,
      data: sellers,
      meta: { totalSellers, currentPage: page, totalPages },
    });
  } catch (error) {
    next(error);
  }
};

// get all notifications
export const getAllNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const notifications = await prisma.notifications.findMany({
      where: {
        receiverId: "admin",
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({ success: true, notifications });
  } catch (error) {
    return next(error);
  }
};

// get all users notifications
export const getUserNotifications = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const notifications = await prisma.notifications.findMany({
      where: {
        receiverId: req.user.id,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return res.status(200).json({ success: true, notifications });
  } catch (error) {
    return next(error);
  }
};
