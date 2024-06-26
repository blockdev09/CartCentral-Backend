import express from "express";
import catchAsync from "../utils/catchAsync.js";
import errorHandler from "../utils/appError.js";
import { User } from "../models/userModel.js";

////// MIDDLEWARE TO MAKE SURE ONLY ADMIN IS ALLOWED
export const adminOnly = catchAsync(async (req, res, next) => {
  const { id } = req.query;
  console.log(id)
  if (!id) {
    return next(new errorHandler("Please Login to get access", 401));
  }
  const user = await User.findById(id);
  if (!user) {
    return next(new errorHandler("ID does not exists", 401));
  }
  if (user.role !== "admin") {
    return next(
      new errorHandler("Only user with admin role can access this route", 403)
    );
  }
  next();
});
