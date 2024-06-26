import express from "express";
import {
  allOrders,
  deleteOrder,
  myOrders,
  newOrder,
  processOrder,
  singleOrder,
} from "../controllers/OrderController.js";
import { adminOnly } from "../middlewares/authController.js";

const Orderrouter = express.Router();

Orderrouter.route("/new").post(newOrder);
Orderrouter.route("/myOrder").get(myOrders);
Orderrouter.route("/allOrders").get(adminOnly, allOrders);
Orderrouter.route("/:id").get(singleOrder);
Orderrouter.route("/:id")
  .put(adminOnly, processOrder)
  .delete(adminOnly, deleteOrder);
export default Orderrouter;
