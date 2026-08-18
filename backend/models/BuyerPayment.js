import mongoose from "mongoose";

const buyerPaymentSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    buyer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Buyer",
      required: true,
      index: true,
    },

    buyerName: {
      type: String,
      required: true,
      trim: true,
    },

    purchase: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Purchase",
      default: null,
      index: true,
    },

    paymentNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    source: {
      type: String,
      enum: ["PURCHASE", "KHATABOOK"],
      required: true,
      index: true,
    },

    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },

    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },

    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI", "Net Banking", "Other"],
      required: true,
    },

    note: {
      type: String,
      trim: true,
      default: "",
      maxlength: 500,
    },

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

buyerPaymentSchema.index({
  user: 1,
  buyer: 1,
  paymentDate: -1,
});

buyerPaymentSchema.index({
  user: 1,
  purchase: 1,
});

buyerPaymentSchema.index({
  user: 1,
  source: 1,
  paymentDate: -1,
});

const BuyerPayment =
  mongoose.models.BuyerPayment || mongoose.model("BuyerPayment", buyerPaymentSchema);

export default BuyerPayment;
