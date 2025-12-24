const Product = require("../model/product");
const deleteFile = require("../util/file");
const { validationResult } = require("express-validator");

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    hasError: false,
    errorMessage: null,
  });
};

exports.postAddProduct = (req, res, next) => {
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;

  if (!image) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      product: { title, price, description },
      errorMessage: "Attached file is not an image.",
    });
  }

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      product: { title, price, description },
      errorMessage: errors.array()[0].msg,
    });
  }

  const imageURL = "/" + image.path;

  const product = new Product({
    title,
    imageURL,
    price,
    description,
    userId: req.user, // using full user object because mongoose will fetch automatically _id from req.user object & assign _id to userId.
  });

  product
    .save()
    .then(() => {
      console.log("created Product");
      res.redirect("/admin/products");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getEditProduct = (req, res, next) => {
  const editMode = req.query.edit;
  if (!editMode) return res.redirect("/");

  const productID = req.params.productID;
  Product.findById(productID)
    .then((product) => {
      if (!product) {
        return res.redirect("/");
      }
      res.render("admin/edit-product", {
        product: product,
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        hasError: false,
        errorMessage: null,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postEditProduct = (req, res, next) => {
  const { productID, title, price, description } = req.body;
  const image = req.file;

  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: true,
      hasError: true,
      product: { title, price, description, _id: productID },
      errorMessage: errors.array()[0].msg,
    });
  }

  const product = Product.findById(productID)
    .then((product) => {
      product.title = title;
      product.price = price;
      if (image) {
        deleteFile(product.imageURL);
        product.imageURL = "/" + image.path;
      }
      product.description = description;
      product.save();
    })
    .then(() => {
      res.redirect("/admin/products");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.deleteProduct = (req, res, next) => {
  const productID = req.params.productID;

  Product.findById(productID)
    .then((product) => {
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      deleteFile(product.imageURL);
      return Product.findByIdAndDelete(productID);
    })
    .then(() => {
      return res.status(200).json({ message: "Success" });
    })
    .catch((err) => {
      console.error("DELETE ERROR:", err);
      return res.status(500).json({ message: "Product deletion failed" });
    });
};

exports.getProducts = (req, res, next) => {
  Product.find()
    .then((products) => {
      res.render("admin/products", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};
