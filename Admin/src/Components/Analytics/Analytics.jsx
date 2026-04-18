import React, { useState, useEffect, useCallback } from "react";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from "recharts";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import styles from "./Analytics.module.css";

export default function Analytics() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const [orderStats, setOrderStats] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [chartData, setChartData] = useState([]);
  const [timeRange, setTimeRange] = useState("month");

  const fetchOrderStats = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/orders/admin/all?limit=1000", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });

      if (!response.ok) throw new Error("Failed to fetch orders");

      const data = await response.json();

      setOrderStats(data.stats || {});

      if (data.orders && Array.isArray(data.orders)) {
        generateChartData(data.orders);
      }

    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load analytics");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchProductAnalytics = useCallback(async () => {
    try {
      const response = await fetch("/api/products?limit=1000", {
        headers: { "Authorization": `Bearer ${localStorage.getItem("token")}` }
      });

      if (!response.ok) throw new Error("Failed to fetch products");

      const data = await response.json();

      const sorted = (data.products || [])
        .sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0))
        .slice(0, 10);

      setTopProducts(sorted);

    } catch (err) {
      console.error("Product fetch error:", err);
    }
  }, []);


  const generateChartData = (orders) => {
    const dailyData = {};

    orders.forEach((order) => {
      const date = new Date(order.createdAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric"
      });

      if (!dailyData[date]) {
        dailyData[date] = {
          date,
          revenue: 0,
          orders: 0,
          avgOrder: 0
        };
      }

      dailyData[date].revenue += order.totalAmount || 0;
      dailyData[date].orders += 1;
    });

    const chartDataArray = Object.values(dailyData).map(item => ({
      ...item,
      revenue: Math.round(item.revenue),
      avgOrder: Math.round(item.revenue / item.orders)
    }));

    chartDataArray.sort((a, b) => new Date(a.date) - new Date(b.date));

    setChartData(chartDataArray.slice(-30)); // Last 30 days
  };

  useEffect(() => {
    fetchOrderStats();
    fetchProductAnalytics();
  }, [fetchOrderStats, fetchProductAnalytics]);

  const formatCurrency = (amount) => {
    if (!amount && amount !== 0) return "₹0";
return `Rs. ${Math.round(amount).toLocaleString('en-IN')}`;  };

  const formatNumber = (num) => {
    if (!num && num !== 0) return "0";
    return num.toLocaleString('en-IN');
  };

  const formatRating = (rating) => {
    if (!rating || rating === 0) return "No ratings";
    return `${rating.toFixed(1)} ★`;
  };

  const generatePDF = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const formattedDate = new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });

      doc.setFillColor(26, 26, 30);
      doc.rect(0, 0, pageWidth, 50, "F");

      doc.setFont("helvetica", "bold");
      doc.setTextColor(201, 168, 76);
      doc.setFontSize(22);
      doc.text("LUXURIA Analytics Report", 14, 25);

      doc.setFontSize(10);
      doc.setTextColor(255, 255, 255);
      doc.setFont("helvetica", "normal");
      doc.text(`Time Range: ${timeRange.charAt(0).toUpperCase() + timeRange.slice(1)}`, 14, 36);
      doc.text(`Generated on: ${formattedDate}`, pageWidth - 65, 36);

      let yPosition = 65;

      doc.setTextColor(0, 0, 0);
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text("Performance Overview", 14, yPosition);

      yPosition += 10;

      const totalRevenue = orderStats?.revenue || 0;
      const totalOrders = orderStats?.total || 0;
      const avgOrderValue = totalOrders > 0 ? Math.round(totalRevenue / totalOrders) : 0;

      autoTable(doc, {
        startY: yPosition,
        head: [["Metric", "Value"]],
        body: [
          ["Total Revenue", formatCurrency(totalRevenue)],
          ["Total Orders", formatNumber(totalOrders)],
          ["Delivered Orders", formatNumber(orderStats?.delivered || 0)],
          ["Pending Orders", formatNumber(orderStats?.pending || 0)],
          ["Processing Orders", formatNumber(orderStats?.processing || 0)],
          ["Cancelled Orders", formatNumber(orderStats?.cancelled || 0)],
          ["Average Order Value", formatCurrency(avgOrderValue)]
        ],
        theme: "grid",
        headStyles: {
          fillColor: [201, 168, 76],
          textColor: [255, 255, 255],
          fontStyle: "bold",
          halign: "center"
        },
        bodyStyles: {
          textColor: [0, 0, 0],
          halign: "center"
        },
        columnStyles: {
          0: { cellWidth: 80, fontStyle: "bold" },
          1: { cellWidth: 80 }
        },
        margin: { left: 14, right: 14 }
      });

      yPosition = doc.lastAutoTable.finalY + 15;

      if (yPosition > pageHeight - 80) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(14);
      doc.setFont("helvetica", "bold");
      doc.text("Order Status Breakdown", 14, yPosition);
      yPosition += 10;

      const statusData = [
        ["Pending", formatNumber(orderStats?.pending || 0)],
        ["Confirmed", formatNumber(orderStats?.confirmed || 0)],
        ["Processing", formatNumber(orderStats?.processing || 0)],
        ["Shipped", formatNumber(orderStats?.shipped || 0)],
        ["Out for Delivery", formatNumber(orderStats?.out_for_delivery || 0)],
        ["Delivered", formatNumber(orderStats?.delivered || 0)],
        ["Returned", formatNumber(orderStats?.returned || 0)],
        ["Cancelled", formatNumber(orderStats?.cancelled || 0)]
      ];

      autoTable(doc, {
        startY: yPosition,
        head: [["Status", "Count"]],
        body: statusData,
        theme: "striped",
        headStyles: {
          fillColor: [26, 26, 30],
          textColor: [255, 255, 255],
          halign: "center"
        },
        bodyStyles: {
          halign: "center"
        },
        columnStyles: {
          0: { cellWidth: 80 },
          1: { cellWidth: 40 }
        },
        margin: { left: 14, right: 14 }
      });

      yPosition = doc.lastAutoTable.finalY + 15;

      if (topProducts.length > 0) {
        if (yPosition > pageHeight - 100) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Top 5 Best-Selling Products", 14, yPosition);
        yPosition += 10;

        const productsData = topProducts.slice(0, 5).map(p => [
          p.name || "N/A",
          formatCurrency(p.basePrice || 0),
          formatNumber(p.totalStock || 0),
          formatRating(p.averageRating || 0)
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [["Product Name", "Price", "Stock", "Rating"]],
          body: productsData,
          theme: "striped",
          headStyles: {
            fillColor: [26, 26, 30],
            textColor: [255, 255, 255],
            halign: "center"
          },
          bodyStyles: {
            halign: "center"
          },
          columnStyles: {
            0: { cellWidth: 90 },
            1: { cellWidth: 35 },
            2: { cellWidth: 25 },
            3: { cellWidth: 35 }
          },
          margin: { left: 14, right: 14 }
        });

        yPosition = doc.lastAutoTable.finalY + 15;
      }

      if (chartData.length > 0) {
        if (yPosition > pageHeight - 100) {
          doc.addPage();
          yPosition = 20;
        }

        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text("Revenue Trend (Last 7 Days)", 14, yPosition);
        yPosition += 10;

        const recentData = chartData.slice(-7);
        const revenueData = recentData.map(item => [
          item.date,
          formatCurrency(item.revenue),
          formatNumber(item.orders),
          formatCurrency(item.avgOrder)
        ]);

        autoTable(doc, {
          startY: yPosition,
          head: [["Date", "Revenue", "Orders", "Avg Order Value"]],
          body: revenueData,
          theme: "striped",
          headStyles: {
            fillColor: [201, 168, 76],
            textColor: [255, 255, 255],
            halign: "center"
          },
          bodyStyles: {
            halign: "center"
          },
          columnStyles: {
            0: { cellWidth: 40 },
            1: { cellWidth: 45 },
            2: { cellWidth: 30 },
            3: { cellWidth: 45 }
          },
          margin: { left: 14, right: 14 }
        });
      }

      const pageCount = doc.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(9);
        doc.setTextColor(100, 100, 100);
        doc.text(
          `Generated by LUXURIA Analytics Dashboard | Page ${i} of ${pageCount}`,
          pageWidth / 2,
          pageHeight - 10,
          { align: "center" }
        );
      }

      doc.save(`LUXURIA_Analytics_Report_${timeRange}_${Date.now()}.pdf`);
      
      console.log("PDF generated successfully");

    } catch (err) {
      console.error("PDF generation error:", err);
      alert("Failed to generate PDF: " + err.message);
    }
  };

  const KPICard = ({ label, value, change, icon, color }) => (
    <div className={`${styles.kpiCard} ${styles[color]}`}>
      <div className={styles.kpiIcon}>{icon}</div>
      <div className={styles.kpiContent}>
        <p className={styles.kpiLabel}>{label}</p>
        <h3 className={styles.kpiValue}>{value}</h3>
        {change !== undefined && (
          <span className={`${styles.kpiChange} ${change > 0 ? styles.positive : styles.negative}`}>
            {change > 0 ? "↑" : "↓"} {Math.abs(change)}%
          </span>
        )}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className={styles.analytics}>
        <div className={styles.loadingContainer}>
          <div className={styles.spinner}></div>
          <p>Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.analytics}>
        <div className={styles.errorContainer}>
          <p>⚠️ Error: {error}</p>
          <button
            onClick={() => {
              setLoading(true);
              fetchOrderStats();
              fetchProductAnalytics();
            }}
            className={styles.retryBtn}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.analytics}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerContent}>
          <h1 className={styles.titleGradient}>Dashboard Analytics</h1>
          <p>Real-time business metrics & insights</p>
        </div>
        <div className={styles.headerControls}>
          <button onClick={generatePDF} className={styles.reportBtn}>
            <span className={styles.reportIcon}>📥</span> Download PDF
          </button>
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className={styles.select}
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>

      {/* Tabs */}
      <div className={styles.tabs}>
        {["overview", "revenue", "products", "orders"].map((tab) => (
          <button
            key={tab}
            className={`${styles.tab} ${activeTab === tab ? styles.active : ""}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Overview Tab */}
      {activeTab === "overview" && (
        <div className={styles.content}>
          {/* KPI Cards */}
          <div className={styles.kpiGrid}>
            <KPICard
              label="Total Revenue"
              value={formatCurrency(orderStats?.revenue || 0)}
              change={12}
              icon="💰"
              color="gold"
            />
            <KPICard
              label="Total Orders"
              value={formatNumber(orderStats?.total || 0)}
              change={8}
              icon="📦"
              color="blue"
            />
            <KPICard
              label="Completed"
              value={formatNumber(orderStats?.delivered || 0)}
              change={15}
              icon="✓"
              color="green"
            />
            <KPICard
              label="Pending"
              value={formatNumber(orderStats?.pending || 0)}
              change={-3}
              icon="⏳"
              color="orange"
            />
          </div>

          {/* Charts Row */}
          <div className={styles.chartsRow}>
            {/* Revenue Trend */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>Revenue Trend</h3>
                <span className={styles.badge}>Last 30 Days</span>
              </div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData} margin={{ top: 5, right: 30, left: 0, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#c9a84c" stopOpacity={0.8} />
                        <stop offset="95%" stopColor="#c9a84c" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{
                        background: "#1a1a1e",
                        border: "1px solid rgba(201,168,76,0.3)",
                        borderRadius: "8px",
                        color: "#fff"
                      }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="#c9a84c"
                      strokeWidth={3}
                      dot={{ fill: "#c9a84c", r: 4 }}
                      activeDot={{ r: 6 }}
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.noData}>No data available</div>
              )}
            </div>

            {/* Order Status Distribution */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>Order Status Distribution</h3>
              </div>
              {orderStats?.total > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Delivered", value: orderStats?.delivered || 0, fill: "#4ade80" },
                        { name: "Pending", value: orderStats?.pending || 0, fill: "#f59e0b" },
                        { name: "Processing", value: orderStats?.processing || 0, fill: "#3b82f6" },
                        { name: "Cancelled", value: orderStats?.cancelled || 0, fill: "#ef4444" }
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {[0, 1, 2, 3].map((index) => (
                        <Cell key={`cell-${index}`} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "#1a1a1e",
                        border: "1px solid rgba(201,168,76,0.3)",
                        borderRadius: "8px",
                        color: "#fff"
                      }}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.noData}>No data available</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Revenue Tab */}
      {activeTab === "revenue" && (
        <div className={styles.content}>
          <div className={styles.revenueCharts}>
            {/* Revenue Chart */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>Revenue Analysis</h3>
              </div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{
                        background: "#1a1a1e",
                        border: "1px solid rgba(201,168,76,0.3)",
                        borderRadius: "8px",
                        color: "#fff"
                      }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Legend />
                    <Bar dataKey="revenue" fill="#c9a84c" name="Revenue" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.noData}>No data available</div>
              )}
            </div>

            {/* Orders Count Chart */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>Orders Count</h3>
              </div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{
                        background: "#1a1a1e",
                        border: "1px solid rgba(201,168,76,0.3)",
                        borderRadius: "8px",
                        color: "#fff"
                      }}
                    />
                    <Legend />
                    <Bar dataKey="orders" fill="#3b82f6" name="Orders" radius={[8, 8, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.noData}>No data available</div>
              )}
            </div>

            {/* Average Order Value Chart */}
            <div className={styles.chartCard}>
              <div className={styles.chartHeader}>
                <h3>Average Order Value</h3>
              </div>
              {chartData.length > 0 ? (
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={chartData} margin={{ top: 20, right: 30, left: 0, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(201,168,76,0.1)" />
                    <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" />
                    <YAxis stroke="rgba(255,255,255,0.5)" />
                    <Tooltip
                      contentStyle={{
                        background: "#1a1a1e",
                        border: "1px solid rgba(201,168,76,0.3)",
                        borderRadius: "8px",
                        color: "#fff"
                      }}
                      formatter={(value) => formatCurrency(value)}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="avgOrder"
                      stroke="#8b5cf6"
                      strokeWidth={3}
                      dot={{ fill: "#8b5cf6", r: 4 }}
                      name="Avg Order Value"
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className={styles.noData}>No data available</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Products Tab */}
      {activeTab === "products" && (
        <div className={styles.content}>
          {topProducts.length > 0 ? (
            <div className={styles.productsGrid}>
              {topProducts.map((product, idx) => (
                <div key={product._id} className={`${styles.productCard} ${styles[`delay${idx % 3}`]}`}>
                  <div className={styles.productImageWrapper}>
                    <img
                      src={product.mainImage || "/placeholder.jpg"}
                      alt={product.name}
                      className={styles.productImage}
                    />
                    <span className={styles.rankBadge}>#{idx + 1}</span>
                  </div>
                  <div className={styles.productInfo}>
                    <h4>{product.name || "N/A"}</h4>
                    <p className={styles.productPrice}>{formatCurrency(product.basePrice || 0)}</p>
                    <div className={styles.productStats}>
                      <span>{formatRating(product.averageRating || 0)}</span>
                      <span>👁 {product.totalReviews || 0} reviews</span>
                    </div>
                    <div className={styles.stockBar}>
                      <div
                        className={styles.stockFill}
                        style={{ width: `${Math.min((product.totalStock / 100) * 100, 100)}%` }}
                      ></div>
                    </div>
                    <p className={styles.stockText}>{formatNumber(product.totalStock || 0)} in stock</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noData}>No products available</div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeTab === "orders" && (
        <div className={styles.content}>
          <div className={styles.statsGrid}>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Total Orders</span>
              <span className={styles.statValue}>{formatNumber(orderStats?.total || 0)}</span>
              <span className={styles.statDetail}>All time</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Delivered</span>
              <span className={styles.statValue} style={{ color: "#4ade80" }}>
                {formatNumber(orderStats?.delivered || 0)}
              </span>
              <span className={styles.statDetail}>
                {orderStats?.total ? Math.round((orderStats.delivered / orderStats.total) * 100) : 0}% of total
              </span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Processing</span>
              <span className={styles.statValue} style={{ color: "#3b82f6" }}>
                {formatNumber(orderStats?.processing || 0)}
              </span>
              <span className={styles.statDetail}>In progress</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Pending</span>
              <span className={styles.statValue} style={{ color: "#f59e0b" }}>
                {formatNumber(orderStats?.pending || 0)}
              </span>
              <span className={styles.statDetail}>Awaiting action</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Cancelled</span>
              <span className={styles.statValue} style={{ color: "#ef4444" }}>
                {formatNumber(orderStats?.cancelled || 0)}
              </span>
              <span className={styles.statDetail}>Refunded</span>
            </div>
            <div className={styles.statBox}>
              <span className={styles.statLabel}>Avg Order Value</span>
              <span className={styles.statValue} style={{ color: "#c9a84c" }}>
                {formatCurrency(Math.round((orderStats?.revenue || 0) / (orderStats?.total || 1)))}
              </span>
              <span className={styles.statDetail}>Per transaction</span>
            </div>
          </div>

          {/* Order Status Timeline */}
          <div className={styles.chartCard}>
            <div className={styles.chartHeader}>
              <h3>Order Status Breakdown</h3>
            </div>
            <div className={styles.statusTimeline}>
              {[
                { label: "Pending", value: orderStats?.pending || 0, color: "#f59e0b" },
                { label: "Confirmed", value: orderStats?.confirmed || 0, color: "#06b6d4" },
                { label: "Processing", value: orderStats?.processing || 0, color: "#3b82f6" },
                { label: "Shipped", value: orderStats?.shipped || 0, color: "#8b5cf6" },
                { label: "Out for Delivery", value: orderStats?.out_for_delivery || 0, color: "#ec4899" },
                { label: "Delivered", value: orderStats?.delivered || 0, color: "#4ade80" },
                { label: "Returned", value: orderStats?.returned || 0, color: "#6366f1" },
                { label: "Cancelled", value: orderStats?.cancelled || 0, color: "#ef4444" }
              ].map((status, idx) => {
                const maxValue = Math.max(
                  orderStats?.pending || 1,
                  orderStats?.confirmed || 1,
                  orderStats?.processing || 1,
                  orderStats?.shipped || 1,
                  orderStats?.delivered || 1,
                  1
                );
                const percentage = (status.value / maxValue) * 100;
                
                return (
                  <div key={status.label} className={styles.statusItem}>
                    <div className={styles.statusHeader}>
                      <span className={styles.statusLabel}>{status.label}</span>
                      <span className={styles.statusCount}>{formatNumber(status.value)}</span>
                    </div>
                    <div className={styles.statusBar}>
                      <div
                        className={styles.statusBarFill}
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: status.color,
                          animationDelay: `${idx * 0.1}s`
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}