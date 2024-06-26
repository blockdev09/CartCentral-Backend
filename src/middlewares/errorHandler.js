import express from "express";
export const errorHandler = (err, req, res, next) => {
  err.message = err.message || "Error";
  err.statusCode = err.statusCode || 500;
  return res.status(err.statusCode).json({
    success: false,
    status: err.status,
    message: err.message,
  });
};
