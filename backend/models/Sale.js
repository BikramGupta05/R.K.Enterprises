import mongoose from "mongoose";

/*
 * Individual item inside a sale.
 */
const saleItemSchema = new mongoose.Schema(
  {
    /*
     * Reference to the original Item.
     *
     * This allows us to later find:
     * "All sales of this particular item."
     */
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },

    /*
     * Store item name as a snapshot.
     *
     * If the Item name changes later,
     * old sales will still show the
     * original name.
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
     * Number of pieces sold.
     */
    pieces: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
     * Selling price.
     */
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
     * Total amount for this particular item.
     *
     * total = quantity/pieces based on
     * the calculation used by your selling page.
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

/*
 * Main Sale schema.
 */
const saleSchema = new mongoose.Schema(
  {
    /*
     * User who created this sale.
     *
     * Every user should only be able
     * to access their own sales.
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
     * Seller connected to this sale.
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
     * This protects historical records
     * if the seller's name changes later.
     */
    sellerName: {
      type: String,
      required: true,
      trim: true,
    },

    /*
     * Unique sale number.
     *
     * Example:
     *
     * SAL-20260810-001
     */
    saleNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    /*
     * Date on which the sale happened.
     */
    saleDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },

    /*
     * Items included in this sale.
     */
    items: {
      type: [saleItemSchema],
      required: true,

      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },

        message: "At least one item is required",
      },
    },

    /*
     * Total of all sold items
     * before any additional charges.
     */
    itemsTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
     * Additional fare / carriage / transportation
     * amount associated with the sale.
     *
     * Keep this as 0 when there is no charge.
     */
    carriage: {
      type: Number,
      default: 0,
      min: 0,
    },

    /*
     * Final sale amount.
     *
     * grandTotal = itemsTotal + carriage
     */
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

/*
 * ---------------------------------------------------------
 * INDEXES
 * ---------------------------------------------------------
 */

/*
 * User's sales sorted by newest date first.
 */
saleSchema.index({
  user: 1,
  saleDate: -1,
});

/*
 * Seller-specific history.
 *
 * Useful for:
 *
 * "Show all sales made to this seller."
 */
saleSchema.index({
  user: 1,
  seller: 1,
  saleDate: -1,
});

/*
 * Sale number lookup.
 */
saleSchema.index({
  user: 1,
  saleNumber: 1,
});

/*
 * Reuse existing model if it has already
 * been registered by Mongoose.
 */
const Sale = mongoose.models.Sale || mongoose.model("Sale", saleSchema);

export default Sale;
