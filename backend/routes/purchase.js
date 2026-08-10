import express from "express";

import protect from "../middleware/authMiddleware.js";

import {
  createPurchase,
  getPurchases,
  getPurchaseById,
  updatePurchase,
  deletePurchase,
} from "../controllers/purchaseController.js";

const router = express.Router();

router.post("/", protect, createPurchase);

router.get("/", protect, getPurchases);

router.get("/:id", protect, getPurchaseById);

router.put("/:id", protect, updatePurchase);

router.delete("/:id", protect, deletePurchase);

export default router;
