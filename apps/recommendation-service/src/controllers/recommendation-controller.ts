import prisma from "@packages/libs/prisma";
import { NextFunction, Response } from "express";
import { recommendProducts } from "../services/recommendation-service";

// get recommended Products
export const getRecommendedProducts = async (
  req: any,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log("inside getrecomendation controller");
    const userId = req.user.id;
    console.log("userId", userId);
    //fetch all the products
    const products = await prisma.products.findMany({
      include: { images: true, Shop: true },
    });

    ///look for user analytics
    console.log("Fetching userAnalytics for:", userId);

    let userAnalytics = await prisma.userAnalytics.findUnique({
      where: { userId },
      select: { actions: true, recommendations: true, lastTrained: true },
    });

    const now = new Date();
    let recommendedProducts = [];
    // if user doesn't have any activity or activity is less than 50 send the last 10 products ie no recommended products
    if (!userAnalytics) {
      console.log("Branch: no userAnalytics found");

      recommendedProducts = products.slice(-10);
    } else {
      const actions = Array.isArray(userAnalytics.actions)
        ? (userAnalytics.actions as any[])
        : [];

      const recommendations = Array.isArray(userAnalytics.recommendations)
        ? (userAnalytics.recommendations as string[])
        : [];

      const lastTrainedTime = userAnalytics.lastTrained
        ? new Date(userAnalytics.lastTrained)
        : null;

      // if we train our machine learning model everytime when user is reloading then this will increase the server cost
      //   hence we wait for one hour to train our model if user is active
      const hoursDiff = lastTrainedTime
        ? (now.getTime() - lastTrainedTime.getTime()) / (1000 * 60 * 60)
        : Infinity;
      console.log("actions", actions.length);
      if (actions.length < 50) {
        console.log("Branch: less than 50 actions");

        recommendedProducts = products.slice(-10);
      } else if (hoursDiff < 3 && recommendations.length > 0) {
        console.log("Branch: using cached recommendations");
        recommendedProducts = products.filter((product) =>
          recommendations.includes(product.id)
        );
      } else {
        console.log("Branch: training new model");

        //train the machine learning model and send
        const recommendedProductIds = await recommendProducts(userId, products);
        recommendedProducts = products.filter((product) =>
          recommendedProductIds.includes(product.id)
        );

        console.log("testing", userId);
        await prisma.userAnalytics.update({
          where: { userId },
          data: { recommendations: recommendedProductIds, lastTrained: now },
        });
      }
    }

    return res.status(200).json({
      success: true,
      recommendations: recommendedProducts,
    });
  } catch (error) {
    return next(error);
  }
};
