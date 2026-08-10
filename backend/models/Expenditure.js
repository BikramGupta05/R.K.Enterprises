import mongoose from "mongoose";

const expenditureSchema = new mongoose.Schema(
  {
    /*
     * User who created this expenditure.
     *
     * Every user should only be able to see
     * and manage their own expenditures.
     */
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    /*
     * Date on which the expenditure happened.
     */
    expenditureDate: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },

    /*
     * Expenditure category.
     *
     * Examples:
     * Transport
     * Electricity
     * Rent
     * Salary
     * Repair
     * Packaging
     * Other
     */
    category: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },

    /*
     * Short description of the expenditure.
     */
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },

    /*
     * Amount spent.
     */
    amount: {
      type: Number,
      required: true,
      min: 0,
    },

    /*
     * How the payment was made.
     */
    paymentMethod: {
      type: String,
      enum: ["Cash", "UPI", "Bank", "Other"],
      default: "Cash",
    },

    /*
     * Optional additional information.
     */
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
      default: "",
    },
  },
  {
    timestamps: true,
  },
);

/*
 * Efficient query:
 *
 * Get one user's expenditures
 * sorted by newest date first.
 */
expenditureSchema.index({
  user: 1,
  expenditureDate: -1,
});

/*
 * Efficient category analysis.
 */
expenditureSchema.index({
  user: 1,
  category: 1,
  expenditureDate: -1,
});

const Expenditure =
  mongoose.models.Expenditure ||
  mongoose.model("Expenditure", expenditureSchema);

export default Expenditure;
