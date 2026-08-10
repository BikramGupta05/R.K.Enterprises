import express from "express";

import protect from "../middleware/authMiddleware.js";

import {
  createSale,
  getSales,
  getSaleById,
  getSellerSalesSummary,
  getItemSalesSummary,
  getSalesBySeller,
  getSalesByItem,
} from "../controllers/saleController.js";

const router = express.Router();

/*
 * ============================================================
 * CREATE SALE
 * ============================================================
 */

router.post("/", protect, createSale);

/*
 * ============================================================
 * GET ALL SALES
 * ============================================================
 */

router.get("/", protect, getSales);

/*
 * ============================================================
 * SELLING HISTORY
 * ============================================================
 *
 * IMPORTANT:
 * These routes must be above /:id.
 */

/*
 * By Seller
 */
router.get("/summary/sellers", protect, getSellerSalesSummary);

/*
 * By Item
 */
router.get("/summary/items", protect, getItemSalesSummary);

/*
 * Specific Seller History
 */
router.get("/seller/:sellerId", protect, getSalesBySeller);

/*
 * Specific Item History
 */
router.get("/item/:itemId", protect, getSalesByItem);

/*
 * ============================================================
 * SINGLE SALE
 * ============================================================
 */

router.get("/:id", protect, getSaleById);

export default router;
