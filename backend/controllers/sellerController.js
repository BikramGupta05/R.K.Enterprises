import mongoose from "mongoose";
import Seller from "../models/Seller.js";

/* =========================================================
   Helper
========================================================= */

const isValidObjectId = (id) => {
  return mongoose.Types.ObjectId.isValid(id);
};

/* =========================================================
   CREATE SELLER
========================================================= */

export const createSeller = async (req, res, next) => {
  try {
    const { shopName, city, address, phone, email, gstNumber } = req.body;

    const seller = await Seller.create({
      user: req.user.id,
      shopName,
      city,
      address,
      phone,
      email: email || null,
      gstNumber: gstNumber || null,
    });

    res.status(201).json({
      message: "Seller created successfully",
      seller,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   GET ALL SELLERS
========================================================= */

export const getSellers = async (req, res, next) => {
  try {
    const sellers = await Seller.find({
      user: req.user.id,
    })
      .sort({
        shopName: 1,
      })
      .lean();

    res.json({
      sellers,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   GET SELLER BY ID
========================================================= */

export const getSellerById = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid seller ID",
      });
    }

    const seller = await Seller.findOne({
      _id: id,
      user: req.user.id,
    }).lean();

    if (!seller) {
      return res.status(404).json({
        message: "Seller not found",
      });
    }

    res.json({
      seller,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   UPDATE SELLER
========================================================= */

export const updateSeller = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid seller ID",
      });
    }

    const { shopName, city, address, phone, email, gstNumber } = req.body;

    const seller = await Seller.findOneAndUpdate(
      {
        _id: id,
        user: req.user.id,
      },
      {
        $set: {
          shopName,
          city,
          address,
          phone,
          email: email || null,
          gstNumber: gstNumber || null,
        },
      },
      {
        new: true,
        runValidators: true,
      },
    );

    if (!seller) {
      return res.status(404).json({
        message: "Seller not found",
      });
    }

    res.json({
      message: "Seller updated successfully",
      seller,
    });
  } catch (error) {
    next(error);
  }
};

/* =========================================================
   DELETE SELLER
========================================================= */

export const deleteSeller = async (req, res, next) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({
        message: "Invalid seller ID",
      });
    }

    const seller = await Seller.findOneAndDelete({
      _id: id,
      user: req.user.id,
    });

    if (!seller) {
      return res.status(404).json({
        message: "Seller not found",
      });
    }

    res.json({
      message: "Seller deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
