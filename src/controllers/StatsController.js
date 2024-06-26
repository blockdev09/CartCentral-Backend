import { calculatePercentage, getChartData, nodecache } from "../index.js";
import Orders from "../models/orderModel.js";
import product from "../models/productModel.js";
import { User } from "../models/userModel.js";
import catchAsync from "../utils/catchAsync.js";

export const getStats = catchAsync(async (req, res, next) => {
  let stats= {};
  if (nodecache.has("admin-stats")) {
    stats = JSON.parse(nodecache.get("admin-stats"));
  } 
  else{
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const startofthisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const startoflastMonth = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      1
    );
    const endoflastMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const thisMonthProductPromise = product.find({
      createdAt: {
        $gte: startofthisMonth,
        $lte: today,
      },
    });

    const lastMonthProductPromise = product.find({
      createdAt: {
        $gte: startoflastMonth,
        $lte: endoflastMonth,
      },
    });
    const thisMonthUsersPromise = User.find({
      createdAt: {
        $gte: startofthisMonth,
        $lte: today,
      },
    });
    const lastMonthUsersPromise = User.find({
      createdAt: {
        $gte: startoflastMonth,
        $lte: endoflastMonth,
      },
    });
    const thisMonthOrdersPromise = Orders.find({
      createdAt: {
        $gte: startofthisMonth,
        $lte: today,
      },
    });
    const lastMonthOrdersPromise = Orders.find({
      createdAt: {
        $gte: startoflastMonth,
        $lte: endoflastMonth,
      },
    });

    const lastSixMonthOrderPromise = Orders.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    });

    const categories = await product.distinct("category");

    const categoriesCountpromise = categories.map((category) =>
      product.countDocuments({ category })
    );
    const categoriesCount = await Promise.all(categoriesCountpromise);
    const categoryCountArray = [];

    const latestTransactionsPromise = Orders.find({})
      .select(["orderItems", "discount", "total", "status"])
      .limit(4);
    // const productCount = await product.countDocuments()
    // const userCount = await User.countDocuments()
    // const allorders = await Orders.find({}).select("total")
    const [
      thisMonthProduct,
      lastMonthProduct,
      thisMonthUsers,
      lastMonthUsers,
      thisMonthOrders,
      lastMonthOrders,
      productCount,
      userCount,
      allorders,
      lastSixMonthOrder,
      femaleCount,
      latestTransactions,
    ] = await Promise.all([
      thisMonthProductPromise,
      lastMonthProductPromise,
      thisMonthUsersPromise,
      lastMonthUsersPromise,
      thisMonthOrdersPromise,
      lastMonthOrdersPromise,
      product.countDocuments(),
      User.countDocuments(),
      Orders.find({}).select("total"),
      lastSixMonthOrderPromise,
      User.countDocuments({ gender: "female" }),
      latestTransactionsPromise,
    ]);

    const orderMonthCounts = new Array(6).fill(0);
    const orderMonthlyRevenue = new Array(6).fill(0);

    lastSixMonthOrder.forEach((order) => {
      const creationDate = order.createdAt;

      const monthDiff = (today.getMonth() - creationDate.getMonth() + 12) % 12;
      if (monthDiff < 6) {
        orderMonthCounts[5 - monthDiff] = orderMonthCounts[5 - monthDiff] + 1;
        orderMonthlyRevenue[5 - monthDiff] =
          orderMonthlyRevenue[5 - monthDiff] + order.total;
      }
    });

    const productpercentage = calculatePercentage(
      thisMonthProduct.length,
      lastMonthProduct.length
    );
    const userpercentage = calculatePercentage(
      thisMonthUsers.length,
      lastMonthUsers.length
    );
    const orderpercentage = calculatePercentage(
      thisMonthOrders.length,
      lastMonthOrders.length
    );

    const thisMonthRevenue = thisMonthOrders.reduce(
      (total, order) => total + order.total,
      0
    );
    const lastMonthRevenue = lastMonthOrders.reduce(
      (total, order) => total + order.total,
      0
    );
    const changedRevenue = calculatePercentage(
      thisMonthRevenue,
      lastMonthRevenue
    );
    const revenue = allorders.reduce((total, order) => total + order.total, 0);
    categories.forEach((category, i) => {
      categoryCountArray.push({
        [category]: Math.round((categoriesCount[i] / productCount) * 100),
      });
    });
    const ratio = {
      male: userCount - femaleCount,
      female: femaleCount,
    };
    let count = {
      revenue,
      product: productCount,
      users: userCount,
      orders: allorders.length,
    };

    const modifiedlatestTransactions = latestTransactions.map((i) => ({
      _id: i._id,
      discount: i.discount,
      amount: i.amount,
      quantity: i.orderItems.length,
      status: i.status,
    }));
    stats = {
      categoryCountArray,
      changedRevenue,
      productpercentage,
      userpercentage,
      orderpercentage,
      count,
      chart: {
        order: orderMonthCounts,
        revenue: orderMonthlyRevenue,
      },
      ratio,
      modifiedlatestTransactions,
    };
   nodecache.set("admin-stats", JSON.stringify(stats));
  }
  return res.status(200).json({
    success: true,
    stats,
  });
});

export const getPieCharts = catchAsync(async (req, res, next) => {
  let pie;
  if (nodecache.has("pie-stats")) {
    pie = JSON.parse(nodecache.get("pie-stats"));
  } else {
    const Processing = await Orders.countDocuments({ status: "Processing" });
    const Shipped = await Orders.countDocuments({ status: "Shipped" });
    const Delivered = await Orders.countDocuments({ status: "Delivered" });

    const orderFullFillmentRatio = {
      Processing: Processing,
      Shipped: Shipped,
      Delivered: Delivered,
    };

    const categories = await product.find({}).distinct("category");
    let category = [];
    let count = [];
    let countArray = [];
    category = categories.map((i) => {
      return i;
    });

    for (let i = 0; i < category.length; i++) {
      count[i] = await product.countDocuments({ category: category[i] });
    }
    category.forEach((category, i) => {
      countArray.push({
        [category]: count[i],
      });
    });

    const productCountPromise = product.countDocuments();
    const OutofStockCountPromise = product.countDocuments({ stock: 0 });
    const [
      productCount,
      OutofStockCount,
      AllOrders,
      AgeGroup,
      adminUsers,
      customerUsers,
    ] = await Promise.all([
      productCountPromise,
      OutofStockCountPromise,
      Orders.find({}).select([
        "subtotal",
        "tax",
        "discount",
        "total",
        "shippingChargges",
      ]),
      User.find({}).select(["dob"]),
      User.countDocuments({ role: "admin" }),
      User.countDocuments({ role: "user" }),
    ]);
    const stockAvailaibility = {
      Instock: productCount - OutofStockCount,
      OutofStock: OutofStockCount,
    };

    const grossIncome = AllOrders.reduce(
      (prev, order) => prev + (order.total || 0),
      0
    );

    const discount = AllOrders.reduce(
      (prev, order) => prev + (order.discount || 0),
      0
    );

    const productionCost = AllOrders.reduce(
      (prev, order) => prev + (order.shippingCharges || 0),
      0
    );

    const burnt = AllOrders.reduce((prev, order) => prev + (order.tax || 0), 0);
    const marketingCost = Math.round(grossIncome * (30 / 100));
    const netMargin =
      grossIncome - discount - productionCost - burnt - marketingCost;
    const revenueDistribution = {
      netMargin,
      discount,
      productionCost,
      burnt,
      marketingCost,
    };
    let dobArray = [];
    dobArray = AgeGroup.map((i) => {
      return i.dob;
    });

    const today = new Date();
    let count1 = 0;
    let count2 = 0;
    let count3 = 0;
    // console.log(dobArray[0].getFullYear());
    // console.log(dobArray[1].getFullYear());
    // console.log(today.getFullYear());
    for (let i = 0; i < dobArray.length; i++) {
      if (today.getFullYear() - dobArray[i].getFullYear() <= 20) {
        count1 = count1 + 1;
      } else if (
        today.getFullYear() - dobArray[i].getFullYear() > 20 &&
        today.getFullYear() - dobArray[i].getFullYear() <= 40
      ) {
        count2++;
      } else if (today.getFullYear() - dobArray[i].getFullYear() > 40) {
        count3++;
      }
    }

    // console.log(count1, count2);

    const adminandUserCustomers = {
      admin: adminUsers,
      customer: customerUsers,
    };
    const usersAgeGroup = {
      teenager: count1,
      Adult: count2,
      Older: count3,
    };

    pie = {
      orderFullFillmentRatio,
      countArray,
      stockAvailaibility,
      revenueDistribution,
      adminandUserCustomers,
      usersAgeGroup,
    };
  }
  return res.status(200).json({
    sucess: true,
    pie,
  });
});

export const getBarCharts = catchAsync(async (req, res, next) => {
  let charts;
  const key = "admin-bar-charts";
  if (nodecache.has(key)) {
    charts = JSON.parse(nodecache.get(key));
  } else {
    const today = new Date();
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const tweleveMonthsAgo = new Date();
    tweleveMonthsAgo.setMonth(tweleveMonthsAgo.getMonth() - 6);

    const SixMonthUserPromise = User.find({
      createdAt: {
        $gte: sixMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");

    const SixMonthProductPromise = product
      .find({
        createdAt: {
          $gte: sixMonthsAgo,
          $lte: today,
        },
      })
      .select("createdAt");
    const twelveMonthOrderPromise = Orders.find({
      createdAt: {
        $gte: tweleveMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");
    const [products, users, orders] = await Promise.all([
      SixMonthProductPromise,
      SixMonthUserPromise,
      twelveMonthOrderPromise,
    ]);
    const orderMonthlyRevenue = new Array(6).fill(0);

    const productCount = getChartData(6, products);
    const UsersCount = getChartData(6, users);
    const OrdersCount = getChartData(12, orders);

    charts = {
      users: UsersCount,
      product: productCount,
      orders: OrdersCount,
    };
    nodecache.set(key, JSON.stringify(charts));
  }
  return res.status(200).json({
    success: true,
    charts,
  });
});

export const getLineCharts = catchAsync(async (req, res, next) => {
  let charts;
  const key = "admin-line-charts";
  if (nodecache.has(key)) {
    charts = JSON.parse(nodecache.get(key));
  } else {
    const today = new Date();

    const tweleveMonthsAgo = new Date();
    tweleveMonthsAgo.setMonth(tweleveMonthsAgo.getMonth() - 6);

    const twelveMonthUsersPromise = product.find({
      createdAt: {
        $gte: tweleveMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");
    const twelveMonthProductPromise = User.find({
      createdAt: {
        $gte: tweleveMonthsAgo,
        $lte: today,
      },
    }).select("createdAt");
    const twelveMonthOrderPromise = Orders.find({
      createdAt: {
        $gte: tweleveMonthsAgo,
        $lte: today,
      },
    }).select(["createdAt","discount","total"]);
    const [products, users, orders] = await Promise.all([
      twelveMonthProductPromise,
      twelveMonthUsersPromise,
      twelveMonthOrderPromise,
    ]);
    const orderMonthlyRevenue = new Array(6).fill(0);

    const productCount = getChartData(12, products);
    const UsersCount = getChartData(12, users);
    const discount = getChartData(12, orders,"discount");
    const revenue = getChartData(12,orders,"total")
    charts = {
      users: UsersCount,
      product: productCount,
      discount,
      revenue
    };
    nodecache.set(key, JSON.stringify(charts));
  }
  return res.status(200).json({
    success: true,
    charts,
  });
});
