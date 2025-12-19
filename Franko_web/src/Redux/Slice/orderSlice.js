import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/* Async thunks */

export const fetchOrdersByDate = createAsyncThunk(
  "orders/fetchOrdersByDate",
  async ({ from, to }, { rejectWithValue }) => {
    try {
      const response = await axios.get(
        `${API_BASE_URL}/Order/GetOrdersByDate/${from}/${to}`
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching orders by date:", error);
      return rejectWithValue(error.response?.data || "Failed to fetch orders by date");
    }
  }
);

export const checkOutOrder = createAsyncThunk(
  "orders/checkOutOrder",
  async (
    { Cartid, orderCode, customerId, PaymentMode, paymentService, PaymentAccountNumber, customerAccountType },
    { rejectWithValue }
  ) => {
    try {
      const payload = {
        Cartid,
        orderCode,
        customerId,
        PaymentMode,
        paymentService,
        PaymentAccountNumber,
        customerAccountType,
      };

      const response = await axios.post(`${API_BASE_URL}/Order/CheckOutDbCart`, payload);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to checkout order");
    }
  }
);

export const fetchOrdersByCustomer = createAsyncThunk(
  "orders/fetchOrdersByCustomerOrAgent",
  async ({ from, to, customerId }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/Order/GetOrderByCustomer`, {
        params: { from, to, customerId },
      });
      return response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || "Failed to fetch orders by customer");
    }
  }
);

export const fetchOrdersByThirdParty = createAsyncThunk(
  "orders/fetchOrdersByThirdParty",
  async ({ from, to, ThirdPartyAccountNumber }, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/Order/GetOrderByThirdParty`, {
        params: { from, to, ThirdPartyAccountNumber },
      });
      return response.data || [];
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch orders by third party");
    }
  }
);

export const updateOrderTransition = createAsyncThunk(
  "orders/updateOrderTransition",
  async ({ CycleName, OrderId }, { rejectWithValue }) => {
    try {
      console.log("Updating order transition with CycleName:", CycleName, "OrderId:", OrderId);
      const response = await axios.post(
        `${API_BASE_URL}/Order/UpdateOrderTransition/${CycleName}/${OrderId}`
      );
      return response.data;
    } catch (error) {
      console.error("Error in updateOrderTransition:", error);
      return rejectWithValue(error.response?.data || "Failed to update order transition");
    }
  }
);

export const fetchOrderLifeCycle = createAsyncThunk(
  "orders/fetchOrderLifeCycle",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/Order/OrderLifeCycle-Get`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch order lifecycle");
    }
  }
);

export const fetchSalesOrderById = createAsyncThunk(
  "orders/fetchSalesOrderById",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/Order/SalesOrderGet/${orderId}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch sales order");
    }
  }
);

export const updateOrderDelivery = createAsyncThunk(
  "orders/updateOrderDelivery",
  async ({ orderCode, address, recipientName, recipientContactNumber, orderNote, geoLocation, Customerid }, { rejectWithValue }) => {
    try {
      const body = {
        Customerid,
        recipientName,
        recipientContactNumber,
        orderCode,
        address,
        geoLocation,
        orderNote,
      };
      const response = await axios.post(
        `${API_BASE_URL}/Order/OrderDeliveryUpdate/${orderCode}`,
        body,
        { headers: { "Content-Type": "application/json" } }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to update order delivery");
    }
  }
);

export const orderAddress = createAsyncThunk(
  "orders/orderAddress",
  async ({ customerId, OrderCode, address, geoLocation, RecipientName, RecipientContactNumber, orderNote }, { rejectWithValue }) => {
    try {
      const requestData = {
        customerId,
        OrderCode,
        address,
        geoLocation,
        RecipientName,
        RecipientContactNumber,
        orderNote,
      };
      // Adjust endpoint if needed
      const response = await axios.post(`${API_BASE_URL}/Order/OrderAddress`, requestData, {
        headers: { "Content-Type": "application/json" },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to update order address");
    }
  }
);

export const fetchOrderDeliveryAddress = createAsyncThunk(
  "orders/fetchOrderDeliveryAddress",
  async (OrderCode, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/Order/GetOrderDeliveryAddress/${OrderCode}`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "Failed to fetch delivery address");
    }
  }
);

/* Slice */

const parseJSON = (value) => {
  try {
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const initialState = {
  orders: [],
  salesOrder: null,
  deliveryAddress: null,
  deliveryUpdate: null,
  lifeCycle: null,
  checkoutDetails: parseJSON(localStorage.getItem("checkoutDetails")) || {},
  orderAddressDetails: parseJSON(localStorage.getItem("orderAddressDetails")) || {},
  loading: {
    orders: false,
    deliveryAddress: false,
    deliveryUpdate: false,
    lifeCycle: false,
  },
  error: {
    orders: null,
    lifeCycle: null,
    deliveryAddress: null,
    deliveryUpdate: null,
  },
};

const orderSlice = createSlice({
  name: "order",
  initialState,
  reducers: {
    // Clear localStorage and reset state
    clearLocalStorage: (state) => {
      localStorage.removeItem("checkoutDetails");
      localStorage.removeItem("orderAddressDetails");
      localStorage.removeItem("userOrders");
      state.checkoutDetails = null;
      state.orderAddressDetails = null;
      state.orders = [];
    },

    // Save checkout details and persist
    saveCheckoutDetails: (state, action) => {
      state.checkoutDetails = action.payload;
      try {
        localStorage.setItem("checkoutDetails", JSON.stringify(action.payload));
      } catch {}
    },

    // Save order address details and persist
    saveAddressDetails: (state, action) => {
      state.orderAddressDetails = action.payload;
      try {
        localStorage.setItem("orderAddressDetails", JSON.stringify(action.payload));
      } catch {}
    },

    updateOrder: (state, action) => {
      const updated = action.payload;
      const index = state.orders.findIndex((o) => o._id === updated._id || o.orderCode === updated.orderCode);
      if (index !== -1) {
        state.orders[index] = { ...state.orders[index], ...updated };
      }
    },

    // Store the local order
    storeLocalOrder: (state, action) => {
      const payload = action.payload;
      const storedOrders = JSON.parse(localStorage.getItem("userOrders") || "[]");
      const existingOrderIndex = storedOrders.findIndex(
        (order) => order.userId === payload.userId && order.orderId === payload.orderId
      );
      if (existingOrderIndex !== -1) {
        storedOrders[existingOrderIndex] = payload;
      } else {
        storedOrders.push(payload);
      }
      state.orders = storedOrders;
      try {
        localStorage.setItem("userOrders", JSON.stringify(storedOrders));
      } catch {}
    },

    // Fetch orders by user from localStorage
    fetchOrdersByUser: (state, action) => {
      const userId = action.payload;
      const storedOrders = JSON.parse(localStorage.getItem("userOrders") || "[]");
      state.orders = storedOrders.filter((order) => order.userId === userId);
    },

    // Clear orders and reset flags/errors
    clearOrders: (state) => {
      state.orders = [];
      state.salesOrder = null;
      state.deliveryAddress = null;
      state.loading = {
        orders: false,
        deliveryAddress: false,
        deliveryUpdate: false,
        lifeCycle: false,
      };
      state.error = {
        orders: null,
        lifeCycle: null,
        deliveryAddress: null,
        deliveryUpdate: null,
      };
    },
  },
  extraReducers: (builder) => {
    builder
      /* fetchOrdersByDate */
      .addCase(fetchOrdersByDate.pending, (state) => {
        state.loading.orders = true;
        state.error.orders = null;
      })
      .addCase(fetchOrdersByDate.fulfilled, (state, action) => {
        state.orders = action.payload || [];
        state.loading.orders = false;
      })
      .addCase(fetchOrdersByDate.rejected, (state, action) => {
        state.loading.orders = false;
        state.error.orders = action.payload || action.error?.message;
      })

      /* updateOrderTransition */
      .addCase(updateOrderTransition.pending, (state) => {
        state.loading.orders = true;
        state.error.orders = null;
      })
      .addCase(updateOrderTransition.fulfilled, (state, action) => {
        state.loading.orders = false;
        const updatedOrder = action.payload;
        const index = state.orders.findIndex((order) => order.orderCode === updatedOrder.orderCode || order._id === updatedOrder._id);
        if (index !== -1) {
          state.orders[index] = { ...state.orders[index], ...updatedOrder };
        }
      })
      .addCase(updateOrderTransition.rejected, (state, action) => {
        state.loading.orders = false;
        state.error.orders = action.payload || action.error?.message || "Error updating order lifecycle";
      })

      /* fetchOrderLifeCycle */
      .addCase(fetchOrderLifeCycle.pending, (state) => {
        state.loading.lifeCycle = true;
        state.error.lifeCycle = null;
      })
      .addCase(fetchOrderLifeCycle.fulfilled, (state, action) => {
        state.loading.lifeCycle = false;
        state.lifeCycle = action.payload;
      })
      .addCase(fetchOrderLifeCycle.rejected, (state, action) => {
        state.loading.lifeCycle = false;
        state.error.lifeCycle = action.payload || action.error?.message;
      })

      /* checkOutOrder */
      .addCase(checkOutOrder.pending, (state) => {
        state.loading.orders = true;
        state.error.orders = null;
      })
      .addCase(checkOutOrder.fulfilled, (state, action) => {
        state.loading.orders = false;
        state.orders = Array.isArray(action.payload) ? action.payload : state.orders;
      })
      .addCase(checkOutOrder.rejected, (state, action) => {
        state.loading.orders = false;
        state.error.orders = action.payload || action.error?.message;
      })

      /* orderAddress */
      .addCase(orderAddress.pending, (state) => {
        state.loading.deliveryAddress = true;
        state.error.deliveryAddress = null;
      })
      .addCase(orderAddress.fulfilled, (state, action) => {
        state.loading.deliveryAddress = false;
        state.orderAddressDetails = action.payload || state.orderAddressDetails;
      })
      .addCase(orderAddress.rejected, (state, action) => {
        state.loading.deliveryAddress = false;
        state.error.deliveryAddress = action.payload || action.error?.message;
      })

      /* fetchOrderDeliveryAddress */
      .addCase(fetchOrderDeliveryAddress.pending, (state) => {
        state.loading.deliveryAddress = true;
        state.error.deliveryAddress = null;
      })
      .addCase(fetchOrderDeliveryAddress.fulfilled, (state, action) => {
        state.loading.deliveryAddress = false;
        state.deliveryAddress = action.payload || null;
      })
      .addCase(fetchOrderDeliveryAddress.rejected, (state, action) => {
        state.loading.deliveryAddress = false;
        state.error.deliveryAddress = action.payload || action.error?.message;
      })

      /* updateOrderDelivery */
      .addCase(updateOrderDelivery.pending, (state) => {
        state.loading.deliveryUpdate = true;
        state.error.deliveryUpdate = null;
      })
      .addCase(updateOrderDelivery.fulfilled, (state, action) => {
        state.loading.deliveryUpdate = false;
        state.deliveryUpdate = action.payload;
      })
      .addCase(updateOrderDelivery.rejected, (state, action) => {
        state.loading.deliveryUpdate = false;
        state.error.deliveryUpdate = action.payload || action.error?.message;
      })

      /* fetchSalesOrderById */
      .addCase(fetchSalesOrderById.pending, (state) => {
        state.loading.orders = true;
        state.error.orders = null;
      })
      .addCase(fetchSalesOrderById.fulfilled, (state, action) => {
        state.loading.orders = false;
        state.salesOrder = action.payload;
      })
      .addCase(fetchSalesOrderById.rejected, (state, action) => {
        state.loading.orders = false;
        state.error.orders = action.payload || action.error?.message || "Failed to fetch sales order";
      })

      /* fetchOrdersByCustomer */
      .addCase(fetchOrdersByCustomer.pending, (state) => {
        state.loading.orders = true;
        state.error.orders = null;
      })
      .addCase(fetchOrdersByCustomer.fulfilled, (state, action) => {
        state.loading.orders = false;
        state.orders = action.payload || [];
      })
      .addCase(fetchOrdersByCustomer.rejected, (state, action) => {
        state.loading.orders = false;
        state.error.orders = action.payload || action.error?.message;
      })

      /* fetchOrdersByThirdParty */
      .addCase(fetchOrdersByThirdParty.pending, (state) => {
        state.loading.orders = true;
        state.error.orders = null;
      })
      .addCase(fetchOrdersByThirdParty.fulfilled, (state, action) => {
        state.loading.orders = false;
        state.orders = action.payload || [];
      })
      .addCase(fetchOrdersByThirdParty.rejected, (state, action) => {
        state.loading.orders = false;
        state.error.orders = action.payload || action.error?.message;
      });
  },
});

export const {
  storeLocalOrder,
  fetchOrdersByUser,
  clearLocalStorage,
  saveCheckoutDetails,
  updateOrder,
  saveAddressDetails,
  clearOrders,
} = orderSlice.actions;

export default orderSlice.reducer;