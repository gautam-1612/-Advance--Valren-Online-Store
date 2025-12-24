const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const orderSchema = new mongoose.Schema({
  products: [
    {
      product: { type: Object, required: true },
      quantity: { type: Number, required: true },
    },
  ],

  user: {
    email: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    name: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
  },

  amount: Number,

  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("Order", orderSchema);
