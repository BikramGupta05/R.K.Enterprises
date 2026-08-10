import mongoose from "mongoose";

/* =========================================================
   PAYMENT SCHEMA
========================================================= */

const paymentSchema = new mongoose.Schema(
  {
    /* =======================================================
       USER
    ======================================================= */

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* =======================================================
       SELLER
    ======================================================= */

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },

    /* =======================================================
       SELLER NAME SNAPSHOT
    ======================================================= */

    sellerName: {
      type: String,
      required: true,
      trim: true,
    },

    /* =======================================================
       PAYMENT NUMBER
       
       Example:
       
       PAY-20260810-0001
    ======================================================= */

    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    /* =======================================================
       PAYMENT SOURCE
       
       KHATABOOK:
       Payment manually recorded later
       from the Khatabook page.
       
       SALE:
       Legacy/old payment records that may
       have been incorrectly created during
       the sale flow.
       
       IMPORTANT:
       
       New sales should NOT create Payment
       documents at all.
    ======================================================= */

    source: {
      type: String,

      enum: ["KHATABOOK", "SALE"],

      default: "KHATABOOK",

      required: true,

      index: true,
    },

    /* =======================================================
       PAYMENT DATE
    ======================================================= */

    paymentDate: {
      type: Date,

      required: true,

      default: Date.now,

      index: true,
    },

    /* =======================================================
       AMOUNT
    ======================================================= */

    amount: {
      type: Number,

      required: true,

      min: 0.01,
    },

    /* =======================================================
       PAYMENT METHOD
    ======================================================= */

    paymentMethod: {
      type: String,

      enum: ["Cash", "UPI", "Net Banking", "Other"],

      required: true,
    },

    /* =======================================================
       NOTE
    ======================================================= */

    note: {
      type: String,

      trim: true,

      default: "",

      maxlength: 500,
    },

    /* =======================================================
       REFERENCE NUMBER
       
       Useful for:
       
       UPI
       Net Banking
       Bank transaction reference
    ======================================================= */

    referenceNumber: {
      type: String,

      trim: true,

      default: "",

      maxlength: 100,
    },
  },

  {
    timestamps: true,
  },
);

/* =========================================================
   INDEXES
========================================================= */

/*
 * Khatabook payments for a seller.
 *
 * This is the most important index for
 * the new calculation.
 */

paymentSchema.index({
  user: 1,

  seller: 1,

  source: 1,

  paymentDate: -1,
});

/*
 * Complete payment history.
 */

paymentSchema.index({
  user: 1,

  paymentDate: -1,
});

/*
 * Payment number is already unique/indexed
 * through the schema field.
 */

/* =========================================================
   MODEL
========================================================= */

const Payment =
  mongoose.models.Payment || mongoose.model("Payment", paymentSchema);

export default Payment;
