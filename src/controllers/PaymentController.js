import { stripe } from "../index.js";
import Coupon from "../models/couponSchema.js";
import errorHandler from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";

export const createPayment = catchAsync(async (req, res, next) => {
  const { amount } = req.body;
  if (!amount) {
    return next(new errorHandler("Please enter the amount", 400));
  }
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Number(amount) * 100,
    currency: "inr",
  });
  return res.status(201).json({
    success: true,
    clientSecret: paymentIntent.client_secret,
  });
});

export const newCoupon = catchAsync(async (req, res, next) => {
  const { coupon, amount } = req.body;
  if (!coupon || !amount) {
    return next(
      new errorHandler("Please enter the coupon and amount both", 400)
    );
  }
  await Coupon.create({
    couponCode: coupon,
    amount,
  });
  return res.status(201).json({
    sucess: true,
    message: `Coupon ${coupon} created successfully!`,
  });
});

export const applyDiscount = catchAsync(async (req, res, next) => {
  const { coupon } = req.query;
  const discount = await Coupon.findOne({ couponCode: coupon });
  // console.log(discount);
  if (!discount) {
    return next(new errorHandler("Coupon does not exists", 400));
  }
  return res.status(200).json({
    success: true,
    discount: discount.amount,
  });
});

export const getAllCoupons = catchAsync(async (req, res, next) => {
  const allCoupons = await Coupon.find({});
  return res.status(200).json({
    success: true,
    allCoupons,
  });
});

export const deleteCoupon = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  // console.log(id);
  const coupon = await Coupon.findById(id);
  if (!coupon) {
    return next(new errorHandler("Invalid Coupon ID", 400));
  }
  await coupon.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Coupon Deleted Successfully!",
  });
});
