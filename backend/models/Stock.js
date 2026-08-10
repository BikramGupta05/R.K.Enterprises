import mongoose from "mongoose";

const stockSchema = new mongoose.Schema(
  {
    /*
     * User who owns this stock.
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
     * Original item from the user's Item List.
     */
    item: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Item",
      required: true,
      index: true,
    },

    /*
     * Store the item name as a snapshot.
     *
     * This makes displaying stock easier and also
     * preserves the name that existed at the time.
     */
    itemName: {
      type: String,
      required: true,
      trim: true,
    },

    /*
     * Number of cartons / main quantity.
     */
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },

    /*
     * Number of individual pieces.
     */
    pieces: {
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
 * VERY IMPORTANT
 *
 * One user can have only ONE stock record
 * for one Item.
 *
 * Therefore:
 *
 * user + item = unique stock row
 *
 * Example:
 *
 * User A + Neem Soap = one row
 *
 * User B + Neem Soap = another row
 */
stockSchema.index(
  {
    user: 1,
    item: 1,
  },
  {
    unique: true,
  },
);

const Stock = mongoose.models.Stock || mongoose.model("Stock", stockSchema);

export default Stock;
