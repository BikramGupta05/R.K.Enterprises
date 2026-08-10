import mongoose from "mongoose";

/*
 * Individual item inside a sale.
 */
const saleItemSchema = new mongoose.Schema(
  {
    /*
     * Reference to the original Item.
     */
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },

    /*
     * Store the item name as a snapshot.
     *
     * If the item is renamed later,
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
     * Pieces sold.
     */
    pieces: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
     * Selling price for this item.
     *
     * This allows you to sell different
     * items at different prices.
     */
    price: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
     * quantity/pieces based final amount
     * for this row.
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
 * Complete sale document.
 */
const saleSchema = new mongoose.Schema(
  {
    /*
     * User who created this sale.
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
     * Seller to whom the goods were sold.
     */
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Seller",
      required: true,
      index: true,
    },

    /*
     * Seller shop name snapshot.
     *
     * This keeps old history accurate
     * if the seller name changes later.
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
     * Date of sale.
     */
    saleDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },

    /*
     * Items sold.
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
     * Total before any additional charges.
     */
    itemsTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
     * Final sale amount.
     *
     * Currently:
     *
     * grandTotal = itemsTotal
     *
     * We keep this field so that later
     * discounts, transport charges,
     * taxes, etc. can be added easily.
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
 * User's sales sorted newest first.
 */
saleSchema.index({
  user: 1,
  saleDate: -1,
});

/*
 * Seller-specific history.
 */
saleSchema.index({
  user: 1,
  seller: 1,
  saleDate: -1,
});

/*
 * Item-specific history.
 */
saleSchema.index({
  user: 1,
  "items.item": 1,
  saleDate: -1,
});

const Sale = mongoose.models.Sale || mongoose.model("Sale", saleSchema);

export default Sale;
