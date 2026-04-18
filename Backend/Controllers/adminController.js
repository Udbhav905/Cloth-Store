import User from "../model/User.js";
import Product from "../model/Product.js";
import Order from "../model/Order.js";

/* ─────────────────────────────────────────────
   @desc    Get admin dashboard stats
   @route   GET /api/admin/dashboard
   @access  Private/Admin
───────────────────────────────────────────── */
export const getDashboardStats = async (req, res) => {
  try {
    const now          = new Date();
    const thisMonth    = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonth    = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    /* ── Run all DB queries in parallel for speed ── */
    const [
      totalCustomers,
      customersThisMonth,
      customersLastMonth,

      totalProducts,
      productsThisMonth,
      productsLastMonth,

      totalOrders,
      ordersThisMonth,
      ordersLastMonth,

      revenueThisMonth,
      revenueLastMonth,

      recentOrders,
      orderStatusCounts,
    ] = await Promise.all([

      User.countDocuments({ role: "user" }),
      User.countDocuments({ role: "user", createdAt: { $gte: thisMonth } }),
      User.countDocuments({ role: "user", createdAt: { $gte: lastMonth, $lte: lastMonthEnd } }),

      Product.countDocuments({}),
      Product.countDocuments({ createdAt: { $gte: thisMonth } }),
      Product.countDocuments({ createdAt: { $gte: lastMonth, $lte: lastMonthEnd } }),

      Order.countDocuments({}),
      Order.countDocuments({ createdAt: { $gte: thisMonth } }),
      Order.countDocuments({ createdAt: { $gte: lastMonth, $lte: lastMonthEnd } }),

      Order.aggregate([
        {
          $match: {
            createdAt:   { $gte: thisMonth },
            orderStatus: { $nin: ["cancelled", "returned", "refunded"] },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),

      Order.aggregate([
        {
          $match: {
            createdAt:   { $gte: lastMonth, $lte: lastMonthEnd },
            orderStatus: { $nin: ["cancelled", "returned", "refunded"] },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),

      Order.find({})
        .sort({ createdAt: -1 })
        .limit(5)
        .populate("userId", "name email")
        .lean(),

      Order.aggregate([
        { $group: { _id: "$orderStatus", count: { $sum: 1 } } },
      ]),
    ]);

    const revThis = revenueThisMonth[0]?.total || 0;
    const revLast = revenueLastMonth[0]?.total || 0;

    const pctChange = (current, previous) => {
      if (previous === 0) return current > 0 ? "+100%" : "0%";
      const pct = ((current - previous) / previous) * 100;
      return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
    };

    const statusMap = {};
    orderStatusCounts.forEach(({ _id, count }) => { statusMap[_id] = count; });

    return res.json({
      stats: {
        revenue: {
          value:    Math.round(revThis),
          change:   pctChange(revThis, revLast),
          positive: revThis >= revLast,
        },
        orders: {
          value:    totalOrders,
          change:   pctChange(ordersThisMonth, ordersLastMonth),
          positive: ordersThisMonth >= ordersLastMonth,
        },
        products: {
          value:    totalProducts,
          change:   pctChange(productsThisMonth, productsLastMonth),
          positive: productsThisMonth >= productsLastMonth,
        },
        customers: {
          value:    totalCustomers,
          change:   pctChange(customersThisMonth, customersLastMonth),
          positive: customersThisMonth >= customersLastMonth,
        },
      },
      orderStatusBreakdown: statusMap,
      recentOrders,
    });

  } catch (error) {
    console.error("Dashboard stats error:", error);
    return res.status(500).json({ message: error.message });
  }
};