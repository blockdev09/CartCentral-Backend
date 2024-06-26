import express from "express";
import {
  deleteProduct,
  getAdminProduct,
  getAllProducts,
  getLatestProduct,
  getlatestCategories,
  getsingleProduct,
  newProduct,
  updateProduct,
} from "../controllers/productController.js";
import { singleUpload } from "../middlewares/multer.js";
import { adminOnly } from "../middlewares/authController.js";
const Productrouter = express.Router();

Productrouter.route("/new").post(adminOnly, singleUpload, newProduct);
Productrouter.route("/all").get(getAllProducts);
Productrouter.route("/latest").get(getLatestProduct);
Productrouter.route("/categories").get(getlatestCategories);
Productrouter.route("/admin-products").get(adminOnly, getAdminProduct);
Productrouter.route("/:id")
  .get(getsingleProduct)
  .put(adminOnly, singleUpload, updateProduct)
  .delete(adminOnly, deleteProduct);

export default Productrouter;
