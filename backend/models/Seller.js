import mongoose from "mongoose";

const sellerSchema = new mongoose.Schema(
  {
    /*
     * User who created this seller.
     *
     * Every seller belongs to one user.
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
     * Seller / shop name.
     */
    shopName: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 200,
    },

    /*
     * City where the seller is located.
     */
    city: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    /*
     * Seller address.
     */
    address: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    /*
     * Seller phone number.
     */
    phone: {
      type: String,
      required: true,
      trim: true,
    },

    /*
     * Email is optional.
     */
    email: {
      type: String,
      default: null,
      trim: true,
      lowercase: true,
    },

    /*
     * GST number is optional.
     */
    gstNumber: {
      type: String,
      default: null,
      trim: true,
      uppercase: true,
    },
  },
  {
    timestamps: true,
  },
);

/*
 * Quickly find all sellers belonging
 * to a particular user.
 */
sellerSchema.index({
  user: 1,
  createdAt: -1,
});

/*
 * Seller names can be searched efficiently
 * for a particular user.
 */
sellerSchema.index({
  user: 1,
  shopName: 1,
});

const Seller = mongoose.models.Seller || mongoose.model("Seller", sellerSchema);

export default Seller;
