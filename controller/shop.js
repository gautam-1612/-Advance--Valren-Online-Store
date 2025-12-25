const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const { validationResult } = require("express-validator");
require("dotenv").config();

// Load Stripe Secret Key securely
const stripe = require("stripe")(process.env.SECRET_KEY);

const Product = require("../model/product");
const Order = require("../model/order");

const ITEMS_PER_PAGE = 4;

// ========================== PRODUCTS =============================

exports.getProducts = (req, res, next) => {
  const page = +req.query.page || 1;
  let totalProducts;

  Product.find()
    .countDocuments()
    .then((numProducts) => {
      totalProducts = numProducts;
      return Product.find()
        .skip((page - 1) * ITEMS_PER_PAGE)
        .limit(ITEMS_PER_PAGE);
    })
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "Products",
        path: "/products",
        totalProducts,
        hasNextPage: ITEMS_PER_PAGE * page < totalProducts,
        hasPreviousPage: page > 1,
        currentPage: page,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalProducts / ITEMS_PER_PAGE),
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

// ========================== PRODUCT DETAIL =============================

exports.getProduct = (req, res, next) => {
  const productID = req.params.productID;
  Product.findById(productID).then((product) => {
    res.render("shop/product-detail", {
      prod: product,
      pageTitle: product.title,
      path: "/products",
    });
  });
};

// ========================== HOME PAGE =============================

exports.getIndex = (req, res, next) => {
  res.render("shop/index", {
    pageTitle: "Shop",
    path: "/",
  });
};

// ========================== CART =============================

exports.getCart = (req, res, next) => {
  req.user
    .getCartItems()
    .then((products) => {
      let totalPrice = products.reduce((acc, prod) => {
        return acc + Number(prod.productId.price) * Number(prod.quantity);
      }, 0);

      res.render("shop/cart", {
        path: "/cart",
        pageTitle: "Cart",
        products,
        totalPrice,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.increaseQty = (req, res, next) => {
  const prodID = req.body.productID;
  req.user
    .increaseQty(prodID)
    .then(() => res.redirect("/cart"))
    .catch((err) => next(new Error(err)));
};

exports.decreaseQty = (req, res, next) => {
  const prodID = req.body.productID;
  req.user
    .decreaseQty(prodID)
    .then(() => res.redirect("/cart"))
    .catch((err) => next(new Error(err)));
};

exports.deleteItem = (req, res, next) => {
  const prodID = req.body.productID;
  req.user
    .deleteItem(prodID)
    .then(() => res.redirect("/cart"))
    .catch((err) => next(new Error(err)));
};

exports.postCart = (req, res, next) => {
  const prodID = req.body.productID;
  Product.findById(prodID)
    .then((product) => req.user.addToCart(product))
    .then(() => res.redirect("/cart"))
    .catch((err) => next(new Error(err)));
};

// ========================== CHECKOUT =============================

exports.getCheckout = (req, res, next) => {
  let totalPrice = 0;

  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items;

      products.forEach((p) => {
        totalPrice += p.quantity * p.productId.price;
      });

      res.render("shop/checkout", {
        path: "/checkout",
        pageTitle: "Checkout",
        products,
        totalPrice,
        publishableKey: process.env.PUBLISHABLE_KEY,
      });
    })
    .catch((err) => next(new Error(err)));
};

// ========================== Start Checkout ============================

exports.startCheckout = async (req, res, next) => {
  console.log("🔥 /start-checkout HIT");

  try {
    const { fullName, phone, address, email } = req.body;

    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        error: errors.array()[0].msg, // FIRST validation error
      });
    }

    // Load cart
    await req.user.populate("cart.items.productId");
    const items = req.user.cart.items;

    if (!items.length) {
      return res.status(400).json({ error: "Cart is empty" });
    }

    // ==========================
    // 🧮 1️⃣ CALCULATE SUBTOTAL
    // ==========================
    let subtotal = 0;
    let totalQty = 0;

    items.forEach((i) => {
      subtotal += i.productId.price * i.quantity;
      totalQty += i.quantity;
    });

    // ==========================
    // 🧮 2️⃣ CALCULATE GST + SHIPPING
    // ==========================
    const GST_PERCENT = 12;
    const gstAmount = Math.round((subtotal * GST_PERCENT) / 100);
    const shippingCost = subtotal >= 5000 ? 0 : 500;

    const finalPayable = subtotal + gstAmount + shippingCost;

    // ==========================
    // 🧮 3️⃣ DISTRIBUTE EXTRA COST OVER EACH UNIT
    // ==========================
    const extraCharge = finalPayable - subtotal;
    const extraPerUnit = Math.round(extraCharge / totalQty);
    // safe rounding

    // ==========================
    // 🧮 4️⃣ CREATE STRIPE LINE ITEMS WITH OVERRIDDEN PRICE
    // ==========================
    const lineItems = items.map((i) => {
      const basePrice = i.productId.price;
      const finalUnitPrice = basePrice + extraPerUnit;

      return {
        price_data: {
          currency: "inr",
          product_data: {
            name: i.productId.title,
            description: i.productId.description,
          },
          unit_amount: finalUnitPrice * 100, // 👈 Stripe takes paise
        },
        quantity: i.quantity,
      };
    });

    // ==========================
    // 💾 5️⃣ SAVE FORM + FINAL PRICE IN SESSION
    // ==========================
    req.session.checkoutData = {
      fullName,
      phone,
      address,
      email,
      finalPayable,
      gstAmount,
      shippingCost,
    };
    await req.session.save();

    // ==========================
    // 💳 6️⃣ CREATE STRIPE SESSION
    // ==========================
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: lineItems,
      customer_email: req.user.email,
      success_url: `${req.protocol}://${req.get("host")}/checkout/success`,
      cancel_url: `${req.protocol}://${req.get("host")}/checkout`,
    });

    console.log("🟢 Stripe session created:", session.id);

    return res.json({ url: session.url });
  } catch (err) {
    console.error("🔴 Stripe Error:", err);
    next(err);
  }
};

// ========================== CHECKOUT SUCCESS =============================
exports.getCheckoutSuccess = async (req, res, next) => {
  try {
    req.method = "POST";
    await exports.createOrder(req, {
      status: () => ({
        json: () => {},
      }),
    });

    res.redirect("/orders");
  } catch (err) {
    next(err);
  }
};

// ========================== Create Order ===============================

exports.createOrder = async (req, res, next) => {
  try {
    const data = req.session.checkoutData;

    if (!data) {
      return res.status(400).json({ message: "No checkout data found" });
    }

    await req.user.populate("cart.items.productId");
    const products = req.user.cart.items.map((i) => ({
      product: { ...i.productId._doc },
      quantity: i.quantity,
    }));

    const order = new Order({
      products,
      user: {
        userId: req.user._id,
        email: req.user.email,
        name: data.fullName,
        phone: data.phone,
        address: data.address,
      },
      createdAt: new Date(),
    });

    await order.save();
    await req.user.clearCart();

    // Clear session checkout data
    req.session.checkoutData = null;
    await req.session.save();

    res.status(200).json({ message: "Order created" });
  } catch (err) {
    next(err);
  }
};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .sort({ createdAt: -1 })
    .then((orders) => {
      res.render("shop/orders", {
        path: "/orders",
        pageTitle: "Your Orders",
        orders,
      });
    })
    .catch((err) => {
      next(new Error(err));
    });
};

// ========================== INVOICE GENERATION =============================
exports.getInvoice = (req, res, next) => {
  const orderId = req.params.orderId;

  Order.findById(orderId)
    .then((order) => {
      if (!order) return next(new Error("Order not found!"));

      if (order.user.userId.toString() !== req.user._id.toString()) {
        return next(new Error("Unauthorized user"));
      }

      const invoiceName = "invoice_" + orderId + ".pdf";
      const invoicePath = path.join("data", "invoices", invoiceName);

      const pdfDoc = new PDFDocument({ margin: 50 });

      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `inline; filename="${invoiceName}"`);

      pdfDoc.pipe(fs.createWriteStream(invoicePath));
      pdfDoc.pipe(res);

      // ================== HEADER ==================
      pdfDoc.fontSize(20).text("INVOICE", { align: "center", underline: true });
      pdfDoc.moveDown(1.5);

      // ================== CUSTOMER INFO ==================
      pdfDoc.fontSize(14).text("Customer Details:", { underline: true });
      pdfDoc.moveDown(0.5);

      pdfDoc.fontSize(12);
      pdfDoc.text(`Invoice ID: ${orderId}`);
      pdfDoc.text(`Date: ${order.createdAt.toLocaleDateString()}`);
      pdfDoc.text(`Customer Name: ${order.user.name}`);
      pdfDoc.text(`Customer Email: ${order.user.email}`);
      pdfDoc.text(`Customer Phone: ${order.user.phone}`);
      pdfDoc.text(`Customer Address: ${order.user.address}`);

      pdfDoc.moveDown(2);

      // ================== ORDER SUMMARY TITLE ==================
      pdfDoc.fontSize(16).text("Order Summary", { underline: true });
      pdfDoc.moveDown(1);

      // Column positions
      const colItemX = 50;
      const colQtyX = 250;
      const colPriceX = 330;
      const colTotalX = 420;

      const itemWidth = 180;
      const qtyWidth = 40;
      const priceWidth = 60;
      const totalWidth = 80;

      // Header row
      pdfDoc.fontSize(12);
      const headerY = pdfDoc.y;

      pdfDoc.text("Item", colItemX, headerY, { width: itemWidth });
      pdfDoc.text("Qty", colQtyX, headerY, {
        width: qtyWidth,
        align: "center",
      });
      pdfDoc.text("Price (Rs.)", colPriceX, headerY, {
        width: priceWidth,
        align: "right",
      });
      pdfDoc.text("Total (Rs.)", colTotalX, headerY, {
        width: totalWidth,
        align: "right",
      });

      const dividerY = headerY + 16;
      pdfDoc.moveTo(colItemX, dividerY).lineTo(550, dividerY).stroke();
      pdfDoc.y = dividerY + 8;

      // ================== PRODUCTS LOOP ==================
      let subtotal = 0;

      order.products.forEach((item, index) => {
        const p = item.product;
        const lineTotal = p.price * item.quantity;
        subtotal += lineTotal;

        const rowY = pdfDoc.y;

        pdfDoc.fontSize(12).text(`${index + 1}. ${p.title}`, colItemX, rowY, {
          width: itemWidth,
        });

        pdfDoc.text(String(item.quantity), colQtyX, rowY, {
          width: qtyWidth,
          align: "center",
        });

        pdfDoc.text(String(p.price), colPriceX, rowY, {
          width: priceWidth,
          align: "right",
        });

        pdfDoc.text(String(lineTotal), colTotalX, rowY, {
          width: totalWidth,
          align: "right",
        });

        pdfDoc.moveDown(2);
      });

      // ================== GST + SHIPPING + GRAND TOTAL ==================

      const gstPercent = 12;
      const gstAmount = Math.round((subtotal * gstPercent) / 100);

      const shippingCost = subtotal >= 5000 ? 0 : 500;

      const grandTotal = subtotal + gstAmount + shippingCost;

      pdfDoc.moveDown(1);

      pdfDoc.fontSize(13).text(`Subtotal: Rs. ${subtotal}`, { align: "right" });
      pdfDoc.text(`GST (${gstPercent}%): Rs. ${gstAmount}`, { align: "right" });
      pdfDoc.text(`Shipping: Rs. ${shippingCost}`, { align: "right" });

      pdfDoc.moveDown(0.7);

      pdfDoc.fontSize(16).text(`Grand Total: Rs. ${grandTotal}`, {
        align: "right",
        bold: true,
      });

      // ================== FOOTER ==================
      pdfDoc.moveDown(2);
      pdfDoc.fontSize(10).text("Thank you for shopping at Valren!", {
        align: "center",
      });
      pdfDoc.text("For support, contact support@valren.com", {
        align: "center",
      });

      pdfDoc.end();
    })
    .catch((err) => next(new Error(err)));
};
