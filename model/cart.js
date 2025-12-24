// const fs = require("fs");
// const path = require("path");
// const { getDb } = require("../util/database");

// process.mainModule.filename was a Node.js property used to get the entry point file of your application — basically the file that was run with node app.js

// const p = path.join(
//   path.dirname(process.mainModule.filename),
//   "data",
//   "cart.json"
// );

// module.exports = class Cart {
//   static addProduct(id, productPrice) {
//     // Fetch the previous cart
//     fs.readFile(p, (err, fileContent) => {
//       let cart = { products: [], totalPrice: 0 };
//       if (!err) {
//         cart = JSON.parse(fileContent);
//       }
//       // Analyze the cart => Find existing product
//       const existingProductIndex = cart.products.findIndex(
//         (prod) => prod.id === id
//       );
//       const existingProduct = cart.products[existingProductIndex];
//       let updatedProduct;
//       // Add new product/ increase quantity
//       if (existingProduct) {
//         updatedProduct = { ...existingProduct };
//         updatedProduct.qty = updatedProduct.qty + 1;
//         cart.products = [...cart.products];
//         cart.products[existingProductIndex] = updatedProduct;
//       } else {
//         updatedProduct = { id: id, qty: 1 };
//         cart.products = [...cart.products, updatedProduct];
//       }
//       cart.totalPrice = cart.totalPrice + +productPrice;
//       fs.writeFile(p, JSON.stringify(cart), (err) => {
//         console.log(err);
//       });
//     });
//   }

//   static reduceProduct(id, productPrice) {
//     fs.readFile(p, (err, data) => {
//       if (err) return;

//       const cart = JSON.parse(data);
//       const productIndex = cart.products.findIndex((p) => p.id === id);
//       if (productIndex < 0) return;

//       const existingProduct = cart.products[productIndex];

//       if (existingProduct.qty > 1) {
//         existingProduct.qty = existingProduct.qty - 1;
//       } else {
//         cart.products.splice(productIndex, 1);
//       }

//       cart.totalPrice -= productPrice;

//       fs.writeFile(p, JSON.stringify(cart), (err) => console.log(err));
//     });
//   }

//   static deleteProduct(id, productPrice) {
//     fs.readFile(p, (err, data) => {
//       if (err) return;

//       const cart = JSON.parse(data);
//       const product = cart.products.find((p) => p.id === id);
//       if (!product) return;

//       cart.totalPrice -= product.qty * productPrice;

//       cart.products = cart.products.filter((p) => p.id !== id);

//       fs.writeFile(p, JSON.stringify(cart), (err) => console.log(err));
//     });
//   }

//   static fetchCart(cb) {
//     fs.readFile(p, (err, data) => {
//       if (err) cb(null);
//       const cartData = JSON.parse(data);
//       cb(cartData);
//     });
//   }
// };
