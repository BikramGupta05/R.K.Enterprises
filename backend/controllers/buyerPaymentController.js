import mongoose from "mongoose";

import BuyerPayment from "../models/BuyerPayment.js";
import Buyer from "../models/Buyer.js";
import Purchase from "../models/Purchase.js";

const ALLOWED_PAYMENT_METHODS = ["Cash", "UPI", "Net Banking", "Other"];
const KHATABOOK_SOURCE = "KHATABOOK";
const PURCHASE_SOURCE = "PURCHASE";

const isValidObjectId = (id) => mongoose.Types.ObjectId.isValid(id);

const getUserId = (req) => req.user?._id || req.user?.id;

const parseDate = (value) => {
  if (!value) {
    return new Date();
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    const error = new Error("Invalid payment date");
    error.status = 400;
    throw error;
  }

  return date;
};

const normalizeAmount = (value) => {
  const amount = Number(value);

  if (!Number.isFinite(amount) || amount <= 0) {
    const error = new Error("Payment amount must be greater than zero");
    error.status = 400;
    throw error;
  }

  return amount;
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

  const latest = await query.lean();

  let nextNumber = 1;

  if (latest?.paymentNumber) {
    const parsed = Number(latest.paymentNumber.split("-").pop());

    if (Number.isFinite(parsed)) {
      nextNumber = parsed + 1;
    }
  }

  return `${prefix}-${String(nextNumber).padStart(4, "0")}`;
};

const getBuyerAccount = async ({ buyerId, userId, session = null }) => {
  let purchaseQuery = Purchase.find({
    user: userId,
    buyer: buyerId,
  })
    .select("grandTotal buyerName purchaseDate")
    .sort({ purchaseDate: -1, createdAt: -1 });

  let paymentQuery = BuyerPayment.find({
    user: userId,
    buyer: buyerId,
  })
    .select(
      "buyer buyerName purchase paymentNumber source paymentDate amount paymentMethod note referenceNumber createdAt",
    )
    .sort({ paymentDate: -1, createdAt: -1 });

  if (session) {
    purchaseQuery = purchaseQuery.session(session);
    paymentQuery = paymentQuery.session(session);
  }

  const [purchases, payments] = await Promise.all([
    purchaseQuery.lean(),
    paymentQuery.lean(),
  ]);

  const totalPurchased = purchases.reduce(
    (total, purchase) => total + (Number(purchase.grandTotal) || 0),
    0,
  );

  const totalPaid = payments.reduce(
    (total, payment) => total + (Number(payment.amount) || 0),
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

const getBuyerById = async ({ buyerId, userId }) => {
  if (!buyerId || !isValidObjectId(buyerId)) {
    const error = new Error("Invalid buyer ID");
    error.status = 400;
    throw error;
  }

  const buyer = await Buyer.findOne({
    _id: buyerId,
    user: userId,
  }).lean();

  if (!buyer) {
    const error = new Error("Buyer not found");
    error.status = 404;
    throw error;
  }

  return buyer;
};

const validatePaymentMethod = (paymentMethod) => {
  if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
    const error = new Error("Invalid payment method");
    error.status = 400;
    throw error;
  }
};

/* =========================================================
   GET MONEY DUE SUMMARY
========================================================= */

export const getMoneyDueSummary = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const buyers = await Buyer.find({ user: userId })
      .sort({ shopName: 1 })
      .lean();

    const purchases = await Purchase.find({ user: userId })
      .select("buyer grandTotal purchaseDate")
      .lean();

    const payments = await BuyerPayment.find({ user: userId })
      .select("buyer amount paymentDate")
      .lean();

    const accounts = buyers
      .map((buyer) => {
        const buyerId = String(buyer._id);

        const buyerPurchases = purchases.filter(
          (purchase) => String(purchase.buyer) === buyerId,
        );

        const buyerPayments = payments.filter(
          (payment) => String(payment.buyer) === buyerId,
        );

        const totalPurchased = buyerPurchases.reduce(
          (total, purchase) => total + (Number(purchase.grandTotal) || 0),
          0,
        );

        const totalPaid = buyerPayments.reduce(
          (total, payment) => total + (Number(payment.amount) || 0),
          0,
        );

        const totalDue = Math.max(totalPurchased - totalPaid, 0);

        const sortedPurchases = [...buyerPurchases].sort(
          (a, b) => new Date(b.purchaseDate || 0) - new Date(a.purchaseDate || 0),
        );

        const sortedPayments = [...buyerPayments].sort(
          (a, b) => new Date(b.paymentDate || 0) - new Date(a.paymentDate || 0),
        );

        return {
          ...buyer,
          totalPurchases: buyerPurchases.length,
          totalPurchased,
          totalPaid,
          totalDue,
          lastPurchaseDate: sortedPurchases[0]?.purchaseDate || null,
          lastPaymentDate: sortedPayments[0]?.paymentDate || null,
        };
      })
      .filter((buyer) => buyer.totalPurchased > 0);

    const totals = accounts.reduce(
      (result, account) => {
        result.totalPurchased += account.totalPurchased;
        result.totalPaid += account.totalPaid;
        result.totalDue += account.totalDue;
        result.totalBuyers += 1;
        return result;
      },
      {
        totalPurchased: 0,
        totalPaid: 0,
        totalDue: 0,
        totalBuyers: 0,
      },
    );

    res.json({
      accounts,
      totals,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   GET BUYER ACCOUNT
========================================================= */

export const getMoneyDueByBuyer = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { buyerId } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const buyer = await getBuyerById({ buyerId, userId });
    const account = await getBuyerAccount({ buyerId, userId });

    const [purchases, payments] = await Promise.all([
      Purchase.find({ user: userId, buyer: buyerId })
        .select(
          "buyer buyerName purchaseNumber purchaseDate itemsTotal carriage grandTotal paidAtPurchase createdAt",
        )
        .sort({ purchaseDate: -1, createdAt: -1 })
        .lean(),
      BuyerPayment.find({ user: userId, buyer: buyerId })
        .sort({ paymentDate: -1, createdAt: -1 })
        .lean(),
    ]);

    res.json({
      buyer,
      account,
      purchases,
      payments,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   GET ALL BUYER PAYMENTS
========================================================= */

export const getBuyerPayments = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const payments = await BuyerPayment.find({ user: userId })
      .populate("buyer", "shopName city address phone email gstNumber")
      .populate("purchase", "purchaseNumber purchaseDate grandTotal")
      .sort({ paymentDate: -1, createdAt: -1 })
      .lean();

    res.json({ payments });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   GET PAYMENT BY ID
========================================================= */

export const getBuyerPaymentById = async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid payment ID" });
    }

    const payment = await BuyerPayment.findOne({
      _id: id,
      user: userId,
    })
      .populate("buyer", "shopName city address phone email gstNumber")
      .populate("purchase", "purchaseNumber purchaseDate grandTotal")
      .lean();

    if (!payment) {
      return res.status(404).json({ message: "Buyer payment not found" });
    }

    res.json({ payment });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   CREATE BUYER PAYMENT

   This endpoint is used by:

   Money Due → Buyer → Make Payment

   It creates only KHATABOOK payments.
========================================================= */

export const createBuyerPayment = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const {
      buyerId,
      paymentDate,
      amount,
      paymentMethod,
      note,
      referenceNumber,
    } = req.body;

    const buyer = await getBuyerById({ buyerId, userId });
    const paymentAmount = normalizeAmount(amount);

    validatePaymentMethod(paymentMethod);

    const finalPaymentDate = parseDate(paymentDate);

    session.startTransaction();

    const account = await getBuyerAccount({
      buyerId,
      userId,
      session,
    });

    if (account.totalDue <= 0) {
      const error = new Error("This buyer has no outstanding balance");
      error.status = 409;
      throw error;
    }

    if (paymentAmount > account.totalDue + 0.000001) {
      const error = new Error(
        `Payment cannot be greater than the due amount of ₹${account.totalDue.toFixed(2)}`,
      );
      error.status = 400;
      throw error;
    }

    const paymentNumber = await generateBuyerPaymentNumber(session);

    const payment = await BuyerPayment.create(
      [
        {
          user: userId,
          buyer: buyer._id,
          buyerName: buyer.shopName,
          purchase: null,
          paymentNumber,
          source: KHATABOOK_SOURCE,
          paymentDate: finalPaymentDate,
          amount: paymentAmount,
          paymentMethod,
          note: typeof note === "string" ? note.trim() : "",
          referenceNumber:
            typeof referenceNumber === "string" ? referenceNumber.trim() : "",
        },
      ],
      { session },
    );

    const updatedAccount = await getBuyerAccount({
      buyerId,
      userId,
      session,
    });

    await session.commitTransaction();

    res.status(201).json({
      message: "Buyer payment recorded successfully",
      payment: payment[0],
      account: updatedAccount,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    next(error);
  } finally {
    await session.endSession();
  }
};

/* =========================================================
   UPDATE BUYER PAYMENT

   Purchase-linked payments are controlled by Purchase edit.
========================================================= */

export const updateBuyerPayment = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid payment ID" });
    }

    const payment = await BuyerPayment.findOne({
      _id: id,
      user: userId,
    }).session(session);

    if (!payment) {
      return res.status(404).json({ message: "Buyer payment not found" });
    }

    if (payment.source === PURCHASE_SOURCE) {
      return res.status(409).json({
        message:
          "This payment is linked to a purchase. Edit the purchase to change its initial payment.",
      });
    }

    const {
      paymentDate,
      amount,
      paymentMethod,
      note,
      referenceNumber,
    } = req.body;

    const paymentAmount = normalizeAmount(amount);
    validatePaymentMethod(paymentMethod);

    const finalPaymentDate = parseDate(paymentDate);

    session.startTransaction();

    const account = await getBuyerAccount({
      buyerId: payment.buyer,
      userId,
      session,
    });

    const availableDueBeforeThisPayment = account.totalDue + Number(payment.amount || 0);

    if (paymentAmount > availableDueBeforeThisPayment + 0.000001) {
      const error = new Error(
        `Payment cannot be greater than the buyer's available due of ₹${availableDueBeforeThisPayment.toFixed(2)}`,
      );
      error.status = 400;
      throw error;
    }

    payment.paymentDate = finalPaymentDate;
    payment.amount = paymentAmount;
    payment.paymentMethod = paymentMethod;
    payment.note = typeof note === "string" ? note.trim() : "";
    payment.referenceNumber =
      typeof referenceNumber === "string" ? referenceNumber.trim() : "";

    const updatedPayment = await payment.save({ session });

    const updatedAccount = await getBuyerAccount({
      buyerId: payment.buyer,
      userId,
      session,
    });

    await session.commitTransaction();

    res.json({
      message: "Buyer payment updated successfully",
      payment: updatedPayment,
      account: updatedAccount,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    next(error);
  } finally {
    await session.endSession();
  }
};

/* =========================================================
   DELETE BUYER PAYMENT
========================================================= */

export const deleteBuyerPayment = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const userId = getUserId(req);
    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({ message: "Authentication required" });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({ message: "Invalid payment ID" });
    }

    const payment = await BuyerPayment.findOne({
      _id: id,
      user: userId,
    }).session(session);

    if (!payment) {
      return res.status(404).json({ message: "Buyer payment not found" });
    }

    if (payment.source === PURCHASE_SOURCE) {
      return res.status(409).json({
        message:
          "This payment is linked to a purchase. Edit or delete the purchase instead.",
      });
    }

    session.startTransaction();

    await payment.deleteOne({ session });

    const updatedAccount = await getBuyerAccount({
      buyerId: payment.buyer,
      userId,
      session,
    });

    await session.commitTransaction();

    res.json({
      message: "Buyer payment deleted successfully",
      account: updatedAccount,
    });
  } catch (error) {
    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    next(error);
  } finally {
    await session.endSession();
  }
};
