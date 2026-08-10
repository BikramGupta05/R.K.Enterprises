import express from "express";

import protect from "../middleware/authMiddleware.js";

import {
  getStock,
  getStockById,
  getStockByItem,
  addStock,
  removeStock,
} from "../controllers/stockController.js";

const router = express.Router();

/*
 * Get all stock
 *
 * GET /api/stock
 */
router.get("/", protect, getStock);

/*
 * Get stock for a specific item
 *
 * GET /api/stock/item/:itemId
 *
 * Keep this BEFORE /:id.
 */
router.get("/item/:itemId", protect, getStockByItem);

/*
 * Get one stock record
 *
 * GET /api/stock/:id
 */
router.get("/:id", protect, getStockById);

/*
 * Manually increase stock
 *
 * POST /api/stock
 */
router.post("/", protect, addStock);

/*
 * Manually decrease stock
 *
 * PUT /api/stock/:id/remove
 */
router.put("/:id/remove", protect, removeStock);

export default router;
