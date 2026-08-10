import mongoose from "mongoose";

import Payment from "../models/Payment.js";
import Seller from "../models/Seller.js";
import Sale from "../models/Sale.js";

/* =========================================================
   Helpers
========================================================= */

/*
 * Generate a readable payment number.
 *
 * Example:
 * PAY-20260810-0001
 */

const generatePaymentNumber = async () => {
  const date = new Date();

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  const prefix = `PAY-${year}${month}${day}`;

  const latestPayment = await Payment.findOne({
    paymentNumber: {
      $regex: `^${prefix}-`,
    },
  })
    .sort({
      paymentNumber: -1,
    })
    .select("paymentNumber")
    .lean();

  let nextNumber = 1;

  if (latestPayment?.paymentNumber) {
    const lastPart = latestPayment.paymentNumber.split("-").pop();

    const parsed = Number(lastPart);

    if (Number.isFinite(parsed)) {
      nextNumber = parsed + 1;
    }
  }

  return `${prefix}-` + String(nextNumber).padStart(4, "0");
};

/*
 * Calculate how much the seller
 * currently owes.
 *
 * Outstanding =
 * Total sales - Total payments
 */

const getSellerOutstanding = async ({ userId, sellerId, session = null }) => {
  const saleQuery = Sale.find({
    user: userId,
    seller: sellerId,
  }).select("grandTotal paidAmount");

  const paymentQuery = Payment.find({
    user: userId,
    seller: sellerId,
  }).select("amount");

  if (session) {
    saleQuery.session(session);
    paymentQuery.session(session);
  }

  const [sales, payments] = await Promise.all([
    saleQuery.lean(),
    paymentQuery.lean(),
  ]);

  const totalSales = sales.reduce(
    (total, sale) => total + (Number(sale.grandTotal) || 0),
    0,
  );

  /*
   * Payments made while creating
   * a sale are already stored in
   * sale.paidAmount.
   */

  const salePayments = sales.reduce(
    (total, sale) => total + (Number(sale.paidAmount) || 0),
    0,
  );

  /*
   * Separate Khatabook payments.
   */

  const khatabookPayments = payments.reduce(
    (total, payment) => total + (Number(payment.amount) || 0),
    0,
  );

  const totalPaid = salePayments + khatabookPayments;

  const outstanding = Math.max(totalSales - totalPaid, 0);

  return {
    totalSales,
    salePayments,
    khatabookPayments,
    totalPaid,
    outstanding,
  };
};

/* =========================================================
   CREATE PAYMENT
========================================================= */

export const createPayment = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    const {
      sellerId,
      paymentDate,
      amount,
      paymentMethod,
      note,
      referenceNumber,
    } = req.body;

    /* -----------------------------------------------------
         User
      ----------------------------------------------------- */

    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    /* -----------------------------------------------------
         Seller
      ----------------------------------------------------- */

    if (!sellerId) {
      return res.status(400).json({
        message: "Valid seller is required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        message: "Invalid seller ID",
      });
    }

    /* -----------------------------------------------------
         Amount
      ----------------------------------------------------- */

    const paymentAmount = Number(amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({
        message: "Payment amount must be greater than zero",
      });
    }

    /* -----------------------------------------------------
         Payment Method
      ----------------------------------------------------- */

    const allowedMethods = ["Cash", "UPI", "Net Banking", "Other"];

    if (!allowedMethods.includes(paymentMethod)) {
      return res.status(400).json({
        message: "Invalid payment method",
      });
    }

    /* -----------------------------------------------------
         Seller
      ----------------------------------------------------- */

    const seller = await Seller.findOne({
      _id: sellerId,
      user: userId,
    }).lean();

    if (!seller) {
      return res.status(404).json({
        message: "Seller not found",
      });
    }

    /* -----------------------------------------------------
         Calculate Current Outstanding
      ----------------------------------------------------- */

    const account = await getSellerOutstanding({
      userId,
      sellerId,
    });

    if (account.outstanding <= 0) {
      return res.status(400).json({
        message: "This seller has no outstanding balance",
        outstanding: 0,
      });
    }

    /*
     * Do not allow a payment larger
     * than the outstanding amount.
     */

    if (paymentAmount > account.outstanding) {
      return res.status(400).json({
        message: `Payment cannot be greater than the outstanding balance of ₹${account.outstanding.toFixed(
          2,
        )}`,
        outstanding: account.outstanding,
      });
    }

    /* -----------------------------------------------------
         Generate Payment Number
      ----------------------------------------------------- */

    let paymentNumber;

    /*
     * Payment number generation is
     * kept outside the transaction because
     * it does not change financial data.
     */

    paymentNumber = await generatePaymentNumber();

    /* -----------------------------------------------------
         Create Payment
      ----------------------------------------------------- */

    let createdPayment;

    session.startTransaction();

    const payment = new Payment({
      user: userId,

      seller: sellerId,

      sellerName: seller.shopName,

      paymentNumber,

      paymentDate: paymentDate || new Date(),

      amount: paymentAmount,

      paymentMethod,

      note: note?.trim() || "",

      referenceNumber: referenceNumber?.trim() || "",
    });

    const savedPayments = await payment.save({
      session,
    });

    createdPayment = savedPayments;

    await session.commitTransaction();

    /* -----------------------------------------------------
         Calculate New Balance
      ----------------------------------------------------- */

    const updatedAccount = await getSellerOutstanding({
      userId,
      sellerId,
    });

    /* -----------------------------------------------------
         Response
      ----------------------------------------------------- */

    return res.status(201).json({
      message: "Payment recorded successfully",

      payment: createdPayment,

      account: {
        totalSales: updatedAccount.totalSales,

        totalPaid: updatedAccount.totalPaid,

        outstanding: updatedAccount.outstanding,
      },
    });
  } catch (error) {
    try {
      await session.abortTransaction();
    } catch {
      // Transaction may already be closed.
    }

    console.error("Create payment error:", error);

    next(error);
  } finally {
    await session.endSession();
  }
};

/* =========================================================
   GET ALL PAYMENTS
========================================================= */

export const getPayments = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const { sellerId, startDate, endDate } = req.query;

    const filter = {
      user: userId,
    };

    /* -----------------------------------------------------
         Seller Filter
      ----------------------------------------------------- */

    if (sellerId) {
      if (!mongoose.Types.ObjectId.isValid(sellerId)) {
        return res.status(400).json({
          message: "Invalid seller ID",
        });
      }

      filter.seller = sellerId;
    }

    /* -----------------------------------------------------
         Date Filter
      ----------------------------------------------------- */

    if (startDate || endDate) {
      filter.paymentDate = {};

      if (startDate) {
        const start = new Date(startDate);

        if (Number.isNaN(start.getTime())) {
          return res.status(400).json({
            message: "Invalid start date",
          });
        }

        start.setHours(0, 0, 0, 0);

        filter.paymentDate.$gte = start;
      }

      if (endDate) {
        const end = new Date(endDate);

        if (Number.isNaN(end.getTime())) {
          return res.status(400).json({
            message: "Invalid end date",
          });
        }

        end.setHours(23, 59, 59, 999);

        filter.paymentDate.$lte = end;
      }
    }

    /* -----------------------------------------------------
         Query
      ----------------------------------------------------- */

    const payments = await Payment.find(filter)
      .populate("seller", "shopName phone city")
      .sort({
        paymentDate: -1,
        createdAt: -1,
      });

    return res.status(200).json({
      payments,
    });
  } catch (error) {
    console.error("Get payments error:", error);

    next(error);
  }
};

/* =========================================================
   GET PAYMENT BY ID
========================================================= */

export const getPaymentById = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;

    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid payment ID",
      });
    }

    const payment = await Payment.findOne({
      _id: id,
      user: userId,
    }).populate("seller", "shopName phone city");

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    return res.status(200).json({
      payment,
    });
  } catch (error) {
    console.error("Get payment error:", error);

    next(error);
  }
};

/* =========================================================
   GET PAYMENTS BY SELLER
========================================================= */

export const getPaymentsBySeller = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;

    const { sellerId } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(sellerId)) {
      return res.status(400).json({
        message: "Invalid seller ID",
      });
    }

    /* -----------------------------------------------------
         Verify Seller
      ----------------------------------------------------- */

    const seller = await Seller.findOne({
      _id: sellerId,
      user: userId,
    }).lean();

    if (!seller) {
      return res.status(404).json({
        message: "Seller not found",
      });
    }

    /* -----------------------------------------------------
         Payments
      ----------------------------------------------------- */

    const payments = await Payment.find({
      user: userId,
      seller: sellerId,
    }).sort({
      paymentDate: -1,
      createdAt: -1,
    });

    /* -----------------------------------------------------
         Account
      ----------------------------------------------------- */

    const account = await getSellerOutstanding({
      userId,
      sellerId,
    });

    return res.status(200).json({
      seller: {
        _id: seller._id,
        shopName: seller.shopName,
      },

      payments,

      account: {
        totalSales: account.totalSales,

        salePayments: account.salePayments,

        khatabookPayments: account.khatabookPayments,

        totalPaid: account.totalPaid,

        outstanding: account.outstanding,
      },
    });
  } catch (error) {
    console.error("Get seller payments error:", error);

    next(error);
  }
};

/* =========================================================
   UPDATE PAYMENT
========================================================= */

export const updatePayment = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;

    const { id } = req.params;

    const { paymentDate, amount, paymentMethod, note, referenceNumber } =
      req.body;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid payment ID",
      });
    }

    const existingPayment = await Payment.findOne({
      _id: id,
      user: userId,
    });

    if (!existingPayment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    /* -----------------------------------------------------
         Validate Amount
      ----------------------------------------------------- */

    const newAmount = Number(amount ?? existingPayment.amount);

    if (!Number.isFinite(newAmount) || newAmount <= 0) {
      return res.status(400).json({
        message: "Payment amount must be greater than zero",
      });
    }

    /* -----------------------------------------------------
         Calculate Available Balance
         
         Add the old payment back because
         we are replacing it.
      ----------------------------------------------------- */

    const account = await getSellerOutstanding({
      userId,
      sellerId: existingPayment.seller,
    });

    const availableBalance =
      account.outstanding + Number(existingPayment.amount);

    if (newAmount > availableBalance) {
      return res.status(400).json({
        message: `Payment cannot be greater than the available outstanding balance of ₹${availableBalance.toFixed(
          2,
        )}`,
        outstanding: availableBalance,
      });
    }

    /* -----------------------------------------------------
         Payment Method
      ----------------------------------------------------- */

    const allowedMethods = ["Cash", "UPI", "Net Banking", "Other"];

    const newMethod = paymentMethod ?? existingPayment.paymentMethod;

    if (!allowedMethods.includes(newMethod)) {
      return res.status(400).json({
        message: "Invalid payment method",
      });
    }

    /* -----------------------------------------------------
         Update
      ----------------------------------------------------- */

    existingPayment.amount = newAmount;

    existingPayment.paymentMethod = newMethod;

    if (paymentDate !== undefined) {
      const parsedDate = new Date(paymentDate);

      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          message: "Invalid payment date",
        });
      }

      existingPayment.paymentDate = parsedDate;
    }

    if (note !== undefined) {
      existingPayment.note = note?.trim() || "";
    }

    if (referenceNumber !== undefined) {
      existingPayment.referenceNumber = referenceNumber?.trim() || "";
    }

    await existingPayment.save();

    /* -----------------------------------------------------
         Updated Account
      ----------------------------------------------------- */

    const updatedAccount = await getSellerOutstanding({
      userId,
      sellerId: existingPayment.seller,
    });

    return res.status(200).json({
      message: "Payment updated successfully",

      payment: existingPayment,

      account: {
        totalSales: updatedAccount.totalSales,

        totalPaid: updatedAccount.totalPaid,

        outstanding: updatedAccount.outstanding,
      },
    });
  } catch (error) {
    console.error("Update payment error:", error);

    next(error);
  }
};

/* =========================================================
   DELETE PAYMENT
========================================================= */

export const deletePayment = async (req, res, next) => {
  try {
    const userId = req.user?._id || req.user?.id;

    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        message: "Invalid payment ID",
      });
    }

    const payment = await Payment.findOne({
      _id: id,
      user: userId,
    });

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    await Payment.deleteOne({
      _id: id,
      user: userId,
    });

    const updatedAccount = await getSellerOutstanding({
      userId,
      sellerId: payment.seller,
    });

    return res.status(200).json({
      message: "Payment deleted successfully",

      account: {
        totalSales: updatedAccount.totalSales,

        totalPaid: updatedAccount.totalPaid,

        outstanding: updatedAccount.outstanding,
      },
    });
  } catch (error) {
    console.error("Delete payment error:", error);

    next(error);
  }
};
