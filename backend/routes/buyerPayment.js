import express from "express";

import protect from "../middleware/authMiddleware.js";

import {
  getMoneyDueSummary,
  getMoneyDueByBuyer,
  getBuyerPayments,
  getBuyerPaymentById,
  createBuyerPayment,
  updateBuyerPayment,
  deleteBuyerPayment,
} from "../controllers/buyerPaymentController.js";

const router = express.Router();

/* =========================================================
   MONEY DUE SUMMARY
   GET /api/buyer-payments/summary
========================================================= */

router.get("/summary", protect, getMoneyDueSummary);

/* =========================================================
   BUYER ACCOUNT
   GET /api/buyer-payments/buyer/:buyerId
========================================================= */

router.get("/buyer/:buyerId", protect, getMoneyDueByBuyer);

/* =========================================================
   ALL BUYER PAYMENTS
   GET /api/buyer-payments
========================================================= */

router.get("/", protect, getBuyerPayments);

/* =========================================================
   CREATE BUYER PAYMENT
   POST /api/buyer-payments
========================================================= */

router.post("/", protect, createBuyerPayment);

/* =========================================================
   PAYMENT BY ID
   GET /api/buyer-payments/:id
========================================================= */

router.get("/:id", protect, getBuyerPaymentById);

/* =========================================================
   UPDATE BUYER PAYMENT
   PUT /api/buyer-payments/:id
========================================================= */

router.put("/:id", protect, updateBuyerPayment);

/* =========================================================
   DELETE BUYER PAYMENT
   DELETE /api/buyer-payments/:id
========================================================= */

router.delete("/:id", protect, deleteBuyerPayment);

export default router;
