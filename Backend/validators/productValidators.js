import { body } from "express-validator";

export const productValidator = [
  body("name").notEmpty().withMessage("Product name is required"),
  body("description").notEmpty().withMessage("Description is required"),
  body("basePrice").isNumeric().withMessage("Base price must be a number"),
  body("category").isMongoId().withMessage("Valid category ID is required"),
  body("variants").isArray().optional(),
  body("variants.*.sku").notEmpty().withMessage("SKU is required for each variant"),
  body("variants.*.price").isNumeric().withMessage("Price must be a number"),
  body("variants.*.stock").isNumeric().withMessage("Stock must be a number")
];