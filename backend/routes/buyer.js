import express from "express";

import protect from "../middleware/authMiddleware.js";

import {
  createBuyer,
  getBuyers,
  getBuyerById,
  updateBuyer,
  deleteBuyer,
} from "../controllers/buyerController.js";

import {
  createBuyerValidation,
  updateBuyerValidation,
  validateRequest,
} from "../middleware/validation.js";

const router = express.Router();

/* ---------------- Create Buyer ---------------- */

router.post("/", protect, createBuyerValidation, validateRequest, createBuyer);

/* ---------------- Get All Buyers ---------------- */

router.get("/", protect, getBuyers);

/* ---------------- Get Single Buyer ---------------- */

router.get("/:id", protect, getBuyerById);

/* ---------------- Update Buyer ---------------- */

router.put(
  "/:id",
  protect,
  updateBuyerValidation,
  validateRequest,
  updateBuyer,
);

/* ---------------- Delete Buyer ---------------- */

router.delete("/:id", protect, deleteBuyer);

export default router;
