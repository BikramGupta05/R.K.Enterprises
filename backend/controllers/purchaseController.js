import mongoose from "mongoose";
import Purchase from "../models/Purchase.js";
import Buyer from "../models/Buyer.js";
import Item from "../models/Item.js";
import Stock from "../models/Stock.js";
import BuyerPayment from "../models/BuyerPayment.js";

const getUserId = (req) => {
  const userId = req.user?._id || req.user?.id;

  if (!userId) {
    return null;
  }

  if (userId instanceof mongoose.Types.ObjectId) {
    return userId;
  }

  if (!mongoose.Types.ObjectId.isValid(userId)) {
    return null;
  }

  return new mongoose.Types.ObjectId(userId);
};

const buildPurchaseDateFilter = (from, to) => {
  if (!from && !to) {
    return null;
  }

  const purchaseDate = {};

  if (from) {
    const fromDate = new Date(`${from}T00:00:00.000`);

    if (Number.isNaN(fromDate.getTime())) {
      throw new Error("Invalid from date");
    }

    purchaseDate.$gte = fromDate;
  }

  if (to) {
    const toDate = new Date(`${to}T23:59:59.999`);

    if (Number.isNaN(toDate.getTime())) {
      throw new Error("Invalid to date");
    }

    purchaseDate.$lte = toDate;
  }

  return purchaseDate;
};

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

const ALLOWED_PAYMENT_METHODS = ["Cash", "UPI", "Net Banking", "Other"];

const BUYER_PAYMENT_SOURCE = "PURCHASE";

const toDateOrNow = (value) => {
  if (!value) {
    return new Date();
  }

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    const error = new Error("Invalid purchase date");

    error.status = 400;

    throw error;
  }

  return date;
};

const generateBuyerPaymentNumber = async (session = null) => {
  const date = new Date();

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  const prefix = `BYPAY-${year}${month}${day}`;

  let query = BuyerPayment.findOne({
    paymentNumber: { $regex: `^${prefix}-` },
  })
    .sort({ paymentNumber: -1 })
    .select("paymentNumber");

  if (session) {
    query = query.session(session);
  }

  const latestPayment = await query.lean();

  let nextNumber = 1;

  if (latestPayment?.paymentNumber) {
    const lastPart = latestPayment.paymentNumber.split("-").pop();
    const parsedNumber = Number(lastPart);

    if (Number.isFinite(parsedNumber)) {
      nextNumber = parsedNumber + 1;
    }
  }

  return `${prefix}-${String(nextNumber).padStart(4, "0")}`;
};

const getPurchasePaidAmount = async ({ purchaseId, userId, session = null }) => {
  let query = BuyerPayment.find({
    user: userId,
    purchase: purchaseId,
    source: BUYER_PAYMENT_SOURCE,
  }).select("amount");

  if (session) {
    query = query.session(session);
  }

  const payments = await query.lean();

  return payments.reduce((total, payment) => total + toNumber(payment.amount), 0);
};

const getBuyerAccount = async ({ buyerId, userId, session = null }) => {
  let purchaseQuery = Purchase.find({
    user: userId,
    buyer: buyerId,
  }).select("grandTotal");

  let paymentQuery = BuyerPayment.find({
    user: userId,
    buyer: buyerId,
  }).select("amount source paymentDate purchase buyerName paymentMethod note referenceNumber paymentNumber");

  if (session) {
    purchaseQuery = purchaseQuery.session(session);
    paymentQuery = paymentQuery.session(session);
  }

  const [purchases, payments] = await Promise.all([
    purchaseQuery.lean(),
    paymentQuery.lean(),
  ]);

  const totalPurchased = purchases.reduce(
    (total, purchase) => total + toNumber(purchase.grandTotal),
    0,
  );

  const totalPaid = payments.reduce(
    (total, payment) => total + toNumber(payment.amount),
    0,
  );

  return {
    totalPurchased,
    totalPaid,
    totalDue: Math.max(totalPurchased - totalPaid, 0),
    purchaseCount: purchases.length,
    paymentCount: payments.length,
  };
};

const validateInitialPayment = ({ paidAmount, grandTotal, paymentMethod }) => {
  const amount = paidAmount === undefined || paidAmount === null || paidAmount === ""
    ? 0
    : Number(paidAmount);

  if (!Number.isFinite(amount) || amount < 0) {
    const error = new Error("Paid amount must be zero or greater");
    error.status = 400;
    throw error;
  }

  if (amount > grandTotal) {
    const error = new Error(
      `Paid amount cannot be greater than the purchase total of ₹${grandTotal.toFixed(2)}`,
    );
    error.status = 400;
    throw error;
  }

  if (amount > 0 && !ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
    const error = new Error("A valid payment method is required when an amount is paid");
    error.status = 400;
    throw error;
  }

  return amount;
};

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
      const {
        buyerId,
        purchaseDate,
        items,
        carriage,
        paidAmount,
        paymentMethod,
        paymentNote,
        paymentReferenceNumber,
      } = req.body;

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

      const initialPaidAmount = validateInitialPayment({
        paidAmount,
        grandTotal: totals.grandTotal,
        paymentMethod,
      });

      const finalPurchaseDate = toDateOrNow(purchaseDate);

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

            purchaseDate: finalPurchaseDate,

            items: normalizedItems,

            itemsTotal: totals.itemsTotal,

            carriage: totals.carriage,

            grandTotal: totals.grandTotal,

            paidAtPurchase: initialPaidAmount,
          },
        ],
        {
          session,
        },
      );

      if (initialPaidAmount > 0) {
        const paymentNumber = await generateBuyerPaymentNumber(session);

        await BuyerPayment.create(
          [
            {
              user: req.user.id,
              buyer: buyerData._id,
              buyerName: buyerData.shopName,
              purchase: purchase[0]._id,
              paymentNumber,
              source: BUYER_PAYMENT_SOURCE,
              paymentDate: finalPurchaseDate,
              amount: initialPaidAmount,
              paymentMethod,
              note: typeof paymentNote === "string" ? paymentNote.trim() : "",
              referenceNumber:
                typeof paymentReferenceNumber === "string"
                  ? paymentReferenceNumber.trim()
                  : "",
            },
          ],
          { session },
        );
      }

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
      const {
        buyerId,
        purchaseDate,
        items,
        carriage,
        paidAmount,
        paymentMethod,
        paymentNote,
        paymentReferenceNumber,
      } = req.body;

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

      const purchasePayments = await BuyerPayment.find({
        user: req.user.id,
        purchase: existingPurchase._id,
        source: BUYER_PAYMENT_SOURCE,
      }).session(session);

      const existingPaidAmount = purchasePayments.reduce(
        (total, payment) => total + toNumber(payment.amount),
        0,
      );

      const requestedPaidAmount =
        paidAmount === undefined ? existingPaidAmount : paidAmount;

      const existingPaymentMethod = purchasePayments[0]?.paymentMethod;

      const updatedPaidAmount = validateInitialPayment({
        paidAmount: requestedPaidAmount,
        grandTotal: totals.grandTotal,
        paymentMethod:
          paymentMethod ||
          (existingPaidAmount > 0 ? existingPaymentMethod : undefined),
      });

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
        existingPurchase.purchaseDate = toDateOrNow(purchaseDate);
      }

      existingPurchase.items = normalizedItems;

      existingPurchase.itemsTotal = totals.itemsTotal;

      existingPurchase.carriage = totals.carriage;

      existingPurchase.grandTotal = totals.grandTotal;

      existingPurchase.paidAtPurchase = updatedPaidAmount;

      /*
       * Keep the purchase-linked initial payment synchronized
       * with the edited purchase.
       */
      if (updatedPaidAmount <= 0) {
        if (purchasePayments.length > 0) {
          await BuyerPayment.deleteMany({
            user: req.user.id,
            purchase: existingPurchase._id,
            source: BUYER_PAYMENT_SOURCE,
          }).session(session);
        }
      } else {
        const paymentDate = purchaseDate
          ? toDateOrNow(purchaseDate)
          : existingPurchase.purchaseDate;

        const paymentPayload = {
          user: req.user.id,
          buyer: buyerData._id,
          buyerName: buyerData.shopName,
          purchase: existingPurchase._id,
          source: BUYER_PAYMENT_SOURCE,
          paymentDate,
          amount: updatedPaidAmount,
          paymentMethod: paymentMethod || existingPaymentMethod || "Other",
          note:
            typeof paymentNote === "string"
              ? paymentNote.trim()
              : purchasePayments[0]?.note || "",
          referenceNumber:
            typeof paymentReferenceNumber === "string"
              ? paymentReferenceNumber.trim()
              : purchasePayments[0]?.referenceNumber || "",
        };

        if (purchasePayments.length > 0) {
          purchasePayments[0].set(paymentPayload);
          await purchasePayments[0].save({ session });

          if (purchasePayments.length > 1) {
            await BuyerPayment.deleteMany({
              _id: { $in: purchasePayments.slice(1).map((payment) => payment._id) },
            }).session(session);
          }
        } else {
          paymentPayload.paymentNumber = await generateBuyerPaymentNumber(session);
          await BuyerPayment.create([paymentPayload], { session });
        }
      }

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
       * Deleting a purchase must never leave the buyer
       * with more recorded payments than purchases.
       */
      const buyerAccount = await getBuyerAccount({
        buyerId: purchase.buyer,
        userId: req.user.id,
        session,
      });

      const purchaseLinkedPaidAmount = await getPurchasePaidAmount({
        purchaseId: purchase._id,
        userId: req.user.id,
        session,
      });

      const remainingPurchased =
        buyerAccount.totalPurchased - Number(purchase.grandTotal || 0);

      const remainingPaid = buyerAccount.totalPaid - purchaseLinkedPaidAmount;

      if (remainingPurchased + 0.000001 < remainingPaid) {
        const error = new Error(
          "This purchase cannot be deleted because the buyer has payments recorded against the account. Remove or adjust those payments first.",
        );
        error.status = 409;
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

      await BuyerPayment.deleteMany({
        user: req.user.id,
        purchase: purchase._id,
        source: BUYER_PAYMENT_SOURCE,
      }).session(session);

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

/* =========================================================
   GET PURCHASE SUMMARY BY BUYER
========================================================= */

export const getPurchaseSummaryByBuyer = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "User authentication required",
      });
    }

    const { from, to } = req.query;

    const match = {
      user: userId,
    };

    const purchaseDate = buildPurchaseDateFilter(from, to);

    if (purchaseDate) {
      match.purchaseDate = purchaseDate;
    }

    const buyers = await Purchase.aggregate([
      {
        $match: match,
      },

      {
        $group: {
          _id: "$buyer",

          buyerName: {
            $first: "$buyerName",
          },

          totalPurchases: {
            $sum: 1,
          },

          totalAmount: {
            $sum: {
              $ifNull: ["$grandTotal", 0],
            },
          },

          lastPurchaseDate: {
            $max: "$purchaseDate",
          },
        },
      },

      {
        $sort: {
          buyerName: 1,
        },
      },
    ]);

    return res.status(200).json({
      buyers,
    });
  } catch (error) {
    console.error("getPurchaseSummaryByBuyer error:", error);

    next(error);
  }
};

/* =========================================================
   GET PURCHASE HISTORY BY BUYER
========================================================= */

export const getPurchaseHistoryByBuyer = async (req, res, next) => {
  try {
    const { buyerId } = req.params;
    const { from, to } = req.query;

    const match = {
      user: req.user.id,
      buyer: buyerId,
    };

    /*
     * Date filter
     */
    if (from || to) {
      match.purchaseDate = {};

      if (from) {
        const fromDate = new Date(`${from}T00:00:00.000`);

        if (Number.isNaN(fromDate.getTime())) {
          return res.status(400).json({
            message: "Invalid from date",
          });
        }

        match.purchaseDate.$gte = fromDate;
      }

      if (to) {
        const toDate = new Date(`${to}T23:59:59.999`);

        if (Number.isNaN(toDate.getTime())) {
          return res.status(400).json({
            message: "Invalid to date",
          });
        }

        match.purchaseDate.$lte = toDate;
      }
    }

    const purchases = await Purchase.find(match)
      .sort({
        purchaseDate: -1,
        createdAt: -1,
      })
      .lean();

    const summary = purchases.reduce(
      (result, purchase) => {
        result.totalPurchases += 1;

        result.totalAmount += Number(purchase.grandTotal || 0);

        return result;
      },
      {
        totalPurchases: 0,
        totalAmount: 0,
      },
    );

    const buyerName = purchases[0]?.buyerName || "Unknown Buyer";

    res.status(200).json({
      buyer: {
        _id: buyerId,
        buyerName,
      },

      summary,

      purchases,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   GET PURCHASE SUMMARY BY ITEM
========================================================= */

export const getPurchaseSummaryByItem = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "User authentication required",
      });
    }

    const { from, to } = req.query;

    const match = {
      user: userId,
    };

    const purchaseDate = buildPurchaseDateFilter(from, to);

    if (purchaseDate) {
      match.purchaseDate = purchaseDate;
    }

    const items = await Purchase.aggregate([
      {
        $match: match,
      },

      /*
       * Convert each purchase's items array
       * into individual item documents.
       */
      {
        $unwind: "$items",
      },

      /*
       * Group identical Item IDs.
       */
      {
        $group: {
          _id: "$items.item",

          itemName: {
            $first: "$items.itemName",
          },

          totalQuantity: {
            $sum: {
              $ifNull: ["$items.quantity", 0],
            },
          },

          totalPieces: {
            $sum: {
              $ifNull: ["$items.pieces", 0],
            },
          },

          totalAmount: {
            $sum: {
              $ifNull: ["$items.total", 0],
            },
          },

          purchaseCount: {
            $sum: 1,
          },

          lastPurchaseDate: {
            $max: "$purchaseDate",
          },
        },
      },

      /*
       * Calculate average price per quantity.
       */
      {
        $addFields: {
          averagePrice: {
            $cond: [
              {
                $gt: ["$totalQuantity", 0],
              },
              {
                $divide: ["$totalAmount", "$totalQuantity"],
              },
              0,
            ],
          },
        },
      },

      {
        $sort: {
          itemName: 1,
        },
      },
    ]);

    return res.status(200).json({
      items,
    });
  } catch (error) {
    console.error("getPurchaseSummaryByItem error:", error);

    next(error);
  }
};

/* =========================================================
   GET PURCHASE HISTORY BY ITEM
========================================================= */

export const getPurchaseHistoryByItem = async (req, res, next) => {
  try {
    const { itemId } = req.params;
    const { from, to } = req.query;

    const match = {
      user: req.user.id,
      "items.item": itemId,
    };

    /*
     * Date filter
     */
    if (from || to) {
      match.purchaseDate = {};

      if (from) {
        const fromDate = new Date(`${from}T00:00:00.000`);

        if (Number.isNaN(fromDate.getTime())) {
          return res.status(400).json({
            message: "Invalid from date",
          });
        }

        match.purchaseDate.$gte = fromDate;
      }

      if (to) {
        const toDate = new Date(`${to}T23:59:59.999`);

        if (Number.isNaN(toDate.getTime())) {
          return res.status(400).json({
            message: "Invalid to date",
          });
        }

        match.purchaseDate.$lte = toDate;
      }
    }

    const purchases = await Purchase.find(match)
      .sort({
        purchaseDate: -1,
        createdAt: -1,
      })
      .lean();

    const history = [];

    let totalQuantity = 0;
    let totalPieces = 0;
    let totalAmount = 0;

    /*
     * Extract only the requested item
     * from every purchase.
     */
    for (const purchase of purchases) {
      const matchingItems = purchase.items.filter(
        (item) => String(item.item) === String(itemId),
      );

      for (const item of matchingItems) {
        totalQuantity += Number(item.quantity || 0);

        totalPieces += Number(item.pieces || 0);

        totalAmount += Number(item.total || 0);

        history.push({
          purchaseId: purchase._id,

          purchaseNumber: purchase.purchaseNumber,

          purchaseDate: purchase.purchaseDate,

          buyer: purchase.buyer,

          buyerName: purchase.buyerName,

          item: item.item,

          itemName: item.itemName,

          quantity: item.quantity,

          pieces: item.pieces,

          price: item.price,

          total: item.total,
        });
      }
    }

    const averagePrice = totalQuantity > 0 ? totalAmount / totalQuantity : 0;

    const itemName = history[0]?.itemName || "Unknown Item";

    res.status(200).json({
      item: {
        _id: itemId,
        itemName,
      },

      summary: {
        totalQuantity,
        totalPieces,
        totalAmount,
        averagePrice,
        purchaseCount: history.length,
      },

      history,
    });
  } catch (error) {
    next(error);
  }
};
