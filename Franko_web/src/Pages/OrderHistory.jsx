import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrdersByCustomer } from "../Redux/Slice/orderSlice";
import { DatePicker, Table, Spin, Tooltip, Button, Card, Input, Select, Drawer } from "antd";
import { Eye, ShoppingCart, Calendar, Clock, Search, Filter, Download, Package, TrendingUp, CheckCircle, AlertCircle, XCircle, FileText, UserX, Menu } from "lucide-react";
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

  // Check if customer exists in localStorage
  const customerObject = (localStorage.getItem("customer") || "null");
  const customerId = customerObject?.customerAccountNumber;
  const hasValidCustomer = customerObject && customerId;

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    if (hasValidCustomer) {
      const [from, to] = dateRange.map((date) => date.format("MM/DD/YYYY"));
      dispatch(fetchOrdersByCustomer({ from, to, customerId }));
    }
  }, [dateRange, customerId, dispatch, hasValidCustomer]);

  const handleDateChange = (dates) => {
    if (dates) {
      setDateRange(dates);
    }
  };

  const handleViewOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setIsOrderModalVisible(true);
  };

  const handleOrderModalClose = () => {
    setIsOrderModalVisible(false);
    setSelectedOrderId(null);
  };

  const handleAuthModalClose = () => {
    setIsAuthModalVisible(false);
  };

  const handleSignInClick = () => {
    setIsAuthModalVisible(true);
  };

  const handleRefresh = () => {
    if (hasValidCustomer) {
      const [from, to] = dateRange.map((date) => date.format("MM/DD/YYYY"));
      dispatch(fetchOrdersByCustomer({ from, to, customerId }));
    }
  };

  // Transform orders for display
  const transformedOrders = (orders || [])
    .map((order, index) => ({
      key: index,
      orderId: order?.orderCode || "N/A",
      orderDate: moment(order?.orderDate).format("MM/DD/YYYY") || "N/A",
      customerName: order?.fullName || "N/A",
      orderCycle: order?.orderCycle || "N/A",
      orderDateMoment: moment(order?.orderDate),
    }))
    .filter(order => {
      const matchesSearch = order.orderId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || order.orderCycle === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => b.orderDateMoment.valueOf() - a.orderDateMoment.valueOf());

  // PDF Export function
  const handleExportPDF = () => {
    if (transformedOrders.length === 0) return;

    const printWindow = window.open('', '_blank');
    
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Order History Report</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            .header { text-align: center; margin-bottom: 30px; }
            .header h1 { color: #333; margin-bottom: 10px; }
            .date-range { text-align: center; margin-bottom: 20px; color: #666; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
            th, td { border: 1px solid #ddd; padding: 12px; text-left; }
            th { background-color: #f5f5f5; font-weight: bold; }
            .status-badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Order History Report</h1>
            <p>Customer: ${customerObject?.fullName || 'N/A'}</p>
          </div>
          
          <div class="date-range">
            <strong>Report Period:</strong> ${dateRange[0].format('MM/DD/YYYY')} - ${dateRange[1].format('MM/DD/YYYY')}
          </div>
          
          <table>
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Order Date</th>
                <th>Status</th>
                <th>Customer Name</th>
              </tr>
            </thead>
            <tbody>
              ${transformedOrders.map(order => `
                <tr>
                  <td>#${order.orderId}</td>
                  <td>${order.orderDate}</td>
                  <td>${order.orderCycle}</td>
                  <td>${order.customerName}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          
          <div class="footer">
            <p>Generated on: ${moment().format('MM/DD/YYYY HH:mm:ss')}</p>
            <p>Total Orders: ${transformedOrders.length}</p>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
    
    printWindow.onload = () => {
      printWindow.print();
      printWindow.close();
    };
  };

  const getStatusConfig = (status) => {
    const statusConfig = {
      'Pending': { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock, iconColor: 'text-amber-600' },
      'Processing': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: TrendingUp, iconColor: 'text-blue-600' },
      'Order Placement': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: FileText, iconColor: 'text-blue-600' },
      'Wrong Number': { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: XCircle, iconColor: 'text-purple-600' },
      'Delivery': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, iconColor: 'text-green-600' },
      'Completed': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, iconColor: 'text-green-600' },
      'Cancelled': { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, iconColor: 'text-red-600' },
      'Unreachable': { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertCircle, iconColor: 'text-gray-600' },
      'Not Answered': { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: AlertCircle, iconColor: 'text-orange-600' },
      'Multiple order': { color: 'bg-indigo-100 text-indigo-800 border-indigo-200', icon: UserX, iconColor: 'text-indigo-600' },
    };
    return statusConfig[status] || { color: 'bg-gray-100 text-gray-800 border-gray-200', icon: AlertCircle, iconColor: 'text-gray-600' };
  };

  const columns = [
    {
      title: (
        <div className="flex items-center gap-2 font-semibold text-gray-700">
          <Package className="w-4 h-4" />
          Order ID
        </div>
      ),
      dataIndex: "orderId",
      key: "orderId",
      render: (text) => (
        <div className="flex items-center gap-2">
          <span className="font-mono text-xs md:text-sm bg-gradient-to-r from-gray-50 to-gray-100 px-2 md:px-3 py-1 md:py-1.5 rounded-lg border shadow-sm">
            #{text}
          </span>
        </div>
      ),
    },
    {
      title: (
        <div className="flex items-center gap-2 font-semibold text-gray-700">
          <Calendar className="w-4 h-4" />
          Date
        </div>
      ),
      dataIndex: "orderDate",
      key: "orderDate",
      render: (text) => (
        <div className="flex items-center gap-2">
          <div className="p-1 md:p-1.5 bg-blue-50 rounded-md">
            <Calendar className="w-3 h-3 md:w-3.5 md:h-3.5 text-blue-600" />
          </div>
          <span className="text-xs md:text-sm text-gray-700 font-medium">{text}</span>
        </div>
      ),
      sorter: (a, b) => moment(a.orderDate).unix() - moment(b.orderDate).unix(),
    },
    {
      title: (
        <div className="flex items-center gap-2 font-semibold text-gray-700">
          <Clock className="w-4 h-4" />
          Status
        </div>
      ),
      dataIndex: "orderCycle",
      key: "orderCycle",
      render: (status) => {
        const config = getStatusConfig(status);
        const IconComponent = config.icon;
        return (
          <div className={`inline-flex items-center gap-1.5 md:gap-2 px-2 md:px-3 py-1 md:py-1.5 rounded-full border ${config.color} font-medium text-xs`}>
            <IconComponent className={`w-3 h-3 md:w-3.5 md:h-3.5 ${config.iconColor}`} />
            <span className="hidden sm:inline">{status}</span>
          </div>
        );
      },
      filters: [
        { text: 'Pending', value: 'Pending' },
        { text: 'Processing', value: 'Processing' },
        { text: 'Order Placement', value: 'Order Placement' },
        { text: 'Wrong Number', value: 'Wrong Number' },
        { text: 'Delivered', value: 'Delivery' },
        { text: 'Completed', value: 'Completed' },
        { text: 'Cancelled', value: 'Cancelled' },
        { text: 'Unreachable', value: 'Unreachable' },
        { text: 'Not Answered', value: 'Not Answered' },
        { text: 'Multiple order', value: 'Multiple order' },
      ],
      onFilter: (value, record) => record.orderCycle === value,
    },
    {
      title: "Actions",
      key: "action",
      render: (_, record) => (
        <Tooltip title="View Details">
          <Button
            type="text"
            size="small"
            className="hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
            onClick={() => handleViewOrder(record.orderId)}
            icon={<Eye className="w-3.5 h-3.5 md:w-4 md:h-4" />}
          >
            <span className="hidden md:inline">View</span>
          </Button>
        </Tooltip>
      ),
    },
  ];

  const getOrderStats = () => {
    const total = orders.length;
    const completed = orders.filter(order => ['Delivery', 'Completed'].includes(order.orderCycle)).length;
    const inProgress = orders.filter(order => ['Processing', 'Pending', 'Wrong Number'].includes(order.orderCycle)).length;
    const cancelled = orders.filter(order => order.orderCycle === 'Cancelled').length;


    
    return { total, completed, inProgress, cancelled };
  };

  const stats = getOrderStats();

  // Mobile Order Card Component
  const MobileOrderCard = ({ order }) => {
    const config = getStatusConfig(order.orderCycle);
    const IconComponent = config.icon;

    return (
      <Card 
        className="mb-3 shadow-md hover:shadow-lg transition-all duration-200 border border-gray-200 rounded-xl"
        onClick={() => handleViewOrder(order.orderId)}
      >
        <div className="space-y-3">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-gray-500" />
                <span className="font-mono text-sm font-semibold text-gray-900">#{order.orderId}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="w-3.5 h-3.5" />
                <span>{order.orderDate}</span>
              </div>
            </div>
            <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border ${config.color} text-xs font-medium`}>
              <IconComponent className={`w-3.5 h-3.5 ${config.iconColor}`} />
              <span>{order.orderCycle}</span>
            </div>
          </div>
          
          <div className="pt-3 border-t border-gray-100">
            <Button
              type="primary"
              size="small"
              className="w-full bg-gradient-to-r from-blue-500 to-blue-600 border-0"
              icon={<Eye className="w-4 h-4" />}
            >
              View Details
            </Button>
          </div>
        </div>
      </Card>
    );
  };

  // Filters Drawer for Mobile
  const FiltersDrawer = () => (
    <Drawer
      title={
        <div className="flex items-center gap-2">
          <Filter className="w-5 h-5 text-blue-600" />
          <span>Filters & Search</span>
        </div>
      }
      placement="bottom"
      height="auto"
      open={filtersDrawerOpen}
      onClose={() => setFiltersDrawerOpen(false)}
      className="mobile-filters-drawer"
    >
      <div className="space-y-4 pb-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Calendar className="w-4 h-4 inline mr-2" />
            Date Range
          </label>
          <DatePicker.RangePicker
            value={dateRange}
            onChange={handleDateChange}
            format="MM/DD/YYYY"
            className="w-full"
            size="large"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Search className="w-4 h-4 inline mr-2" />
            Search Order ID
          </label>
          <Input
            placeholder="Enter Order ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="large"
            prefix={<Search className="w-4 h-4 text-gray-400" />}
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <Filter className="w-4 h-4 inline mr-2" />
            Filter by Status
          </label>
          <Select
            value={statusFilter}
            onChange={setStatusFilter}
            className="w-full"
            size="large"
          >
            <Select.Option value="all">All Status</Select.Option>
            <Select.Option value="Pending">Pending</Select.Option>
            <Select.Option value="Processing">Processing</Select.Option>
            <Select.Option value="Wrong Number">Wrong Number</Select.Option>
            <Select.Option value="Delivery">Delivery</Select.Option>
            <Select.Option value="Completed">Completed</Select.Option>
            <Select.Option value="Cancelled">Cancelled</Select.Option>
            <Select.Option value="Unreachable">Unreachable</Select.Option>
            <Select.Option value="Not Answered">Not Answered</Select.Option>
            <Select.Option value="Multiple order">Multiple order</Select.Option>
          </Select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            <FileText className="w-4 h-4 inline mr-2" />
            Export
          </label>
          <Button
            className="w-full"
            size="large"
            icon={<FileText className="w-4 h-4" />}
            disabled={transformedOrders.length === 0}
            onClick={handleExportPDF}
          >
            Export PDF
          </Button>
        </div>
      </div>
    </Drawer>
  );

  const NoCustomerState = () => (
    <div className="text-center py-12 md:py-16 px-4">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg inline-block max-w-md">
        <UserX className="w-16 h-16 md:w-20 md:h-20 mx-auto text-gray-400 mb-4 md:mb-6" />
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">Customer Not Found</h3>
        <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
          Please log in to view your order history.
        </p>
        <Button
          type="primary"
          size="large"
          className="w-full md:w-auto bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-0 shadow-lg"
          onClick={handleSignInClick}
          icon={<UserX className="w-5 h-5" />}
        >
          Sign In
        </Button>
      </div>
    </div>
  );

  const EmptyState = () => (
    <div className="text-center py-12 md:py-16 px-4">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg inline-block max-w-md">
        <ShoppingCart className="w-16 h-16 md:w-20 md:h-20 mx-auto text-gray-400 mb-4 md:mb-6" />
        <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-2 md:mb-3">No Orders Found</h3>
        <p className="text-sm md:text-base text-gray-600 mb-4 md:mb-6">
          {searchTerm || statusFilter !== "all" 
            ? "No orders match your filters."
            : "You haven't placed any orders yet."
          }
        </p>
        {!searchTerm && statusFilter === "all" && (
          <Button
            type="primary"
            size="large"
            className="w-full md:w-auto bg-gradient-to-r from-red-500 to-red-600 border-0 shadow-lg"
            onClick={() => (window.location.href = "/home")}
            icon={<ShoppingCart className="w-5 h-5" />}
          >
            Start Shopping
          </Button>
        )}
      </div>
    </div>
  );

  const LoadingState = () => (
    <div className="text-center py-16">
      <Spin size="large" className="mb-6" />
      <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading Orders</h3>
      <p className="text-gray-600 text-sm">Please wait...</p>
    </div>
  );

  const ErrorState = () => (
    <div className="text-center py-12 px-4">
      <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg inline-block max-w-md">
        <Package className="w-16 h-16 md:w-20 md:h-20 mx-auto text-red-500 mb-4 md:mb-6" />
        <h3 className="text-xl md:text-2xl font-bold text-red-900 mb-2 md:mb-3">Unable to Load Orders</h3>
        <p className="text-sm md:text-base text-red-700 mb-4 md:mb-6">{error}</p>
        <Button 
          type="primary" 
          danger 
          size="large"
          className="w-full md:w-auto shadow-lg"
          onClick={handleRefresh}
        >
          Try Again
        </Button>
      </div>
    </div>
  );

  if (!hasValidCustomer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
        <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
          <div className="mb-6 md:mb-8">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                <Package className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  Order History
                </h1>
                <p className="text-xs md:text-sm text-gray-600">Track your orders</p>
              </div>
            </div>
          </div>

          <Card className="bg-white shadow-xl rounded-2xl border-0">
            <NoCustomerState />
          </Card>

          <AuthModal
            open={isAuthModalVisible}
            onClose={handleAuthModalClose}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-3 md:px-4 py-4 md:py-8">
        {/* Header */}
        <div className="mb-4 md:mb-8">
          <div className="flex items-center justify-between mb-4 md:mb-6">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                <Package className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  Order History
                </h1>
                <p className="text-xs md:text-sm text-gray-600">Track your orders</p>
              </div>
            </div>
            
            {/* Mobile Filter Button */}
            <Button
              className="md:hidden"
              icon={<Filter className="w-5 h-5" />}
              onClick={() => setFiltersDrawerOpen(true)}
              size="large"
            >
              Filters
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {!loading && !error && orders.length > 0 && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 mb-4 md:mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-md hover:shadow-lg transition-all">
              <div className="flex flex-col md:flex-row items-center md:justify-between gap-2">
                <div className="text-center md:text-left">
                  <p className="text-2xl md:text-3xl font-bold text-blue-700">{stats.total}</p>
                  <p className="text-xs md:text-sm text-blue-600 font-medium">Total</p>
                </div>
                <div className="p-2 md:p-3 bg-blue-200 rounded-full">
                  <Package className="w-4 h-4 md:w-6 md:h-6 text-blue-700" />
                </div>
              </div>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-md hover:shadow-lg transition-all">
              <div className="flex flex-col md:flex-row items-center md:justify-between gap-2">
                <div className="text-center md:text-left">
                  <p className="text-2xl md:text-3xl font-bold text-green-700">{stats.completed}</p>
                  <p className="text-xs md:text-sm text-green-600 font-medium">Completed</p>
                </div>
                <div className="p-2 md:p-3 bg-green-200 rounded-full">
                  <CheckCircle className="w-4 h-4 md:w-6 md:h-6 text-green-700" />
                </div>
              </div>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-md hover:shadow-lg transition-all">
              <div className="flex flex-col md:flex-row items-center md:justify-between gap-2">
                <div className="text-center md:text-left">
                  <p className="text-2xl md:text-3xl font-bold text-orange-700">{stats.inProgress}</p>
                  <p className="text-xs md:text-sm text-orange-600 font-medium">Pending</p>
                </div>
                <div className="p-2 md:p-3 bg-orange-200 rounded-full">
                  <Clock className="w-4 h-4 md:w-6 md:h-6 text-orange-700" />
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-0 shadow-md hover:shadow-lg transition-all">
              <div className="flex flex-col md:flex-row items-center md:justify-between gap-2">
                <div className="text-center md:text-left">
                  <p className="text-2xl md:text-3xl font-bold text-red-700">{stats.cancelled}</p>
                  <p className="text-xs md:text-sm text-red-600 font-medium">Cancelled</p>
                </div>
                <div className="p-2 md:p-3 bg-red-200 rounded-full">
                  <XCircle className="w-4 h-4 md:w-6 md:h-6 text-red-700" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Desktop Filters */}
        {orders?.length > 0 && (
          <Card className="hidden md:block mb-8 bg-white shadow-lg border-0">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Calendar className="w-4 h-4 inline mr-2" />
                  Date Range
                </label>
                <DatePicker.RangePicker
                  value={dateRange}
                  onChange={handleDateChange}
                  format="MM/DD/YYYY"
                  className="w-full"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Search className="w-4 h-4 inline mr-2" />
                  Search
                </label>
                <Input
                  placeholder="Order ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  prefix={<Search className="w-4 h-4 text-gray-400" />}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Filter className="w-4 h-4 inline mr-2" />
                  Status
                </label>
                <Select
                  value={statusFilter}
                  onChange={setStatusFilter}
                  className="w-full"
                >
                  <Select.Option value="all">All Status</Select.Option>
                  <Select.Option value="Pending">Pending</Select.Option>
                  <Select.Option value="Processing">Processing</Select.Option>
                  <Select.Option value="Wrong Number">Wrong Number</Select.Option>
                  <Select.Option value="Delivery">Delivery</Select.Option>
                  <Select.Option value="Completed">Completed</Select.Option>
                  <Select.Option value="Cancelled">Cancelled</Select.Option>
                  <Select.Option value="Unreachable">Unreachable</Select.Option>
                  <Select.Option value="Not Answered">Not Answered</Select.Option>
                  <Select.Option value="Multiple order">Multiple order</Select.Option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <FileText className="w-4 h-4 inline mr-2" />
                  Export
                </label>
                <Button
                  className="w-full"
                  icon={<FileText className="w-4 h-4" />}
                  disabled={transformedOrders.length === 0}
                  onClick={handleExportPDF}
                >
                  Export PDF
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Main Content */}
        <Card className="bg-white shadow-xl rounded-2xl border-0 overflow-hidden">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState />
          ) : transformedOrders.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-hidden">
                <Table
                  dataSource={transformedOrders}
                  columns={columns}
                  rowKey="key"
                  pagination={{
                    pageSize: 10,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total, range) =>
                      `Showing ${range[0]}-${range[1]} of ${total} orders`,
                    className: "mt-6 px-4",
                  }}
                  className="custom-table"
                  size="middle"
                  scroll={{ x: 800 }}
                  rowClassName="hover:bg-gradient-to-r hover:from-blue-50/50 hover:to-indigo-50/50 transition-all duration-200"
                />
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden p-4">
                {transformedOrders.map((order) => (
                  <MobileOrderCard key={order.key} order={order} />
                ))}
                
                {/* Mobile Pagination */}
                {transformedOrders.length > 10 && (
                  <div className="mt-4 text-center text-sm text-gray-600">
                    Showing {transformedOrders.length} order{transformedOrders.length !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </>
          ) : (
            <EmptyState />
          )}
        </Card>

        {/* Order Modal */}
        <OrderModal
          orderId={selectedOrderId}
          isModalVisible={isOrderModalVisible}
          onClose={handleOrderModalClose}
        />

        {/* Auth Modal */}
        <AuthModal
          open={isAuthModalVisible}
          onClose={handleAuthModalClose}
        />

        {/* Mobile Filters Drawer */}
        <FiltersDrawer />
      </div>

      <style jsx>{`
        .custom-table .ant-table-thead > tr > th {
          background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
          border-bottom: 2px solid #e2e8f0;
          font-weight: 600;
          padding: 16px 12px;
        }
        
        .custom-table .ant-table-tbody > tr > td {
          border-bottom: 1px solid #f1f5f9;
          padding: 16px 12px;
        }
        
        .custom-table .ant-table-tbody > tr:last-child > td {
          border-bottom: none;
        }

        .custom-table .ant-pagination {
          margin-top: 24px;
          margin-bottom: 8px;
        }

        .custom-table .ant-pagination-item {
          border-radius: 8px;
        }

        .custom-table .ant-pagination-item-active {
          background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
          border-color: #3b82f6;
        }

        .mobile-filters-drawer .ant-drawer-body {
          padding-bottom: 80px;
        }

        @media (max-width: 768px) {
          .custom-table .ant-table-thead > tr > th {
            padding: 12px 8px;
            font-size: 12px;
          }
          
          .custom-table .ant-table-tbody > tr > td {
            padding: 12px 8px;
            font-size: 12px;
          }
        }
      `}</style>
    </div>
  );
};

export default OrderHistoryPage;