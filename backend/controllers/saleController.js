import mongoose from "mongoose";

import Sale from "../models/Sale.js";
import Payment from "../models/Payment.js";
import Seller from "../models/Seller.js";
import Item from "../models/Item.js";
import Stock from "../models/Stock.js";

/* =========================================================
   HELPERS
========================================================= */

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/* =========================================================
   GENERATE SALE NUMBER
========================================================= */

const generateSaleNumber = () => {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  const randomPart = String(Math.floor(100000 + Math.random() * 900000));

  return `SAL-${year}${month}${day}-${randomPart}`;
};

/* =========================================================
   GENERATE PAYMENT NUMBER
========================================================= */

const generatePaymentNumber = () => {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  const randomPart = String(Math.floor(100000 + Math.random() * 900000));

  return `PAY-${year}${month}${day}-${randomPart}`;
};

/* =========================================================
   CREATE UNIQUE SALE NUMBER
========================================================= */

const createUniqueSaleNumber = async (session) => {
  let saleNumber = generateSaleNumber();

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

  return saleNumber;
};

/* =========================================================
   CREATE UNIQUE PAYMENT NUMBER
========================================================= */

const createUniquePaymentNumber = async (session) => {
  let paymentNumber = generatePaymentNumber();

  let existingPayment = await Payment.findOne({
    paymentNumber,
  })
    .session(session)
    .lean();

  while (existingPayment) {
    paymentNumber = generatePaymentNumber();

    existingPayment = await Payment.findOne({
      paymentNumber,
    })
      .session(session)
      .lean();
  }

  return paymentNumber;
};

/* =========================================================
   CREATE SALE
========================================================= */

export const createSale = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const {
      sellerId,
      saleDate,
      items,

      /*
       * NEW PAYMENT FIELDS
       */
      paidAmount,
      paymentMethod,
    } = req.body;

    /* =====================================================
       SELLER VALIDATION
    ===================================================== */

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

    /* =====================================================
       ITEM VALIDATION
    ===================================================== */

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "At least one item is required",
      });
    }

    /* =====================================================
       SELLER OWNERSHIP
    ===================================================== */

    const seller = await Seller.findOne({
      _id: sellerId,
      user: req.user.id,
    }).lean();

    if (!seller) {
      return res.status(404).json({
        message: "Seller not found",
      });
    }

    /* =====================================================
       PAYMENT VALIDATION
    ===================================================== */

    let finalPaidAmount = 0;

    if (paidAmount !== undefined && paidAmount !== null && paidAmount !== "") {
      finalPaidAmount = Number(paidAmount);
    }

    if (!Number.isFinite(finalPaidAmount)) {
      return res.status(400).json({
        message: "Paid amount must be a valid number",
      });
    }

    if (finalPaidAmount < 0) {
      return res.status(400).json({
        message: "Paid amount cannot be negative",
      });
    }

    const allowedPaymentMethods = ["Cash", "UPI", "Net Banking", "Other"];

    const finalPaymentMethod = paymentMethod || "Cash";

    if (!allowedPaymentMethods.includes(finalPaymentMethod)) {
      return res.status(400).json({
        message: "Invalid payment method",
      });
    }

    /* =====================================================
       MERGE DUPLICATE ITEMS
    ===================================================== */

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

    /* =====================================================
       START TRANSACTION
    ===================================================== */

    session.startTransaction();

    const saleItems = [];

    let itemsTotal = 0;

    /* =====================================================
       PROCESS ITEMS
    ===================================================== */

    for (const saleItem of itemMap.values()) {
      /* ---------------------------------------------------
         FIND ITEM
      --------------------------------------------------- */

      const item = await Item.findOne({
        _id: saleItem.itemId,

        user: req.user.id,
      })
        .session(session)
        .lean();

      if (!item) {
        throw new Error(`Item not found: ${saleItem.itemId}`);
      }

      /* ---------------------------------------------------
         FIND STOCK
      --------------------------------------------------- */

      const stock = await Stock.findOne({
        user: req.user.id,

        item: saleItem.itemId,
      }).session(session);

      if (!stock) {
        throw new Error(`No stock available for ${item.title}`);
      }

      /* ---------------------------------------------------
         QUANTITY VALIDATION
      --------------------------------------------------- */

      if (saleItem.quantity > stock.quantity) {
        throw new Error(
          `Not enough quantity available for ${item.title}. Available: ${stock.quantity}`,
        );
      }

      /* ---------------------------------------------------
         PIECES VALIDATION
      --------------------------------------------------- */

      if (saleItem.pieces > stock.pieces) {
        throw new Error(
          `Not enough pieces available for ${item.title}. Available: ${stock.pieces}`,
        );
      }

      /* ---------------------------------------------------
         CALCULATE ITEM TOTAL
      --------------------------------------------------- */

      const total = saleItem.quantity * saleItem.price;

      itemsTotal += total;

      /* ---------------------------------------------------
         HISTORICAL SALE ITEM
      --------------------------------------------------- */

      saleItems.push({
        item: item._id,

        itemName: item.title,

        quantity: saleItem.quantity,

        pieces: saleItem.pieces,

        price: saleItem.price,

        total,
      });

      /* ---------------------------------------------------
         REDUCE STOCK
      --------------------------------------------------- */

      stock.quantity -= saleItem.quantity;

      stock.pieces -= saleItem.pieces;

      /* ---------------------------------------------------
         PREVENT NEGATIVE STOCK
      --------------------------------------------------- */

      if (stock.quantity < 0 || stock.pieces < 0) {
        throw new Error(`Stock cannot become negative for ${item.title}`);
      }

      await stock.save({
        session,
      });
    }

    /* =====================================================
       GRAND TOTAL
    ===================================================== */

    const grandTotal = itemsTotal;

    /* =====================================================
       PAYMENT VALIDATION AGAINST BILL
    ===================================================== */

    if (finalPaidAmount > grandTotal) {
      throw new Error(
        `Paid amount cannot be greater than the sale total of ₹${grandTotal.toFixed(
          2,
        )}`,
      );
    }

    /* =====================================================
       CREDIT AMOUNT
    ===================================================== */

    const creditAmount = Math.max(grandTotal - finalPaidAmount, 0);

    /* =====================================================
       PAYMENT STATUS
    ===================================================== */

    let paymentStatus = "CREDIT";

    if (creditAmount === 0) {
      paymentStatus = "PAID";
    } else if (finalPaidAmount > 0) {
      paymentStatus = "PARTIAL";
    }

    /* =====================================================
       SALE NUMBER
    ===================================================== */

    const saleNumber = await createUniqueSaleNumber(session);

    /* =====================================================
       CREATE SALE
    ===================================================== */

    const sale = new Sale({
      user: req.user.id,

      seller: seller._id,

      sellerName: seller.shopName,

      saleNumber,

      saleDate: saleDate || new Date(),

      items: saleItems,

      itemsTotal,

      grandTotal,

      /*
       * NEW
       */
      paidAmount: finalPaidAmount,

      paymentMethod: finalPaymentMethod,

      creditAmount,

      paymentStatus,
    });

    await sale.save({
      session,
    });

    /* =====================================================
       CREATE INITIAL PAYMENT RECORD
    ===================================================== */

    /*
     * If the customer paid something at the time
     * of sale, create a Payment document too.
     *
     * This is extremely important.
     *
     * Otherwise Khatabook would know:
     *
     * Sale = ₹10,000
     * Paid = ₹4,000
     *
     * but the Payment collection would incorrectly
     * show ₹0 received.
     */

    if (finalPaidAmount > 0) {
      const paymentNumber = await createUniquePaymentNumber(session);

      await Payment.create(
        [
          {
            user: req.user.id,

            seller: seller._id,

            sellerName: seller.shopName,

            sale: sale._id,

            paymentNumber,

            paymentDate: saleDate || new Date(),

            amount: finalPaidAmount,

            paymentMethod: finalPaymentMethod,

            notes: "Payment received at the time of sale",
          },
        ],
        {
          session,
        },
      );
    }

    /* =====================================================
       COMMIT TRANSACTION
    ===================================================== */

    await session.commitTransaction();

    /* =====================================================
       RESPONSE
    ===================================================== */

    return res.status(201).json({
      message: "Sale created successfully",

      sale,
    });
  } catch (error) {
    /* =====================================================
       ROLLBACK
    ===================================================== */

    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    return res.status(400).json({
      message: error.message || "Unable to create sale",
    });
  } finally {
    await session.endSession();
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

    return res.json({
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

    return res.json({
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

    const query = {
      user: req.user.id,

      seller: sellerId,
    };

    /* ---------------------------------------------------
         DATE FILTER
      --------------------------------------------------- */

    if (req.query.from || req.query.to) {
      query.saleDate = {};

      if (req.query.from) {
        const fromDate = new Date(req.query.from);

        if (Number.isNaN(fromDate.getTime())) {
          return res.status(400).json({
            message: "Invalid from date",
          });
        }

        fromDate.setHours(0, 0, 0, 0);

        query.saleDate.$gte = fromDate;
      }

      if (req.query.to) {
        const toDate = new Date(req.query.to);

        if (Number.isNaN(toDate.getTime())) {
          return res.status(400).json({
            message: "Invalid to date",
          });
        }

        toDate.setHours(23, 59, 59, 999);

        query.saleDate.$lte = toDate;
      }
    }

    const sales = await Sale.find(query)
      .populate("seller", "shopName city address phone email gstNumber")
      .sort({
        saleDate: -1,
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
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

    const query = {
      user: req.user.id,

      "items.item": itemId,
    };

    /* ---------------------------------------------------
         DATE FILTER
      --------------------------------------------------- */

    if (req.query.from || req.query.to) {
      query.saleDate = {};

      if (req.query.from) {
        const fromDate = new Date(req.query.from);

        if (Number.isNaN(fromDate.getTime())) {
          return res.status(400).json({
            message: "Invalid from date",
          });
        }

        fromDate.setHours(0, 0, 0, 0);

        query.saleDate.$gte = fromDate;
      }

      if (req.query.to) {
        const toDate = new Date(req.query.to);

        if (Number.isNaN(toDate.getTime())) {
          return res.status(400).json({
            message: "Invalid to date",
          });
        }

        toDate.setHours(23, 59, 59, 999);

        query.saleDate.$lte = toDate;
      }
    }

    const sales = await Sale.find(query)
      .populate("seller", "shopName city address phone email gstNumber")
      .sort({
        saleDate: -1,
        createdAt: -1,
      })
      .lean();

    /*
     * Return only the requested item
     * from each sale.
     */

    const result = sales.map((sale) => {
      return {
        ...sale,

        items: sale.items.filter(
          (saleItem) => saleItem.item?.toString() === itemId,
        ),
      };
    });

    return res.status(200).json({
      sales: result,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   GET SELLER SALES SUMMARY
========================================================= */

export const getSellerSalesSummary = async (req, res, next) => {
  try {
    const match = {
      user: new mongoose.Types.ObjectId(req.user.id),
    };

    /* ---------------------------------------------------
         DATE FILTER
      --------------------------------------------------- */

    if (req.query.from || req.query.to) {
      match.saleDate = {};

      if (req.query.from) {
        const fromDate = new Date(req.query.from);

        if (Number.isNaN(fromDate.getTime())) {
          return res.status(400).json({
            message: "Invalid from date",
          });
        }

        fromDate.setHours(0, 0, 0, 0);

        match.saleDate.$gte = fromDate;
      }

      if (req.query.to) {
        const toDate = new Date(req.query.to);

        if (Number.isNaN(toDate.getTime())) {
          return res.status(400).json({
            message: "Invalid to date",
          });
        }

        toDate.setHours(23, 59, 59, 999);

        match.saleDate.$lte = toDate;
      }
    }

    const result = await Sale.aggregate([
      {
        $match: match,
      },

      {
        $group: {
          _id: "$seller",

          sellerName: {
            $first: "$sellerName",
          },

          totalSales: {
            $sum: 1,
          },

          totalAmount: {
            $sum: "$grandTotal",
          },

          totalPaid: {
            $sum: "$paidAmount",
          },

          totalCredit: {
            $sum: "$creditAmount",
          },

          lastSaleDate: {
            $max: "$saleDate",
          },
        },
      },

      {
        $sort: {
          lastSaleDate: -1,
        },
      },
    ]);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   GET ITEM SALES SUMMARY
========================================================= */

export const getItemSalesSummary = async (req, res, next) => {
  try {
    const match = {
      user: new mongoose.Types.ObjectId(req.user.id),
    };

    /* ---------------------------------------------------
         DATE FILTER
      --------------------------------------------------- */

    if (req.query.from || req.query.to) {
      match.saleDate = {};

      if (req.query.from) {
        const fromDate = new Date(req.query.from);

        if (Number.isNaN(fromDate.getTime())) {
          return res.status(400).json({
            message: "Invalid from date",
          });
        }

        fromDate.setHours(0, 0, 0, 0);

        match.saleDate.$gte = fromDate;
      }

      if (req.query.to) {
        const toDate = new Date(req.query.to);

        if (Number.isNaN(toDate.getTime())) {
          return res.status(400).json({
            message: "Invalid to date",
          });
        }

        toDate.setHours(23, 59, 59, 999);

        match.saleDate.$lte = toDate;
      }
    }

    const result = await Sale.aggregate([
      {
        $match: match,
      },

      {
        $unwind: "$items",
      },

      {
        $group: {
          _id: "$items.item",

          itemName: {
            $first: "$items.itemName",
          },

          totalQuantity: {
            $sum: "$items.quantity",
          },

          totalPieces: {
            $sum: "$items.pieces",
          },

          totalAmount: {
            $sum: "$items.total",
          },

          averagePrice: {
            $avg: "$items.price",
          },

          saleCount: {
            $sum: 1,
          },

          lastSaleDate: {
            $max: "$saleDate",
          },
        },
      },

      {
        $sort: {
          lastSaleDate: -1,
        },
      },
    ]);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
