import mongoose from "mongoose";

/* =========================================================
   SALE ITEM SCHEMA
========================================================= */

const saleItemSchema = new mongoose.Schema(
  {
    /* =======================================================
       ITEM
    ======================================================= */

    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },

    /* =======================================================
       ITEM NAME SNAPSHOT
    ======================================================= */

    itemName: {
      type: String,
      required: true,
      trim: true,
    },

    /* =======================================================
       QUANTITY
    ======================================================= */

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    /* =======================================================
       PIECES
    ======================================================= */

    pieces: {
      type: Number,
      required: true,
      min: 0,
    },

    /* =======================================================
       PRICE
       
       Selling price per quantity.
    ======================================================= */

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    /* =======================================================
       TOTAL
       
       quantity × price
    ======================================================= */

    total: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: true,
  },
);

/* =========================================================
   SALE SCHEMA
========================================================= */

const saleSchema = new mongoose.Schema(
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
       SALE NUMBER
       
       Example:
       
       SAL-20260810-37177
    ======================================================= */

    saleNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    /* =======================================================
       SALE DATE
    ======================================================= */

    saleDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },

    /* =======================================================
       ITEMS
    ======================================================= */

    items: {
      type: [saleItemSchema],

      required: true,

      validate: {
        validator: function (items) {
          return Array.isArray(items) && items.length > 0;
        },

        message: "At least one item is required",
      },
    },

    /* =======================================================
       ITEMS TOTAL
    ======================================================= */

    itemsTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    /* =======================================================
       GRAND TOTAL
    ======================================================= */

    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    /* =======================================================
       PAID AMOUNT
       
       IMPORTANT:
       
       This is the amount received DURING
       the original sale.
       
       It is NOT a Payment document.
    ======================================================= */

    paidAmount: {
      type: Number,

      required: true,

      default: 0,

      min: 0,
    },

    /* =======================================================
       PAYMENT METHOD
       
       Method used when money was received
       during the original sale.
    ======================================================= */

    paymentMethod: {
      type: String,

      enum: ["Cash", "UPI", "Net Banking", "Other"],

      default: "Cash",
    },

    /* =======================================================
       SALE PAYMENT DATE
       
       Date on which the amount was received
       during the sale.
       
       This is separate from paymentDate in
       the Payment collection.
    ======================================================= */

    paymentDate: {
      type: Date,

      default: null,
    },

    /* =======================================================
       SALE PAYMENT REFERENCE
       
       Used for UPI / Net Banking etc.
    ======================================================= */

    paymentReference: {
      type: String,

      trim: true,

      default: "",

      maxlength: 100,
    },

    /* =======================================================
       SALE PAYMENT NOTE
    ======================================================= */

    paymentNote: {
      type: String,

      trim: true,

      default: "",

      maxlength: 500,
    },

    /* =======================================================
       CREDIT AMOUNT
       
       Example:
       
       Bill       = ₹190
       Paid       = ₹80
       Credit     = ₹110
    ======================================================= */

    creditAmount: {
      type: Number,

      required: true,

      default: 0,

      min: 0,
    },

    /* =======================================================
       PAYMENT STATUS
    ======================================================= */

    paymentStatus: {
      type: String,

      enum: ["PAID", "PARTIAL", "CREDIT"],

      default: "CREDIT",

      index: true,
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
 * User's sales sorted by date.
 */

saleSchema.index({
  user: 1,
  saleDate: -1,
});

/*
 * Seller-specific sales.
 */

saleSchema.index({
  user: 1,
  seller: 1,
  saleDate: -1,
});

/*
 * Seller + payment status.
 */

saleSchema.index({
  user: 1,
  seller: 1,
  paymentStatus: 1,
});

/*
 * Outstanding sales.
 */

saleSchema.index({
  user: 1,
  creditAmount: 1,
});

/* =========================================================
   PRE VALIDATION
========================================================= */

/*
 * Keep payment fields mathematically consistent.
 *
 * IMPORTANT:
 *
 * This does NOT create a Payment document.
 *
 * It only calculates the values inside
 * the Sale document.
 */

saleSchema.pre("validate", function (next) {
  /* =====================================================
       GRAND TOTAL
    ===================================================== */

  const grandTotal = Number(this.grandTotal) || 0;

  /* =====================================================
       PAID AMOUNT
    ===================================================== */

  let paidAmount = Number(this.paidAmount) || 0;

  /* =====================================================
       NEGATIVE PAYMENT
    ===================================================== */

  if (paidAmount < 0) {
    paidAmount = 0;
  }

  /* =====================================================
       PAYMENT CANNOT EXCEED BILL
    ===================================================== */

  if (paidAmount > grandTotal) {
    return next(new Error("Paid amount cannot be greater than the sale total"));
  }

  /* =====================================================
       SAVE NORMALIZED PAID AMOUNT
    ===================================================== */

  this.paidAmount = paidAmount;

  /* =====================================================
       CREDIT CALCULATION
    ===================================================== */

  this.creditAmount = Math.max(grandTotal - paidAmount, 0);

  /* =====================================================
       PAYMENT STATUS
    ===================================================== */

  if (this.creditAmount === 0) {
    this.paymentStatus = "PAID";
  } else if (paidAmount > 0) {
    this.paymentStatus = "PARTIAL";
  } else {
    this.paymentStatus = "CREDIT";
  }

  /* =====================================================
       PAYMENT DATE
       
       If there is no payment, there
       should be no payment date.
    ===================================================== */

  if (paidAmount === 0) {
    this.paymentDate = null;
  } else if (!this.paymentDate) {
    this.paymentDate = this.saleDate || new Date();
  }

  /* =====================================================
       PAYMENT METHOD
       
       If no payment happened,
       don't treat the default Cash
       as an actual payment.
       
       We keep the schema default for
       compatibility, but normalize it
       only when needed.
    ===================================================== */

  if (paidAmount === 0) {
    this.paymentMethod = undefined;
  }

  next();
});

/* =========================================================
   MODEL
========================================================= */

const Sale = mongoose.models.Sale || mongoose.model("Sale", saleSchema);

export default Sale;
