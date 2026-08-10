import Buyer from "../models/Buyer.js";

/* -------------------- Create Buyer -------------------- */

export const createBuyer = async (req, res, next) => {
  try {
    const { shopName, city, address, phone, email, gstNumber } = req.body;

    const buyer = await Buyer.create({
      shopName,
      city,
      address,
      phone,
      email,
      gstNumber,
      user: req.user.id,
    });

    res.status(201).json({
      message: "Buyer created successfully",
      buyer,
    });
  } catch (error) {
    next(error);
  }
};

/* -------------------- Get All Buyers -------------------- */

export const getBuyers = async (req, res, next) => {
  try {
    const buyers = await Buyer.find({
      user: req.user.id,
    }).sort({
      shopName: 1,
    });

    res.json({
      buyers,
    });
  } catch (error) {
    next(error);
  }
};

/* -------------------- Get Buyer By ID -------------------- */

export const getBuyerById = async (req, res, next) => {
  try {
    const buyer = await Buyer.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!buyer) {
      return res.status(404).json({
        message: "Buyer not found",
      });
    }

    res.json({
      buyer,
    });
  } catch (error) {
    next(error);
  }
};

/* -------------------- Update Buyer -------------------- */

export const updateBuyer = async (req, res, next) => {
  try {
    const buyer = await Buyer.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!buyer) {
      return res.status(404).json({
        message: "Buyer not found",
      });
    }

    buyer.shopName = req.body.shopName;
    buyer.city = req.body.city;
    buyer.address = req.body.address;
    buyer.phone = req.body.phone;
    buyer.email = req.body.email;
    buyer.gstNumber = req.body.gstNumber;

    await buyer.save();

    res.json({
      message: "Buyer updated successfully",
      buyer,
    });
  } catch (error) {
    next(error);
  }
};

/* -------------------- Delete Buyer -------------------- */

export const deleteBuyer = async (req, res, next) => {
  try {
    const buyer = await Buyer.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!buyer) {
      return res.status(404).json({
        message: "Buyer not found",
      });
    }

    await buyer.deleteOne();

    res.json({
      message: "Buyer deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
