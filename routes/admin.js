const express = require("express");
const { body } = require("express-validator");

const adminController = require("../controller/admin");
const { adminAuth } = require("../middleware/is-auth");

const router = express.Router();

// /admin/add-product => GET
router.get("/add-product", adminAuth, adminController.getAddProduct);

// /admin/add-product => POST
router.post(
  "/add-product",
  [
    body("title", "Title must be 3 characters long.")
      .trim()
      .isLength({ min: 3 })
      .customSanitizer(
        (value) => value.charAt(0).toUpperCase() + value.slice(1)
      ),
    body("price", "Price must be in numbers.").trim().isNumeric(),
    body("description", "Description must be 5 - 400 characters long.")
      .trim()
      .isLength({ min: 3, max: 400 }),
  ],
  adminAuth,
  adminController.postAddProduct
);

// /admin/products => GET
router.get("/products", adminAuth, adminController.getProducts);

// /admin/edit-product/:productID?edit=true => GET
router.get(
  "/edit-product/:productID",
  adminAuth,
  adminController.getEditProduct
);

// /admin/edit-product => POST
router.post(
  "/edit-product",
  [
    body("title", "Title must be 3 characters long.")
      .trim()
      .isLength({ min: 3 })
      .customSanitizer(
        (value) => value.charAt(0).toUpperCase() + value.slice(1)
      ),
    body("price", "Price must be in numbers.").trim().isNumeric(),
    body("description", "Description must be 5 - 400 characters long.")
      .trim()
      .isLength({ min: 3, max: 400 }),
  ],
  adminAuth,
  adminController.postEditProduct
);

// public/js/admin.js file (vanila JS)
router.delete("/products/:productID", adminAuth, adminController.deleteProduct);

module.exports = router;
