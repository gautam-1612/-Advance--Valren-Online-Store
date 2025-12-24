const express = require("express");
const router = express.Router();

const { body } = require("express-validator");
const shopController = require("../controller/shop");
const { clientAuth, adminAuth } = require("../middleware/is-auth");

router.get("/", shopController.getIndex);

router.get("/products", shopController.getProducts);
router.get("/products/:productID", shopController.getProduct);

router.get("/cart", clientAuth, shopController.getCart);
router.post("/cart", clientAuth, shopController.postCart);

router.post("/cart/increase", clientAuth, shopController.increaseQty);
router.post("/cart/decrease", clientAuth, shopController.decreaseQty);
router.post("/cart/delete", clientAuth, shopController.deleteItem);

router.get("/checkout", clientAuth, shopController.getCheckout);

router.post(
  "/start-checkout",
  clientAuth,
  [
    body("fullName").trim().notEmpty().withMessage("Full name is required"),
    body("email").isEmail().withMessage("Valid email is required"),
    body("phone")
      .isLength({ min: 10, max: 10 })
      .withMessage("Phone must be exactly 10 digits")
      .isNumeric()
      .withMessage("Phone must contain only numbers"),
    body("address").trim().notEmpty().withMessage("Address is required"),
  ],
  shopController.startCheckout
);

router.post("/create-order", clientAuth, shopController.createOrder);
router.get("/checkout/success", clientAuth, shopController.getCheckoutSuccess);
router.get("/checkout/cancel", clientAuth, shopController.getCheckout);

router.get("/orders", clientAuth, shopController.getOrders);

router.get("/orders/:orderId", clientAuth, shopController.getInvoice);

module.exports = router;
