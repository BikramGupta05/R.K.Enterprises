import mongoose from "mongoose";

import Payment from "../models/Payment.js";
import Seller from "../models/Seller.js";
import Sale from "../models/Sale.js";

/* =========================================================
   CONSTANTS
========================================================= */

const ALLOWED_PAYMENT_METHODS = ["Cash", "UPI", "Net Banking", "Other"];

const KHATABOOK_SOURCE = "KHATABOOK";

/* =========================================================
   HELPERS
========================================================= */

/*
 * Validate MongoDB ObjectId.
 */
const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/*
 * Get authenticated user ID.
 *
 * Supports both:
 *
 * req.user.id
 *
 * and:
 *
 * req.user._id
 */
const getUserId = (req) => {
  return req.user?._id || req.user?.id;
};

/*
 * Convert MongoDB/ObjectId values to
 * a consistent string.
 */
const toIdString = (value) => {
  return value ? String(value) : "";
};

/* =========================================================
   GENERATE PAYMENT NUMBER
========================================================= */

/*
 * Generates a readable payment number.
 *
 * Example:
 *
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

    const parsedNumber = Number(lastPart);

    if (Number.isFinite(parsedNumber)) {
      nextNumber = parsedNumber + 1;
    }
  }

  return `${prefix}-${String(nextNumber).padStart(4, "0")}`;
};

/* =========================================================
   GET SELLER ACCOUNT
========================================================= */

/*
 * CENTRAL KHATABOOK CALCULATION
 *
 * ---------------------------------------------------------
 *
 * SALE PAYMENT
 *
 * Sale.paidAmount
 *
 * means:
 *
 * Money received while creating
 * the original sale.
 *
 * ---------------------------------------------------------
 *
 * KHATABOOK PAYMENT
 *
 * Payment.amount
 *
 * with:
 *
 * source = "KHATABOOK"
 *
 * means:
 *
 * Money received later through
 * the Khatabook Add Payment section.
 *
 * ---------------------------------------------------------
 *
 * IMPORTANT:
 *
 * We NEVER count every Payment document.
 *
 * We count ONLY:
 *
 * source = "KHATABOOK"
 *
 * ---------------------------------------------------------
 *
 * Formula:
 *
 * Total Sales
 *       -
 * Sale Payments
 *       -
 * Khatabook Payments
 *       =
 * Outstanding
 *
 * ---------------------------------------------------------
 */

const getSellerAccount = async ({ userId, sellerId, session = null }) => {
  /* =======================================================
     SALES
  ======================================================= */

  let saleQuery = Sale.find({
    user: userId,
    seller: sellerId,
  }).select("grandTotal paidAmount creditAmount");

  /* =======================================================
     KHATABOOK PAYMENTS ONLY
  ======================================================= */

  let paymentQuery = Payment.find({
    user: userId,

    seller: sellerId,

    /*
     * THIS IS THE IMPORTANT FIX.
     *
     * Old/incorrect Payment records
     * will not be included.
     */
    source: KHATABOOK_SOURCE,
  }).select("amount");

  /* =======================================================
     TRANSACTION SESSION
  ======================================================= */

  if (session) {
    saleQuery = saleQuery.session(session);

    paymentQuery = paymentQuery.session(session);
  }

  /* =======================================================
     FETCH BOTH
  ======================================================= */

  const [sales, khatabookPaymentsList] = await Promise.all([
    saleQuery.lean(),

    paymentQuery.lean(),
  ]);

  /* =======================================================
     TOTAL SALES
  ======================================================= */

  const totalSales = sales.reduce((total, sale) => {
    return total + (Number(sale.grandTotal) || 0);
  }, 0);

  /* =======================================================
     SALE PAYMENTS
  ======================================================= */

  /*
   * This is money received during
   * the original sale.
   *
   * IMPORTANT:
   *
   * It is NOT coming from Payment.
   */

  const salePayments = sales.reduce((total, sale) => {
    return total + (Number(sale.paidAmount) || 0);
  }, 0);

  /* =======================================================
     KHATABOOK PAYMENTS
  ======================================================= */

  /*
   * Only Payment documents with:
   *
   * source = KHATABOOK
   *
   * are included.
   */

  const khatabookPayments = khatabookPaymentsList.reduce((total, payment) => {
    return total + (Number(payment.amount) || 0);
  }, 0);

  /* =======================================================
     TOTAL PAID
  ======================================================= */

  const totalPaid = salePayments + khatabookPayments;

  /* =======================================================
     OUTSTANDING
  ======================================================= */

  const outstanding = Math.max(totalSales - totalPaid, 0);

  /* =======================================================
     RETURN
  ======================================================= */

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

/*
 * THIS ENDPOINT IS ONLY FOR:
 *
 * Khatabook → Add Payment
 *
 * It creates:
 *
 * Payment
 * source = KHATABOOK
 *
 * It MUST NOT be called from
 * the Sale creation flow.
 */

export const createPayment = async (req, res, next) => {
  const session = await mongoose.startSession();

  try {
    /* =====================================================
       REQUEST DATA
    ===================================================== */

    const {
      sellerId,
      paymentDate,
      amount,
      paymentMethod,
      note,
      referenceNumber,
    } = req.body;

    /* =====================================================
       USER
    ===================================================== */

    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    /* =====================================================
       SELLER ID
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
       AMOUNT
    ===================================================== */

    const paymentAmount = Number(amount);

    if (!Number.isFinite(paymentAmount) || paymentAmount <= 0) {
      return res.status(400).json({
        message: "Payment amount must be greater than zero",
      });
    }

    /* =====================================================
       PAYMENT METHOD
    ===================================================== */

    if (!ALLOWED_PAYMENT_METHODS.includes(paymentMethod)) {
      return res.status(400).json({
        message: "Invalid payment method",
      });
    }

    /* =====================================================
       PAYMENT DATE
    ===================================================== */

    let finalPaymentDate;

    if (
      paymentDate !== undefined &&
      paymentDate !== null &&
      paymentDate !== ""
    ) {
      finalPaymentDate = new Date(paymentDate);

      if (Number.isNaN(finalPaymentDate.getTime())) {
        return res.status(400).json({
          message: "Invalid payment date",
        });
      }
    } else {
      finalPaymentDate = new Date();
    }

    /* =====================================================
       SELLER OWNERSHIP
    ===================================================== */

    const seller = await Seller.findOne({
      _id: sellerId,

      user: userId,
    }).lean();

    if (!seller) {
      return res.status(404).json({
        message: "Seller not found",
      });
    }

    /* =====================================================
       START TRANSACTION
    ===================================================== */

    session.startTransaction();

    /* =====================================================
       CURRENT ACCOUNT
    ===================================================== */

    const account = await getSellerAccount({
      userId,

      sellerId,

      session,
    });

    /* =====================================================
       OUTSTANDING CHECK
    ===================================================== */

    if (account.outstanding <= 0) {
      throw new Error("This seller has no outstanding balance");
    }

    /* =====================================================
       PAYMENT CANNOT EXCEED OUTSTANDING
    ===================================================== */

    if (paymentAmount > account.outstanding) {
      throw new Error(
        `Payment cannot be greater than the outstanding balance of ₹${account.outstanding.toFixed(
          2,
        )}`,
      );
    }

    /* =====================================================
       PAYMENT NUMBER
    ===================================================== */

    const paymentNumber = await generatePaymentNumber();

    /* =====================================================
       NOTE
    ===================================================== */

    const finalNote = typeof note === "string" ? note.trim() : "";

    /* =====================================================
       REFERENCE NUMBER
    ===================================================== */

    const finalReferenceNumber =
      typeof referenceNumber === "string" ? referenceNumber.trim() : "";

    /* =====================================================
       CREATE KHATABOOK PAYMENT
    ===================================================== */

    const payment = new Payment({
      user: userId,

      seller: sellerId,

      sellerName: seller.shopName,

      paymentNumber,

      /*
       * CRITICAL:
       *
       * This payment came from
       * Khatabook → Add Payment.
       */
      source: KHATABOOK_SOURCE,

      paymentDate: finalPaymentDate,

      amount: paymentAmount,

      paymentMethod,

      note: finalNote,

      referenceNumber: finalReferenceNumber,
    });

    const createdPayment = await payment.save({
      session,
    });

    /* =====================================================
       RECALCULATE ACCOUNT
    ===================================================== */

    const updatedAccount = await getSellerAccount({
      userId,

      sellerId,

      session,
    });

    /* =====================================================
       COMMIT
    ===================================================== */

    await session.commitTransaction();

    /* =====================================================
       RESPONSE
    ===================================================== */

    return res.status(201).json({
      message: "Payment recorded successfully",

      payment: createdPayment,

      account: {
        totalSales: updatedAccount.totalSales,

        salePayments: updatedAccount.salePayments,

        khatabookPayments: updatedAccount.khatabookPayments,

        totalPaid: updatedAccount.totalPaid,

        outstanding: updatedAccount.outstanding,
      },
    });
  } catch (error) {
    /* =====================================================
       ROLLBACK
    ===================================================== */

    if (session.inTransaction()) {
      await session.abortTransaction();
    }

    console.error("Create payment error:", error);

    return res.status(400).json({
      message: error.message || "Unable to create payment",
    });
  } finally {
    await session.endSession();
  }
};

/* =========================================================
   GET ALL KHATABOOK PAYMENTS
========================================================= */

/*
 * We return ONLY genuine Khatabook
 * payments.
 *
 * Old Payment records created by
 * the previous incorrect logic are
 * excluded.
 */

export const getPayments = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    const { sellerId, startDate, endDate } = req.query;

    /* =====================================================
       BASE FILTER
    ===================================================== */

    const filter = {
      user: userId,

      source: KHATABOOK_SOURCE,
    };

    /* =====================================================
       SELLER FILTER
    ===================================================== */

    if (sellerId) {
      if (!isValidObjectId(sellerId)) {
        return res.status(400).json({
          message: "Invalid seller ID",
        });
      }

      filter.seller = sellerId;
    }

    /* =====================================================
       DATE FILTER
    ===================================================== */

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

    /* =====================================================
       FETCH
    ===================================================== */

    const payments = await Payment.find(filter)
      .populate("seller", "shopName phone city address")
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
    const userId = getUserId(req);

    const { id } = req.params;

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid payment ID",
      });
    }

    const payment = await Payment.findOne({
      _id: id,

      user: userId,

      /*
       * Only genuine Khatabook
       * payments are accessible
       * through this API.
       */
      source: KHATABOOK_SOURCE,
    }).populate("seller", "shopName phone city address");

    if (!payment) {
      return res.status(404).json({
        message: "Khatabook payment not found",
      });
    }

    return res.status(200).json({
      payment,
    });
  } catch (error) {
    console.error("Get payment by ID error:", error);

    next(error);
  }
};

/* =========================================================
   GET PAYMENTS BY SELLER
========================================================= */

export const getPaymentsBySeller = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    const { sellerId } = req.params;

    /* ===================================================
         USER
      =================================================== */

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    /* ===================================================
         SELLER ID
      =================================================== */

    if (!isValidObjectId(sellerId)) {
      return res.status(400).json({
        message: "Invalid seller ID",
      });
    }

    /* ===================================================
         SELLER OWNERSHIP
      =================================================== */

    const seller = await Seller.findOne({
      _id: sellerId,

      user: userId,
    }).lean();

    if (!seller) {
      return res.status(404).json({
        message: "Seller not found",
      });
    }

    /* ===================================================
         KHATABOOK PAYMENTS ONLY
      =================================================== */

    const payments = await Payment.find({
      user: userId,

      seller: sellerId,

      source: KHATABOOK_SOURCE,
    })
      .populate("seller", "shopName phone city address")
      .sort({
        paymentDate: -1,

        createdAt: -1,
      });

    /* ===================================================
         ACCOUNT
      =================================================== */

    const account = await getSellerAccount({
      userId,

      sellerId,
    });

    /* ===================================================
         RESPONSE
      =================================================== */

    return res.status(200).json({
      seller: {
        _id: seller._id,

        shopName: seller.shopName,

        phone: seller.phone || "",

        city: seller.city || "",

        address: seller.address || "",
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

/*
 * Only genuine Khatabook payments
 * can be edited.
 *
 * Sale payments are NEVER edited
 * through this controller.
 */

export const updatePayment = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    const { id } = req.params;

    const { paymentDate, amount, paymentMethod, note, referenceNumber } =
      req.body;

    /* =====================================================
         USER
      ===================================================== */

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    /* =====================================================
         PAYMENT ID
      ===================================================== */

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid payment ID",
      });
    }

    /* =====================================================
         FIND KHATABOOK PAYMENT
      ===================================================== */

    const existingPayment = await Payment.findOne({
      _id: id,

      user: userId,

      source: KHATABOOK_SOURCE,
    });

    if (!existingPayment) {
      return res.status(404).json({
        message: "Khatabook payment not found",
      });
    }

    /* =====================================================
         NEW AMOUNT
      ===================================================== */

    const newAmount =
      amount === undefined || amount === null || amount === ""
        ? Number(existingPayment.amount)
        : Number(amount);

    if (!Number.isFinite(newAmount) || newAmount <= 0) {
      return res.status(400).json({
        message: "Payment amount must be greater than zero",
      });
    }

    /* =====================================================
         CURRENT ACCOUNT
      ===================================================== */

    const account = await getSellerAccount({
      userId,

      sellerId: existingPayment.seller,
    });

    /* =====================================================
         AVAILABLE BALANCE
      ===================================================== */

    /*
     * The current payment is already
     * included in khatabookPayments.
     *
     * Add it back so that we can
     * replace the old amount.
     */

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

    /* =====================================================
         PAYMENT METHOD
      ===================================================== */

    const newMethod = paymentMethod ?? existingPayment.paymentMethod;

    if (!ALLOWED_PAYMENT_METHODS.includes(newMethod)) {
      return res.status(400).json({
        message: "Invalid payment method",
      });
    }

    /* =====================================================
         PAYMENT DATE
      ===================================================== */

    let newPaymentDate = existingPayment.paymentDate;

    if (paymentDate !== undefined) {
      const parsedDate = new Date(paymentDate);

      if (Number.isNaN(parsedDate.getTime())) {
        return res.status(400).json({
          message: "Invalid payment date",
        });
      }

      newPaymentDate = parsedDate;
    }

    /* =====================================================
         UPDATE
      ===================================================== */

    existingPayment.amount = newAmount;

    existingPayment.paymentMethod = newMethod;

    existingPayment.paymentDate = newPaymentDate;

    if (note !== undefined) {
      existingPayment.note = typeof note === "string" ? note.trim() : "";
    }

    if (referenceNumber !== undefined) {
      existingPayment.referenceNumber =
        typeof referenceNumber === "string" ? referenceNumber.trim() : "";
    }

    /*
     * Make absolutely sure that an
     * edited payment remains a
     * Khatabook payment.
     */

    existingPayment.source = KHATABOOK_SOURCE;

    await existingPayment.save();

    /* =====================================================
         UPDATED ACCOUNT
      ===================================================== */

    const updatedAccount = await getSellerAccount({
      userId,

      sellerId: existingPayment.seller,
    });

    /* =====================================================
         RESPONSE
      ===================================================== */

    return res.status(200).json({
      message: "Payment updated successfully",

      payment: existingPayment,

      account: {
        totalSales: updatedAccount.totalSales,

        salePayments: updatedAccount.salePayments,

        khatabookPayments: updatedAccount.khatabookPayments,

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

/*
 * Only genuine Khatabook payments
 * can be deleted.
 *
 * This NEVER modifies Sale.paidAmount.
 */

export const deletePayment = async (req, res, next) => {
  try {
    const userId = getUserId(req);

    const { id } = req.params;

    /* =====================================================
         USER
      ===================================================== */

    if (!userId) {
      return res.status(401).json({
        message: "Authentication required",
      });
    }

    /* =====================================================
         PAYMENT ID
      ===================================================== */

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid payment ID",
      });
    }

    /* =====================================================
         FIND KHATABOOK PAYMENT
      ===================================================== */

    const payment = await Payment.findOne({
      _id: id,

      user: userId,

      source: KHATABOOK_SOURCE,
    });

    if (!payment) {
      return res.status(404).json({
        message: "Khatabook payment not found",
      });
    }

    /* =====================================================
         DELETE
      ===================================================== */

    await Payment.deleteOne({
      _id: id,

      user: userId,

      source: KHATABOOK_SOURCE,
    });

    /* =====================================================
         UPDATED ACCOUNT
      ===================================================== */

    const updatedAccount = await getSellerAccount({
      userId,

      sellerId: payment.seller,
    });

    /* =====================================================
         RESPONSE
      ===================================================== */

    return res.status(200).json({
      message: "Payment deleted successfully",

      account: {
        totalSales: updatedAccount.totalSales,

        salePayments: updatedAccount.salePayments,

        khatabookPayments: updatedAccount.khatabookPayments,

        totalPaid: updatedAccount.totalPaid,

        outstanding: updatedAccount.outstanding,
      },
    });
  } catch (error) {
    console.error("Delete payment error:", error);

    next(error);
  }
};
