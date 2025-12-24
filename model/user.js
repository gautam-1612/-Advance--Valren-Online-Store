// ################# Mongoose ODM ##################

const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  role: {
    type: String,
    enum: ["user", "admin"], //enum means the fiels can only be one of these two choices.
    default: "user",
  },
  resetToken: String,
  resetTokenExpiration: Date,
  cart: {
    items: [
      {
        productId: {
          type: Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        quantity: { type: Number, required: true },
      },
    ],
  },
});

UserSchema.methods.addToCart = function (product) {
  const cartProductIndex = this.cart.items.findIndex((cp) => {
    return cp.productId.toString() === product._id.toString();
  });

  let newQuantity = 1;
  const updatedCartItems = [...this.cart.items];

  if (cartProductIndex >= 0) {
    newQuantity = this.cart.items[cartProductIndex].quantity + 1;
    updatedCartItems[cartProductIndex].quantity = newQuantity;
  } else {
    updatedCartItems.push({
      productId: product._id,
      quantity: newQuantity,
    });
  }

  this.cart = { items: updatedCartItems };
  return this.save();
};

UserSchema.methods.getCartItems = function () {
  return this.populate("cart.items.productId").then((user) => user.cart.items);
};

UserSchema.methods.increaseQty = function (productId) {
  const index = this.cart.items.findIndex(
    (item) => item.productId.toString() === productId.toString()
  );
  if (index >= 0) this.cart.items[index].quantity++;
  return this.save();
};

UserSchema.methods.decreaseQty = function (productId) {
  const index = this.cart.items.findIndex(
    (items) => items.productId.toString() === productId.toString()
  );
  if (this.cart.items[index].quantity <= 1) {
    this.cart.items.splice(index, 1);
    return this.save();
  }
  if (index >= 0) this.cart.items[index].quantity--;
  return this.save();
};

UserSchema.methods.deleteItem = function (productId) {
  const updatedCartItems = this.cart.items.filter(
    (item) => item.productId.toString() !== productId.toString()
  );
  this.cart.items = updatedCartItems;
  return this.save();
};

UserSchema.methods.clearCart = function () {
  this.cart.items = [];
  return this.save();
};

module.exports = mongoose.model("User", UserSchema);

// ################# MongoDB Driver ################

// const getDb = require("../util/database").getDb;
// const { ObjectId } = require("mongodb");
// const Product = require("./product");

// class User {
//   constructor(username, email, cart, id) {
//     this.username = username;
//     this.email = email;
//     this.cart = cart && cart.items ? cart : { items: [] };
//     this._id = typeof id === "string" ? new ObjectId(id) : id;
//   }

//   save() {
//     const db = getDb();
//     return db.collection("users").insertOne(this);
//   }

//   addToCart(product) {
//     const cartProductIndex = this.cart.items.findIndex((cp) => {
//       return cp.productId.toString() === product._id.toString();
//     });

//     let newQuantity = 1;
//     const updatedCartItems = [...this.cart.items];

//     if (cartProductIndex >= 0) {
//       newQuantity = this.cart.items[cartProductIndex].quantity + 1;
//       updatedCartItems[cartProductIndex].quantity = newQuantity;
//     } else {
//       updatedCartItems.push({
//         productId: new ObjectId(product._id),
//         quantity: newQuantity,
//       });
//     }

//     const updatedCart = { items: updatedCartItems };

//     const db = getDb();
//     return db
//       .collection("users")
//       .updateOne({ _id: this._id }, { $set: { cart: updatedCart } });
//   }

//   getCartItems() {
//     const db = getDb();

//     if (!this.cart.items || this.cart.items.length === 0) {
//       return Promise.resolve([]);
//     }

//     const productIds = this.cart.items.map(
//       (item) => new ObjectId(item.productId)
//     );

//     return Product.fetchAll().then((availableProducts) => {
//       return db
//         .collection("products")
//         .find({ _id: { $in: productIds } })
//         .toArray()
//         .then((productsFromCart) => {
//           // FIXED: must return from inside filter
//           const filteredProducts = productsFromCart.filter((prod) => {
//             return availableProducts.some(
//               (item) => item._id.toString() === prod._id.toString()
//             );
//           });

//           return filteredProducts.map((prod) => {
//             return {
//               ...prod,
//               quantity: this.cart.items.find(
//                 (i) => i.productId.toString() === prod._id.toString()
//               ).quantity,
//             };
//           });
//         });
//     });
//   }

//   increaseQty(productID) {
//     const db = getDb();
//     return db.collection("users").updateOne(
//       {
//         _id: this._id,
//         "cart.items.productId": new ObjectId(productID),
//       },
//       {
//         $inc: { "cart.items.$.quantity": 1 }, //$ in "cart.items.$.quantity" is called the positional operator in MongoDB. UPDATE exactly that element
//       }
//     );
//   }

//   decreaseQty(productID) {
//     const db = getDb();
//     return db.collection("users").updateOne(
//       {
//         _id: this._id,
//         "cart.items.productId": new ObjectId(productID),
//       },
//       {
//         $inc: { "cart.items.$.quantity": -1 }, //$ in "cart.items.$.quantity" is called the positional operator in MongoDB. UPDATE exactly that element
//       }
//     );
//   }

//   deleteItem(productId) {
//     const updatedCartItems = this.cart.items.filter((item) => {
//       return item.productId.toString() !== productId.toString();
//     });

//     const db = getDb();
//     return db
//       .collection("users")
//       .updateOne(
//         { _id: this._id },
//         { $set: { cart: { items: updatedCartItems } } }
//       );
//   }

//   clearCart() {
//     const db = getDb();
//     return db
//       .collection("users")
//       .updateOne({ _id: this._id }, { $set: { cart: { items: [] } } });
//   }

//   addOrder() {
//     const db = getDb();
//     return this.getCartItems()
//       .then((products) => {
//         const order = {
//           items: products,
//           createdAt: new Date(),
//           user: {
//             userId: new ObjectId(this._id),
//             username: this.username,
//           },
//         };
//         return db.collection("orders").insertOne(order);
//       })
//       .then(() => {
//         this.cart = { items: [] };
//         return db
//           .collection("users")
//           .updateOne({ _id: this._id }, { $set: { cart: { items: [] } } });
//       });
//   }

//   getOrders() {
//     const db = getDb();
//     return db
//       .collection("orders")
//       .find({ "user.userId": new ObjectId(this._id) })
//       .toArray()
//       .then((orders) => {
//         return orders;
//       });
//   }

//   static findByID(id) {
//     const db = getDb();
//     return db.collection("users").findOne({ _id: new ObjectId(id) });
//   }
// }

// module.exports = User;
