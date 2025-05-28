import React, { useEffect, useState, useCallback } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Checkbox, Button, TextField, Tooltip, IconButton,
  Select, MenuItem, Chip, CircularProgress, Pagination, Stack
} from "@mui/material";
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

  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [searchText, setSearchText] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedCheckboxes, setSelectedCheckboxes] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrderCycle, setSelectedOrderCycle] = useState(null);
  const [cachedOrderDetails, setCachedOrderDetails] = useState({});
  const [page, setPage] = useState(1);

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
    if (dateRange.start && dateRange.end) {
      dispatch(fetchOrdersByDate({
        from: dayjs(dateRange.start).format("YYYY-MM-DD"),
        to: dayjs(dateRange.end).add(1, "day").format("YYYY-MM-DD"),
      }));
    } else {
      alert("Please select both start and end date.");
    }
  };

  const groupedOrders = Object.values(orders.reduce((acc, order) => {
    if (!acc[order.orderCode]) {
      acc[order.orderCode] = { ...order, orders: [order] };
    } else {
      acc[order.orderCode].orders.push(order);
    }
    return acc;
  }, {}));

  const statusCounts = groupedOrders.reduce((acc, order) => {
    const status = order.orderCycle || "Unknown";
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {});

  const filteredOrders = groupedOrders.filter(order => {
    const matchesSearch =
      order.fullName?.toLowerCase().includes(searchText.toLowerCase()) ||
      order.orderCycle?.toLowerCase().includes(searchText.toLowerCase());
    const matchesSource =
      filterSource === "all" ||
      (filterSource === "website" && order.orderCode.startsWith("ORD")) ||
      (filterSource === "app" && !order.orderCode.startsWith("ORD"));
    const matchesStatus = !selectedStatus || order.orderCycle === selectedStatus;

    return matchesSearch && matchesSource && matchesStatus;
  }).sort((a, b) => new Date(b.orderDate) - new Date(a.orderDate));

  const paginatedOrders = filteredOrders.slice((page - 1) * 10, page * 10);

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
    filteredOrders.forEach(order => {
      updated[order.orderCode] = newChecked;
    });
    setSelectedCheckboxes(updated);
  };

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

  const openDetailModal = async (orderId) => {
    if (!cachedOrderDetails[orderId]) {
      const orderDetails = await fetchSalesOrderById(orderId);
      setCachedOrderDetails(prev => ({ ...prev, [orderId]: orderDetails }));
    }
    setSelectedOrderId(orderId);
    setIsDetailModalOpen(true);
  };

  const openCycleModal = (order) => {
    setSelectedOrderId(order.orderCode);
    setSelectedOrderCycle(order.orderCycle);
    setIsModalOpen(true);
  };

  return (
    <div>
      <h2 style={{ color: "#f44336", marginBottom: 16 }}>Orders</h2>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 12, marginBottom: 16 }}>
        <TextField
          type="date"
          label="Start Date"
          InputLabelProps={{ shrink: true }}
          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
        />
        <TextField
          type="date"
          label="End Date"
          InputLabelProps={{ shrink: true }}
          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
        />
        <Button variant="contained" color="success" onClick={handleFetchOrders}>Fetch Orders</Button>
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

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {Object.entries(statusCounts).map(([status, count]) => (
          <Chip
            key={status}
            label={`${status} (${count})`}
            color={statusColors[status] || "default"}
            variant={status === selectedStatus ? "filled" : "outlined"}
            onClick={() => setSelectedStatus(prev => prev === status ? null : status)}
            style={{ cursor: "pointer" }}
          />
        ))}
      </div>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><Checkbox checked={selectAll} onChange={handleSelectAll} /></TableCell>
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
            {paginatedOrders.map(order => (
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

      <Stack spacing={2} alignItems="center" style={{ marginTop: 16 }}>
        <Pagination
          count={Math.ceil(filteredOrders.length / 10)}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
        />
      </Stack>

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
