import React, { useEffect, useState, useCallback } from "react";
import {
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Paper, Checkbox, Button, TextField, Tooltip, IconButton,
  Select, MenuItem, Chip, CircularProgress, Pagination, Stack, Typography
} from "@mui/material";
import { Visibility } from "@mui/icons-material";
import dayjs from "dayjs";
import * as XLSX from "xlsx";
import { useDispatch, useSelector } from "react-redux";
import { fetchOrdersByDate, fetchSalesOrderById } from "../../../Redux/Slice/orderSlice";
import OrderDetailsModal from "./OrderDetailsModal";
import CycleUpdateModal from "./CycleUpdateModal";
import EditIcon from '@mui/icons-material/Edit';

const Orders = () => {
  const dispatch = useDispatch();
  const { orders = [], loading } = useSelector((state) => state.orders);

  const [dateRange, setDateRange] = useState({ start: "", end: "" });
  const [searchText, setSearchText] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState(null);
  const [selectedCheckboxes, setSelectedCheckboxes] = useState({});
  const [selectAll, setSelectAll] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrderCycle, setSelectedOrderCycle] = useState(null);
  const [isCycleModalOpen, setIsCycleModalOpen] = useState(false);
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

  // Fixed openDetailModal function
  const openDetailModal = async (order) => {
    const orderId = order._id || order.orderCode; // Use _id if available, fallback to orderCode
    
    // Cache order details if not already cached
    if (!cachedOrderDetails[orderId]) {
      try {
        const orderDetails = await dispatch(fetchSalesOrderById(orderId));
        setCachedOrderDetails((prev) => ({ ...prev, [orderId]: orderDetails }));
      } catch (error) {
        console.error("Error fetching order details:", error);
      }
    }
    
    // Set the selected order ID and open modal
    setSelectedOrderId(orderId);
    setIsDetailModalOpen(true);

    // Select checkbox for the order (use orderCode for checkbox)
    handleCheckboxClick(order.orderCode);
  };

  const openCycleModal = (order) => {
    setSelectedOrderId(order._id || order.orderCode);
    setSelectedOrderCycle(order.orderCycle);
    setIsCycleModalOpen(true);
  };

  const closeCycleModal = () => {
    setIsCycleModalOpen(false);
    setSelectedOrderId(null);
    setSelectedOrderCycle(null);
  };

  const handleCycleUpdated = () => {
    fetchCurrentMonthOrders();
    closeCycleModal();
  };

  return (
    <div>
      <h2 style={{ color: "#f44336", marginBottom: 16 }}>Orders</h2>

      {/* Filters */}
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

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', padding: '8px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <h2 style={{ margin: 0, fontSize: '1rem' }}>Filter by Source</h2>
          <Select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            style={{ minWidth: 180, backgroundColor: '#fff', borderRadius: 8 }}
          >
            <MenuItem value="all">All Orders</MenuItem>
            <MenuItem value="website">Website Orders</MenuItem>
            <MenuItem value="app">App Orders</MenuItem>
          </Select>
        </div>
        <Typography variant="subtitle1" style={{ marginTop: 8 }}>
          <strong>Total Orders:</strong>{" "}
          <span style={{ color: "#7cb342", fontWeight: 600 }}>{filteredOrders.length}</span>
        </Typography>
      </div>

      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16 }}>
        {Object.entries(statusCounts).map(([status, count]) => (
          <Chip
            key={status}
            label={`${status} (${count})`}
            color={statusColors[status] || "default"}
            variant={status === selectedStatus ? "filled" : "outlined"}
            onClick={() => setSelectedStatus(prev => prev === status ? null : status)}
          />
        ))}
      </div>

      {/* Orders Table */}
      <TableContainer component={Paper} style={{ position: 'relative', minHeight: 300 }}>
        {loading && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              zIndex: 2,
            }}
          >
            <CircularProgress />
          </div>
        )}
        <Table>
          <TableHead>
            <TableRow>
              <TableCell><Checkbox checked={selectAll} onChange={handleSelectAll} /></TableCell>
              <TableCell>Order Code</TableCell>
              <TableCell>Order Date</TableCell>
              <TableCell>Customer Name</TableCell>
              <TableCell>Contact Number</TableCell>
              <TableCell>Payment Mode</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody
            style={{
              opacity: loading ? 0.3 : 1,
              pointerEvents: loading ? 'none' : 'auto',
            }}
          >
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
                  <Chip
                    label={order.orderCycle}
                    color={statusColors[order.orderCycle] || "default"}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Tooltip title="Update Cycle">
                    <EditIcon
                      style={{ color: "#8bc34a", cursor: 'pointer', marginRight: 8 }}
                      onClick={() => openCycleModal(order)}
                    />
                  </Tooltip>
                  <Tooltip title="View Details">
                    <IconButton onClick={() => openDetailModal(order)}>
                      <Visibility />
                    </IconButton>
                  </Tooltip>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Stack spacing={2} alignItems="center" style={{ marginTop: 16 }}>
        <Pagination
          count={Math.ceil(filteredOrders.length / 10)}
          page={page}
          onChange={(_, value) => setPage(value)}
          color="primary"
        />
      </Stack>

      {/* Modals */}
      <OrderDetailsModal
        open={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        orderId={selectedOrderId}
        orderDetails={cachedOrderDetails[selectedOrderId]}
      />

      {isCycleModalOpen && (
        <CycleUpdateModal
          open={isCycleModalOpen}
          onClose={closeCycleModal}
          orderId={selectedOrderId}
          currentCycle={selectedOrderCycle}
          onUpdated={handleCycleUpdated}
        />
      )}
    </div>
  );
};

export default Orders;