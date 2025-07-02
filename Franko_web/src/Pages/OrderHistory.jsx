import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrdersByCustomer } from "../Redux/Slice/orderSlice";
import { DatePicker, Table, Spin, Tooltip, Button, Card, Input, Select } from "antd";
import { Eye, ShoppingCart, Calendar, Clock, Search, Filter, Download, Package, TrendingUp, CheckCircle, AlertCircle, XCircle } from "lucide-react";
import moment from "moment";
import OrderModal from "../Component/OrderModal";

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
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [viewMode, setViewMode] = useState("table");

  const customerObject = JSON.parse(localStorage.getItem("customer"));
  const customerId = customerObject?.customerAccountNumber;

  useEffect(() => {
    if (customerId) {
      const [from, to] = dateRange.map((date) => date.format("MM/DD/YYYY"));
      dispatch(fetchOrdersByCustomer({ from, to, customerId }));
    }
  }, [dateRange, customerId, dispatch]);

  const handleDateChange = (dates) => {
    if (dates) {
      setDateRange(dates);
    }
  };

  const handleViewOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setIsModalVisible(true);
  };

  const handleModalClose = () => {
    setIsModalVisible(false);
  };

  const handleRefresh = () => {
    if (customerId) {
      const [from, to] = dateRange.map((date) => date.format("MM/DD/YYYY"));
      dispatch(fetchOrdersByCustomer({ from, to, customerId }));
    }
  };

  const getStatusConfig = (status) => {
    const statusConfig = {
      'Pending': { color: 'bg-amber-100 text-amber-800 border-amber-200', icon: Clock, iconColor: 'text-amber-600' },
      'Processing': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: TrendingUp, iconColor: 'text-blue-600' },
      'Wrong Number': { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: XCircle, iconColor: 'text-purple-600' },
      'Delivered': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, iconColor: 'text-green-600' },
      'Completed': { color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle, iconColor: 'text-green-600' },
      'Cancelled': { color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle, iconColor: 'text-red-600' },
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
          <span className="font-mono text-sm bg-gradient-to-r from-gray-50 to-gray-100 px-3 py-1.5 rounded-lg border shadow-sm">
            #{text}
          </span>
        </div>
      ),
    },
    {
      title: (
        <div className="flex items-center gap-2 font-semibold text-gray-700">
          <Calendar className="w-4 h-4" />
          Order Date
        </div>
      ),
      dataIndex: "orderDate",
      key: "orderDate",
      render: (text) => (
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-blue-50 rounded-md">
            <Calendar className="w-3.5 h-3.5 text-blue-600" />
          </div>
          <span className="text-gray-700 font-medium">{text}</span>
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
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.color} font-medium text-xs`}>
            <IconComponent className={`w-3.5 h-3.5 ${config.iconColor}`} />
            {status}
          </div>
        );
      },
      filters: [
        { text: 'Pending', value: 'Pending' },
        { text: 'Processing', value: 'Processing' },
        { text: 'Wrong Number', value: 'Wrong Number' },
        { text: 'Delivered', value: 'Delivered' },
        { text: 'Completed', value: 'Completed' },
        { text: 'Cancelled', value: 'Cancelled' },
      ],
      onFilter: (value, record) => record.orderCycle === value,
    },
    {
      title: (
        <div className="flex items-center gap-2 font-semibold text-gray-700">
          Actions
        </div>
      ),
      key: "action",
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Tooltip title="View Order Details">
            <Button
              type="text"
              size="middle"
              className="hover:bg-blue-50 hover:text-blue-600 transition-all duration-200 border-0 shadow-sm hover:shadow-md"
              onClick={() => handleViewOrder(record.orderId)}
              icon={<Eye className="w-4 h-4" />}
            >
              View
            </Button>
          </Tooltip>
        </div>
      ),
    },
  ];

  const transformedOrders = (orders || [])
    .map((order, index) => ({
      key: index,
      orderId: order?.orderCode || "N/A",
      orderDate: moment(order?.orderDate).format("MM/DD/YYYY") || "N/A",
      customerName: order?.fullName || "N/A",
      orderCycle: order?.orderCycle || "N/A",
    }))
    .filter(order => {
      const matchesSearch = order.orderId.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || order.orderCycle === statusFilter;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) =>
      moment(b.orderDate).isBefore(moment(a.orderDate)) ? 1 : -1
    );

  const getOrderStats = () => {
    const total = orders.length;
    const completed = orders.filter(order => ['Delivered', 'Completed'].includes(order.orderCycle)).length;
    const inProgress = orders.filter(order => ['Processing', 'Pending', 'Wrong Number'].includes(order.orderCycle)).length;
    const cancelled = orders.filter(order => order.orderCycle === 'Cancelled').length;
    
    return { total, completed, inProgress, cancelled };
  };

  const stats = getOrderStats();

  const EmptyState = () => (
    <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl border-2 border-dashed border-gray-300">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-400/20 to-purple-600/20 rounded-full blur-3xl scale-150"></div>
        <div className="relative bg-white p-8 rounded-2xl shadow-lg inline-block">
          <ShoppingCart className="w-20 h-20 mx-auto text-gray-400 mb-6" />
          <h3 className="text-2xl font-bold text-gray-900 mb-3">No Orders Found</h3>
          <p className="text-gray-600 mb-6 max-w-md">
            {searchTerm || statusFilter !== "all" 
              ? "No orders match your current filters. Try adjusting your search or filter criteria."
              : "You haven't placed any orders yet. Start shopping to see your order history here."
            }
          </p>
          {!searchTerm && statusFilter === "all" && (
            <Button
              type="primary"
              size="large"
              className="bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 border-0 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              onClick={() => (window.location.href = "/home")}
              icon={<ShoppingCart className="w-5 h-5" />}
            >
              Start Shopping
            </Button>
          )}
        </div>
      </div>
    </div>
  );

  const LoadingState = () => (
    <div className="text-center py-16 rounded-2xl">
      <div className="relative">
      
        <div className="relative">
          <Spin size="large" className="mb-6" />
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Loading Your Orders</h3>
          <p className="text-gray-600">Please wait while we fetch your order history...</p>
        </div>
      </div>
    </div>
  );

  const ErrorState = () => (
    <div className="text-center py-16 ">
      <div className="relative">
        <div className="bg-white p-8 rounded-2xl shadow-lg inline-block">
          <div className="text-red-500 mb-6">
            <Package className="w-20 h-20 mx-auto" />
          </div>
          <h3 className="text-2xl font-bold text-red-900 mb-3">Unable to Load Orders</h3>
          <p className="text-red-700 mb-6 max-w-md">{error}</p>
          <Button 
            type="primary" 
            danger 
            size="large"
            className="shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
            onClick={handleRefresh}
         
          >
            Try Again
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Enhanced Header Section */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg">
                <Package className="w-4 h-4 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                  Order History
                </h1>
                <p className="text-gray-600 text-xs">Track and manage all your previous orders</p>
              </div>
            </div>
            <Button
              type="text"
              size="large"
              onClick={handleRefresh}
              className="hover:bg-gray-100 bg-green-200 text-white rounded-full transition-all duration-200"
           
              loading={loading}
            >
              Refresh
            </Button>
          </div>
        </div>

        {/* Enhanced Statistics Cards */}
        {!loading && !error && orders.length > 0 && (
          <div className="grid grid-row-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xl font-bold text-blue-700">{stats.total}</p>
                  <p className="text-blue-600 font-medium">Total Orders</p>
                </div>
                <div className="p-3 bg-blue-200 rounded-full">
                  <Package className="w-6 h-6 text-blue-700" />
                </div>
              </div>
            </Card>
            
            <Card className="bg-gradient-to-br from-green-50 to-green-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-green-700">{stats.completed}</p>
                  <p className="text-green-600 font-medium">Completed</p>
                </div>
                <div className="p-3 bg-green-200 rounded-full">
                  <CheckCircle className="w-6 h-6 text-green-700" />
                </div>
              </div>
            </Card>
            
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-orange-700">{stats.inProgress}</p>
                  <p className="text-orange-600 font-medium">In Progress</p>
                </div>
                <div className="p-3 bg-orange-200 rounded-full">
                  <Clock className="w-6 h-6 text-orange-700" />
                </div>
              </div>
            </Card>

            <Card className="bg-gradient-to-br from-red-50 to-red-100 border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-3xl font-bold text-red-700">{stats.cancelled}</p>
                  <p className="text-red-600 font-medium">Cancelled</p>
                </div>
                <div className="p-3 bg-red-200 rounded-full">
                  <XCircle className="w-6 h-6 text-red-700" />
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Enhanced Filters Section */}
        {orders?.length > 0 && (
          <Card className="mb-8 bg-white/80 backdrop-blur-sm border-0 shadow-lg">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date Range
                  </label>
                  <DatePicker.RangePicker
                    value={dateRange}
                    onChange={handleDateChange}
                    format="MM/DD/YYYY"
                    className="w-full shadow-sm"
                    size="middle"
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <Search className="w-5 h-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Search Orders
                  </label>
                  <Input
                    placeholder="Enter Order ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="shadow-sm"
                    prefix={<Search className="w-4 h-4 text-gray-400" />}
                  />
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <Filter className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Filter Status
                  </label>
                  <Select
                    value={statusFilter}
                    onChange={setStatusFilter}
                    className="w-full shadow-sm"
                    size="middle"
                  >
                    <Select.Option value="all">All Status</Select.Option>
                    <Select.Option value="Pending">Pending</Select.Option>
                    <Select.Option value="Processing">Processing</Select.Option>
                    <Select.Option value="Wrong Number">Wrong Number</Select.Option>
                    <Select.Option value="Delivered">Delivered</Select.Option>
                    <Select.Option value="Completed">Completed</Select.Option>
                    <Select.Option value="Cancelled">Cancelled</Select.Option>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <Download className="w-5 h-5 text-indigo-600" />
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Export Data
                  </label>
                  <Button
                    className="w-full shadow-sm"
                    icon={<Download className="w-4 h-4" />}
                    disabled={transformedOrders.length === 0}
                  >
                    Export CSV
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Main Content */}
        <Card className="bg-white/90 backdrop-blur-sm border-0 shadow-xl rounded-2xl overflow-hidden">
          {loading ? (
            <LoadingState />
          ) : error ? (
            <ErrorState />
          ) : transformedOrders.length > 0 ? (
            <div className="overflow-hidden">
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
          ) : (
            <EmptyState />
          )}
        </Card>

        {/* Order Modal */}
        <OrderModal
          orderId={selectedOrderId}
          isModalVisible={isModalVisible}
          onClose={handleModalClose}
        />
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
      `}</style>
    </div>
  );
};

export default OrderHistoryPage;