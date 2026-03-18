import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrdersByCustomer } from "../Redux/Slice/orderSlice";
import { DatePicker, Table, Spin, Tooltip, Button, Input, Select, Drawer } from "antd";
import {
  Eye, ShoppingCart, Calendar, Clock, Search, Filter,
  Package, TrendingUp, CheckCircle, AlertCircle, XCircle,
  FileText, UserX,
} from "lucide-react";
import moment from "moment";
import OrderModal from "../Component/OrderModal";
import AuthModal from "../Component/AuthModal";

const OrderHistoryPage = () => {
  const dispatch = useDispatch();
  const ordersData = useSelector((state) => state.orders || { orders: [], loading: false, error: null });
  const orders = ordersData.orders || [];
  const loading = ordersData.loading || false;
  const error = ordersData.error || null;

  const today = moment();
  const defaultFromDate = moment("01/01/2000", "MM/DD/YYYY");
  const defaultToDate = today.clone().add(1, "days");

  const [dateRange, setDateRange] = useState([defaultFromDate, defaultToDate]);
  const [isOrderModalVisible, setIsOrderModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isAuthModalVisible, setIsAuthModalVisible] = useState(false);
  const [filtersDrawerOpen, setFiltersDrawerOpen] = useState(false);

  const customerObject = localStorage.getItem("customer") || "null";
  const customerId = customerObject?.customerAccountNumber;
  const hasValidCustomer = customerObject && customerId;

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (hasValidCustomer) {
      const [from, to] = dateRange.map((date) => date.format("MM/DD/YYYY"));
      dispatch(fetchOrdersByCustomer({ from, to, customerId }));
    }
  }, [dateRange, customerId, dispatch, hasValidCustomer]);

  const handleDateChange = (dates) => { if (dates) setDateRange(dates); };
  const handleViewOrder = (orderId) => { setSelectedOrderId(orderId); setIsOrderModalVisible(true); };
  const handleOrderModalClose = () => { setIsOrderModalVisible(false); setSelectedOrderId(null); };
  const handleAuthModalClose = () => setIsAuthModalVisible(false);
  const handleSignInClick = () => setIsAuthModalVisible(true);

  const handleRefresh = () => {
    if (hasValidCustomer) {
      const [from, to] = dateRange.map((date) => date.format("MM/DD/YYYY"));
      dispatch(fetchOrdersByCustomer({ from, to, customerId }));
    }
  };

  const transformedOrders = (orders || [])
    .map((order, index) => ({
      key: index,
      orderId: order?.orderCode || "N/A",
      orderDate: moment(order?.orderDate).format("MM/DD/YYYY") || "N/A",
      customerName: order?.fullName || "N/A",
      orderCycle: order?.orderCycle || "N/A",
      orderDateMoment: moment(order?.orderDate),
    }))
    .filter((order) => {
      const matchesSearch = order.orderId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || order.orderCycle === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => b.orderDateMoment.valueOf() - a.orderDateMoment.valueOf());

  const handleExportPDF = () => {
    if (transformedOrders.length === 0) return;
    const printWindow = window.open("", "_blank");
    const htmlContent = `<!DOCTYPE html><html><head><title>Order History</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@400;600;700&display=swap');
        body{font-family:'Source Sans 3',sans-serif;margin:24px;color:#1a1a1a}
        .header{text-align:center;margin-bottom:32px;padding-bottom:16px;border-bottom:2px solid #e0e0e0}
        .header h1{font-size:24px;font-weight:800;margin:0 0 4px}
        .header p{font-size:13px;color:#888;margin:0}
        .date-range{text-align:center;margin-bottom:24px;font-size:13px;color:#555}
        table{width:100%;border-collapse:collapse}
        th{background:#14532d;color:#fff;text-align:left;padding:10px 14px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:.03em}
        td{padding:10px 14px;border-bottom:1px solid #e0e0e0;font-size:13px}
        tr:last-child td{border-bottom:none}
        .footer{text-align:center;margin-top:32px;font-size:11px;color:#888}
      </style></head><body>
      <div class="header"><h1>Order History Report</h1><p>Customer: ${customerObject?.fullName || "N/A"}</p></div>
      <div class="date-range"><strong>Period:</strong> ${dateRange[0].format("MM/DD/YYYY")} – ${dateRange[1].format("MM/DD/YYYY")}</div>
      <table><thead><tr><th>Order ID</th><th>Date</th><th>Status</th><th>Customer</th></tr></thead>
      <tbody>${transformedOrders.map((o) => `<tr><td>#${o.orderId}</td><td>${o.orderDate}</td><td>${o.orderCycle}</td><td>${o.customerName}</td></tr>`).join("")}</tbody></table>
      <div class="footer"><p>Generated: ${moment().format("MM/DD/YYYY HH:mm")}</p><p>Total: ${transformedOrders.length} orders</p></div>
      </body></html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => { printWindow.print(); printWindow.close(); };
  };

  const getStatusConfig = (status) => {
    const map = {
      Pending: { bg: "#fffbeb", color: "#92400e", border: "#fde68a", icon: Clock },
      Processing: { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe", icon: TrendingUp },
      "Order Placement": { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe", icon: FileText },
      "Wrong Number": { bg: "#faf5ff", color: "#6b21a8", border: "#e9d5ff", icon: XCircle },
      Delivery: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0", icon: CheckCircle },
      Completed: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0", icon: CheckCircle },
      Cancelled: { bg: "#fef2f2", color: "#991b1b", border: "#fecaca", icon: XCircle },
      Unreachable: { bg: "#f9fafb", color: "#374151", border: "#e5e7eb", icon: AlertCircle },
      "Not Answered": { bg: "#fff7ed", color: "#9a3412", border: "#fed7aa", icon: AlertCircle },
      "Multiple order": { bg: "#eef2ff", color: "#3730a3", border: "#c7d2fe", icon: UserX },
    };
    return map[status] || { bg: "#f9fafb", color: "#374151", border: "#e5e7eb", icon: AlertCircle };
  };

  const getOrderStats = () => {
    const total = orders.length;
    const completed = orders.filter((o) => ["Delivery", "Completed"].includes(o.orderCycle)).length;
    const inProgress = orders.filter((o) => ["Processing", "Pending", "Wrong Number"].includes(o.orderCycle)).length;
    const cancelled = orders.filter((o) => o.orderCycle === "Cancelled").length;
    return { total, completed, inProgress, cancelled };
  };

  const stats = getOrderStats();

  const statusOptions = [
    "all", "Pending", "Processing", "Order Placement", "Wrong Number",
    "Delivery", "Completed", "Cancelled", "Unreachable", "Not Answered", "Multiple order",
  ];

  const columns = [
    {
      title: "Order ID",
      dataIndex: "orderId",
      key: "orderId",
      render: (text) => (
        <span className="oh-order-id">#{text}</span>
      ),
    },
    {
      title: "Date",
      dataIndex: "orderDate",
      key: "orderDate",
      render: (text) => <span className="oh-date">{text}</span>,
      sorter: (a, b) => moment(a.orderDate).unix() - moment(b.orderDate).unix(),
    },
    {
      title: "Status",
      dataIndex: "orderCycle",
      key: "orderCycle",
      render: (status) => {
        const cfg = getStatusConfig(status);
        const Icon = cfg.icon;
        return (
          <span
            className="oh-status-badge"
            style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
          >
            <Icon style={{ width: 13, height: 13 }} />
            {status}
          </span>
        );
      },
      filters: statusOptions.filter((s) => s !== "all").map((s) => ({ text: s, value: s })),
      onFilter: (value, record) => record.orderCycle === value,
    },
    {
      title: "",
      key: "action",
      width: 80,
      render: (_, record) => (
        <Tooltip title="View Details">
          <button className="oh-view-btn" onClick={() => handleViewOrder(record.orderId)}>
            <Eye style={{ width: 15, height: 15 }} />
            <span className="oh-view-label">View</span>
          </button>
        </Tooltip>
      ),
    },
  ];

  // ==================== SUB COMPONENTS ====================

  const StatCard = ({ value, label, icon: Icon, colorVar }) => (
    <div className="oh-stat-card" style={{ "--stat-color": colorVar }}>
      <div className="oh-stat-left">
        <div className="oh-stat-value">{value}</div>
        <div className="oh-stat-label">{label}</div>
      </div>
      <div className="oh-stat-icon-wrap">
        <Icon style={{ width: 20, height: 20 }} />
      </div>
    </div>
  );

  const MobileOrderCard = ({ order }) => {
    const cfg = getStatusConfig(order.orderCycle);
    const Icon = cfg.icon;
    return (
      <div className="oh-mobile-card" onClick={() => handleViewOrder(order.orderId)}>
        <div className="oh-mobile-card-top">
          <div>
            <div className="oh-mobile-card-id">#{order.orderId}</div>
            <div className="oh-mobile-card-date">{order.orderDate}</div>
          </div>
          <span
            className="oh-status-badge"
            style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}
          >
            <Icon style={{ width: 12, height: 12 }} />
            {order.orderCycle}
          </span>
        </div>
        <div className="oh-mobile-card-bottom">
          <span className="oh-mobile-view-link">
            <Eye style={{ width: 14, height: 14 }} />
            View Details
          </span>
        </div>
      </div>
    );
  };

  const FiltersDrawerContent = () => (
    <Drawer
      title={
        <div style={{ display: "flex", alignItems: "center", gap: 8, fontFamily: "var(--oh-font)", fontWeight: 800 }}>
          <Filter style={{ width: 18, height: 18, color: "var(--oh-green)" }} />
          Filters
        </div>
      }
      placement="bottom"
      height="auto"
      open={filtersDrawerOpen}
      onClose={() => setFiltersDrawerOpen(false)}
    >
      <div className="oh-drawer-body">
        <div className="oh-drawer-field">
          <label className="oh-drawer-label">Date Range</label>
          <DatePicker.RangePicker value={dateRange} onChange={handleDateChange} format="MM/DD/YYYY" className="oh-drawer-input" size="large" />
        </div>
        <div className="oh-drawer-field">
          <label className="oh-drawer-label">Search Order ID</label>
          <Input placeholder="Enter Order ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} size="large" prefix={<Search style={{ width: 16, height: 16, color: "#888" }} />} />
        </div>
        <div className="oh-drawer-field">
          <label className="oh-drawer-label">Status</label>
          <Select value={statusFilter} onChange={setStatusFilter} className="oh-drawer-input" size="large" style={{ width: "100%" }}>
            {statusOptions.map((s) => (
              <Select.Option key={s} value={s}>{s === "all" ? "All Status" : s}</Select.Option>
            ))}
          </Select>
        </div>
        <div className="oh-drawer-field">
          <Button className="oh-drawer-input" size="large" icon={<FileText style={{ width: 16, height: 16 }} />} disabled={transformedOrders.length === 0} onClick={handleExportPDF} block>
            Export PDF
          </Button>
        </div>
      </div>
    </Drawer>
  );

  const NoCustomerState = () => (
    <div className="oh-empty-state">
      <div className="oh-empty-icon-wrap">
        <UserX style={{ width: 36, height: 36, color: "var(--oh-light)" }} />
      </div>
      <div className="oh-empty-title">Sign In Required</div>
      <div className="oh-empty-desc">Please log in to view your order history and track your purchases.</div>
      <button className="oh-empty-btn oh-empty-btn-primary" onClick={handleSignInClick}>
        Sign In
      </button>
    </div>
  );

  const EmptyState = () => (
    <div className="oh-empty-state">
      <div className="oh-empty-icon-wrap">
        <ShoppingCart style={{ width: 36, height: 36, color: "var(--oh-light)" }} />
      </div>
      <div className="oh-empty-title">
        {searchTerm || statusFilter !== "all" ? "No Matching Orders" : "No Orders Yet"}
      </div>
      <div className="oh-empty-desc">
        {searchTerm || statusFilter !== "all"
          ? "Try adjusting your search or filter criteria."
          : "You haven't placed any orders yet. Start shopping to see your orders here."}
      </div>
      {!searchTerm && statusFilter === "all" && (
        <button className="oh-empty-btn oh-empty-btn-primary" onClick={() => (window.location.href = "/home")}>
          Start Shopping
        </button>
      )}
    </div>
  );

  const LoadingState = () => (
    <div className="oh-empty-state">
      <Spin size="large" />
      <div className="oh-empty-title" style={{ marginTop: 20 }}>Loading Orders</div>
      <div className="oh-empty-desc">Please wait while we fetch your orders...</div>
    </div>
  );

  const ErrorState = () => (
    <div className="oh-empty-state">
      <div className="oh-empty-icon-wrap" style={{ background: "#fef2f2", borderColor: "#fecaca" }}>
        <AlertCircle style={{ width: 36, height: 36, color: "#dc2626" }} />
      </div>
      <div className="oh-empty-title">Unable to Load Orders</div>
      <div className="oh-empty-desc">{error}</div>
      <button className="oh-empty-btn oh-empty-btn-primary" onClick={handleRefresh}>
        Try Again
      </button>
    </div>
  );

  // ==================== RENDER ====================

  if (!hasValidCustomer) {
    return (
      <>
        <style>{styles}</style>
        <div className="oh-root">
          <div className="oh-container">
            <div className="oh-page-header">
              <div className="oh-page-header-accent" />
              <div>
                <h1 className="oh-page-title">Order History</h1>
                <p className="oh-page-count">Track and manage your orders</p>
              </div>
              <div className="oh-page-header-line" />
            </div>
            <div className="oh-main-card">
              <NoCustomerState />
            </div>
          </div>
          <AuthModal open={isAuthModalVisible} onClose={handleAuthModalClose} />
        </div>
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <div className="oh-root">
        <div className="oh-container">
          {/* Page Header */}
          <div className="oh-page-header">
            <div className="oh-page-header-accent" />
            <div>
              <h1 className="oh-page-title">Order History</h1>
              <p className="oh-page-count">
                {loading ? "Loading..." : `${transformedOrders.length} order${transformedOrders.length !== 1 ? "s" : ""} found`}
              </p>
            </div>
            <div className="oh-page-header-line" />
            {/* Mobile filter button */}
            <button className="oh-mobile-filter-btn" onClick={() => setFiltersDrawerOpen(true)}>
              <Filter style={{ width: 16, height: 16 }} />
              Filters
            </button>
          </div>

          {/* Stats */}
          {!loading && !error && orders.length > 0 && (
            <div className="oh-stats-grid">
              <StatCard value={stats.total} label="Total Orders" icon={Package} colorVar="#2563eb" />
              <StatCard value={stats.completed} label="Completed" icon={CheckCircle} colorVar="#16a34a" />
              <StatCard value={stats.inProgress} label="In Progress" icon={Clock} colorVar="#ea580c" />
              <StatCard value={stats.cancelled} label="Cancelled" icon={XCircle} colorVar="#dc2626" />
            </div>
          )}

          {/* Desktop Filters */}
          {orders?.length > 0 && (
            <div className="oh-filters-bar">
              <div className="oh-filter-group">
                <label className="oh-filter-label">Date Range</label>
                <DatePicker.RangePicker value={dateRange} onChange={handleDateChange} format="MM/DD/YYYY" style={{ width: "100%" }} />
              </div>
              <div className="oh-filter-group">
                <label className="oh-filter-label">Search</label>
                <Input placeholder="Order ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} prefix={<Search style={{ width: 14, height: 14, color: "#888" }} />} />
              </div>
              <div className="oh-filter-group">
                <label className="oh-filter-label">Status</label>
                <Select value={statusFilter} onChange={setStatusFilter} style={{ width: "100%" }}>
                  {statusOptions.map((s) => (
                    <Select.Option key={s} value={s}>{s === "all" ? "All Status" : s}</Select.Option>
                  ))}
                </Select>
              </div>
              <div className="oh-filter-group">
                <label className="oh-filter-label">Export</label>
                <Button icon={<FileText style={{ width: 14, height: 14 }} />} disabled={transformedOrders.length === 0} onClick={handleExportPDF} block>
                  Export PDF
                </Button>
              </div>
            </div>
          )}

          {/* Main Content */}
          <div className="oh-main-card">
            {loading ? (
              <LoadingState />
            ) : error ? (
              <ErrorState />
            ) : transformedOrders.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className="oh-desktop-table">
                  <Table
                    dataSource={transformedOrders}
                    columns={columns}
                    rowKey="key"
                    pagination={{
                      pageSize: 10,
                      showSizeChanger: true,
                      showTotal: (total, range) => `${range[0]}–${range[1]} of ${total}`,
                    }}
                    size="middle"
                    scroll={{ x: 600 }}
                    rowClassName="oh-table-row"
                  />
                </div>

                {/* Mobile Cards */}
                <div className="oh-mobile-list">
                  {transformedOrders.map((order) => (
                    <MobileOrderCard key={order.key} order={order} />
                  ))}
                  {transformedOrders.length > 10 && (
                    <div className="oh-mobile-count">
                      {transformedOrders.length} orders total
                    </div>
                  )}
                </div>
              </>
            ) : (
              <EmptyState />
            )}
          </div>
        </div>

        <OrderModal orderId={selectedOrderId} isModalVisible={isOrderModalVisible} onClose={handleOrderModalClose} />
        <AuthModal open={isAuthModalVisible} onClose={handleAuthModalClose} />
        <FiltersDrawerContent />
      </div>
    </>
  );
};

// ==================== STYLES ====================

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700;800;900&display=swap');

  :root {
    --oh-font: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --oh-green: #14532d;
    --oh-green-mid: #166534;
    --oh-green-accent: #22c55e;
    --oh-green-light: #dcfce7;
    --oh-green-lighter: #f0fdf4;
    --oh-dark: #1a1a1a;
    --oh-mid: #555;
    --oh-light: #888;
    --oh-border: #e0e0e0;
    --oh-bg: #f7f7f7;
    --oh-red: #dc2626;
    --oh-radius: 4px;
  }

  .oh-root, .oh-root * {
    font-family: var(--oh-font) !important;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .oh-root {
    min-height: 100vh;
    background: #fff;
  }

  .oh-container {
    max-width: 1100px;
    margin: 0 auto;
    padding: 24px 16px;
  }
  @media (min-width: 768px) {
    .oh-container { padding: 32px 40px; }
  }

  /* ==================== PAGE HEADER ==================== */

  .oh-page-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--oh-border);
    flex-wrap: wrap;
  }

  .oh-page-header-accent {
    width: 4px;
    height: 28px;
    border-radius: 2px;
    background: var(--oh-green);
    flex-shrink: 0;
  }

  .oh-page-title {
    font-size: 22px;
    font-weight: 800;
    color: var(--oh-dark);
    letter-spacing: -0.02em;
    margin: 0;
    line-height: 1.2;
  }
  @media (min-width: 768px) {
    .oh-page-title { font-size: 26px; }
  }

  .oh-page-count {
    font-size: 13px;
    font-weight: 500;
    color: var(--oh-light);
    margin: 2px 0 0;
  }

  .oh-page-header-line {
    flex: 1;
    height: 1px;
    background: var(--oh-border);
    display: none;
  }
  @media (min-width: 768px) {
    .oh-page-header-line { display: block; }
  }

  .oh-mobile-filter-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: var(--oh-green);
    color: #fff;
    border: none;
    border-radius: var(--oh-radius);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    font-family: var(--oh-font);
    margin-left: auto;
    transition: background 0.15s;
  }
  .oh-mobile-filter-btn:active { transform: scale(0.97); }
  @media (min-width: 768px) {
    .oh-mobile-filter-btn { display: none; }
  }

  /* ==================== STATS ==================== */

  .oh-stats-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin-bottom: 20px;
  }
  @media (min-width: 768px) {
    .oh-stats-grid {
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
      margin-bottom: 24px;
    }
  }

  .oh-stat-card {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px;
    background: #fff;
    border: 1px solid var(--oh-border);
    border-radius: var(--oh-radius);
    border-left: 3px solid var(--stat-color, #888);
    transition: box-shadow 0.2s;
  }
  .oh-stat-card:hover {
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }

  .oh-stat-value {
    font-size: 28px;
    font-weight: 900;
    color: var(--stat-color, var(--oh-dark));
    letter-spacing: -0.02em;
    line-height: 1;
  }
  @media (min-width: 768px) {
    .oh-stat-value { font-size: 32px; }
  }

  .oh-stat-label {
    font-size: 12px;
    font-weight: 600;
    color: var(--oh-light);
    margin-top: 4px;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .oh-stat-icon-wrap {
    width: 40px;
    height: 40px;
    border-radius: var(--oh-radius);
    background: var(--oh-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--stat-color, var(--oh-light));
    flex-shrink: 0;
  }

  /* ==================== FILTERS BAR ==================== */

  .oh-filters-bar {
    display: none;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    padding: 16px;
    background: #fff;
    border: 1px solid var(--oh-border);
    border-radius: var(--oh-radius);
    margin-bottom: 20px;
  }
  @media (min-width: 768px) {
    .oh-filters-bar { display: grid; }
  }

  .oh-filter-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .oh-filter-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--oh-light);
    text-transform: uppercase;
    letter-spacing: 0.04em;
  }

  /* ==================== MAIN CARD ==================== */

  .oh-main-card {
    background: #fff;
    border: 1px solid var(--oh-border);
    border-radius: var(--oh-radius);
    overflow: hidden;
  }

  /* ==================== TABLE ==================== */

  .oh-desktop-table {
    display: none;
  }
  @media (min-width: 768px) {
    .oh-desktop-table { display: block; }
  }

  .oh-desktop-table .ant-table-thead > tr > th {
    background: var(--oh-bg) !important;
    border-bottom: 1px solid var(--oh-border) !important;
    font-size: 11px !important;
    font-weight: 700 !important;
    text-transform: uppercase !important;
    letter-spacing: 0.04em !important;
    color: var(--oh-light) !important;
    padding: 12px 16px !important;
    font-family: var(--oh-font) !important;
  }

  .oh-desktop-table .ant-table-tbody > tr > td {
    padding: 14px 16px !important;
    border-bottom: 1px solid #f0f0f0 !important;
    font-size: 14px !important;
    font-family: var(--oh-font) !important;
  }

  .oh-desktop-table .ant-table-tbody > tr:last-child > td {
    border-bottom: none !important;
  }

  .oh-desktop-table .ant-table-tbody > tr:hover > td {
    background: var(--oh-green-lighter) !important;
  }

  .oh-desktop-table .ant-pagination {
    padding: 16px !important;
    font-family: var(--oh-font) !important;
  }

  .oh-desktop-table .ant-pagination-item-active {
    background: var(--oh-green) !important;
    border-color: var(--oh-green) !important;
  }
  .oh-desktop-table .ant-pagination-item-active a {
    color: #fff !important;
  }

  .oh-order-id {
    font-family: 'SF Mono', 'Fira Code', monospace, var(--oh-font);
    font-size: 13px;
    font-weight: 600;
    color: var(--oh-dark);
    background: var(--oh-bg);
    padding: 4px 10px;
    border-radius: var(--oh-radius);
    border: 1px solid var(--oh-border);
  }

  .oh-date {
    font-size: 14px;
    font-weight: 500;
    color: var(--oh-mid);
  }

  .oh-status-badge {
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 10px;
    border-radius: 100px;
    border: 1px solid;
    font-size: 12px;
    font-weight: 600;
    white-space: nowrap;
    font-family: var(--oh-font);
  }

  .oh-view-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: none;
    border: 1px solid var(--oh-border);
    border-radius: var(--oh-radius);
    color: var(--oh-mid);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    font-family: var(--oh-font);
  }
  .oh-view-btn:hover {
    background: var(--oh-green-lighter);
    border-color: var(--oh-green-accent);
    color: var(--oh-green);
  }

  .oh-view-label {
    display: none;
  }
  @media (min-width: 768px) {
    .oh-view-label { display: inline; }
  }

  /* ==================== MOBILE LIST ==================== */

  .oh-mobile-list {
    display: block;
    padding: 12px;
  }
  @media (min-width: 768px) {
    .oh-mobile-list { display: none; }
  }

  .oh-mobile-card {
    border: 1px solid var(--oh-border);
    border-radius: var(--oh-radius);
    padding: 14px;
    margin-bottom: 10px;
    cursor: pointer;
    transition: all 0.15s;
    background: #fff;
  }
  .oh-mobile-card:hover {
    border-color: var(--oh-green-accent);
    box-shadow: 0 2px 8px rgba(20, 83, 45, 0.06);
  }
  .oh-mobile-card:active {
    transform: scale(0.99);
  }

  .oh-mobile-card-top {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }

  .oh-mobile-card-id {
    font-family: 'SF Mono', 'Fira Code', monospace, var(--oh-font);
    font-size: 14px;
    font-weight: 700;
    color: var(--oh-dark);
    margin-bottom: 4px;
  }

  .oh-mobile-card-date {
    font-size: 13px;
    color: var(--oh-light);
    font-weight: 500;
  }

  .oh-mobile-card-bottom {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid #f0f0f0;
  }

  .oh-mobile-view-link {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    font-weight: 600;
    color: var(--oh-green);
  }

  .oh-mobile-count {
    text-align: center;
    font-size: 12px;
    color: var(--oh-light);
    font-weight: 500;
    padding: 12px 0 4px;
  }

  /* ==================== EMPTY STATE ==================== */

  .oh-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 60px 24px;
  }

  .oh-empty-icon-wrap {
    width: 80px;
    height: 80px;
    border-radius: 50%;
    background: var(--oh-bg);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 20px;
    border: 1px solid var(--oh-border);
  }

  .oh-empty-title {
    font-size: 20px;
    font-weight: 800;
    color: var(--oh-dark);
    margin-bottom: 8px;
    letter-spacing: -0.01em;
  }

  .oh-empty-desc {
    font-size: 14px;
    color: var(--oh-light);
    max-width: 340px;
    line-height: 1.6;
    margin-bottom: 24px;
  }

  .oh-empty-btn {
    padding: 10px 28px;
    border-radius: var(--oh-radius);
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.15s;
    font-family: var(--oh-font);
    border: none;
  }

  .oh-empty-btn-primary {
    background: var(--oh-green);
    color: #fff;
  }
  .oh-empty-btn-primary:hover {
    background: var(--oh-green-mid);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(20, 83, 45, 0.15);
  }

  /* ==================== DRAWER ==================== */

  .oh-drawer-body {
    display: flex;
    flex-direction: column;
    gap: 16px;
    padding-bottom: 24px;
  }

  .oh-drawer-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .oh-drawer-label {
    font-size: 11px;
    font-weight: 700;
    color: var(--oh-light);
    text-transform: uppercase;
    letter-spacing: 0.04em;
    font-family: var(--oh-font);
  }

  .oh-drawer-input {
    width: 100%;
  }
`;

export default OrderHistoryPage;