import mongoose from "mongoose";

const purchaseItemSchema = new mongoose.Schema(
  {
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
    },

    // Store the item name as it was at the time of purchase.
    // This keeps historical records accurate if the item is renamed later.
    itemName: {
      type: String,
      required: true,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 0,
    },

    pieces: {
      type: Number,
      required: true,
      min: 0,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

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

const purchaseSchema = new mongoose.Schema(
  {
    /*
     * The user who created this purchase.
     *
     * This is important because every user must only
     * be able to see their own purchases.
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
     * Buyer connected to this purchase.
     */
    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Buyer",
      required: true,
      index: true,
    },

    /*
     * Store the buyer name as a snapshot.
     *
     * If the buyer's shop name is changed later,
     * old purchase records will still show the
     * original shop name.
     */
    buyerName: {
      type: String,
      required: true,
      trim: true,
    },

    /*
     * Unique purchase number for easy identification.
     *
     * Example:
     * PUR-20260810-001
     */
    purchaseNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    /*
     * Date on which the purchase was made.
     */
    purchaseDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },

    /*
     * Items included in this purchase.
     */
    items: {
      type: [purchaseItemSchema],
      required: true,
      validate: {
        validator: function (items) {
          return items && items.length > 0;
        },
        message: "At least one item is required",
      },
    },

    /*
     * Total of all purchased items
     * before carriage/fare.
     */
    itemsTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
     * Transportation/carriage/fare.
     */
    carriage: {
      type: Number,
      default: 0,
      min: 0,
    },

    /*
     * Final purchase amount.
     *
     * grandTotal = itemsTotal + carriage
     */
    grandTotal: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
     * Amount paid at the time this purchase was created.
     *
     * Later buyer payments are stored separately in
     * BuyerPayment and are intentionally not copied here.
     */
    paidAtPurchase: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  },
);

/*
 * Compound index.
 *
 * This makes queries such as:
 *
 * "Get purchases of this user sorted by date"
 *
 * more efficient.
 */
purchaseSchema.index({
  user: 1,
  purchaseDate: -1,
});

/*
 * Compound index for buyer-specific history.
 */
purchaseSchema.index({
  user: 1,
  buyer: 1,
  purchaseDate: -1,
});

const Purchase =
  mongoose.models.Purchase || mongoose.model("Purchase", purchaseSchema);

export default Purchase;
