import { body, validationResult } from "express-validator";

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// User validation
export const registerValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("mobileNo").isLength({ min: 10, max: 10 }).withMessage("Valid mobile number is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
  validateRequest
];

export const loginValidation = [
  body("email").isEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required"),
  validateRequest
];

// Product validation
export const productValidation = [
  body("name").notEmpty().withMessage("Product name is required"),
  body("price").isNumeric().withMessage("Price must be a number"),
  body("category").isMongoId().withMessage("Valid category ID is required"),
  body("stock").isNumeric().withMessage("Stock must be a number"),
  validateRequest
];

// Order validation
export const orderValidation = [
  body("items").isArray({ min: 1 }).withMessage("At least one item is required"),
  body("shippingAddress").notEmpty().withMessage("Shipping address is required"),
  body("paymentMethod").isIn(["cod", "card", "upi", "netbanking", "wallet"]).withMessage("Valid payment method is required"),
  validateRequest
];

// Review validation
export const reviewValidation = [
  body("rating").isInt({ min: 1, max: 5 }).withMessage("Rating must be between 1 and 5"),
  body("review").notEmpty().withMessage("Review text is required"),
  validateRequest
];