import mongoose from "mongoose";

import Expenditure from "../models/Expenditure.js";

/* =========================================================
   HELPERS
========================================================= */

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/* =========================================================
   CREATE EXPENDITURE
========================================================= */

export const createExpenditure = async (req, res, next) => {
  try {
    const {
      expenditureDate,
      category,
      description,
      amount,
      paymentMethod,
      notes,
    } = req.body;

    /* -------------------- Category -------------------- */

    if (!category || !category.trim()) {
      return res.status(400).json({
        message: "Category is required",
      });
    }

    /* -------------------- Description -------------------- */

    if (!description || !description.trim()) {
      return res.status(400).json({
        message: "Description is required",
      });
    }

    /* -------------------- Amount -------------------- */

    const numericAmount = Number(amount);

    if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        message: "Amount must be greater than zero",
      });
    }

    /* -------------------- Date -------------------- */

    let finalDate = new Date();

    if (expenditureDate) {
      finalDate = new Date(expenditureDate);

      if (Number.isNaN(finalDate.getTime())) {
        return res.status(400).json({
          message: "Invalid expenditure date",
        });
      }
    }

    /* -------------------- Payment Method -------------------- */

    const allowedPaymentMethods = ["Cash", "UPI", "Bank", "Other"];

    const finalPaymentMethod = paymentMethod || "Cash";

    if (!allowedPaymentMethods.includes(finalPaymentMethod)) {
      return res.status(400).json({
        message: "Invalid payment method",
      });
    }

    /* -------------------- Create -------------------- */

    const expenditure = await Expenditure.create({
      user: req.user.id,

      expenditureDate: finalDate,

      category: category.trim(),

      description: description.trim(),

      amount: numericAmount,

      paymentMethod: finalPaymentMethod,

      notes: notes?.trim() || "",
    });

    return res.status(201).json({
      message: "Expenditure created successfully",

      expenditure,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   GET ALL EXPENDITURES
========================================================= */

export const getExpenditures = async (req, res, next) => {
  try {
    const query = {
      user: req.user.id,
    };

    /*
     * Optional date filtering.
     *
     * Example:
     *
     * /api/expenditures?from=2026-08-01&to=2026-08-10
     */

    if (req.query.from || req.query.to) {
      query.expenditureDate = {};

      if (req.query.from) {
        const fromDate = new Date(req.query.from);

        if (Number.isNaN(fromDate.getTime())) {
          return res.status(400).json({
            message: "Invalid from date",
          });
        }

        fromDate.setHours(0, 0, 0, 0);

        query.expenditureDate.$gte = fromDate;
      }

      if (req.query.to) {
        const toDate = new Date(req.query.to);

        if (Number.isNaN(toDate.getTime())) {
          return res.status(400).json({
            message: "Invalid to date",
          });
        }

        toDate.setHours(23, 59, 59, 999);

        query.expenditureDate.$lte = toDate;
      }

      /*
       * Prevent invalid date range.
       */

      if (
        query.expenditureDate.$gte &&
        query.expenditureDate.$lte &&
        query.expenditureDate.$gte > query.expenditureDate.$lte
      ) {
        return res.status(400).json({
          message: "From date cannot be greater than to date",
        });
      }
    }

    const expenditures = await Expenditure.find(query)
      .sort({
        expenditureDate: -1,
        createdAt: -1,
      })
      .lean();

    return res.status(200).json({
      expenditures,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   GET EXPENDITURE BY ID
========================================================= */

export const getExpenditureById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid expenditure ID",
      });
    }

    const expenditure = await Expenditure.findOne({
      _id: id,
      user: req.user.id,
    }).lean();

    if (!expenditure) {
      return res.status(404).json({
        message: "Expenditure not found",
      });
    }

    return res.status(200).json({
      expenditure,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   UPDATE EXPENDITURE
========================================================= */

export const updateExpenditure = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid expenditure ID",
      });
    }

    const {
      expenditureDate,
      category,
      description,
      amount,
      paymentMethod,
      notes,
    } = req.body;

    /*
     * Find only this user's expenditure.
     */

    const expenditure = await Expenditure.findOne({
      _id: id,
      user: req.user.id,
    });

    if (!expenditure) {
      return res.status(404).json({
        message: "Expenditure not found",
      });
    }

    /* -------------------- Category -------------------- */

    if (category !== undefined) {
      if (!category || !category.trim()) {
        return res.status(400).json({
          message: "Category cannot be empty",
        });
      }

      expenditure.category = category.trim();
    }

    /* -------------------- Description -------------------- */

    if (description !== undefined) {
      if (!description || !description.trim()) {
        return res.status(400).json({
          message: "Description cannot be empty",
        });
      }

      expenditure.description = description.trim();
    }

    /* -------------------- Amount -------------------- */

    if (amount !== undefined) {
      const numericAmount = Number(amount);

      if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
        return res.status(400).json({
          message: "Amount must be greater than zero",
        });
      }

      expenditure.amount = numericAmount;
    }

    /* -------------------- Date -------------------- */

    if (expenditureDate !== undefined) {
      const updatedDate = new Date(expenditureDate);

      if (Number.isNaN(updatedDate.getTime())) {
        return res.status(400).json({
          message: "Invalid expenditure date",
        });
      }

      expenditure.expenditureDate = updatedDate;
    }

    /* -------------------- Payment Method -------------------- */

    if (paymentMethod !== undefined) {
      const allowedPaymentMethods = ["Cash", "UPI", "Bank", "Other"];

      if (!allowedPaymentMethods.includes(paymentMethod)) {
        return res.status(400).json({
          message: "Invalid payment method",
        });
      }

      expenditure.paymentMethod = paymentMethod;
    }

    /* -------------------- Notes -------------------- */

    if (notes !== undefined) {
      expenditure.notes = notes?.trim() || "";
    }

    await expenditure.save();

    return res.status(200).json({
      message: "Expenditure updated successfully",

      expenditure,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   DELETE EXPENDITURE
========================================================= */

export const deleteExpenditure = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid expenditure ID",
      });
    }

    const expenditure = await Expenditure.findOneAndDelete({
      _id: id,
      user: req.user.id,
    });

    if (!expenditure) {
      return res.status(404).json({
        message: "Expenditure not found",
      });
    }

    return res.status(200).json({
      message: "Expenditure deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   GET EXPENDITURE SUMMARY
=========================================================

   Returns:

   total expenditure
   number of expenditures
   average expenditure
   highest expenditure
   lowest expenditure

   It can also be filtered by date.

========================================================= */

export const getExpenditureSummary = async (req, res, next) => {
  try {
    const match = {
      user: req.user.id,
    };

    /*
     * Date filtering.
     */

    if (req.query.from || req.query.to) {
      match.expenditureDate = {};

      if (req.query.from) {
        const fromDate = new Date(req.query.from);

        if (Number.isNaN(fromDate.getTime())) {
          return res.status(400).json({
            message: "Invalid from date",
          });
        }

        fromDate.setHours(0, 0, 0, 0);

        match.expenditureDate.$gte = fromDate;
      }

      if (req.query.to) {
        const toDate = new Date(req.query.to);

        if (Number.isNaN(toDate.getTime())) {
          return res.status(400).json({
            message: "Invalid to date",
          });
        }

        toDate.setHours(23, 59, 59, 999);

        match.expenditureDate.$lte = toDate;
      }

      if (
        match.expenditureDate.$gte &&
        match.expenditureDate.$lte &&
        match.expenditureDate.$gte > match.expenditureDate.$lte
      ) {
        return res.status(400).json({
          message: "From date cannot be greater than to date",
        });
      }
    }

    const result = await Expenditure.aggregate([
      {
        $match: match,
      },

      {
        $group: {
          _id: null,

          totalAmount: {
            $sum: "$amount",
          },

          totalExpenditures: {
            $sum: 1,
          },

          averageAmount: {
            $avg: "$amount",
          },

          highestAmount: {
            $max: "$amount",
          },

          lowestAmount: {
            $min: "$amount",
          },
        },
      },
    ]);

    const summary = result[0] || {
      totalAmount: 0,

      totalExpenditures: 0,

      averageAmount: 0,

      highestAmount: 0,

      lowestAmount: 0,
    };

    return res.status(200).json(summary);
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   GET EXPENDITURE BY CATEGORY
=========================================================

   Example:

   Transport    5 expenses    ₹4,500
   Electricity  2 expenses    ₹2,100
   Packaging    4 expenses    ₹1,850

========================================================= */

export const getExpenditureByCategory = async (req, res, next) => {
  try {
    const match = {
      user: req.user.id,
    };

    /*
     * Optional date filtering.
     */

    if (req.query.from || req.query.to) {
      match.expenditureDate = {};

      if (req.query.from) {
        const fromDate = new Date(req.query.from);

        if (Number.isNaN(fromDate.getTime())) {
          return res.status(400).json({
            message: "Invalid from date",
          });
        }

        fromDate.setHours(0, 0, 0, 0);

        match.expenditureDate.$gte = fromDate;
      }

      if (req.query.to) {
        const toDate = new Date(req.query.to);

        if (Number.isNaN(toDate.getTime())) {
          return res.status(400).json({
            message: "Invalid to date",
          });
        }

        toDate.setHours(23, 59, 59, 999);

        match.expenditureDate.$lte = toDate;
      }
    }

    const result = await Expenditure.aggregate([
      {
        $match: match,
      },

      {
        $group: {
          _id: "$category",

          totalAmount: {
            $sum: "$amount",
          },

          totalExpenditures: {
            $sum: 1,
          },
        },
      },

      {
        $sort: {
          totalAmount: -1,
        },
      },

      {
        $project: {
          _id: 0,

          category: "$_id",

          totalAmount: 1,

          totalExpenditures: 1,
        },
      },
    ]);

    return res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
