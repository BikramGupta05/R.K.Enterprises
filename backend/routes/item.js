import express from "express";
import protect from "../middleware/authMiddleware.js";
import {
  createItem,
  getItems,
  getItemById,
  updateItem,
  deleteItem,
} from "../controllers/itemController.js";

import {
  createItemValidation,
  updateItemValidation,
  validateRequest,
} from "../middleware/validation.js";

const router = express.Router();

// Create Item
router.post("/", protect, createItemValidation, validateRequest, createItem);

// Get All Items
router.get("/", protect, getItems);

// Get Single Item
router.get("/:id", protect, getItemById);

// Update Item
router.put("/:id", protect, updateItemValidation, validateRequest, updateItem);

// Delete Item
router.delete("/:id", protect, deleteItem);

export default router;
