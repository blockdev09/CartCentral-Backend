import express from "express";
import catchAsync from "../utils/catchAsync.js";
import product from "../models/productModel.js";
import errorHandler from "../utils/appError.js";
import { rm } from "fs";
import { error } from "console";
import { invalidateCache, nodecache } from "../index.js";
export const newProduct = catchAsync(async (req, res, next) => {
  const { name, price, stock, category } = req.body;
  const photo = req.file;
  if (!photo) {
    return next(new errorHandler("Please add Photo", 400));
  }
  if (!name || !price || !stock || !category) {
    rm(photo.path, () => {
      console.log("Deleted");
    });
    return next(new errorHandler("Please enter all the fields", 400));
  }
  await product.create({
    name,
    stock,
    price,
    category,
    photo: photo.path,
  });
  invalidateCache({ Product: true, admin: true });
  return res.status(201).json({
    success: true,
    message: "Product created Successfully!",
  });
});

////// REVALIDATE ON NEW,UPDATE,DELETE A PRODUCT
export const getLatestProduct = catchAsync(async (req, res, next) => {
  let latestProducts;
  if (nodecache.has("latest-products")) {
    latestProducts = JSON.parse(nodecache.get("latest-products"));
  } else {
    latestProducts = await product.find({}).sort({ createdAt: -1 }).limit(5);
    nodecache.set("latest-products", JSON.stringify(latestProducts));
  }

  return res.status(200).json({
    success: true,
    data: {
      latestProducts,
    },
  });
});

////// REVALIDATE ON NEW,UPDATE,DELETE A PRODUCT
export const getlatestCategories = catchAsync(async (req, res, next) => {
  let categories;
  if (nodecache.has("categoriesss")) {
    categories = JSON.parse(nodecache.get("categoriesss"));
  } else {
    categories = await product.distinct("category");
    nodecache.set("categoriesss", JSON.stringify(categories));
  }

  return res.status(200).json({
    success: true,
    data: {
      categories,
    },
  });
});

////// REVALIDATE ON NEW,UPDATE,DELETE A PRODUCT
export const getAdminProduct = catchAsync(async (req, res, next) => {
  let products;
  if (nodecache.has("productsss")) {
    products = JSON.parse(nodecache.get("productsss"));
  } else {
    products = await product.find({});
    nodecache.set("productsss", JSON.stringify(products));
  }

  return res.status(200).json({
    success: true,
    data: {
      products,
    },
  });
});

export const getsingleProduct = catchAsync(async (req, res, next) => {
  const id = req.params.id;
  let singleproduct;
  if (nodecache.has(`single-product-${id}`)) {
    singleproduct = JSON.parse(nodecache.get(`single-product-${id}`));
  } else {
    singleproduct = await product.findById(id);
    if (!singleproduct) {
      return next(new errorHandler("Product not found", 404));
    }
    nodecache.set(`single-product-${id}`, JSON.stringify(singleproduct));
  }

  return res.status(200).json({
    success: true,
    data: {
      singleproduct,
    },
  });
});

export const updateProduct = catchAsync(async (req, res, next) => {
  const { id } = req.params;
  const { name, stock, category, price } = req.body;
  const photo = req.file;
  const products = await product.findById(id);
  if (!products) {
    return next(new errorHandler("Product not found", 404));
  }

  if (photo) {
    rm(products.photo, () => {
      console.log("Old photo deleted successfully!");
    });
    products.photo = photo.path;
  }
  if (name) {
    products.name = name;
  }
  if (category) {
    products.category = category;
  }
  if (stock) {
    products.stock = stock;
  }
  if (price) {
    products.price = price;
  }
  await products.save();
  invalidateCache({
    Product: true,
    productId: String(products._id),
    admin: true,
  });
  return res.status(200).json({
    success: true,
    message: "Product updated Successfully!",
  });
});

export const deleteProduct = catchAsync(async (req, res, next) => {
  const products = await product.findById(req.params.id);
  if (!products) {
    return next(new errorHandler("Product not found!", 404));
  }
  rm(products.photo, () => {
    console.log("Photo deleted!");
  });
  await products.deleteOne();
  invalidateCache({
    Product: true,
    productId: String(products._id),
    admin: true,
  });
  return res.status(200).json({
    success: true,
    message: "Product Deleted Successfully!",
  });
});

export const getAllProducts = catchAsync(async (req, res, next) => {
  const { search, sort, category, price } = req.query;
  const page = Number(req.query.page) || 1;
  const limit = Number(process.env.PRODUCT_PER_PAGE) || 8;
  const skip = (page - 1) * limit;

  const baseQuery = {};
  if (search) {
    baseQuery.name = {
      $regex: search,
      $options: "i",
    };
  }
  if (price) {
    baseQuery.price = {
      $lte: Number(price),
    };
  }
  if (category) {
    baseQuery.category = category;
  }

  const [Products, filteredOnlyProducts] = await Promise.all([
    product
      .find(baseQuery)
      .sort(sort && { price: sort === "asc" ? 1 : -1 })
      .limit(limit)
      .skip(skip),
    product.find(baseQuery),
  ]);

  const totalPages = Math.ceil(filteredOnlyProducts.length / limit);
  return res.status(200).json({
    success: true,
    totalPages: totalPages,
    data: {
      Products,
    },
  });
});
