import express from "express";

import protect from "../middleware/authMiddleware.js";

import {
  createSale,
  getSales,
  getSaleById,
  getSalesBySeller,
  getSalesByItem,
} from "../controllers/saleController.js";

const router = express.Router();

/*
 * Create sale.
 */
router.post("/", protect, createSale);

/*
 * Get all sales.
 */
router.get("/", protect, getSales);

/*
 * Get sales by seller.
 *
 * Keep this BEFORE /:id.
 */
router.get("/seller/:sellerId", protect, getSalesBySeller);

/*
 * Get sales by item.
 *
 * Keep this BEFORE /:id.
 */
router.get("/item/:itemId", protect, getSalesByItem);

/*
 * Get one sale.
 */
router.get("/:id", protect, getSaleById);

export default router;
