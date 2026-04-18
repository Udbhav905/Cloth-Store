
const BASE_URL = process.env.REACT_APP_API_URL || "http://localhost:3000/api";


const getAuthToken = () => {
  return localStorage.getItem("token") || localStorage.getItem("authToken");
};


const getFetchConfig = () => ({
  headers: {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${getAuthToken()}`,
  },
});


export const fetchOrdersData = async (page = 1, limit = 1000) => {
  try {
    const response = await fetch(
      `${BASE_URL}/orders/admin/all?page=${page}&limit=${limit}`,
      getFetchConfig()
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching orders:", error);
    throw error;
  }
};


export const fetchProductsData = async (limit = 1000) => {
  try {
    const response = await fetch(
      `${BASE_URL}/products?limit=${limit}`,
      getFetchConfig()
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Error fetching products:", error);
    throw error;
  }
};


export const fetchFeaturedProducts = async () => {
  try {
    const response = await fetch(
      `${BASE_URL}/products/featured`,
      getFetchConfig()
    );

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching featured products:", error);
    throw error;
  }
};


export const calculateOrderMetrics = (orders) => {
  if (!Array.isArray(orders) || orders.length === 0) {
    return {
      totalRevenue: 0,
      totalOrders: 0,
      averageOrderValue: 0,
      conversionRate: 0,
      returnRate: 0,
    };
  }

  const totalRevenue = orders.reduce((sum, order) => sum + (order.totalAmount || 0), 0);
  const totalOrders = orders.length;
  const averageOrderValue = totalRevenue / totalOrders;

  const completedOrders = orders.filter(o => o.orderStatus === "delivered").length;
  const returnedOrders = orders.filter(o => o.orderStatus === "returned").length;
  const conversionRate = (completedOrders / totalOrders) * 100;
  const returnRate = (returnedOrders / totalOrders) * 100;

  return {
    totalRevenue: Math.round(totalRevenue),
    totalOrders,
    averageOrderValue: Math.round(averageOrderValue),
    conversionRate: conversionRate.toFixed(1),
    returnRate: returnRate.toFixed(1),
  };
};


export const getTopProductsBySales = (products, limit = 10) => {
  if (!Array.isArray(products)) return [];

  return products
    .sort((a, b) => (b.totalSold || b.totalReviews || 0) - (a.totalSold || a.totalReviews || 0))
    .slice(0, limit);
};


export const getLowStockProducts = (products, threshold = 10) => {
  if (!Array.isArray(products)) return [];

  return products
    .filter(p => (p.totalStock || 0) <= threshold)
    .sort((a, b) => (a.totalStock || 0) - (b.totalStock || 0));
};


export const getDailyRevenueData = (orders) => {
  if (!Array.isArray(orders)) return [];

  const dailyData = {};

  orders.forEach((order) => {
    const date = new Date(order.createdAt).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });

    dailyData[date] = (dailyData[date] || 0) + (order.totalAmount || 0);
  });

  return Object.entries(dailyData)
    .map(([date, revenue]) => ({
      date,
      revenue: Math.round(revenue),
    }))
    .sort((a, b) => new Date(a.date) - new Date(b.date));
};


export const getStatusDistribution = (orders) => {
  if (!Array.isArray(orders)) return {};

  const distribution = {};

  orders.forEach((order) => {
    const status = order.orderStatus || "unknown";
    distribution[status] = (distribution[status] || 0) + 1;
  });

  return distribution;
};


export const getPaymentMethodBreakdown = (orders) => {
  if (!Array.isArray(orders)) return {};

  const breakdown = {};

  orders.forEach((order) => {
    const method = order.paymentMethod || "unknown";
    breakdown[method] = (breakdown[method] || 0) + 1;
  });

  return breakdown;
};


export const getTopCategories = (products) => {
  if (!Array.isArray(products)) return [];

  const categories = {};

  products.forEach((product) => {
    const categoryName = product.category?.name || "Uncategorized";
    const revenue = (product.basePrice || 0) * (product.totalSold || 0);

    categories[categoryName] = (categories[categoryName] || 0) + revenue;
  });

  return Object.entries(categories)
    .map(([name, revenue]) => ({ name, revenue: Math.round(revenue) }))
    .sort((a, b) => b.revenue - a.revenue);
};

export const getCustomerInsights = (orders) => {
  if (!Array.isArray(orders) || orders.length === 0) {
    return {
      uniqueCustomers: 0,
      repeatCustomerRate: 0,
      averageOrdersPerCustomer: 0,
    };
  }

  const customerOrderCounts = {};

  orders.forEach((order) => {
    const customerId = order.userId?._id || order.userId;
    customerOrderCounts[customerId] = (customerOrderCounts[customerId] || 0) + 1;
  });

  const uniqueCustomers = Object.keys(customerOrderCounts).length;
  const repeatCustomers = Object.values(customerOrderCounts).filter(count => count > 1).length;
  const repeatCustomerRate = (repeatCustomers / uniqueCustomers) * 100;
  const averageOrdersPerCustomer = orders.length / uniqueCustomers;

  return {
    uniqueCustomers,
    repeatCustomerRate: repeatCustomerRate.toFixed(1),
    averageOrdersPerCustomer: averageOrdersPerCustomer.toFixed(1),
  };
};

/**
 * Get monthly trend data
 */
export const getMonthlyTrendData = (orders) => {
  if (!Array.isArray(orders)) return [];

  const monthlyData = {};

  orders.forEach((order) => {
    const date = new Date(order.createdAt);
    const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

    monthlyData[monthKey] = (monthlyData[monthKey] || 0) + (order.totalAmount || 0);
  });

  return Object.entries(monthlyData)
    .map(([month, revenue]) => ({
      month,
      revenue: Math.round(revenue),
    }))
    .sort((a, b) => new Date(a.month) - new Date(b.month));
};

/**
 * Get products with low reviews
 */
export const getProductsNeedingReviews = (products, minReviews = 5) => {
  if (!Array.isArray(products)) return [];

  return products
    .filter(p => (p.totalReviews || 0) < minReviews)
    .sort((a, b) => (a.totalReviews || 0) - (b.totalReviews || 0));
};

/**
 * Get rating distribution
 */
export const getRatingDistribution = (products) => {
  if (!Array.isArray(products)) return {};

  const distribution = {
    "5": 0,
    "4": 0,
    "3": 0,
    "2": 0,
    "1": 0,
  };

  products.forEach((product) => {
    const rating = Math.floor(product.averageRating || 0);
    if (rating >= 1 && rating <= 5) {
      distribution[String(rating)]++;
    }
  });

  return distribution;
};

/**
 * Format currency
 */
export const formatCurrency = (value) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
  }).format(value);
};

/**
 * Format percentage
 */
export const formatPercentage = (value) => {
  return `${parseFloat(value).toFixed(1)}%`;
};

/**
 * Get date range label
 */
export const getDateRangeLabel = (timeRange) => {
  const now = new Date();
  let startDate;

  switch (timeRange) {
    case "week":
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case "month":
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case "year":
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 1));
  }

  return `${startDate.toLocaleDateString()} - ${new Date().toLocaleDateString()}`;
};

/**
 * Filter orders by date range
 */
export const filterOrdersByDateRange = (orders, timeRange) => {
  if (!Array.isArray(orders)) return [];

  const now = new Date();
  let startDate;

  switch (timeRange) {
    case "week":
      startDate = new Date(now.setDate(now.getDate() - 7));
      break;
    case "month":
      startDate = new Date(now.setMonth(now.getMonth() - 1));
      break;
    case "year":
      startDate = new Date(now.setFullYear(now.getFullYear() - 1));
      break;
    default:
      startDate = new Date(now.setMonth(now.getMonth() - 1));
  }

  return orders.filter(order => new Date(order.createdAt) >= startDate);
};

/**
 * Export analytics data to CSV
 */
export const exportToCSV = (data, filename = "analytics.csv") => {
  const csv = convertArrayOfObjectsToCSV(data);
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");

  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

/**
 * Convert array of objects to CSV
 */
const convertArrayOfObjectsToCSV = (array) => {
  let csv = "data:text/csv;charset=utf-8,";

  const headers = Object.keys(array[0] || {});
  csv += headers.join(",") + "\n";

  array.forEach((row) => {
    const values = headers.map((header) =>
      typeof row[header] === "string" && row[header].includes(",")
        ? `"${row[header]}"`
        : row[header]
    );
    csv += values.join(",") + "\n";
  });

  return encodeURI(csv);
};

/**
 * Get growth rate (percentage change)
 */
export const getGrowthRate = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return (((current - previous) / previous) * 100).toFixed(1);
};