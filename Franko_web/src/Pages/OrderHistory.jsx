import { useEffect, useState, useMemo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrdersByCustomer, cancelOrder } from "../Redux/Slice/orderSlice";
import {
  DatePicker,
  Table,
  Spin,
  Tooltip,
  Button,
  Input,
  Select,
  Drawer,
  Modal,
  message,
} from "antd";
import {
  Eye,
  ShoppingCart,
  Calendar,
  Clock,
  Search,
  Filter,
  Package,
  CheckCircle,
  AlertCircle,
  XCircle,
  FileText,
  UserX,
  X,
  RefreshCw,
  ShieldAlert,
  Ban,
  PackageCheck,
  Timer,
  ArrowUpRight,
  Download,
  SlidersHorizontal,
} from "lucide-react";
import moment from "moment";
import OrderModal from "../Component/OrderModal";
import AuthModal from "../Component/AuthModal";

// ==================== HELPERS ====================
const safeParseCustomer = () => {
  try {
    const raw = localStorage.getItem("customer");
    if (!raw || raw === "null" || raw === "undefined") return null;
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    if (!parsed || typeof parsed !== "object") return null;
    return parsed;
  } catch {
    return null;
  }
};

const getCustomerType = (customer) =>
  String(
    customer?.customerType ??
      customer?.CustomerType ??
      customer?.customer_type ??
      customer?.accountType ??
      customer?.AccountType ??
      customer?.account_type ??
      "",
  )
    .trim()
    .toLowerCase();

// ONLY Order Placement can be cancelled
const isCancellable = (status) => {
  if (!status) return false;
  return String(status).trim() === "Order Placement";
};

const getStatusConfig = (status) => {
  const map = {
    Pending: { bg: "#fffbeb", color: "#92400e", border: "#fde68a", dot: "#f59e0b", icon: Clock, label: "Pending" },
    Processing: { bg: "#eff6ff", color: "#1e40af", border: "#bfdbfe", dot: "#3b82f6", icon: Timer, label: "Processing" },
    "Order Placement": { bg: "#eef2ff", color: "#3730a3", border: "#c7d2fe", dot: "#6366f1", icon: FileText, label: "Placed" },
    "Wrong Number": { bg: "#faf5ff", color: "#6b21a8", border: "#e9d5ff", dot: "#a855f7", icon: AlertCircle, label: "Wrong Number" },
    Delivery: { bg: "#f0fdf4", color: "#166534", border: "#bbf7d0", dot: "#22c55e", icon: PackageCheck, label: "Delivered" },
    Completed: { bg: "#f0fdf4", color: "#14532d", border: "#86efac", dot: "#16a34a", icon: CheckCircle, label: "Completed" },
    Cancelled: { bg: "#fef2f2", color: "#991b1b", border: "#fecaca", dot: "#ef4444", icon: Ban, label: "Cancelled" },
    Unreachable: { bg: "#f9fafb", color: "#374151", border: "#e5e7eb", dot: "#6b7280", icon: UserX, label: "Unreachable" },
    "Not Answered": { bg: "#fff7ed", color: "#9a3412", border: "#fed7aa", dot: "#f97316", icon: AlertCircle, label: "No Answer" },
    "Multiple order": { bg: "#f0f9ff", color: "#0c4a6e", border: "#bae6fd", dot: "#0ea5e9", icon: Package, label: "Multiple" },
  };
  return map[status] || { bg: "#f9fafb", color: "#374151", border: "#e5e7eb", dot: "#9ca3af", icon: AlertCircle, label: status };
};

const statusOptions = [
  "all",
  "Pending",
  "Processing",
  "Order Placement",
  "Wrong Number",
  "Delivery",
  "Completed",
  "Cancelled",
  "Unreachable",
  "Not Answered",
  "Multiple order",
];

// ==================== COMPONENT ====================
const OrderHistoryPage = () => {
  const dispatch = useDispatch();
  const ordersData = useSelector((state) => state.orders || { orders: [], loading: false, error: null });
  const currentCustomer = useSelector((state) => state.customer?.currentCustomer || null);
  const orders = ordersData.orders || [];

  const loading = useMemo(() => {
    if (ordersData.loadingStatus && typeof ordersData.loadingStatus.orders === "boolean") {
      return ordersData.loadingStatus.orders;
    }
    return typeof ordersData.loading === "boolean" ? ordersData.loading : false;
  }, [ordersData.loading, ordersData.loadingStatus]);

  const error = useMemo(() => {
    const raw = ordersData.errorStatus?.orders ?? ordersData.error?.orders ?? null;
    if (typeof raw === "string" && raw.trim()) return raw;
    if (raw && typeof raw === "object" && typeof raw.message === "string") return raw.message;
    if (typeof ordersData.error === "string" && ordersData.error.trim()) return ordersData.error;
    if (ordersData.error && typeof ordersData.error === "object") {
      const firstString = Object.values(ordersData.error).find((v) => typeof v === "string" && v.trim());
      if (firstString) return firstString;
    }
    if (ordersData.errorStatus && typeof ordersData.errorStatus === "object") {
      const firstString = Object.values(ordersData.errorStatus).find((v) => typeof v === "string" && v.trim());
      if (firstString) return firstString;
    }
    return null;
  }, [ordersData.error, ordersData.errorStatus]);

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

  const [cancelModal, setCancelModal] = useState({
    open: false,
    orderId: null,
    orderDate: null,
    status: null,
    loading: false,
  });
  const [cancellingId, setCancellingId] = useState(null);

  const customerObj = useMemo(() => {
    const storedCustomer = safeParseCustomer();
    // The authenticated customer is stored in Redux as
    // state.customer.currentCustomer. Fall back to localStorage for sessions
    // that have not hydrated Redux yet.
    return currentCustomer || storedCustomer?.currentCustomer || storedCustomer || null;
  }, [currentCustomer]);
  const customerType = useMemo(() => getCustomerType(customerObj), [customerObj]);
  const isAgentCustomer = customerType === "agent";
  const customerId =
    customerObj?.customerAccountNumber ||
    customerObj?.CustomerAccountNumber ||
    customerObj?.customerId ||
    null;
  const hasValidCustomer = Boolean(customerObj && customerId);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  useEffect(() => {
    if (hasValidCustomer) {
      const [from, to] = dateRange.map((date) => date.format("MM/DD/YYYY"));
      dispatch(fetchOrdersByCustomer({ from, to, customerId }));
    }
  }, [dateRange, customerId, dispatch, hasValidCustomer]);

  const handleDateChange = (dates) => {
    if (dates && dates[0] && dates[1]) setDateRange(dates);
  };

  const handleViewOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setIsOrderModalVisible(true);
  };

  const handleOrderModalClose = () => {
    setIsOrderModalVisible(false);
    setSelectedOrderId(null);
  };

  const handleAuthModalClose = () => setIsAuthModalVisible(false);
  const handleSignInClick = () => setIsAuthModalVisible(true);

  const handleRefresh = useCallback(() => {
    if (hasValidCustomer) {
      const [from, to] = dateRange.map((date) => date.format("MM/DD/YYYY"));
      dispatch(fetchOrdersByCustomer({ from, to, customerId }));
    }
  }, [hasValidCustomer, dateRange, customerId, dispatch]);

  const transformedOrders = useMemo(() => {
    return (orders || [])
      .map((order, index) => ({
        key: order?.orderCode ? `${order.orderCode}-${index}` : `order-${index}`,
        orderId: order?.orderCode || "N/A",
        orderDate: order?.orderDate ? moment(order.orderDate).format("MMM DD, YYYY") : "N/A",
        orderDateRaw: order?.orderDate,
        orderDateMoment: order?.orderDate ? moment(order.orderDate) : moment(0),
        customerName: order?.fullName || customerObj?.firstName || "N/A",
        orderCycle: order?.orderCycle || "Pending",
        totalAmount: order?.totalAmount || order?.orderAmount || null,
        paymentMode: order?.paymentMode || order?.PaymentMode || "N/A",
        raw: order,
      }))
      .filter((order) => {
        const matchesSearch =
          !searchTerm ||
          order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.customerName.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || order.orderCycle === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => b.orderDateMoment.valueOf() - a.orderDateMoment.valueOf());
  }, [orders, searchTerm, statusFilter, customerObj]);

  const stats = useMemo(() => {
    const total = orders.length;
    const completed = orders.filter((o) => ["Delivery", "Completed"].includes(o.orderCycle)).length;
    const inProgress = orders.filter((o) =>
      ["Processing", "Pending", "Order Placement", "Wrong Number"].includes(o.orderCycle),
    ).length;
    const cancelled = orders.filter((o) => o.orderCycle === "Cancelled").length;
    return { total, completed, inProgress, cancelled };
  }, [orders]);

  const handleExportPDF = () => {
    if (transformedOrders.length === 0) {
      message.warning("No orders to export");
      return;
    }
    const printWindow = window.open("", "_blank");
    const htmlContent = `<!DOCTYPE html><html><head><title>Order History - Franko Trading</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        body{font-family:'Plus Jakarta Sans',sans-serif;margin:24px;color:#1a1a1a}
        .header{text-align:center;margin-bottom:32px;padding-bottom:16px;border-bottom:2px solid #e0e0e0}
        .header h1{font-size:24px;font-weight:800;margin:0 0 4px;color:#14532d}
        .header p{font-size:13px;color:#888;margin:0}
        .date-range{text-align:center;margin-bottom:24px;font-size:13px;color:#555}
        table{width:100%;border-collapse:collapse}
        th{background:#14532d;color:#fff;text-align:left;padding:10px 14px;font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.03em}
        td{padding:10px 14px;border-bottom:1px solid #e0e0e0;font-size:13px}
        tr:last-child td{border-bottom:none}
        .footer{text-align:center;margin-top:32px;font-size:11px;color:#888}
      </style></head><body>
      <div class="header"><h1>Franko Trading - Order History</h1><p>Customer: ${customerObj?.firstName || ""} ${customerObj?.lastName || ""} (${customerId || "N/A"})</p></div>
      <div class="date-range"><strong>Period:</strong> ${dateRange[0].format("MMM DD, YYYY")} – ${dateRange[1].format("MMM DD, YYYY")}</div>
      <table><thead><tr><th>Order ID</th><th>Date</th><th>Status</th><th>Payment</th></tr></thead>
      <tbody>${transformedOrders
        .map((o) => `<tr><td>#${o.orderId}</td><td>${o.orderDate}</td><td>${o.orderCycle}</td><td>${o.paymentMode}</td></tr>`)
        .join("")}</tbody></table>
      <div class="footer"><p>Generated: ${moment().format("MMM DD, YYYY HH:mm")}</p><p>Total: ${transformedOrders.length} orders</p></div>
      </body></html>`;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  // ==================== CANCEL LOGIC ====================
  const openCancelModal = (order) => {
    if (isAgentCustomer) return;
    if (!isCancellable(order.orderCycle)) {
      message.warning(`Only 'Order Placement' orders can be cancelled. Order #${order.orderId} is at ${order.orderCycle} stage`);
      return;
    }
    setCancelModal({
      open: true,
      orderId: order.orderId,
      orderDate: order.orderDate,
      status: order.orderCycle,
      loading: false,
    });
  };

  const closeCancelModal = () => {
    if (cancelModal.loading) return;
    setCancelModal({ open: false, orderId: null, orderDate: null, status: null, loading: false });
  };

  const handleConfirmCancel = async () => {
    if (isAgentCustomer || !cancelModal.orderId) return;
    setCancelModal((p) => ({ ...p, loading: true }));
    setCancellingId(cancelModal.orderId);
    try {
      await dispatch(cancelOrder(cancelModal.orderId)).unwrap();
      message.success(`Order #${cancelModal.orderId} cancelled successfully`);
      setCancelModal({ open: false, orderId: null, orderDate: null, status: null, loading: false });
      handleRefresh();
    } catch (err) {
      const errMsg = err?.message || err?.responseMessage || err?.rawMessage || "Failed to cancel order. Please try again.";
      const lower = String(errMsg).toLowerCase();
      const friendly =
        lower.includes("datareader") || lower.includes("transaction failed")
          ? "Unable to cancel at the moment. Please try again later."
          : errMsg;
      message.error(friendly);
      setCancelModal((p) => ({ ...p, loading: false }));
    } finally {
      setCancellingId(null);
    }
  };

  // ==================== TABLE COLUMNS ====================
  const columns = [
    {
      title: "Order",
      dataIndex: "orderId",
      key: "orderId",
      width: 160,
      render: (text) => (
        <div className="oh-order-cell">
          <span className="oh-order-id">#{text}</span>
        </div>
      ),
    },
    {
      title: "Date",
      dataIndex: "orderDate",
      key: "orderDate",
      width: 140,
      render: (text) => (
        <div className="oh-date-cell">
          <Calendar style={{ width: 14, height: 14, color: "#888" }} />
          <span>{text}</span>
        </div>
      ),
      sorter: (a, b) => a.orderDateMoment.unix() - b.orderDateMoment.unix(),
    },
    {
      title: "Status",
      dataIndex: "orderCycle",
      key: "orderCycle",
      width: 160,
      render: (status) => {
        const cfg = getStatusConfig(status);
        const Icon = cfg.icon;
        return (
          <span className="oh-status-badge" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
            <span className="oh-status-dot" style={{ background: cfg.dot }} />
            <Icon style={{ width: 12, height: 12 }} />
            {cfg.label}
          </span>
        );
      },
    },
    {
      title: "Action",
      key: "action",
      width: 230,
      render: (_, record) => {
        const cancellable = !isAgentCustomer && isCancellable(record.orderCycle);
        const isThisCancelling = cancellingId === record.orderId;
        return (
          <div className="oh-action-group">
            <Tooltip title="View order details, invoice & receipt">
              <button className="oh-action-btn oh-action-view" onClick={() => handleViewOrder(record.orderId)}>
                <Eye style={{ width: 14, height: 14 }} />
                View
              </button>
            </Tooltip>
            {cancellable && (
              <Tooltip title="Cancel this order - Only Order Placement status can be cancelled">
                <button
                  className="oh-action-btn oh-action-cancel-active"
                  onClick={() => openCancelModal(record)}
                  disabled={isThisCancelling}
                  style={{
                    background: "#dc2626",
                    color: "#fff",
                    borderColor: "#dc2626",
                    fontWeight: 700,
                    boxShadow: "0 2px 8px rgba(220,38,38,0.2)",
                  }}
                >
                  {isThisCancelling ? <Spin size="small" /> : <X style={{ width: 12, height: 12 }} />}
                  Cancel Order
                </button>
              </Tooltip>
            )}
          </div>
        );
      },
    },
  ];

  // ==================== SUB COMPONENTS ====================
  const StatCard = ({ value, label, icon: Icon, color, bg }) => (
    <div className="oh-stat-card" style={{ "--stat-color": color, "--stat-bg": bg }}>
      <div className="oh-stat-top">
        <div className="oh-stat-icon" style={{ background: bg, color }}>
          <Icon style={{ width: 18, height: 18 }} />
        </div>
      </div>
      <div className="oh-stat-value">{value}</div>
      <div className="oh-stat-label">{label}</div>
    </div>
  );

  const MobileOrderCard = ({ order }) => {
    const cfg = getStatusConfig(order.orderCycle);
    const cancellable = !isAgentCustomer && isCancellable(order.orderCycle);
    const isThisCancelling = cancellingId === order.orderId;
    return (
      <div className="oh-mobile-card">
        <div className="oh-mobile-card-header">
          <div className="oh-mobile-card-idrow">
            <span className="oh-mobile-id">#{order.orderId}</span>
            <span className="oh-status-badge oh-status-badge-sm" style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.border }}>
              <span className="oh-status-dot" style={{ background: cfg.dot }} />
              {cfg.label}
            </span>
          </div>
          <div className="oh-mobile-date">
            <Calendar style={{ width: 12, height: 12 }} />
            {order.orderDate}
          </div>
        </div>
        <div className="oh-mobile-card-body">
          <div className="oh-mobile-meta">
            <span className="oh-mobile-meta-label">Payment</span>
            <span className="oh-mobile-meta-value">{order.paymentMode}</span>
          </div>
          {order.totalAmount && (
            <div className="oh-mobile-meta">
              <span className="oh-mobile-meta-label">Amount</span>
              <span className="oh-mobile-meta-value oh-mobile-amount">GH₵{Number(order.totalAmount).toFixed(2)}</span>
            </div>
          )}
        </div>
        <div className="oh-mobile-card-actions">
          <button className="oh-mobile-btn oh-mobile-btn-view" onClick={() => handleViewOrder(order.orderId)} style={{ flex: cancellable ? 1 : "auto" }}>
            <Eye style={{ width: 14, height: 14 }} />
            View Details
            <ArrowUpRight style={{ width: 12, height: 12, opacity: 0.6 }} />
          </button>
          {cancellable && (
            <button
              className="oh-mobile-btn oh-mobile-btn-cancel-active"
              onClick={() => openCancelModal(order)}
              disabled={isThisCancelling}
              style={{ background: "#dc2626", color: "#fff", borderColor: "#dc2626", fontWeight: 800 }}
            >
              {isThisCancelling ? <Spin size="small" /> : <X style={{ width: 12, height: 12 }} />}
              Cancel Order
            </button>
          )}
        </div>
      </div>
    );
  };

  const NoCustomerState = () => (
    <div className="oh-empty-state">
      <div className="oh-empty-icon-wrap oh-empty-icon-amber">
        <UserX style={{ width: 32, height: 32, color: "#d97706" }} />
      </div>
      <h3 className="oh-empty-title">Sign in to view orders</h3>
      <p className="oh-empty-desc">Your order history is tied to your account. Please sign in to track, view and manage your purchases.</p>
      <div className="oh-empty-actions">
        <button className="oh-btn-primary" onClick={handleSignInClick}>
          <UserX style={{ width: 16, height: 16 }} />
          Sign In
        </button>
        <button className="oh-btn-secondary" onClick={() => (window.location.href = "/")}>
          <ShoppingCart style={{ width: 16, height: 16 }} />
          Continue Shopping
        </button>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="oh-empty-state">
      <div className="oh-empty-icon-wrap">
        <Package style={{ width: 32, height: 32, color: "#9ca3af" }} />
      </div>
      <h3 className="oh-empty-title">{searchTerm || statusFilter !== "all" ? "No matching orders" : "No orders yet"}</h3>
      <p className="oh-empty-desc">
        {searchTerm || statusFilter !== "all"
          ? `No orders found for "${searchTerm || statusFilter}". Try adjusting your filters.`
          : "You haven't placed any orders yet. Your order history will appear here once you make a purchase."}
      </p>
      {searchTerm || statusFilter !== "all" ? (
        <div className="oh-empty-actions">
          <button className="oh-btn-secondary" onClick={() => { setSearchTerm(""); setStatusFilter("all"); }}>
            <X style={{ width: 16, height: 16 }} />
            Clear Filters
          </button>
        </div>
      ) : (
        <div className="oh-empty-actions">
          <button className="oh-btn-primary" onClick={() => (window.location.href = "/")}>
            <ShoppingCart style={{ width: 16, height: 16 }} />
            Start Shopping
          </button>
        </div>
      )}
    </div>
  );

  const LoadingState = () => (
    <div className="oh-empty-state">
      <div className="oh-loading-wrap">
        <div className="oh-spinner" />
        <div className="oh-spinner-ring" />
      </div>
      <h3 className="oh-empty-title" style={{ marginTop: 20 }}>Loading your orders</h3>
      <p className="oh-empty-desc">Fetching latest order information...</p>
    </div>
  );

  const ErrorState = () => (
    <div className="oh-empty-state">
      <div className="oh-empty-icon-wrap oh-empty-icon-red">
        <AlertCircle style={{ width: 32, height: 32, color: "#dc2626" }} />
      </div>
      <h3 className="oh-empty-title">Unable to load orders</h3>
      <p className="oh-empty-desc">
        {typeof error === "string" && error.toLowerCase().includes("datareader")
          ? "Something went wrong. Please try again."
          : typeof error === "string"
          ? error
          : "Failed to load orders. Please try again."}
      </p>
      <div className="oh-empty-actions">
        <button className="oh-btn-primary" onClick={handleRefresh}>
          <RefreshCw style={{ width: 16, height: 16 }} />
          Try Again
        </button>
      </div>
    </div>
  );

  if (!hasValidCustomer) {
    return (
      <>
        <style>{styles}</style>
        <div className="oh-root">
          <div className="oh-container">
            <div className="oh-page-header">
              <div className="oh-page-header-accent" />
              <div className="oh-page-header-content">
                <h1 className="oh-page-title">Order History</h1>
                <p className="oh-page-subtitle">Track and manage your purchases</p>
              </div>
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
          <div className="oh-page-header">
            <div className="oh-page-header-accent" />
            <div className="oh-page-header-content">
              <h1 className="oh-page-title">Order History</h1>
              <p className="oh-page-subtitle">
                {loading ? "Loading..." : `${transformedOrders.length} ${transformedOrders.length === 1 ? "order" : "orders"} • ${stats.total} total`}
              </p>
            </div>
            <div className="oh-page-header-line" />
            <div className="oh-header-actions">
              <button className="oh-header-btn oh-header-btn-ghost" onClick={handleRefresh} disabled={loading}>
                <RefreshCw style={{ width: 16, height: 16 }} className={loading ? "oh-spin" : ""} />
                <span className="oh-hide-mobile">Refresh</span>
              </button>
              <button className="oh-mobile-filter-btn" onClick={() => setFiltersDrawerOpen(true)}>
                <SlidersHorizontal style={{ width: 16, height: 16 }} />
                Filters
              </button>
            </div>
          </div>

          {!loading && !error && orders.length > 0 && (
            <div className="oh-stats-grid">
              <StatCard value={stats.total} label="Total Orders" icon={Package} color="#2563eb" bg="#eff6ff" />
              <StatCard value={stats.completed} label="Completed" icon={CheckCircle} color="#16a34a" bg="#f0fdf4" />
              <StatCard value={stats.inProgress} label="In Progress" icon={Clock} color="#d97706" bg="#fffbeb" />
              <StatCard value={stats.cancelled} label="Cancelled" icon={XCircle} color="#dc2626" bg="#fef2f2" />
            </div>
          )}

          <div className="oh-filters-card">
            <div className="oh-filters-grid">
              <div className="oh-filter-group">
                <label className="oh-filter-label"><Calendar style={{ width: 12, height: 12 }} />Date Range</label>
                <DatePicker.RangePicker value={dateRange} onChange={handleDateChange} format="MM/DD/YYYY" className="oh-filter-input" size="middle" />
              </div>
              <div className="oh-filter-group">
                <label className="oh-filter-label"><Search style={{ width: 12, height: 12 }} />Search Order</label>
                <Input placeholder="Order ID or name..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} prefix={<Search style={{ width: 14, height: 14, color: "#9ca3af" }} />} allowClear className="oh-filter-input" />
              </div>
              <div className="oh-filter-group">
                <label className="oh-filter-label"><Filter style={{ width: 12, height: 12 }} />Status</label>
                <Select value={statusFilter} onChange={setStatusFilter} className="oh-filter-input" style={{ width: "100%" }} size="middle" options={statusOptions.map((s) => ({ value: s, label: s === "all" ? "All Status" : s }))} />
              </div>
              <div className="oh-filter-group">
                <label className="oh-filter-label"><Download style={{ width: 12, height: 12 }} />Export</label>
                <Button icon={<FileText style={{ width: 14, height: 14 }} />} disabled={transformedOrders.length === 0} onClick={handleExportPDF} className="oh-export-btn" block>Export PDF</Button>
              </div>
            </div>
          </div>

          <div className="oh-main-card">
            {loading ? <LoadingState /> : error ? <ErrorState /> : transformedOrders.length > 0 ? (
              <>
                <div className="oh-desktop-table">
                  <Table dataSource={transformedOrders} columns={columns} rowKey="key" pagination={{ pageSize: 10, showSizeChanger: true, pageSizeOptions: ["10", "20", "50"], showTotal: (total, range) => (<span className="oh-pagination-total">{range[0]}–{range[1]} of {total} orders</span>) }} size="middle" scroll={{ x: 700 }} rowClassName="oh-table-row" />
                </div>
                <div className="oh-mobile-list">
                  <div className="oh-mobile-list-header"><span>{transformedOrders.length} orders</span><span className="oh-mobile-list-sub">Tap to view details</span></div>
                  {transformedOrders.map((order) => (<MobileOrderCard key={order.key} order={order} />))}
                </div>
              </>
            ) : <EmptyState />}
          </div>

          {transformedOrders.length > 0 && (
            <div className="oh-info-banner">
              <div className="oh-info-icon"><ShieldAlert style={{ width: 16, height: 16 }} /></div>
              <div className="oh-info-content">
                <p className="oh-info-title">Cancellation Policy</p>
                <p className="oh-info-text">Only orders with status <strong>Order Placement</strong> can be cancelled. Once order moves to processing/delivery, it cannot be cancelled. Contact support for help.</p>
              </div>
            </div>
          )}
        </div>

        {!isAgentCustomer && (
          <Modal open={cancelModal.open} onCancel={closeCancelModal} footer={null} centered width={440} closeIcon={false} className="oh-cancel-modal" maskClosable={!cancelModal.loading}>
            <div className="oh-cancel-content">
              <div className="oh-cancel-icon-wrap">
                <div className="oh-cancel-icon-bg"><AlertCircle style={{ width: 28, height: 28, color: "#dc2626" }} /></div>
                <button className="oh-cancel-close" onClick={closeCancelModal} disabled={cancelModal.loading}><X style={{ width: 18, height: 18 }} /></button>
              </div>
              <h3 className="oh-cancel-title">Cancel Order?</h3>
              <p className="oh-cancel-desc">You are about to cancel order <strong>#{cancelModal.orderId}</strong>. This action cannot be undone.</p>
              <div className="oh-cancel-details">
                <div className="oh-cancel-detail-row"><span className="oh-cancel-detail-label">Order ID</span><span className="oh-cancel-detail-value">#{cancelModal.orderId}</span></div>
                <div className="oh-cancel-detail-row"><span className="oh-cancel-detail-label">Date</span><span className="oh-cancel-detail-value">{cancelModal.orderDate}</span></div>
                <div className="oh-cancel-detail-row"><span className="oh-cancel-detail-label">Status</span><span className="oh-cancel-detail-value"><span className="oh-cancel-status">{cancelModal.status}</span></span></div>
              </div>
              <div className="oh-cancel-warning"><ShieldAlert style={{ width: 14, height: 14, flexShrink: 0 }} /><span>Refund will be processed according to our cancellation policy. If you paid via Mobile Money, it may take 24-48 hours.</span></div>
              <div className="oh-cancel-actions">
                <button className="oh-btn-secondary oh-btn-block" onClick={closeCancelModal} disabled={cancelModal.loading}>Keep Order</button>
                <button className="oh-btn-danger oh-btn-block" onClick={handleConfirmCancel} disabled={cancelModal.loading}>{cancelModal.loading ? <><Spin size="small" />Cancelling...</> : <><Ban style={{ width: 16, height: 16 }} />Yes, Cancel Order</>}</button>
              </div>
            </div>
          </Modal>
        )}

        <OrderModal orderId={selectedOrderId} orderCode={selectedOrderId} isModalVisible={isOrderModalVisible} onClose={handleOrderModalClose} onCancelled={handleRefresh} />
        <AuthModal open={isAuthModalVisible} onClose={handleAuthModalClose} />

        <Drawer title={<div className="oh-drawer-title"><SlidersHorizontal style={{ width: 18, height: 18, color: "#14532d" }} />Filters & Export</div>} placement="bottom" height="auto" open={filtersDrawerOpen} onClose={() => setFiltersDrawerOpen(false)} className="oh-drawer">
          <div className="oh-drawer-body">
            <div className="oh-drawer-field"><label className="oh-drawer-label"><Calendar style={{ width: 14, height: 14 }} />Date Range</label><DatePicker.RangePicker value={dateRange} onChange={handleDateChange} format="MM/DD/YYYY" style={{ width: "100%" }} size="large" /></div>
            <div className="oh-drawer-field"><label className="oh-drawer-label"><Search style={{ width: 14, height: 14 }} />Search</label><Input placeholder="Order ID..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} size="large" prefix={<Search style={{ width: 16, height: 16, color: "#888" }} />} allowClear /></div>
            <div className="oh-drawer-field"><label className="oh-drawer-label"><Filter style={{ width: 14, height: 14 }} />Status</label><Select value={statusFilter} onChange={setStatusFilter} style={{ width: "100%" }} size="large" options={statusOptions.map((s) => ({ value: s, label: s === "all" ? "All Status" : s }))} /></div>
            <div className="oh-drawer-field"><Button icon={<Download style={{ width: 16, height: 16 }} />} disabled={transformedOrders.length === 0} onClick={() => { handleExportPDF(); setFiltersDrawerOpen(false); }} size="large" block>Export PDF ({transformedOrders.length})</Button></div>
            <div className="oh-drawer-field"><Button type="primary" size="large" block onClick={() => setFiltersDrawerOpen(false)} style={{ background: "#14532d", borderColor: "#14532d" }}>Apply Filters</Button></div>
          </div>
        </Drawer>
      </div>
    </>
  );
};

const styles = `
  :root {
    --oh-font: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
    --oh-green: #14532d;
    --oh-green-mid: #166534;
    --oh-green-light: #dcfce7;
    --oh-green-lighter: #f0fdf4;
    --oh-green-accent: #16a34a;
    --oh-dark: #111827;
    --oh-mid: #4b5563;
    --oh-light: #9ca3af;
    --oh-border: #e5e7eb;
    --oh-border-light: #f3f4f6;
    --oh-bg: #f9fafb;
    --oh-bg-card: #ffffff;
    --oh-red: #dc2626;
    --oh-radius: 12px;
    --oh-radius-sm: 8px;
    --oh-radius-xs: 6px;
    --oh-shadow-sm: 0 1px 2px rgba(0,0,0,0.04);
    --oh-shadow: 0 4px 12px rgba(0,0,0,0.05);
    --oh-shadow-lg: 0 8px 24px rgba(0,0,0,0.08);
  }
  .oh-root, .oh-root * { font-family: var(--oh-font) !important; -webkit-font-smoothing: antialiased; }
  .oh-root { min-height: 100vh; background: linear-gradient(180deg, #f9fafb 0%, #ffffff 100%); }
  .oh-container { max-width: 1120px; margin: 0 auto; padding: 20px 16px 40px; }
  @media (min-width: 768px) { .oh-container { padding: 28px 24px 48px; } }
  .oh-page-header { display: flex; align-items: center; gap: 14px; margin-bottom: 20px; flex-wrap: wrap; }
  .oh-page-header-accent { width: 4px; height: 32px; border-radius: 2px; background: linear-gradient(180deg, var(--oh-green) 0%, var(--oh-green-accent) 100%); flex-shrink: 0; }
  .oh-page-header-content { flex: 1; min-width: 0; }
  .oh-page-title { font-size: 22px; font-weight: 800; color: var(--oh-dark); letter-spacing: -0.025em; margin: 0; line-height: 1.2; }
  @media (min-width: 768px) { .oh-page-title { font-size: 26px; } }
  .oh-page-subtitle { font-size: 13px; font-weight: 500; color: var(--oh-light); margin: 3px 0 0; line-height: 1.4; }
  .oh-page-header-line { flex: 1; height: 1px; background: var(--oh-border-light); display: none; }
  @media (min-width: 768px) { .oh-page-header-line { display: block; } }
  .oh-header-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; }
  .oh-header-btn { display: inline-flex; align-items: center; gap: 6px; padding: 8px 14px; border-radius: var(--oh-radius-xs); font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; border: 1px solid var(--oh-border); background: #fff; color: var(--oh-mid); }
  .oh-header-btn:hover { border-color: #d1d5db; background: #f9fafb; }
  .oh-hide-mobile { display: none; } @media (min-width: 768px) { .oh-hide-mobile { display: inline; } }
  .oh-mobile-filter-btn { display: inline-flex; align-items: center; gap: 6px; padding: 9px 14px; background: var(--oh-green); color: #fff; border: none; border-radius: var(--oh-radius-xs); font-size: 13px; font-weight: 700; cursor: pointer; box-shadow: var(--oh-shadow-sm); }
  @media (min-width: 768px) { .oh-mobile-filter-btn { display: none; } }
  .oh-spin { animation: oh-spin 0.8s linear infinite; } @keyframes oh-spin { to { transform: rotate(360deg); } }
  .oh-stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; margin-bottom: 16px; }
  @media (min-width: 768px) { .oh-stats-grid { grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; } }
  .oh-stat-card { background: var(--oh-bg-card); border: 1px solid var(--oh-border-light); border-radius: var(--oh-radius); padding: 14px; box-shadow: var(--oh-shadow-sm); }
  .oh-stat-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 10px; }
  .oh-stat-icon { width: 36px; height: 36px; border-radius: 10px; display: flex; align-items: center; justify-content: center; }
  .oh-stat-value { font-size: 26px; font-weight: 900; color: var(--oh-dark); letter-spacing: -0.03em; line-height: 1; }
  .oh-stat-label { font-size: 11px; font-weight: 700; color: var(--oh-light); text-transform: uppercase; letter-spacing: 0.05em; margin-top: 4px; }
  .oh-filters-card { background: var(--oh-bg-card); border: 1px solid var(--oh-border-light); border-radius: var(--oh-radius); padding: 16px; margin-bottom: 16px; box-shadow: var(--oh-shadow-sm); display: none; }
  @media (min-width: 768px) { .oh-filters-card { display: block; padding: 18px; margin-bottom: 20px; } }
  .oh-filters-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; }
  .oh-filter-group { display: flex; flex-direction: column; gap: 6px; }
  .oh-filter-label { display: inline-flex; align-items: center; gap: 4px; font-size: 11px; font-weight: 700; color: var(--oh-mid); text-transform: uppercase; letter-spacing: 0.04em; }
  .oh-filter-input .ant-picker, .oh-filter-input.ant-input, .oh-filter-input .ant-select-selector { border-radius: var(--oh-radius-xs) !important; border-color: var(--oh-border) !important; }
  .oh-export-btn { border-radius: var(--oh-radius-xs); font-weight: 600; }
  .oh-main-card { background: var(--oh-bg-card); border: 1px solid var(--oh-border-light); border-radius: var(--oh-radius); overflow: hidden; box-shadow: var(--oh-shadow-sm); }
  .oh-desktop-table { display: none; } @media (min-width: 768px) { .oh-desktop-table { display: block; } }
  .oh-desktop-table .ant-table-thead > tr > th { background: #f9fafb !important; border-bottom: 1px solid var(--oh-border-light) !important; font-size: 11px !important; font-weight: 700 !important; text-transform: uppercase !important; letter-spacing: 0.05em !important; color: var(--oh-light) !important; padding: 12px 16px !important; }
  .oh-desktop-table .ant-table-tbody > tr > td { padding: 14px 16px !important; border-bottom: 1px solid var(--oh-border-light) !important; vertical-align: middle !important; }
  .oh-order-cell { display: flex; flex-direction: column; gap: 2px; }
  .oh-order-id { font-family: 'SF Mono', monospace; font-size: 13px; font-weight: 700; color: var(--oh-dark); background: #f3f4f6; padding: 3px 8px; border-radius: 6px; border: 1px solid #e5e7eb; display: inline-flex; width: fit-content; }
  .oh-date-cell { display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 500; color: var(--oh-mid); }
  .oh-status-badge { display: inline-flex; align-items: center; gap: 6px; padding: 5px 10px; border-radius: 100px; border: 1px solid; font-size: 12px; font-weight: 700; white-space: nowrap; line-height: 1; }
  .oh-status-badge-sm { padding: 4px 8px; font-size: 11px; }
  .oh-status-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
  .oh-action-group { display: flex; align-items: center; gap: 6px; }
  .oh-action-btn { display: inline-flex; align-items: center; gap: 5px; padding: 6px 10px; border-radius: var(--oh-radius-xs); font-size: 12px; font-weight: 600; cursor: pointer; transition: all 0.15s; border: 1px solid; line-height: 1; }
  .oh-action-view { background: #fff; border-color: var(--oh-border); color: var(--oh-mid); }
  .oh-action-view:hover { background: var(--oh-green-lighter); border-color: var(--oh-green-light); color: var(--oh-green); }
  .oh-action-cancel-active { padding: 3px 6px !important; gap: 3px !important; min-height: 22px; font-size: 10px !important; line-height: 1 !important; }
  .oh-mobile-list { display: block; } @media (min-width: 768px) { .oh-mobile-list { display: none; } }
  .oh-mobile-list-header { display: flex; align-items: center; justify-content: space-between; padding: 12px 16px; background: #f9fafb; border-bottom: 1px solid var(--oh-border-light); font-size: 12px; font-weight: 600; color: var(--oh-mid); }
  .oh-mobile-list-sub { font-weight: 500; color: var(--oh-light); font-size: 11px; }
  .oh-mobile-card { padding: 16px; border-bottom: 1px solid var(--oh-border-light); background: #fff; }
  .oh-mobile-card-idrow { display: flex; align-items: center; justify-content: space-between; gap: 8px; margin-bottom: 6px; }
  .oh-mobile-id { font-family: 'SF Mono', monospace; font-size: 14px; font-weight: 800; color: var(--oh-dark); }
  .oh-mobile-date { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--oh-light); font-weight: 500; }
  .oh-mobile-card-body { display: flex; flex-direction: column; gap: 8px; margin-bottom: 14px; padding: 10px 12px; background: #f9fafb; border-radius: var(--oh-radius-sm); border: 1px solid var(--oh-border-light); }
  .oh-mobile-meta { display: flex; align-items: center; justify-content: space-between; font-size: 12px; }
  .oh-mobile-meta-label { font-weight: 600; color: var(--oh-light); text-transform: uppercase; font-size: 10px; letter-spacing: 0.04em; }
  .oh-mobile-meta-value { font-weight: 600; color: var(--oh-dark); }
  .oh-mobile-amount { color: var(--oh-green); font-weight: 800; }
  .oh-mobile-card-actions { display: grid; grid-template-columns: 1fr auto; gap: 8px; }
  .oh-mobile-btn { display: inline-flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 12px; border-radius: var(--oh-radius-xs); font-size: 13px; font-weight: 700; cursor: pointer; transition: all 0.15s; border: 1px solid; }
  .oh-mobile-btn-view { background: var(--oh-green); color: #fff; border-color: var(--oh-green); }
  .oh-mobile-btn-cancel-active { flex: 0 0 auto !important; padding: 5px 7px !important; gap: 3px !important; min-height: 28px; font-size: 10px !important; white-space: nowrap; background: #dc2626; color: #fff; border-color: #dc2626; }
  .oh-empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 48px 20px; }
  @media (min-width: 768px) { .oh-empty-state { padding: 64px 32px; } }
  .oh-empty-icon-wrap { width: 72px; height: 72px; border-radius: 20px; background: #f9fafb; display: flex; align-items: center; justify-content: center; margin-bottom: 16px; border: 1px solid var(--oh-border-light); box-shadow: var(--oh-shadow-sm); }
  .oh-empty-icon-amber { background: #fffbeb; border-color: #fde68a; }
  .oh-empty-icon-red { background: #fef2f2; border-color: #fecaca; }
  .oh-empty-title { font-size: 18px; font-weight: 800; color: var(--oh-dark); margin: 0 0 8px; letter-spacing: -0.01em; }
  .oh-empty-desc { font-size: 14px; color: var(--oh-light); max-width: 380px; line-height: 1.6; margin: 0 0 20px; }
  .oh-empty-actions { display: flex; flex-direction: column; gap: 8px; width: 100%; max-width: 320px; }
  @media (min-width: 480px) { .oh-empty-actions { flex-direction: row; justify-content: center; } }
  .oh-btn-primary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 11px 18px; background: var(--oh-green); color: #fff; border: none; border-radius: var(--oh-radius-sm); font-size: 14px; font-weight: 700; cursor: pointer; transition: all 0.15s; box-shadow: 0 2px 8px rgba(20,83,45,0.15); }
  .oh-btn-secondary { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 11px 18px; background: #fff; color: var(--oh-dark); border: 1px solid var(--oh-border); border-radius: var(--oh-radius-sm); font-size: 14px; font-weight: 600; cursor: pointer; }
  .oh-btn-danger { display: inline-flex; align-items: center; justify-content: center; gap: 8px; padding: 11px 18px; background: #dc2626; color: #fff; border: 1px solid #dc2626; border-radius: var(--oh-radius-sm); font-size: 14px; font-weight: 700; cursor: pointer; }
  .oh-btn-block { width: 100%; }
  .oh-loading-wrap { position: relative; width: 56px; height: 56px; }
  .oh-spinner { position: absolute; inset: 0; border: 3px solid #f3f4f6; border-top-color: var(--oh-green); border-radius: 50%; animation: oh-spin 0.8s linear infinite; }
  .oh-spinner-ring { position: absolute; inset: 8px; border: 2px solid #f0fdf4; border-radius: 50%; }
  .oh-info-banner { display: flex; gap: 12px; padding: 14px 16px; margin-top: 16px; background: linear-gradient(135deg, #f0fdf4, #f7fef9); border: 1px solid #bbf7d0; border-radius: var(--oh-radius); }
  .oh-info-icon { width: 32px; height: 32px; border-radius: 8px; background: #fff; border: 1px solid #bbf7d0; display: flex; align-items: center; justify-content: center; color: var(--oh-green); flex-shrink: 0; }
  .oh-info-content { flex: 1; min-width: 0; }
  .oh-info-title { font-size: 13px; font-weight: 800; color: var(--oh-green); margin: 0 0 2px; }
  .oh-info-text { font-size: 12px; font-weight: 500; color: #166534; margin: 0; line-height: 1.5; }
  .oh-cancel-modal .ant-modal-content { border-radius: 16px !important; overflow: hidden; padding: 0 !important; }
  .oh-cancel-content { padding: 0; }
  .oh-cancel-icon-wrap { position: relative; padding: 20px 20px 0; display: flex; align-items: flex-start; justify-content: space-between; }
  .oh-cancel-icon-bg { width: 48px; height: 48px; border-radius: 12px; background: #fef2f2; border: 1px solid #fecaca; display: flex; align-items: center; justify-content: center; }
  .oh-cancel-close { width: 32px; height: 32px; border-radius: 8px; background: #f9fafb; border: 1px solid var(--oh-border-light); display: flex; align-items: center; justify-content: center; cursor: pointer; color: var(--oh-light); }
  .oh-cancel-title { font-size: 18px; font-weight: 900; color: var(--oh-dark); margin: 16px 20px 8px; }
  .oh-cancel-desc { font-size: 13px; color: var(--oh-mid); margin: 0 20px 16px; line-height: 1.5; }
  .oh-cancel-details { margin: 0 20px 16px; background: #f9fafb; border: 1px solid var(--oh-border-light); border-radius: var(--oh-radius-sm); overflow: hidden; }
  .oh-cancel-detail-row { display: flex; align-items: center; justify-content: space-between; padding: 10px 12px; border-bottom: 1px solid var(--oh-border-light); }
  .oh-cancel-detail-row:last-child { border-bottom: none; }
  .oh-cancel-detail-label { font-size: 11px; font-weight: 700; color: var(--oh-light); text-transform: uppercase; letter-spacing: 0.04em; }
  .oh-cancel-detail-value { font-size: 13px; font-weight: 700; color: var(--oh-dark); }
  .oh-cancel-status { display: inline-flex; padding: 2px 8px; border-radius: 100px; background: #fffbeb; color: #92400e; border: 1px solid #fde68a; font-size: 11px; }
  .oh-cancel-warning { display: flex; gap: 8px; margin: 0 20px 20px; padding: 10px 12px; background: #fffbeb; border: 1px solid #fde68a; border-radius: var(--oh-radius-sm); font-size: 11px; font-weight: 500; color: #92400e; line-height: 1.4; }
  .oh-cancel-actions { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; padding: 0 20px 20px; }
  .oh-drawer .ant-drawer-body { padding: 16px; }
  .oh-drawer-title { display: flex; align-items: center; gap: 8px; font-weight: 800; font-family: var(--oh-font); }
  .oh-drawer-body { display: flex; flex-direction: column; gap: 16px; padding-bottom: 24px; }
  .oh-drawer-field { display: flex; flex-direction: column; gap: 6px; }
  .oh-drawer-label { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 700; color: var(--oh-light); text-transform: uppercase; letter-spacing: 0.04em; }
`;

export default OrderHistoryPage;
