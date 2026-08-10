import mongoose from "mongoose";

/* =========================================================
   Payment Schema
========================================================= */

const paymentSchema = new mongoose.Schema(
  {
    /* =======================================================
       User
    ======================================================= */

    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* =======================================================
       Seller
    ======================================================= */

    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },

    /* =======================================================
       Seller Name Snapshot
       
       We store the seller name at the time
       the payment is recorded.
       
       If the seller's shop name changes later,
       old payment records remain accurate.
    ======================================================= */

    sellerName: {
      type: String,
      required: true,
      trim: true,
    },

    /* =======================================================
       Payment Number
       
       Example:
       PAY-20260810-001
    ======================================================= */

    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    /* =======================================================
       Payment Date
    ======================================================= */

    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },

    /* =======================================================
       Amount
    ======================================================= */

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    /* =======================================================
       Payment Method
    ======================================================= */

    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI", "Net Banking", "Other"],
      required: true,
    },

    /* =======================================================
       Optional Note
    ======================================================= */

    note: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

    /* =======================================================
       Reference Number
       
       Useful for UPI / Net Banking transactions.
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
   Indexes
========================================================= */

/*
 * Quickly find all payments belonging
 * to a particular seller.
 */

paymentSchema.index({
  user: 1,
  seller: 1,
  paymentDate: -1,
});

/*
 * Quickly retrieve a user's
 * complete payment history.
 */

paymentSchema.index({
  user: 1,
  paymentDate: -1,
});

/* =========================================================
   Model
========================================================= */

const Payment =
  mongoose.models.Payment || mongoose.model("Payment", paymentSchema);

export default Payment;
