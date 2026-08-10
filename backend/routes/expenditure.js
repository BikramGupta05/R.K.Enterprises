import express from "express";

import protect from "../middleware/authMiddleware.js";

import {
  createExpenditure,
  getExpenditures,
  getExpenditureById,
  updateExpenditure,
  deleteExpenditure,
  getExpenditureSummary,
  getExpenditureByCategory,
} from "../controllers/expenditureController.js";

const router = express.Router();

/*
 * ============================================================
 * EXPENDITURE SUMMARY
 * ============================================================
 *
 * IMPORTANT:
 * These routes must come BEFORE /:id.
 *
 * Otherwise Express may interpret:
 *
 * /summary
 *
 * as:
 *
 * /:id
 */

router.get("/summary", protect, getExpenditureSummary);

router.get("/categories", protect, getExpenditureByCategory);

/*
 * ============================================================
 * CREATE EXPENDITURE
 * ============================================================
 */

router.post("/", protect, createExpenditure);

/*
 * ============================================================
 * GET ALL EXPENDITURES
 * ============================================================
 *
 * Supports optional:
 *
 * ?from=2026-08-01
 * ?to=2026-08-10
 *
 */

router.get("/", protect, getExpenditures);

/*
 * ============================================================
 * GET SINGLE EXPENDITURE
 * ============================================================
 */

router.get("/:id", protect, getExpenditureById);

/*
 * ============================================================
 * UPDATE EXPENDITURE
 * ============================================================
 */

router.put("/:id", protect, updateExpenditure);

/*
 * ============================================================
 * DELETE EXPENDITURE
 * ============================================================
 */

router.delete("/:id", protect, deleteExpenditure);

export default router;
