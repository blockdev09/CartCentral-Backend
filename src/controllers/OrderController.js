import express from "express";
import catchAsync from "../utils/catchAsync.js";
import Orders from "../models/orderModel.js";
import { invalidateCache, nodecache, reduceStock } from "../index.js";
import errorHandler from "../utils/appError.js";
export const newOrder = catchAsync(async (req, res, next) => {
  const {
    shippingInfo,
    user,
    subtotal,
    tax,
    shippingCharges,
    discount,
    total,
    orderItems,
  } = req.body;

  if (!shippingInfo || !user || !subtotal || !tax || !total || !orderItems) {
    return next(new errorHandler("Please enter all the fields", 400));
  }
  const order = await Orders.create({
    shippingInfo,
    user,
    subtotal,
    tax,
    shippingCharges,
    discount,
    total,
    orderItems,
  });
  invalidateCache({
    Product: true,
    order: true,
    admin: true,
    userID: user,
    productId: order.orderItems.map((i) => String(i.productID)),
  });
  return res.status(201).json({
    sucess: true,
    message: "Order placed Successfully!",
  });
});

export const myOrders = catchAsync(async (req, res, next) => {
  const { id: userID } = req.query;
  const key = `my-orders-${userID}`;
  let orders = [];
  if (nodecache.has(key)) {
    orders = JSON.parse(nodecache.get(key));
  } else {
    orders = await Orders.find({ user: userID });
    nodecache.set(key, JSON.stringify(orders));
  }
  return res.status(200).json({
    success: true,
    data: {
      orders,
    },
  });
});

export const allOrders = catchAsync(async (req, res, next) => {
  const key = "all-orders";
  let orders = [];
  if (nodecache.has(key)) {
    orders = JSON.parse(nodecache.get(key));
  } else {
    orders = await Orders.find().populate("user", "name");
    nodecache.set(key, JSON.stringify(orders));
  }

  return res.status(200).json({
    success: true,
    data: {
      orders,
    },
  });
});

export const singleOrder = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const key = `order-${id}`;
  let order;
  if (nodecache.has(key)) {
    order = JSON.parse(nodecache.get(key));
  } else {
    order = await Orders.findById(id).populate("user", "name");
    if (!order) {
      return next(new errorHandler("Order not found", 404));
    }
    nodecache.set(key, JSON.stringify(order));
  }
  // console.log(key);
  return res.status(200).json({
    sucess: true,
    order,
  });
});

// export const processOrder = catchAsync(async (req, res, next) => {
//   const {id}= req.params;
//   console.log(id);
//   const order = await Orders.findById(id);
//   console.log(order.status)
//   if (!order) {
//     return next(new errorHandler("Order not found", 404));
//   }
//   if (order.status === "Processing") {
//     order.status = "Shipped";
//   }
//   if (order.status === "Shipped") {
//     order.status = "Delivered";
//   }
//   if(order.status === "Delivered"){
//     order.status = "Delivered"
//   }

//   await order.save();
//   console.log(order.status)
//   await invalidateCache({ Product: false, order: true, admin: true,userID : order.user });
//   res.status(200).json({
//     success: true,
//     messsage: "Order Processed Successfully",
//     order,
//   });
// });

export const processOrder = catchAsync(async (req, res, next) => {
  const id = req.params.id;

  const order = await Orders.findById(id);
  if (!order) {
    return next(new errorHandler("Order not found!", 404));
  }

  if (order.status === "Processing") {
    order.status = "Shipped";
  } else if (order.status === "Shipped") {
    order.status = "Delivered";
  } else if (order.status === "Delivered") {
    order.status = "Delivered";
  }
  await order.save();

  invalidateCache({
    Product: false,
    order: true,
    admin: true,
    userID: order.user,
    orderId: String(order._id),
  });
  return res.status(200).json({
    success: true,
    message: "Order Processed Successfully!",
  });
});

export const deleteOrder = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  // console.log(id);
  const order = await Orders.findById(id);
  if (!order) {
    return next(new errorHandler("Order not found", 404));
  }

  await order.deleteOne();
  invalidateCache({
    Product: false,
    order: true,
    admin: true,
    userID: order.user,
    orderId: String(order._id),
  });
  return res.status(200).json({
    success: true,
    messsage: "Order deleted Successfully",
    order,
  });
});
