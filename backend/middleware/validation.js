import { body, validationResult } from "express-validator";

/* -------------------- Auth Validations -------------------- */

const registerValidation = [
  body("name")
    .trim()
    .notEmpty()
    .withMessage("Name is required")
    .isLength({ min: 2 })
    .withMessage("Name must be at least 2 characters"),

  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

const loginValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),

  body("password").notEmpty().withMessage("Password is required"),
];

const emailValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),
];

const resetPasswordValidation = [
  body("email")
    .trim()
    .isEmail()
    .withMessage("Valid email is required")
    .normalizeEmail(),

  body("token").notEmpty().withMessage("Reset token is required"),

  body("password")
    .isLength({ min: 8 })
    .withMessage("Password must be at least 8 characters"),
];

/* -------------------- Item Validations -------------------- */

const createItemValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 200 })
    .withMessage("Title cannot exceed 200 characters"),
];

const updateItemValidation = [
  body("title")
    .trim()
    .notEmpty()
    .withMessage("Title is required")
    .isLength({ max: 200 })
    .withMessage("Title cannot exceed 200 characters"),
];

/* -------------------- Buyer Validations -------------------- */

const createBuyerValidation = [
  body("shopName").trim().notEmpty().withMessage("Shop name is required"),

  body("city").trim().notEmpty().withMessage("City is required"),

  body("address").trim().notEmpty().withMessage("Address is required"),

  body("phone")
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone number must be 10 digits"),

  body("email")
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage("Enter a valid email"),

  body("gstNumber").optional({ checkFalsy: true }).trim(),
];

const updateBuyerValidation = [
  body("shopName").trim().notEmpty().withMessage("Shop name is required"),

  body("city").trim().notEmpty().withMessage("City is required"),

  body("address").trim().notEmpty().withMessage("Address is required"),

  body("phone")
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone number must be 10 digits"),

  body("email")
    .optional({ checkFalsy: true })
    .isEmail()
    .withMessage("Enter a valid email"),

  body("gstNumber").optional({ checkFalsy: true }).trim(),
];

/* -------------------- Validation Handler -------------------- */

const validateRequest = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(422).json({
      errors: errors.array().map((error) => ({
        field: error.path,
        message: error.msg,
      })),
    });
  }

  next();
};

const createSellerValidation = [
  body("shopName")
    .trim()
    .notEmpty()
    .withMessage("Shop name is required")
    .isLength({ min: 2, max: 200 })
    .withMessage("Shop name must be between 2 and 200 characters"),

  body("city")
    .trim()
    .notEmpty()
    .withMessage("City is required")
    .isLength({ max: 100 })
    .withMessage("City cannot exceed 100 characters"),

  body("address")
    .trim()
    .notEmpty()
    .withMessage("Address is required")
    .isLength({ max: 500 })
    .withMessage("Address cannot exceed 500 characters"),

  body("phone")
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone number must be 10 digits"),

  body("email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Enter a valid email")
    .normalizeEmail(),

  body("gstNumber")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage("GST number cannot exceed 50 characters"),
];

const updateSellerValidation = [
  body("shopName")
    .trim()
    .notEmpty()
    .withMessage("Shop name is required")
    .isLength({ min: 2, max: 200 })
    .withMessage("Shop name must be between 2 and 200 characters"),

  body("city")
    .trim()
    .notEmpty()
    .withMessage("City is required")
    .isLength({ max: 100 })
    .withMessage("City cannot exceed 100 characters"),

  body("address")
    .trim()
    .notEmpty()
    .withMessage("Address is required")
    .isLength({ max: 500 })
    .withMessage("Address cannot exceed 500 characters"),

  body("phone")
    .trim()
    .matches(/^[0-9]{10}$/)
    .withMessage("Phone number must be 10 digits"),

  body("email")
    .optional({ checkFalsy: true })
    .trim()
    .isEmail()
    .withMessage("Enter a valid email")
    .normalizeEmail(),

  body("gstNumber")
    .optional({ checkFalsy: true })
    .trim()
    .isLength({ max: 50 })
    .withMessage("GST number cannot exceed 50 characters"),
];

/* -------------------- Exports -------------------- */

// export {
//   registerValidation,
//   loginValidation,
//   emailValidation,
//   resetPasswordValidation,
//   createItemValidation,
//   updateItemValidation,
//   createBuyerValidation,
//   updateBuyerValidation,
//   validateRequest,
// };

export {
  registerValidation,
  loginValidation,
  emailValidation,
  resetPasswordValidation,
  createItemValidation,
  updateItemValidation,
  createBuyerValidation,
  updateBuyerValidation,
  createSellerValidation,
  updateSellerValidation,
  validateRequest,
};
