import express from "express";
import { applyDiscount, createPayment, deleteCoupon, getAllCoupons, newCoupon } from "../controllers/PaymentController.js";
import { adminOnly } from "../middlewares/authController.js";

const PaymentRouter = express.Router();
PaymentRouter.route("/create").post(createPayment)
PaymentRouter.route("/coupon/new").post(newCoupon);
PaymentRouter.route("/discount").get(applyDiscount)
PaymentRouter.route("/all").get(adminOnly,getAllCoupons)
PaymentRouter.route("/coupon/:id").delete(adminOnly,deleteCoupon)
export default PaymentRouter;
