import express from "express";
import { adminOnly } from "../middlewares/authController.js";
import {
  getBarCharts,
  getLineCharts,
  getPieCharts,
  getStats,
} from "../controllers/StatsController.js";
const statRoute = express.Router();

statRoute.route("/stats").get(adminOnly, getStats);
statRoute.route("/pieChart").get(adminOnly, getPieCharts);
statRoute.route("/barChart").get(adminOnly, getBarCharts);
statRoute.route("/lineChart").get(adminOnly, getLineCharts);
export default statRoute;
