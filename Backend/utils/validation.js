import { body, validationResult } from "express-validator";

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

export const registerValidation = [
  body("name").notEmpty().withMessage("Name is required"),
  body("email").isEmail().withMessage("Valid email is required"),
  body("mobileNo").isLength({ min: 10, max: 10 }).withMessage("Valid mobile number is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
];

export const productValidation = [
  body("name").notEmpty().withMessage("Product name is required"),
  body("price").isNumeric().withMessage("Price must be a number"),
  body("category").isMongoId().withMessage("Valid category ID is required"),
  body("stock").isNumeric().withMessage("Stock must be a number")
];