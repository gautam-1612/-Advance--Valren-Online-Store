// ################# Mongoose ODM ##################

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProductSchema = new Schema({
  title: { type: String, required: true },
  price: { type: Number, required: true },
  description: { type: String, required: true },
  imageURL: { type: String, required: true },
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
});

module.exports = mongoose.model("Product", ProductSchema);
// Here Products is what becomes the collection name by lowerCasing the first letter & taking its plural form so it becomes 'products' in mongoDB.

// ################# MongoDB Driver ################

// const getDb = require("../util/database").getDb;
// const { ObjectId } = require("mongodb");

// class Product {
//   constructor(id = null, title, imageURL, price, description, userID) {
//     this._id = id ? new ObjectId(id) : null;
//     this.title = title;
//     this.imageURL = imageURL;
//     this.price = price;
//     this.description = description;
//     this.userID = new ObjectId(userID);
//   }
//   save() {
//     const db = getDb();
//     if (this._id) {
//       return db
//         .collection("products")
//         .updateOne({ _id: this._id }, { $set: this });
//     } else {
//       return db
//         .collection("products")
//         .insertOne(this)
//         .then((result) => console.log(result))
//         .catch((err) => {
//           console.log("product addition failed !");
//           throw err;
//         });
//     }
//   }

//   static fetchAll() {
//     const db = getDb();
//     return db
//       .collection("products")
//       .find()
//       .toArray()
//       .then((products) => products)
//       .catch((err) => {
//         throw err;
//       });
//   }

//   static findByID(productID) {
//     const db = getDb();
//     return db
//       .collection("products")
//       .findOne({ _id: new ObjectId(productID) })
//       .then((product) => product)
//       .catch((err) => {
//         throw err;
//       });
//   }

//   static deleteByID(productID) {
//     const db = getDb();
//     return db
//       .collection("products")
//       .deleteOne({ _id: new ObjectId(productID) })
//       .then(() => console.log("deleted"))
//       .catch((err) => {
//         throw err;
//       });
//   }
// }

// module.exports = Product;

// %%%%%%%%%%%%% USING FILE AS DATA STORAGE %%%%%%%%%%%%%

// const fs = require("fs");
// const path = require("path");

// const p = require("../util/path");
// const Cart = require("./cart");

// module.exports = class Product {
//   constructor(id, title, imageURL, price, description) {
//     this.id = id;
//     this.title = title;
//     this.imageURL = imageURL;
//     this.price = price;
//     this.description = description;
//   }
//   save() {
//     fs.readFile(path.join(p, "/data", "/products.json"), (err, data) => {
//       let products = [];

//       if (!err) products = JSON.parse(data);

//       // checking id already id exists, for updating the product.
//       if (this.id) {
//         const existingProductIndex = products.findIndex(
//           (product) => product.id === this.id
//         );
//         products[existingProductIndex] = this;
//         fs.writeFile(
//           path.join(p, "/data", "/products.json"),
//           JSON.stringify(products),
//           (err) => {
//             if (err) console.log(err);
//           }
//         );
//       } else {
//         let id = (Math.random() * 10).toString();
//         products.push({ ...this, id: id });

//         fs.writeFile(
//           path.join(p, "/data", "/products.json"),
//           JSON.stringify(products),
//           (err) => {
//             if (err) console.log(err);
//           }
//         );
//       }
//     });
//   }

//   static fetchAll(cb) {
//     fs.readFile(path.join(p, "/data", "/products.json"), (err, data) => {
//       if (err) return cb([]);
//       cb(JSON.parse(data));
//     });
//   }

//   static findByID(id, cb) {
//     fs.readFile(path.join(p, "/data", "/products.json"), (err, data) => {
//       if (err) return cb([]);
//       let products = JSON.parse(data);
//       let product = products.find((prods) => prods.id === id);
//       cb(product);
//     });
//   }

//   static deleteByID(id) {
//     fs.readFile(path.join(p, "/data", "/products.json"), (err, data) => {
//       if (err) return err;

//       const products = JSON.parse(data);
//       const filteredProductsArray = products.filter(
//         (product) => product.id !== id
//       );

//       const product = products.find((prod) => prod.id === id);
//       Cart.deleteProduct(id, product.price);

//       fs.writeFile(
//         path.join(p, "/data", "products.json"),
//         JSON.stringify(filteredProductsArray),
//         (err) => console.log(err)
//       );
//     });
//   }
// };
