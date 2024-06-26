import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your name"],
    },
    photo: {
      type: String,
      required: [true, "Please provide the photo"],
    },
    category: {
      type: String,
      required: [true, "Please enter the category"],
    },
    price: {
      type: Number,
      required: [true, "Please enter the price"],
    },
    stock: {
      type: Number,
      required: [true, "Please enter the stock"],
    },
  },
  {
    timestamps: true,
  }
);

const product = mongoose.model("product", productSchema);
export default product;
