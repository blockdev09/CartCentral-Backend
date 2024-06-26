import express from "express";

import {
  deleteUser,
  getAllUsers,
  getUser,
  newUser,
} from "../controllers/userController.js";
import { adminOnly } from "../middlewares/authController.js";
const router = express.Router();
router.route("/new").post(newUser);
router.route("/all").get(adminOnly, getAllUsers);
router.route("/:id").get(getUser);
router.route("/:id").delete(adminOnly, deleteUser);
export default router;
