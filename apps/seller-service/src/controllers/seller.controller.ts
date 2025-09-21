// /seller/api/follow-shop
// /seller/api/unfollow-shop
// /seller/api/get-seller-events/${shop?.id}?page=1&limit=10
// /seller/api/is-following/${shop?.id}
// /seller/api/get-seller-products/${shop?.id}?page=1&limit=10
// /seller/api/get-seller/${id}

import {
  AuthError,
  ForbiddenError,
  NotFoundError,
  ValidationError,
} from "@packages/error-handler";
import { imagekit } from "@packages/libs/imagekit";
import prisma from "@packages/libs/prisma";
import { NextFunction, Request, Response } from "express";

//soft delete (delete shop)
export const deleteShop = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const sellerId = req.seller?.id;
    // find seller with shop
    const seller = await prisma.sellers.findUnique({
      where: { id: sellerId },
      include: { shop: true },
    });

    if (!seller || !seller.shop) {
      return next(new NotFoundError("Seller or shop not found!"));
    }

    // 28 days from now
    const deletedAt = new Date();
    deletedAt.setDate(deletedAt.getDate() + 28);

    // soft delete both seller and shop
    await prisma.$transaction([
      prisma.sellers.update({
        where: { id: sellerId },
        data: { isDeleted: true, deletedAt },
      }),
      prisma.shops.update({
        where: { id: seller.shop.id },
        data: {
          isDeleted: true,
          deletedAt,
        },
      }),
    ]);

    return res.status(200).json({
      message:
        "Shop and seller marked for deletion. Will be permanently deleted",
    });
  } catch (error) {
    next(error);
  }
};

//restore shop
export const restoreShop = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const sellerId = req.seller?.id;
    // find seller with shop
    const seller = await prisma.sellers.findUnique({
      where: { id: sellerId },
      include: { shop: true },
    });

    if (!seller || !seller.shop) {
      return next(new NotFoundError("Seller or shop not found!"));
    }
    if (!seller.isDeleted || !seller.deletedAt || !seller.shop.isDeleted) {
      return next(
        new ForbiddenError("Seller or shop is not marked for deletion")
      );
    }

    // 28 days from now
    const now = new Date();
    const deletedAt = new Date(seller.deletedAt);

    if (now > deletedAt) {
      return next(
        new ForbiddenError(
          "Cannot restore. The 28-day recovery period has expired"
        )
      );
    }
    // restore  both seller and shop
    await prisma.$transaction([
      prisma.sellers.update({
        where: { id: sellerId },
        data: { isDeleted: false, deletedAt: null },
      }),
      prisma.shops.update({
        where: { id: seller.shop.id },
        data: {
          isDeleted: false,
          deletedAt: null,
        },
      }),
    ]);

    return res.status(200).json({
      message: "Shop and seller have been successfully restored.",
    });
  } catch (error) {
    next(error);
  }
};

// upload image
export const uploadImage = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // get file (from multer), fileName, and folder
    const file = req.file?.buffer; // buffer if multer is in memory storage
    const fileName = req.file?.originalname;
    const folder = req.body.folder;

    if (!file || !fileName || !folder) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields." });
    }

    // upload image to image kit
    const uploadResponse = await imagekit.upload({
      file,
      fileName,
      folder,
    });

    return res.status(201).json({
      success: true,
      file_id: uploadResponse.fileId,
      url: uploadResponse.url,
    });
  } catch (error) {
    console.error("Image upload failed:", error);
    return next(error);
  }
};

// upload avatar & cover photo
export const updateProfilePictures = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { editType, imageUrl } = req.body;
    if (!editType || !imageUrl) {
      return next(new ValidationError("Missing required fields!"));
    }
    // ensure user is authenticated
    if (!req.seller?.id) {
      return next(new AuthError("Only sellers can update profile"));
    }

    // determine update field(avatar or cover )
    const updateField =
      editType === "cover" ? { coverBanner: imageUrl } : { avatar: imageUrl };

    // update sellers profile
    const updatedSeller = await prisma.shops.update({
      where: { sellerId: req.seller.id },
      data: updateField,
      select: {
        id: true,
        avatar: true,
        coverBanner: true,
      },
    });
    return res.status(200).json({
      success: true,
      message: `${
        editType === "cover" ? "Cover photo" : "Avatar"
      } updated successfully!`,
      updatedSeller,
    });
  } catch (error) {
    return next(error);
  }
};

// edit seller profile
export const editSellerProfile = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { name, bio, address, opening_hours, website, socialLinks } =
      req.body;
    if (
      !name ||
      !bio ||
      !address ||
      !opening_hours ||
      !website ||
      !socialLinks
    ) {
      return next(new ValidationError("Please fill all the fields"));
    }

    // ensure the user is authenticated
    if (!req.seller?.id) {
      return next(new AuthError("Only sellers can edit their profile"));
    }

    // check if the shop exists for the seller
    const existingShop = await prisma.shops.findUnique({
      where: { sellerId: req.seller.id },
    });

    if (!existingShop) {
      return next(new ValidationError("Shop not found for this seller"));
    }

    // update the shop profile
    const updatedShop = await prisma.shops.update({
      where: { sellerId: req.seller.id },
      data: {
        name,
        bio,
        address,
        opening_hours,
        website,
        socialLinks,
      },
      select: {
        id: true,
        name: true,
        bio: true,
        address: true,
        opening_hours: true,
        socialLinks: true,
        updatedAt: true,
      },
    });
    return res.status(200).json({
      success: true,
      message: "Shop profile updated successfully!",
      updatedShop,
    });
  } catch (error) {
    return next(error);
  }
};

// get seller public preview
export const getSellerInfo = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    // fetch shop + seller info
    const shop = await prisma.shops.findUnique({
      where: { id: req.params.id },
    });

    const followersCount = await prisma.followers.count({
      where: { shopsId: shop?.id },
    });

    return res.json({
      success: true,
      shop,
      followersCount,
    });
  } catch (error) {
    console.error("Error fetching shop/seller:", error);
    return next(error);
  }
};

export const getSellerProducts = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where: {
          // starting_date: null,
          shopId: req.params.id!,
        }, // ← filter by shop
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { images: true, Shop: true },
      }),
      prisma.products.count({
        where: {
          // starting_date: null,
          shopId: req.params.id!,
        },
      }), // count only products for this shop
    ]);

    res.status(200).json({
      success: true,
      products,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching seller products:", error);
    next(error);
  }
};

export const getSellerEvents = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      prisma.products.findMany({
        where: {
          // starting_date: { not: null },
          shopId: req.params.id!,
        }, // ← filter by shop
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: { images: true },
      }),
      prisma.products.count({
        where: {
          // starting_date: null,
          shopId: req.params.id!,
        },
      }), // count only products for this shop
    ]);

    res.status(200).json({
      success: true,
      products,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Error fetching seller products:", error);
    next(error);
  }
};

// follow shop
export const followShop = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { shopId } = req.body;
    if (!shopId) return next(new ValidationError("Shop id is required!"));

    // check if already followed
    const existingFollow = await prisma.followers.findFirst({
      where: {
        userId: req.user?.id,
        shopsId: shopId,
      },
    });

    if (existingFollow) {
      return res
        .status(200)
        .json({ success: true, message: "Already following this shop" });
    }

    // create new follow
    const follow = await prisma.followers.create({
      data: { userId: req.user?.id, shopsId: shopId },
    });

    return res.status(201).json({ success: true, follow });
  } catch (error) {
    console.error("Error following shop:", error);
    next(error);
  }
};

// unfollow shop
export const unfollowShop = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { shopId } = req.body;

    if (!shopId) {
      return next(new ValidationError("shop id is required!"));
    }

    const existingFollow = await prisma.followers.findFirst({
      where: { userId: req.user?.id, shopsId: shopId },
    });

    if (!existingFollow) {
      return res
        .status(404)
        .json({ success: false, message: "You are not following this shop." });
    }

    await prisma.followers.delete({
      where: { id: existingFollow.id },
    });

    return res
      .status(200)
      .json({ success: true, message: "Successfully unfollowed the shop." });
  } catch (error) {
    console.error("Error unfollowing shop:", error);
    next(error);
  }
};

export const isFollowing = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { shopId } = req.params.id;

    if (!shopId) {
      return next(new ValidationError("shop id is required!"));
    }
    const isFollowing = await prisma.followers.findFirst({
      where: { userId: req.user?.id, shopsId: shopId },
    });

    return res.status(200).json({ success: true, isFollowing });
  } catch (error) {
    console.error("Error checking follow status:", error);
    next(error);
  }
};

// fetching notifications for sellers
export const sellerNotifications = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const sellerId = req.seller.id;
    const notifications = await prisma.notifications.findMany({
      where: {
        receiverId: sellerId,
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

// mark notification as read
export const markNotificationsAsRead = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    const { notificationId } = req.body;
    if (!notificationId) {
      return next(new ValidationError("Notification id is required!"));
    }

    const notification = await prisma.notifications.update({
      where: { id: notificationId },
      data: { status: "Read" },
    });

    return res.status(200).json({
      success: true,
      notification,
    });
  } catch (error) {
    return next(error);
  }
};
// export const getSeller = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { id: shopId } = req.params;

//     if (!shopId) {
//       return res.status(400).json({ error: "Shop ID is required" });
//     }

//     // fetch shop + seller info
//     const shop = await prisma.shops.findUnique({
//       where: { id: shopId },
//       include: {
//         sellers: true, // include seller details
//       },
//     });

//     if (!shop) {
//       return res.status(404).json({ error: "Shop not found" });
//     }

//     // count followers
//     const followersCount = await prisma.followers.count({
//       where: { shopsId: shopId },
//     });

//     return res.json({
//       shop,
//       followersCount,
//     });
//   } catch (error) {
//     console.error("Error fetching shop/seller:", error);
//     next(error);
//   }
// };

// export const getSellerProducts = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const shopId = req.params.shopId;
//     if (!shopId) return res.status(400).json({ error: "shopId is required" });

//     const page = parseInt(req.query.page as string) || 1;
//     const limit = parseInt(req.query.limit as string) || 20;
//     const skip = (page - 1) * limit;

//     const [products, totalProducts] = await Promise.all([
//       prisma.products.findMany({
//         where: { shopId }, // ← filter by shop
//         skip,
//         take: limit,
//         orderBy: { createdAt: "desc" },
//         select: {
//           id: true,
//           title: true,
//           slug: true,
//           sale_price: true,
//           stock: true,
//           createdAt: true,
//           category: true,
//           ratings: true,
//           images: { select: { url: true }, take: 1 },
//           Shop: { select: { name: true } },
//         },
//       }),
//       prisma.products.count({ where: { shopId } }), // count only products for this shop
//     ]);

//     const totalPages = Math.ceil(totalProducts / limit);

//     res.status(200).json({
//       success: true,
//       products,
//       meta: { totalProducts, currentPage: page, totalPages },
//     });
//   } catch (error) {
//     console.error("Error fetching seller products:", error);
//     next(error);
//   }
// };

// export const getSellerEvents = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const shopId = req.params.shopId;
//     if (!shopId) return res.status(400).json({ error: "shopId is required" });

//     const page = parseInt(req.query.page as string) || 1;
//     const limit = parseInt(req.query.limit as string) || 20;
//     const skip = (page - 1) * limit;

//     const [events, totalEvents] = await Promise.all([
//       prisma.products.findMany({
//         where: {
//           shopId,
//           //   starting_date: { not: null }, // filter only events/offers
//         },
//         skip,
//         take: limit,
//         orderBy: { createdAt: "desc" },
//         select: {
//           id: true,
//           title: true,
//           slug: true,
//           sale_price: true,
//           stock: true,
//           createdAt: true,
//           category: true,
//           ratings: true,
//           images: { select: { url: true }, take: 1 },
//           Shop: { select: { name: true } },
//         },
//       }),
//       prisma.products.count({
//         where: { shopId, starting_date: { not: null } },
//       }),
//     ]);

//     const totalPages = Math.ceil(totalEvents / limit);

//     res.status(200).json({
//       success: true,
//       events,
//       meta: { totalEvents, currentPage: page, totalPages },
//     });
//   } catch (error) {
//     console.error("Error fetching seller events:", error);
//     next(error);
//   }
// };

// export const followShop = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const userId = req.user?.id; // from auth middleware
//     const { shopId } = req.body;

//     if (!userId) {
//       return res.status(401).json({ error: "Unauthorized" });
//     }
//     if (!shopId) {
//       return res.status(400).json({ error: "shopId is required" });
//     }

//     // check if already following
//     const existing = await prisma.followers.findFirst({
//       where: { userId, shopsId: shopId },
//     });

//     if (existing) {
//       return res.status(400).json({ error: "Already following this shop" });
//     }

//     await prisma.followers.create({
//       data: { userId, shopsId: shopId },
//     });

//     return res.json({ success: true, message: "Followed successfully" });
//   } catch (error) {
//     console.error("Error following shop:", error);
//     next(error);
//   }
// };

// export const unfollowShop = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const userId = req.user?.id;
//     const { shopId } = req.body;

//     if (!userId) {
//       return res.status(401).json({ error: "Unauthorized" });
//     }
//     if (!shopId) {
//       return res.status(400).json({ error: "shopId is required" });
//     }

//     const existing = await prisma.followers.findFirst({
//       where: { userId, shopsId: shopId },
//     });

//     if (!existing) {
//       return res.status(400).json({ error: "Not following this shop" });
//     }

//     await prisma.followers.delete({
//       where: { id: existing.id },
//     });

//     return res.json({ success: true, message: "Unfollowed successfully" });
//   } catch (error) {
//     console.error("Error unfollowing shop:", error);
//     next(error);
//   }
// };

// export const isFollowing = async (
//   req: any,
//   res: Response,
//   next: NextFunction
// ) => {
//   try {
//     const { shopId } = req.params;
//     const userId = req.user?.id; // assuming auth middleware adds req.user

//     if (!userId) {
//       return res.status(401).json({ error: "Unauthorized" });
//     }

//     const follow = await prisma.followers.findFirst({
//       where: { userId, shopsId: shopId },
//     });

//     return res.json({ isFollowing: follow ? true : null });
//   } catch (error) {
//     console.error("Error checking follow status:", error);
//     next(error);
//   }
// };
