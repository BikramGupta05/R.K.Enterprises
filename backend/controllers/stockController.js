import mongoose from "mongoose";

import Stock from "../models/Stock.js";
import Item from "../models/Item.js";

/* -------------------- Validate ID -------------------- */

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/* -------------------- Get All Stock -------------------- */

export const getStock = async (req, res, next) => {
  try {
    const stocks = await Stock.find({
      user: req.user.id,
    })
      .populate("item", "title")
      .sort({
        itemName: 1,
      })
      .lean();

    res.json({
      stocks,
    });
  } catch (error) {
    next(error);
  }
};

/* -------------------- Get Single Stock -------------------- */

export const getStockById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid stock ID",
      });
    }

    const stock = await Stock.findOne({
      _id: id,
      user: req.user.id,
    })
      .populate("item", "title")
      .lean();

    if (!stock) {
      return res.status(404).json({
        message: "Stock not found",
      });
    }

    res.json({
      stock,
    });
  } catch (error) {
    next(error);
  }
};

/* -------------------- Get Stock By Item -------------------- */

export const getStockByItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    if (!isValidObjectId(itemId)) {
      return res.status(400).json({
        message: "Invalid item ID",
      });
    }

    const stock = await Stock.findOne({
      user: req.user.id,
      item: itemId,
    })
      .populate("item", "title")
      .lean();

    if (!stock) {
      return res.status(404).json({
        message: "Stock not found for this item",
      });
    }

    res.json({
      stock,
    });
  } catch (error) {
    next(error);
  }
};

/* -------------------- Add Stock -------------------- */

/*
 * This endpoint is mainly useful for controlled
 * stock adjustments.
 *
 * Normal stock should be increased automatically
 * when a Purchase is created.
 */
export const addStock = async (req, res, next) => {
  try {
    const { itemId, quantity = 0, pieces = 0 } = req.body;

    if (!isValidObjectId(itemId)) {
      return res.status(400).json({
        message: "Invalid item ID",
      });
    }

    const quantityNumber = Number(quantity);
    const piecesNumber = Number(pieces);

    if (!Number.isFinite(quantityNumber) || quantityNumber < 0) {
      return res.status(422).json({
        message: "Quantity must be a valid number",
      });
    }

    if (!Number.isFinite(piecesNumber) || piecesNumber < 0) {
      return res.status(422).json({
        message: "Pieces must be a valid number",
      });
    }

    if (quantityNumber === 0 && piecesNumber === 0) {
      return res.status(422).json({
        message: "Quantity or pieces must be greater than zero",
      });
    }

    const item = await Item.findOne({
      _id: itemId,
      user: req.user.id,
    });

    if (!item) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    const stock = await Stock.findOneAndUpdate(
      {
        user: req.user.id,
        item: item._id,
      },
      {
        $setOnInsert: {
          user: req.user.id,
          item: item._id,
          itemName: item.title,
        },

        $inc: {
          quantity: quantityNumber,
          pieces: piecesNumber,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
      },
    );

    res.status(201).json({
      message: "Stock updated successfully",
      stock,
    });
  } catch (error) {
    next(error);
  }
};

/* -------------------- Remove Stock -------------------- */

/*
 * This is useful for manual stock corrections.
 *
 * Selling should normally decrease stock through
 * the Selling controller instead.
 */
export const removeStock = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid stock ID",
      });
    }

    const { quantity = 0, pieces = 0 } = req.body;

    const quantityNumber = Number(quantity);
    const piecesNumber = Number(pieces);

    if (!Number.isFinite(quantityNumber) || quantityNumber < 0) {
      return res.status(422).json({
        message: "Quantity must be a valid number",
      });
    }

    if (!Number.isFinite(piecesNumber) || piecesNumber < 0) {
      return res.status(422).json({
        message: "Pieces must be a valid number",
      });
    }

    const stock = await Stock.findOne({
      _id: id,
      user: req.user.id,
    });

    if (!stock) {
      return res.status(404).json({
        message: "Stock not found",
      });
    }

    if (quantityNumber > stock.quantity) {
      return res.status(400).json({
        message: "Insufficient quantity in stock",
      });
    }

    if (piecesNumber > stock.pieces) {
      return res.status(400).json({
        message: "Insufficient pieces in stock",
      });
    }

    stock.quantity -= quantityNumber;
    stock.pieces -= piecesNumber;

    await stock.save();

    res.json({
      message: "Stock updated successfully",
      stock,
    });
  } catch (error) {
    next(error);
  }
};
