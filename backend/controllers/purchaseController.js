import mongoose from "mongoose";

import Purchase from "../models/Purchase.js";
import Buyer from "../models/Buyer.js";
import Item from "../models/Item.js";
import Stock from "../models/Stock.js";

/* =========================================================
   Helpers
========================================================= */

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

const toNumber = (value) => {
  const number = Number(value);

  return Number.isFinite(number) ? number : 0;
};

/* =========================================================
   Normalize Purchase Items
========================================================= */

const normalizeItems = async ({ items, userId }) => {
  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error("At least one item is required");

    error.status = 400;

    throw error;
  }

  const normalizedItems = [];

  for (const itemData of items) {
    /*
     * IMPORTANT:
     *
     * Your existing frontend sends:
     *
     * itemId
     *
     * not:
     *
     * item
     */
    const itemId = itemData.itemId;

    if (!itemId || !isValidObjectId(itemId)) {
      const error = new Error("Invalid item ID");

      error.status = 400;

      throw error;
    }

    const item = await Item.findOne({
      _id: itemId,
      user: userId,
    });

    if (!item) {
      const error = new Error("One or more items do not belong to this user");

      error.status = 404;

      throw error;
    }

    const quantity = toNumber(itemData.quantity);

    const pieces = toNumber(itemData.pieces);

    const price = toNumber(itemData.price);

    if (quantity <= 0) {
      const error = new Error(
        `Quantity must be greater than 0 for ${item.title}`,
      );

      error.status = 422;

      throw error;
    }

    if (pieces < 0) {
      const error = new Error(`Pieces cannot be negative for ${item.title}`);

      error.status = 422;

      throw error;
    }

    if (price < 0) {
      const error = new Error(`Price cannot be negative for ${item.title}`);

      error.status = 422;

      throw error;
    }

    /*
     * IMPORTANT:
     *
     * Your existing Purchase frontend calculates:
     *
     * quantity × price
     *
     * Pieces is stored separately.
     *
     * We keep the same behavior here.
     */
    const total = quantity * price;

    normalizedItems.push({
      item: item._id,
      itemName: item.title,
      quantity,
      pieces,
      price,
      total,
    });
  }

  return normalizedItems;
};

/* =========================================================
   Calculate Totals
========================================================= */

const calculateTotals = (items, carriage) => {
  const itemsTotal = items.reduce((sum, item) => sum + toNumber(item.total), 0);

  const carriageValue = toNumber(carriage);

  if (carriageValue < 0) {
    const error = new Error("Carriage cannot be negative");

    error.status = 422;

    throw error;
  }

  const grandTotal = itemsTotal + carriageValue;

  return {
    itemsTotal,
    carriage: carriageValue,
    grandTotal,
  };
};

/* =========================================================
   Stock Helpers
========================================================= */

/*
 * Group duplicate items.
 *
 * Example:
 *
 * Neem Soap +10
 * Neem Soap +20
 *
 * becomes:
 *
 * Neem Soap +30
 */

const createStockDeltaMap = (items) => {
  const stockMap = new Map();

  for (const item of items) {
    const itemId = item.item.toString();

    if (!stockMap.has(itemId)) {
      stockMap.set(itemId, {
        item: item.item,
        itemName: item.itemName,
        quantity: 0,
        pieces: 0,
      });
    }

    const current = stockMap.get(itemId);

    current.quantity += toNumber(item.quantity);

    current.pieces += toNumber(item.pieces);
  }

  return Array.from(stockMap.values());
};

/* =========================================================
   Increase Stock
========================================================= */

const increaseStock = async ({ userId, items, session }) => {
  const stockDeltas = createStockDeltaMap(items);

  for (const stockData of stockDeltas) {
    await Stock.findOneAndUpdate(
      {
        user: userId,
        item: stockData.item,
      },
      {
        $setOnInsert: {
          user: userId,
          item: stockData.item,
          itemName: stockData.itemName,
        },

        $inc: {
          quantity: stockData.quantity,
          pieces: stockData.pieces,
        },
      },
      {
        new: true,
        upsert: true,
        setDefaultsOnInsert: true,
        session,
      },
    );
  }
};

/* =========================================================
   Decrease Stock
========================================================= */

const decreaseStock = async ({ userId, items, session }) => {
  const stockDeltas = createStockDeltaMap(items);

  for (const stockData of stockDeltas) {
    const stock = await Stock.findOne({
      user: userId,
      item: stockData.item,
    }).session(session);

    if (!stock) {
      const error = new Error(`Stock not found for ${stockData.itemName}`);

      error.status = 400;

      throw error;
    }

    if (stock.quantity < stockData.quantity) {
      const error = new Error(
        `Insufficient quantity in stock for ${stockData.itemName}`,
      );

      error.status = 400;

      throw error;
    }

    if (stock.pieces < stockData.pieces) {
      const error = new Error(
        `Insufficient pieces in stock for ${stockData.itemName}`,
      );

      error.status = 400;

      throw error;
    }

    stock.quantity -= stockData.quantity;

    stock.pieces -= stockData.pieces;

    await stock.save({
      session,
    });
  }
};

/* =========================================================
   CREATE PURCHASE
========================================================= */

export const createPurchase = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      /*
       * IMPORTANT:
       *
       * Existing frontend sends:
       *
       * buyerId
       *
       * not:
       *
       * buyer
       */
      const { buyerId, purchaseDate, items, carriage } = req.body;

      /* -------------------- Validate Buyer -------------------- */

      if (!buyerId || !isValidObjectId(buyerId)) {
        const error = new Error("Valid buyer is required");

        error.status = 400;

        throw error;
      }

      const buyerData = await Buyer.findOne({
        _id: buyerId,
        user: req.user.id,
      }).session(session);

      if (!buyerData) {
        const error = new Error("Buyer not found");

        error.status = 404;

        throw error;
      }

      /* -------------------- Validate Items -------------------- */

      const normalizedItems = await normalizeItems({
        items,
        userId: req.user.id,
      });

      /* -------------------- Calculate Totals -------------------- */

      const totals = calculateTotals(normalizedItems, carriage);

      /* -------------------- Purchase Number -------------------- */

      const now = new Date();

      const datePart =
        now.getFullYear().toString() +
        String(now.getMonth() + 1).padStart(2, "0") +
        String(now.getDate()).padStart(2, "0");

      const purchaseNumber = `PUR-${datePart}-${Date.now()}`;

      /* -------------------- Create Purchase -------------------- */

      const purchase = await Purchase.create(
        [
          {
            user: req.user.id,

            buyer: buyerData._id,

            buyerName: buyerData.shopName,

            purchaseNumber,

            purchaseDate: purchaseDate
              ? new Date(`${purchaseDate}T00:00:00`)
              : new Date(),

            items: normalizedItems,

            itemsTotal: totals.itemsTotal,

            carriage: totals.carriage,

            grandTotal: totals.grandTotal,
          },
        ],
        {
          session,
        },
      );

      /* -------------------- Update Stock -------------------- */

      await increaseStock({
        userId: req.user.id,
        items: normalizedItems,
        session,
      });

      res.status(201).json({
        message: "Purchase created successfully",

        purchase: purchase[0],
      });
    });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
};

/* =========================================================
   GET ALL PURCHASES
========================================================= */

export const getPurchases = async (req, res, next) => {
  try {
    const purchases = await Purchase.find({
      user: req.user.id,
    })
      .populate("buyer", "shopName city address phone email gstNumber")
      .sort({
        purchaseDate: -1,
        createdAt: -1,
      })
      .lean();

    res.json({
      purchases,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   GET PURCHASE BY ID
========================================================= */

export const getPurchaseById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid purchase ID",
      });
    }

    const purchase = await Purchase.findOne({
      _id: id,
      user: req.user.id,
    })
      .populate("buyer", "shopName city address phone email gstNumber")
      .populate("items.item", "title")
      .lean();

    if (!purchase) {
      return res.status(404).json({
        message: "Purchase not found",
      });
    }

    res.json({
      purchase,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   UPDATE PURCHASE
========================================================= */

export const updatePurchase = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        const error = new Error("Invalid purchase ID");

        error.status = 400;

        throw error;
      }

      const existingPurchase = await Purchase.findOne({
        _id: id,
        user: req.user.id,
      }).session(session);

      if (!existingPurchase) {
        const error = new Error("Purchase not found");

        error.status = 404;

        throw error;
      }

      /*
       * Existing frontend sends buyerId.
       */
      const { buyerId, purchaseDate, items, carriage } = req.body;

      /* -------------------- Buyer -------------------- */

      if (!buyerId || !isValidObjectId(buyerId)) {
        const error = new Error("Valid buyer is required");

        error.status = 400;

        throw error;
      }

      const buyerData = await Buyer.findOne({
        _id: buyerId,
        user: req.user.id,
      }).session(session);

      if (!buyerData) {
        const error = new Error("Buyer not found");

        error.status = 404;

        throw error;
      }

      /* -------------------- Items -------------------- */

      const normalizedItems = await normalizeItems({
        items,
        userId: req.user.id,
      });

      /* -------------------- Totals -------------------- */

      const totals = calculateTotals(normalizedItems, carriage);

      /*
       * Return the old purchase quantities
       * to stock first.
       */
      await increaseStock({
        userId: req.user.id,
        items: existingPurchase.items,
        session,
      });

      /*
       * Remove the new purchase quantities.
       */
      await decreaseStock({
        userId: req.user.id,
        items: normalizedItems,
        session,
      });

      /* -------------------- Update Purchase -------------------- */

      existingPurchase.buyer = buyerData._id;

      existingPurchase.buyerName = buyerData.shopName;

      if (purchaseDate) {
        existingPurchase.purchaseDate = new Date(`${purchaseDate}T00:00:00`);
      }

      existingPurchase.items = normalizedItems;

      existingPurchase.itemsTotal = totals.itemsTotal;

      existingPurchase.carriage = totals.carriage;

      existingPurchase.grandTotal = totals.grandTotal;

      await existingPurchase.save({
        session,
      });

      res.json({
        message: "Purchase updated successfully",

        purchase: existingPurchase,
      });
    });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
};

/* =========================================================
   DELETE PURCHASE
========================================================= */

export const deletePurchase = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    await session.withTransaction(async () => {
      const { id } = req.params;

      if (!isValidObjectId(id)) {
        const error = new Error("Invalid purchase ID");

        error.status = 400;

        throw error;
      }

      const purchase = await Purchase.findOne({
        _id: id,
        user: req.user.id,
      }).session(session);

      if (!purchase) {
        const error = new Error("Purchase not found");

        error.status = 404;

        throw error;
      }

      /*
       * Remove this purchase from stock.
       */
      await decreaseStock({
        userId: req.user.id,
        items: purchase.items,
        session,
      });

      await purchase.deleteOne({
        session,
      });

      res.json({
        message: "Purchase deleted successfully",
      });
    });
  } catch (error) {
    next(error);
  } finally {
    await session.endSession();
  }
};
