import isAuthenticated from "@packages/middleware/isAuthenticated";
import express, { Router } from "express";
import { getRecommendedProducts } from "../controllers/recommendation-controller";

const router: Router = express.Router();

// at last when we hit this api we can go and check our userAnalytics table in db, new recommendations and lastTrained fields will be updated with new values
router.get(
  "/get-recommendation-products",
  isAuthenticated,
  getRecommendedProducts
);

export default router;
