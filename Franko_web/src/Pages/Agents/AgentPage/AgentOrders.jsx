
import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrdersByThirdParty } from "../../../Redux/Slice/orderSlice";
import {
  DatePicker,
  Table,
  Spin,
  Tag,
  Checkbox,
  Button,
  message,
  Card,
  Statistic,
  Row,
  Col,
  Space,
  Input,
  Select,
  Badge,
  Tooltip,
  Typography,
  Divider,
  Alert,
} from "antd";
import {
  EyeOutlined,
  DownloadOutlined,
  SearchOutlined,
  FilterOutlined,
  CalendarOutlined,
  ShoppingCartOutlined,
  FileExcelOutlined,
  ReloadOutlined,
} from "@ant-design/icons";
import * as XLSX from "xlsx";
import dayjs from "dayjs";
import OrderModal from "../../../Component/OrderModal";

const { RangePicker } = DatePicker;
const { Option } = Select;
const { Title, Text } = Typography;

const AgentOrders = () => {
  const dispatch = useDispatch();
  const ordersData = useSelector((state) => state.orders ?? {});
  const orders = ordersData.orders ?? [];
  const loading = ordersData.loading ?? false;
  const error = ordersData.error ?? null;

  const [dateRange, setDateRange] = useState([
    dayjs("2000-01-01"),
    dayjs().add(1, "day"),
  ]);
  const [searchText, setSearchText] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [viewedOrders, setViewedOrders] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);

  const customerObject = (localStorage.getItem("customer"));
  const ThirdPartyAccountNumber = customerObject?.customerAccountNumber;

  useEffect(() => {
    if (ThirdPartyAccountNumber) {
      const [from, to] = dateRange.map((date) =>
        date.format("MM/DD/YYYY")
      );
      dispatch(
        fetchOrdersByThirdParty({ from, to, ThirdPartyAccountNumber })
      );
    }
  }, [dateRange]);

  const handleDateChange = (dates) => {
    if (dates) {
      setDateRange(dates);
      setCurrentPage(1);
    }
  };

  const handleViewOrder = (orderId) => {
    setSelectedOrderId(orderId);
    setIsModalVisible(true);
    if (!viewedOrders.includes(orderId)) {
      setViewedOrders((prev) => [...prev, orderId]);
    }
  };

  const handleRefresh = () => {
    if (ThirdPartyAccountNumber) {
      const [from, to] = dateRange.map((date) =>
        date.format("MM/DD/YYYY")
      );
      dispatch(
        fetchOrdersByThirdParty({ from, to, ThirdPartyAccountNumber })
      );
      message.success("Orders refreshed successfully!");
    }
  };

  const getOrderStatusColor = (status) => {
    switch (status) {
      case "Pending":
        return "orange";
      case "Processing":
        return "blue";
      case "Confirmed":
      case "Delivery":
        return "green";
      case "Completed":
        return "lime";
      case "Cancelled":
      case "Out of Stock":
      case "Unreachable":
        return "red";
      case "Multiple Orders":
        return "geekblue";
      case "Wrong Number":
        return "purple";
      case "Not Answered":
        return "cyan";
      case "Order Placement":
        return "gold";
      default:
        return "default";
    }
  };

  const transformedOrders = useMemo(() => {
    return orders
      .map((order, index) => ({
        key: index,
        orderId: order?.orderCode || "N/A",
        rawDate: order?.orderDate,
        orderDate: order?.orderDate
          ? dayjs(order.orderDate).format("MM/DD/YYYY hh:mm A")
          : "N/A",
        paymentMode: order?.paymentMode || "N/A",
        orderCycle: order?.orderCycle || "N/A",
      }))
      .filter((order) => {
        const date = dayjs(order.rawDate);
        const matchesDate =
          date.isAfter(dateRange[0].startOf("day")) &&
          date.isBefore(dateRange[1].endOf("day"));
        const matchesSearch =
          searchText === "" ||
          order.orderId.toLowerCase().includes(searchText.toLowerCase());
        const matchesStatus =
          statusFilter === "all" || order.orderCycle === statusFilter;
        const matchesPayment =
          paymentFilter === "all" || order.paymentMode === paymentFilter;
        
        return matchesDate && matchesSearch && matchesStatus && matchesPayment;
      })
      .sort((a, b) => dayjs(b.rawDate).diff(dayjs(a.rawDate)));
  }, [orders, dateRange, searchText, statusFilter, paymentFilter]);

  const exportToExcel = () => {
    const dataToExport = transformedOrders.map((order) => ({
      "Order ID": order.orderId,
      "Order Date": order.orderDate,
      "Payment Mode": order.paymentMode,
      "Status": order.orderCycle,
    }));
    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(workbook, "AgentOrders.xlsx");
    message.success("Orders exported to Excel successfully!");
  };

  const statusSummary = useMemo(() => {
    const summary = {};
    transformedOrders.forEach(({ orderCycle }) => {
      summary[orderCycle] = (summary[orderCycle] || 0) + 1;
    });
    return summary;
  }, [transformedOrders]);

  const uniqueStatuses = [...new Set(orders.map(order => order.orderCycle))].filter(Boolean);
  const uniquePaymentModes = [...new Set(orders.map(order => order.paymentMode))].filter(Boolean);

  const columns = [
    {
      title: (
        <Tooltip title="Viewed Orders">
          <Badge count={viewedOrders.length} size="small">
            ✔
          </Badge>
        </Tooltip>
      ),
      dataIndex: "orderId",
      key: "checkbox",
      render: (id) => (
        <Checkbox 
          checked={viewedOrders.includes(id)} 
          disabled 
          style={{ color: viewedOrders.includes(id) ? '#52c41a' : '#d9d9d9' }}
        />
      ),
      width: 60,
      align: 'center',
    },
    {
      title: "Order ID",
      dataIndex: "orderId",
      key: "orderId",
      render: (text) => (
        <Text copyable={{ text }} strong >
          {text}
        </Text>
      ),
    },
    {
      title: (
        <Space>
          <CalendarOutlined />
          Order Date
        </Space>
      ),
      dataIndex: "orderDate",
      key: "orderDate",
      sorter: (a, b) =>
        dayjs(a.rawDate).unix() - dayjs(b.rawDate).unix(),
      render: (text) => (
        <Text style={{ fontSize: '12px' }}>
          {text}
        </Text>
      ),
    },
    {
      title: "Payment Mode",
      dataIndex: "paymentMode",
      key: "paymentMode",
      render: (text) => (
        <Tag color="blue" style={{ borderRadius: '12px' }}>
          {text}
        </Tag>
      ),
    },
    {
      title: "Order Status",
      dataIndex: "orderCycle",
      key: "orderCycle",
      render: (status) => (
        <Tag 
          color={getOrderStatusColor(status)} 
          style={{ 
            borderRadius: '12px',
            fontWeight: 'bold',
            textTransform: 'uppercase',
            fontSize: '10px'
          }}
        >
          {status}
        </Tag>
      ),
    },
    {
      title: "Action",
      key: "action",
      render: (_, record) => (
        <Tooltip title="View Order Details">
          <Button
            type="text"
            icon={<EyeOutlined />}
            onClick={(e) => {
              e.stopPropagation();
              handleViewOrder(record.orderId);
            }}
            style={{ 
              color: '#52c41a',
              fontSize: '16px',
              border: 'none',
              borderRadius: '50%',
              width: '32px',
              height: '32px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            className="hover:bg-green-50"
          />
        </Tooltip>
      ),
      width: 80,
      align: 'center',
    },
  ];

  return (
    <div className="min-h-screen p-2">
      <div className=" mx-auto">
        {/* Header Section */}
        <Card className="mb-6 shadow-sm border-0">
          <div className="flex justify-between items-center">
            <div>
              <Title level={2} className="mb-1" style={{ color: '#e74c3c' }}>
                <ShoppingCartOutlined className="mr-2" />
                Order History
              </Title>
              <Text type="secondary" className="text-base">
                Track and manage all your placed orders
              </Text>
            </div>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={loading}
                className="border-green-200 text-green-600 hover:border-green-400"
              >
                Refresh
              </Button>
              <Button
                icon={<FileExcelOutlined />}
                type="primary"
                onClick={exportToExcel}
                className="bg-green-600 hover:bg-green-700 border-green-600"
                disabled={transformedOrders.length === 0}
              >
                Export Excel
              </Button>
            </Space>
          </div>
        </Card>

        {/* Statistics Cards */}
        <Row gutter={[16, 16]} className="mb-6">
          <Col xs={24} sm={12} md={6} lg={4}>
            <Card className="text-center shadow-sm">
              <Statistic
                title="Total Orders"
                value={transformedOrders.length}
                valueStyle={{ color: '#3f8600', fontWeight: 'bold' }}
                prefix={<ShoppingCartOutlined />}
              />
            </Card>
          </Col>
          {Object.entries(statusSummary).slice(0, 5).map(([status, count]) => (
            <Col xs={24} sm={12} md={6} lg={4} key={status}>
              <Card className="text-center shadow-sm">
                <Statistic
                  title={status}
                  value={count}
                  valueStyle={{ 
                    color: `var(--ant-${getOrderStatusColor(status)})`,
                    fontWeight: 'bold'
                  }}
                />
              </Card>
            </Col>
          ))}
        </Row>

        {/* Filters Section */}
        <Card className="mb-6 shadow-sm border-0">
          <div className="flex flex-wrap gap-4 items-end">
            <div className="flex-1 min-w-[200px]">
              <Text strong className="block mb-2">
                <CalendarOutlined className="mr-1" />
                Date Range
              </Text>
              <RangePicker
                value={dateRange}
                onChange={handleDateChange}
                format="MM/DD/YYYY"
                className="w-full"
                size="large"
              />
            </div>
            <div className="flex-1 min-w-[200px]">
              <Text strong className="block mb-2">
                <SearchOutlined className="mr-1" />
                Search Order ID
              </Text>
              <Input
                placeholder="Search by Order ID..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                prefix={<SearchOutlined />}
                allowClear
                size="large"
              />
            </div>
            <div className="flex-1 min-w-[150px]">
              <Text strong className="block mb-2">
                <FilterOutlined className="mr-1" />
                Status Filter
              </Text>
              <Select
                value={statusFilter}
                onChange={setStatusFilter}
                className="w-full"
                size="large"
              >
                <Option value="all">All Status</Option>
                {uniqueStatuses.map(status => (
                  <Option key={status} value={status}>{status}</Option>
                ))}
              </Select>
            </div>
            <div className="flex-1 min-w-[150px]">
              <Text strong className="block mb-2">Payment Mode</Text>
              <Select
                value={paymentFilter}
                onChange={setPaymentFilter}
                className="w-full"
                size="large"
              >
                <Option value="all">All Modes</Option>
                {uniquePaymentModes.map(mode => (
                  <Option key={mode} value={mode}>{mode}</Option>
                ))}
              </Select>
            </div>
          </div>
        </Card>

        {/* Orders Table */}
        <Card className="shadow-sm border-0">
          {error && (
            <Alert
              message="Error Loading Orders"
              description={error}
              type="error"
              className="mb-4"
              showIcon
            />
          )}
          
          {loading ? (
            <div className="flex justify-center items-center py-20">
              <Spin size="large" />
              <Text className="ml-3">Loading orders...</Text>
            </div>
          ) : transformedOrders.length > 0 ? (
            <Table
              dataSource={transformedOrders}
              columns={columns}
              rowKey="key"
              pagination={{
                pageSize: 10,
                current: currentPage,
                onChange: (page) => setCurrentPage(page),
                showSizeChanger: true,
                showQuickJumper: true,
                showTotal: (total, range) =>
                  `${range[0]}-${range[1]} of ${total} orders`,
                className: "mt-4"
              }}
              className="custom-table"
              size="middle"
              scroll={{ x: 800 }}
              rowClassName={(record) => 
                viewedOrders.includes(record.orderId) ? 'viewed-row' : ''
              }
            />
          ) : (
            <div className="text-center py-20">
              <ShoppingCartOutlined 
                style={{ fontSize: '48px', color: '#d9d9d9' }} 
                className="mb-4"
              />
              <Title level={4} type="secondary">
                No orders found
              </Title>
              <Text type="secondary">
                Try adjusting your filters or date range
              </Text>
            </div>
          )}
        </Card>

        {/* Modal */}
        {isModalVisible && (
          <OrderModal
            orderId={selectedOrderId}
            isModalVisible={isModalVisible}
            onClose={() => setIsModalVisible(false)}
          />
        )}
      </div>

      <style jsx>{`
        .custom-table .ant-table-thead > tr > th {
          background-color: #f8f9fa;
          border-bottom: 2px solid #e9ecef;
          font-weight: 600;
        }
        .custom-table .ant-table-tbody > tr.viewed-row {
          background-color: #f6ffed;
        }
        .custom-table .ant-table-tbody > tr:hover {
          background-color: #e6f7ff;
        }
        .ant-card {
          border-radius: 8px;
        }
        .ant-statistic-content {
          font-size: 24px;
        }
        .ant-statistic-title {
          font-size: 12px;
          font-weight: 500;
        }
      `}</style>
    </div>
  );
};

export default AgentOrders;