import Item from "../models/Item.js";

/**
 * Create Item
 */
export const createItem = async (req, res, next) => {
  try {
    const { title } = req.body;

    const item = await Item.create({
      title,
      user: req.user.id,
    });

    res.status(201).json({
      message: "Item created successfully",
      item,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get All Items of Logged In User
 */
export const getItems = async (req, res, next) => {
  try {
    const items = await Item.find({
      user: req.user.id,
    }).sort({
      createdAt: -1,
    });

    res.json(items);
  } catch (error) {
    next(error);
  }
};

/**
 * Get Single Item
 */
export const getItemById = async (req, res, next) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!item) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    res.json(item);
  } catch (error) {
    next(error);
  }
};

/**
 * Update Item
 */
export const updateItem = async (req, res, next) => {
  try {
    const { title } = req.body;

    const item = await Item.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!item) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    if (title !== undefined) {
      item.title = title;
    }

    await item.save();

    res.json({
      message: "Item updated successfully",
      item,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete Item
 */
export const deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findOne({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!item) {
      return res.status(404).json({
        message: "Item not found",
      });
    }

    await item.deleteOne();

    res.json({
      message: "Item deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};
