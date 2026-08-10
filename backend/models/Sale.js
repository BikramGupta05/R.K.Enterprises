import mongoose from "mongoose";

/* =========================================================
   SALE ITEM SCHEMA
========================================================= */

const saleItemSchema = new mongoose.Schema(
  {
    /*
     * Original Item ID.
     *
     * This keeps the sale connected to the
     * original Item document.
     */
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },

    /*
     * Snapshot of item name at the time of sale.
     *
     * If the item is renamed later, old sales
     * will still show the original name.
     */
    itemName: {
      type: String,
      required: true,
      trim: true,
    },

    /*
     * Quantity sold.
     */
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
     * Pieces sold.
     */
    pieces: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
     * Selling price per quantity.
     */
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
     * Total for this particular item.
     *
     * quantity × price
     */
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

    /*
     * User who created this sale.
     *
     * Every user must only see their own sales.
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /* =======================================================
       SELLER
    ======================================================= */

    /*
     * Seller/customer connected to this sale.
     */
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },

    /*
     * Seller name snapshot.
     *
     * If seller's shop name changes later,
     * historical sales remain unchanged.
     */
    sellerName: {
      type: String,
      required: true,
      trim: true,
    },

    /* =======================================================
       SALE NUMBER
    ======================================================= */

    /*
     * Unique human readable sale number.
     *
     * Example:
     *
     * SAL-20260810-123456
     */
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

    /*
     * Total of all sale items before
     * payment calculation.
     */
    itemsTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    /* =======================================================
       GRAND TOTAL
    ======================================================= */

    /*
     * Final bill amount.
     *
     * Currently your selling system has no
     * additional charge, so grandTotal is
     * equal to itemsTotal.
     */
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    /* =======================================================
       PAID AMOUNT
    ======================================================= */

    /*
     * Amount paid at the time of sale.
     *
     * Example:
     *
     * Bill = ₹10,000
     * Paid = ₹4,000
     */
    paidAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    /* =======================================================
       PAYMENT METHOD
    ======================================================= */

    /*
     * Payment method used for the amount
     * paid at the time of sale.
     */
    paymentMethod: {
      type: String,

      enum: ["Cash", "UPI", "Net Banking", "Other"],

      default: "Cash",
    },

    /* =======================================================
       CREDIT AMOUNT
    ======================================================= */

    /*
     * Amount still outstanding after
     * the current payment.
     *
     * Example:
     *
     * grandTotal = ₹10,000
     * paidAmount = ₹4,000
     *
     * creditAmount = ₹6,000
     */
    creditAmount: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    /* =======================================================
       PAYMENT STATUS
    ======================================================= */

    /*
     * PAID
     * PARTIAL
     * CREDIT
     */
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
 *
 * Useful for:
 *
 * PAID
 * PARTIAL
 * CREDIT
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
 * This protects the database even if some future
 * frontend code accidentally sends incorrect values.
 */
saleSchema.pre("validate", function (next) {
  const grandTotal = Number(this.grandTotal) || 0;

  let paidAmount = Number(this.paidAmount) || 0;

  /*
   * Never allow paid amount to become
   * greater than the bill.
   */
  if (paidAmount > grandTotal) {
    return next(new Error("Paid amount cannot be greater than the sale total"));
  }

  /*
   * Never allow a negative paid amount.
   */
  if (paidAmount < 0) {
    paidAmount = 0;
  }

  this.paidAmount = paidAmount;

  /*
   * Calculate remaining credit.
   */
  this.creditAmount = Math.max(grandTotal - paidAmount, 0);

  /*
   * Determine payment status.
   */
  if (this.creditAmount === 0) {
    this.paymentStatus = "PAID";
  } else if (paidAmount > 0) {
    this.paymentStatus = "PARTIAL";
  } else {
    this.paymentStatus = "CREDIT";
  }

  next();
});

/* =========================================================
   MODEL
========================================================= */

const Sale = mongoose.models.Sale || mongoose.model("Sale", saleSchema);

export default Sale;
