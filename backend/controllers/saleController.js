import mongoose from "mongoose";

import Sale from "../models/Sale.js";
import Seller from "../models/Seller.js";
import Item from "../models/Item.js";
import Stock from "../models/Stock.js";

/* =========================================================
   Helpers
========================================================= */

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/*
 * Generate a sale number.
 *
 * Example:
 * SAL-20260810-123456
 */
const generateSaleNumber = () => {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  const randomPart = String(Math.floor(100000 + Math.random() * 900000));

  return `SAL-${year}${month}${day}-${randomPart}`;
};

/* =========================================================
   CREATE SALE
========================================================= */

export const createSale = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const { sellerId, saleDate, items } = req.body;

    /*
     * Validate seller ID.
     */
    if (!sellerId) {
      return res.status(400).json({
        message: "Seller is required",
      });
    }

    if (!isValidObjectId(sellerId)) {
      return res.status(400).json({
        message: "Invalid seller ID",
      });
    }

    /*
     * Validate items.
     */
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "At least one item is required",
      });
    }

    /*
     * Make sure the seller belongs
     * to the logged in user.
     */
    const seller = await Seller.findOne({
      _id: sellerId,
      user: req.user.id,
    }).lean();

    if (!seller) {
      return res.status(404).json({
        message: "Seller not found",
      });
    }

    /*
     * Merge duplicate item IDs.
     *
     * If the frontend accidentally sends
     * the same item twice, we don't want
     * two separate stock deductions.
     */
    const itemMap = new Map();

    for (const saleItem of items) {
      if (!saleItem.itemId || !isValidObjectId(saleItem.itemId)) {
        return res.status(400).json({
          message: "Invalid item ID",
        });
      }

      const quantity = Number(saleItem.quantity);

      const pieces = Number(saleItem.pieces);

      const price = Number(saleItem.price);

      if (!Number.isFinite(quantity) || quantity < 0) {
        return res.status(400).json({
          message: "Quantity must be a valid number",
        });
      }

      if (!Number.isFinite(pieces) || pieces < 0) {
        return res.status(400).json({
          message: "Pieces must be a valid number",
        });
      }

      if (!Number.isFinite(price) || price < 0) {
        return res.status(400).json({
          message: "Price must be a valid number",
        });
      }

      if (quantity === 0 && pieces === 0) {
        return res.status(400).json({
          message: "Each item must have quantity or pieces greater than zero",
        });
      }

      if (itemMap.has(saleItem.itemId)) {
        const existing = itemMap.get(saleItem.itemId);

        existing.quantity += quantity;

        existing.pieces += pieces;

        /*
         * Keep the latest entered price.
         */
        existing.price = price;
      } else {
        itemMap.set(saleItem.itemId, {
          itemId: saleItem.itemId,
          quantity,
          pieces,
          price,
        });
      }
    }

    /*
     * Start MongoDB transaction.
     *
     * Either everything succeeds:
     *
     * Sale created
     * Stock decreased
     *
     * OR nothing changes.
     */
    session.startTransaction();

    const saleItems = [];

    let itemsTotal = 0;

    /*
     * Process every unique item.
     */
    for (const saleItem of itemMap.values()) {
      /*
       * Find the original Item.
       */
      const item = await Item.findOne({
        _id: saleItem.itemId,
        user: req.user.id,
      })
        .session(session)
        .lean();

      if (!item) {
        throw new Error(`Item not found: ${saleItem.itemId}`);
      }

      /*
       * Find this user's stock.
       */
      const stock = await Stock.findOne({
        user: req.user.id,
        item: saleItem.itemId,
      }).session(session);

      if (!stock) {
        throw new Error(`No stock available for ${item.title}`);
      }

      /*
       * IMPORTANT:
       *
       * Do not allow selling more
       * than available stock.
       */
      if (saleItem.quantity > stock.quantity) {
        throw new Error(
          `Not enough quantity available for ${item.title}. Available: ${stock.quantity}`,
        );
      }

      if (saleItem.pieces > stock.pieces) {
        throw new Error(
          `Not enough pieces available for ${item.title}. Available: ${stock.pieces}`,
        );
      }

      /*
       * Calculate this row's total.
       *
       * Price represents price per quantity.
       *
       * If quantity is 2 and price is 500:
       *
       * 2 × 500 = 1000
       */
      const total = saleItem.quantity * saleItem.price;

      itemsTotal += total;

      /*
       * Create historical sale item.
       */
      saleItems.push({
        item: item._id,
        itemName: item.title,
        quantity: saleItem.quantity,
        pieces: saleItem.pieces,
        price: saleItem.price,
        total,
      });

      /*
       * Reduce stock.
       */
      stock.quantity -= saleItem.quantity;

      stock.pieces -= saleItem.pieces;

      /*
       * Prevent negative stock.
       */
      if (stock.quantity < 0 || stock.pieces < 0) {
        throw new Error(`Stock cannot become negative for ${item.title}`);
      }

      await stock.save({
        session,
      });
    }

    /*
     * Final total.
     */
    const grandTotal = itemsTotal;

    /*
     * Generate unique sale number.
     */
    let saleNumber = generateSaleNumber();

    /*
     * Very unlikely collision protection.
     */
    let existingSale = await Sale.findOne({
      saleNumber,
    })
      .session(session)
      .lean();

    while (existingSale) {
      saleNumber = generateSaleNumber();

      existingSale = await Sale.findOne({
        saleNumber,
      })
        .session(session)
        .lean();
    }

    /*
     * Create sale.
     */
    const sale = new Sale({
      user: req.user.id,

      seller: seller._id,

      sellerName: seller.shopName,

      saleNumber,

      saleDate: saleDate || new Date(),

      items: saleItems,

      itemsTotal,

      grandTotal,
    });

    await sale.save({
      session,
    });

    /*
     * Commit everything.
     */
    await session.commitTransaction();

    res.status(201).json({
      message: "Sale created successfully",

      sale,
    });
  } catch (error) {
    /*
     * Roll back stock changes
     * if anything failed.
     */
    await session.abortTransaction();

    res.status(400).json({
      message: error.message || "Unable to create sale",
    });
  } finally {
    session.endSession();
  }
};

/* =========================================================
   GET ALL SALES
========================================================= */

export const getSales = async (req, res, next) => {
  try {
    const sales = await Sale.find({
      user: req.user.id,
    })
      .sort({
        saleDate: -1,
        createdAt: -1,
      })
      .lean();

    res.json({
      sales,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   GET SALE BY ID
========================================================= */

export const getSaleById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid sale ID",
      });
    }

    const sale = await Sale.findOne({
      _id: id,
      user: req.user.id,
    }).lean();

    if (!sale) {
      return res.status(404).json({
        message: "Sale not found",
      });
    }

    res.json({
      sale,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   GET SALES BY SELLER
========================================================= */

export const getSalesBySeller = async (req, res, next) => {
  try {
    const { sellerId } = req.params;

    if (!isValidObjectId(sellerId)) {
      return res.status(400).json({
        message: "Invalid seller ID",
      });
    }

    const sales = await Sale.find({
      user: req.user.id,
      seller: sellerId,
    })
      .sort({
        saleDate: -1,
        createdAt: -1,
      })
      .lean();

    res.json({
      sales,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   GET SALES BY ITEM
========================================================= */

export const getSalesByItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;

    if (!isValidObjectId(itemId)) {
      return res.status(400).json({
        message: "Invalid item ID",
      });
    }

    const sales = await Sale.find({
      user: req.user.id,
      "items.item": itemId,
    })
      .sort({
        saleDate: -1,
      })
      .lean();

    res.json({
      sales,
    });
  } catch (error) {
    next(error);
  }
};
