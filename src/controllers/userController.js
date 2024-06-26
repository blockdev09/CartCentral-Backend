import express from "express";
import { User } from "../models/userModel.js";
import errorHandler from "../utils/appError.js";
import catchAsync from "../utils/catchAsync.js";
export const newUser = catchAsync(async (req, res, next) => {
  const { name, email, photo, gender, role, _id, dob } = req.body;
  let user = await User.findById(_id);
  if (user) {
    res.status(200).json({
      success: true,
      message: `Welcome ${user.name}`,
    });
  }
  if (!_id || !name || !email || !photo || !gender || !dob) {
    return next(new errorHandler("Please add all the required fields", 400));
  }
  user = await User.create({
    name,
    email,
    photo,
    gender,
    role,
    _id,
    dob,
  });
  return res.status(200).json({
    success: true,
    message: `Welcome ${user.name}`,
    data: {
      user,
    },
  });
});

export const getAllUsers = catchAsync(async (req, res, next) => {
  const allUser = await User.find();
  return res.status(201).json({
    success: true,
    data: {
      allUser,
    },
  });
});

export const getUser = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const user = await User.findById(id);
  if (!user) {
    return next(new errorHandler("Invalid ID", 400));
  }
  return res.status(200).json({
    success: true,
    data: {
      user,
    },
  });
});

export const deleteUser = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  const user = await User.findById(id);
  if (!user) {
    return next(new errorHandler("Invalid ID", 400));
  }
  await user.deleteOne();
  return res.status(200).json({
    success: true,
    message: "User deleted Successfully",
  });
});
