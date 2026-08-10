import express from "express";

import protect from "../middleware/authMiddleware.js";

import {
  createSeller,
  getSellers,
  getSellerById,
  updateSeller,
  deleteSeller,
} from "../controllers/sellerController.js";

import {
  createSellerValidation,
  updateSellerValidation,
  validateRequest,
} from "../middleware/validation.js";

const router = express.Router();

/* -------------------- Create Seller -------------------- */

router.post(
  "/",
  protect,
  createSellerValidation,
  validateRequest,
  createSeller,
);

/* -------------------- Get All Sellers -------------------- */

router.get("/", protect, getSellers);

/* -------------------- Get Seller By ID -------------------- */

router.get("/:id", protect, getSellerById);

/* -------------------- Update Seller -------------------- */

router.put(
  "/:id",
  protect,
  updateSellerValidation,
  validateRequest,
  updateSeller,
);

/* -------------------- Delete Seller -------------------- */

router.delete("/:id", protect, deleteSeller);

export default router;
