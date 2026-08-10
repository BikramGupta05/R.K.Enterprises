import express from "express";

import protect from "../middleware/authMiddleware.js";

import {
  createPayment,
  getPayments,
  getPaymentById,
  getPaymentsBySeller,
  updatePayment,
  deletePayment,
} from "../controllers/paymentController.js";

const router = express.Router();

/* =========================================================
   Create Payment
   POST /api/payments
========================================================= */

router.post("/", protect, createPayment);

/* =========================================================
   Get All Payments
   GET /api/payments
========================================================= */

router.get("/", protect, getPayments);

/* =========================================================
   Get Payments By Seller
   GET /api/payments/seller/:sellerId
========================================================= */

/*
 * IMPORTANT:
 * This route must come BEFORE /:id.
 *
 * Otherwise Express may treat "seller"
 * as the payment ID.
 */

router.get("/seller/:sellerId", protect, getPaymentsBySeller);

/* =========================================================
   Get Payment By ID
   GET /api/payments/:id
========================================================= */

router.get("/:id", protect, getPaymentById);

/* =========================================================
   Update Payment
   PUT /api/payments/:id
========================================================= */

router.put("/:id", protect, updatePayment);

/* =========================================================
   Delete Payment
   DELETE /api/payments/:id
========================================================= */

router.delete("/:id", protect, deletePayment);

export default router;
