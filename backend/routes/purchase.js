import express from "express";

import protect from "../middleware/authMiddleware.js";

import {
  createPurchase,
  getPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
  getPurchaseSummaryByBuyer,
  getPurchaseHistoryByBuyer,
  getPurchaseSummaryByItem,
  getPurchaseHistoryByItem,
} from "../controllers/purchaseController.js";

const router = express.Router();

/* =========================================================
   CREATE PURCHASE
========================================================= */

router.post("/", protect, createPurchase);

/* =========================================================
   PURCHASE SUMMARY
========================================================= */

/*
 * All buyers with purchase summary.
 */

router.get("/summary/buyers", protect, getPurchaseSummaryByBuyer);

/*
 * All items with purchase summary.
 */

router.get("/summary/items", protect, getPurchaseSummaryByItem);

/* =========================================================
   BUYER SPECIFIC HISTORY
========================================================= */

router.get("/buyer/:buyerId", protect, getPurchaseHistoryByBuyer);

/* =========================================================
   ITEM SPECIFIC HISTORY
========================================================= */

router.get("/item/:itemId", protect, getPurchaseHistoryByItem);

/* =========================================================
   EXISTING PURCHASE HISTORY
========================================================= */

router.get("/", protect, getPurchases);

/* =========================================================
   SINGLE PURCHASE
========================================================= */

router.get("/:id", protect, getPurchaseById);

/* =========================================================
   UPDATE PURCHASE
========================================================= */

router.put("/:id", protect, updatePurchase);

/* =========================================================
   DELETE PURCHASE
========================================================= */

router.delete("/:id", protect, deletePurchase);

export default router;
