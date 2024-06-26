import mongoose from "mongoose";

const orderSchema = new mongoose.Schema(
  {
    shippingInfo: {
      address: {
        type: String,
        required: [true, "Please enter your address"],
      },
      city: {
        type: String,
        required: [true, "Please enter the name of your city"],
      },
      state: {
        type: String,
        required: [true, "Please enter the name of your state"],
      },
      country: {
        type: String,
        required: [true, "Please enter the name of your country"],
      },
      pinCode: {
        type: Number,
        required: [true, "Please the PINCODE"],
      },
    },
    user: {
      type: String,
      ref: "User",
      required: true,
    },
    subtotal: {
      type: Number,
      required: true,
    },
    tax: {
      type: Number,
      required: true,
    },
    shippingCharges: {
      type: Number,
      required: true,
      default:0
    },
    discount: {
      type: Number,
      required: true,
      default:0,
    },
    total: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["Processing", "Shipped", "Delivered"],
      default: "Processing",
    },
    orderItems: [
      {
        name: String,
        photo: String,
        price: Number,
        quantity: Number,
        productID: {
          type: mongoose.Types.ObjectId,
          ref: "product",
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

const Orders = mongoose.model("Orders", orderSchema);

export default Orders;
