import { body } from "express-validator";

export const registerValidator = [
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("mobileNo").isLength({ min: 10, max: 10 }).withMessage("Valid 10-digit mobile number is required"),
  body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters")
];

export const loginValidator = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("password").notEmpty().withMessage("Password is required")
];