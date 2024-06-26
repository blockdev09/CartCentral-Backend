import express from "express";
import mongoose from "mongoose";
import nodeCache from "node-cache";
import product from "./models/productModel.js";
import morgan from "morgan";
import { config } from "dotenv";
import Stripe from "stripe";
import cors from "cors";
import UserRouter from "./routes/UserRoute.js";
import Productrouter from "./routes/ProductRoute.js";
import Orderrouter from "./routes/OrderRoute.js";
import { errorHandler } from "./middlewares/errorHandler.js";
import Orders from "./models/orderModel.js";
import PaymentRouter from "./routes/PaymentRoute.js";
import statRoute from "./routes/StatsRoutes.js";

// const stripeKey = process.env.STRIPE_KEY || "";
// export const stripe = new Stripe(stripeKey)
const app = express();
app.use(express.json());
app.use(morgan("dev"));
app.use(cors());
config({
  path: "./.env",
});

const stripeKey = process.env.STRIPE_KEY || "";
export const stripe = new Stripe(stripeKey);

export const nodecache = new nodeCache();
export const invalidateCache = ({
  Product,
  order,
  admin,
  userID,
  orderId,
  productId,
}) => {
  if (Product) {
    const productkeys = ["latest-products", "categoriesss", "productsss"];
    if (productId === "string") {
      productkeys.push(`single-product-${productId}`);
    }
    if (productId === "object") {
      productId.forEach((i) => productkeys.push(`single-product-${i}`));
    }
    //`single-product-${id}`
    // const products = await product.find({}).select("_id");
    // products.forEach((i) => {
    //   const id = i._id;
    //   productkeys.push(`single-product-${id}`);
    // });
    nodecache.del(productkeys);
  }
  if (order) {
    const orders = ["all-orders", `my-orders-${userID}`, `order-${orderId}`];
    // const order = await Orders.find({}).select("_id");
    // console.log("HII",id)
    // console.log(`my-orders-${userID}`)
    // order.forEach((i) => {
    //   const id = i._id;
    //   // console.log(id)
    //   // console.log(`order-${id}`)
    //   orders.push(`order-${id}`);
    // });
    nodecache.del(orders);
  }
  if (admin) {
    nodecache.del([
      "admin-stats",
      "pie-stats",
      "admin-bar-charts",
      "admin-line-charts",
    ]);
  }
};

export const reduceStock = async (orderItems) => {
  for (let i = 0; i < orderItems.length; i++) {
    const order = orderItems[i];
    const products = await product.findById(order.productID);
    if (!products) {
      throw new Error("Product not found");
    }
    products.stock = products.stock - order.quantity;
    await products.save();
  }
};

export const calculatePercentage = (thisMonth, lastMonth) => {
  if (lastMonth === 0) {
    return thisMonth * 100;
  }
  const percentage = (thisMonth / lastMonth) * 100;
  return Number(percentage.toFixed(0));
};

export const getChartData = (length, docArr, property) => {
  const data = new Array(length).fill(0);
  const today = new Date();
  docArr.forEach((order) => {
    const creationDate = order.createdAt;

    const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
    if (monthDiff < length) {
      if (property) {
        data[length - monthDiff - 1] =
          data[length - monthDiff - 1] + order[property];
      } else {
        data[length - monthDiff - 1] = data[length - monthDiff - 1] + 1;
      }
    }
  });
  return data;
};

app.get("/", (req, res) => {
  res.send("API Working");
});
app.use("/api/v1/users", UserRouter);
app.use("/api/v1/product", Productrouter);
app.use("/api/v1/orders", Orderrouter);
app.use("/api/v1/payment", PaymentRouter);
app.use("/api/v1/dashboard", statRoute);
app.use("/uploads", express.static("uploads"));
app.use(errorHandler);
// const url = `mongodb+srv://${process.env.MONGO-URL}`
// "mongodb+srv://devanshjuwar:xSkSnbSU1BdErg2u@cluster3.fkmsf8j.mongodb.net/e-commerce?retryWrites=true&w=majority&appName=Cluster3";
mongoose
  .connect(process.env.MONGO_URL, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then((con) => console.log("DB"));

const port = 5000;
app.listen(port, () => {
  console.log(`Listening on ${port}`);
});
