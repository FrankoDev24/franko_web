import React, { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  Button,
  TextField,
  Tooltip,
  IconButton,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
} from "@mui/material";
import { DateRangePicker } from '@mui/x-date-pickers-pro/DateRangePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { Visibility } from "@mui/icons-material";
import dayjs from "dayjs";
import * as XLSX from "xlsx";

import { useDispatch, useSelector } from "react-redux";
import { fetchOrdersByDate, fetchSalesOrderById } from "../../../Redux/Slice/orderSlice";
import UpdateOrderCycleModal from "./UpdateOrderCycleModal";
import OrderDetailsModal from "./OrderDetailsModal";

const Orders = () => {
  const dispatch = useDispatch();
  const { orders = [], loading } = useSelector((state) => state.orders);
  const [dateRange, setDateRange] = useState([null, null]);
  const [searchText, setSearchText] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [selectedCheckboxes, setSelectedCheckboxes] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrderCycle, setSelectedOrderCycle] = useState(null);
  const [cachedOrderDetails, setCachedOrderDetails] = useState({});

  const fetchCurrentMonthOrders = useCallback(() => {
    const now = dayjs();
    const from = now.startOf("month").format("YYYY-MM-DD");
    const to = now.add(1, "day").format("YYYY-MM-DD");
    dispatch(fetchOrdersByDate({ from, to }));
  }, [dispatch]);

  useEffect(() => {
    fetchCurrentMonthOrders();
  }, [fetchCurrentMonthOrders]);

  const handleFetchOrders = () => {
    if (dateRange[0] && dateRange[1]) {
      const from = dateRange[0].format("YYYY-MM-DD");
      const to = dateRange[1].add(1, "day").format("YYYY-MM-DD");
      dispatch(fetchOrdersByDate({ from, to }));
    } else {
      alert("Please select a date range");
    }
  };

  const handleCheckboxClick = (orderCode) => {
    setSelectedCheckboxes(prev => ({
      ...prev,
      [orderCode]: !prev[orderCode],
    }));
  };

  const handleSelectAll = () => {
    const newChecked = !selectAll;
    setSelectAll(newChecked);
    const updated = {};
    groupedOrders.forEach(order => {
      updated[order.orderCode] = newChecked;
    });
    setSelectedCheckboxes(updated);
  };

  const openDetailModal = async (orderId) => {
    if (!cachedOrderDetails[orderId]) {
      const orderDetails = await fetchSalesOrderById(orderId);
      setCachedOrderDetails(prev => ({ ...prev, [orderId]: orderDetails }));
    }
    setSelectedOrderId(orderId);
    setIsDetailModalOpen(true);
    handleCheckboxClick(orderId);
  };

  const openCycleModal = (order) => {
    setSelectedOrderId(order.orderCode);
    setSelectedOrderCycle(order.orderCycle);
    setIsModalOpen(true);
  };

  const groupedOrders = Object.values(
    orders.reduce((acc, order) => {
      if (!acc[order.orderCode]) {
        acc[order.orderCode] = { ...order, orders: [order] };
      } else {
        acc[order.orderCode].orders.push(order);
      }
      return acc;
    }, {})
  );

  const filteredOrders = groupedOrders
    .filter(order => {
      if (filterSource === "website" && !order.orderCode.startsWith("ORD")) return false;
      if (filterSource === "app" && order.orderCode.startsWith("ORD")) return false;
      return (
        order.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
        order.orderCycle?.toLowerCase().includes(searchText.toLowerCase()) ||
        !searchText
      );
    })
    .sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

  const exportToExcel = () => {
    if (!filteredOrders.length) {
      alert("No orders to export");
      return;
    }
    const formatted = filteredOrders.map(order => ({
      "Order Code": order.orderCode,
      "Order Date": order.orderDate,
      "Full Name": order.fullName,
      "Contact Number": order.contactNumber,
      "Payment Mode": order.paymentMode || "N/A",
      "Status": order.orderCycle,
    }));
    const worksheet = XLSX.utils.json_to_sheet(formatted);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Orders");
    XLSX.writeFile(workbook, "Orders.xlsx");
  };

  const statusColors = {
    "Order Placement": "warning",
    Processing: "primary",
    Confirmed: "success",
    Pending: "warning",
    Unreachable: "error",
    "Out of Stock": "error",
    "Wrong Number": "secondary",
    Cancelled: "error",
    "Not Answered": "info",
    Delivery: "success",
    Completed: "success",
    "Multiple Orders": "info",
  };

  return (
    <div>
      <h2 style={{ color: "#f44336" }}>Orders</h2>
      <div style={{ display: "flex", gap: 12, marginBottom: 16 }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <DateRangePicker
            value={dateRange}
            onChange={(newRange) => setDateRange(newRange)}
            localeText={{ start: 'Start', end: 'End' }}
          />
        </LocalizationProvider>
        <Button variant="contained" color="success" onClick={handleFetchOrders}>
          Fetch Orders
        </Button>
        <Button variant="outlined" onClick={exportToExcel}>Export</Button>
      </div>

      <TextField
        fullWidth
        variant="outlined"
        placeholder="Search by name or status"
        onChange={(e) => setSearchText(e.target.value)}
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 16 }}>
        <Select value={filterSource} onChange={(e) => setFilterSource(e.target.value)}>
          <MenuItem value="all">All Orders</MenuItem>
          <MenuItem value="website">Website Orders</MenuItem>
          <MenuItem value="app">App Orders</MenuItem>
        </Select>
      </div>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>
                <Checkbox checked={selectAll} onChange={handleSelectAll} />
              </TableCell>
              <TableCell>Order Code</TableCell>
              <TableCell>Order Date</TableCell>
              <TableCell>Full Name</TableCell>
              <TableCell>Contact Number</TableCell>
              <TableCell>Payment Mode</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredOrders.map(order => (
              <TableRow key={order.orderCode}>
                <TableCell>
                  <Checkbox
                    checked={selectedCheckboxes[order.orderCode] || false}
                    onChange={() => handleCheckboxClick(order.orderCode)}
                  />
                </TableCell>
                <TableCell>{order.orderCode}</TableCell>
                <TableCell>{new Date(order.orderDate).toLocaleString()}</TableCell>
                <TableCell>{order.fullName}</TableCell>
                <TableCell>{order.contactNumber}</TableCell>
                <TableCell>{order.paymentMode || "N/A"}</TableCell>
                <TableCell>
                  <Tooltip title="Update order status">
                    <Chip
                      label={order.orderCycle}
                      color={statusColors[order.orderCycle] || "default"}
                      onClick={() => openCycleModal(order)}
                      style={{ cursor: "pointer" }}
                    />
                  </Tooltip>
                </TableCell>
                <TableCell>
                  <Tooltip title="View Order">
                    <IconButton onClick={() => openDetailModal(order.orderCode)}>
                      <Visibility color="error" />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {loading && <CircularProgress style={{ margin: 20 }} />}
      </TableContainer>

      {/* Modals */}
      {isModalOpen && (
        <UpdateOrderCycleModal
          open={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          orderId={selectedOrderId}
          orderCycle={selectedOrderCycle}
        />
      )}
      {isDetailModalOpen && (
        <OrderDetailsModal
          open={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          orderDetails={cachedOrderDetails[selectedOrderId]}
        />
      )}
    </div>
  );
};

export default Orders;
