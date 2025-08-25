const mongoose = require("mongoose"); // ✅ Add this
const Schema = mongoose.Schema;

const StockSchema = new mongoose.Schema({
  stock: {
    type: String,
    trim: true
  },
  ticker: {
    type: String,
    trim: true,
    required: true
  },
  value: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  data: {
    resultPrice: { type: Number },
    direction: { type: String },
    outcome: { type: String }
  },
  date: {
    type: Date,
    default: Date.now
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true
  }
});

module.exports = mongoose.model("Stock", StockSchema);
