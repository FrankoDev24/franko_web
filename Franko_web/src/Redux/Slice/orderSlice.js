// src/Redux/Slice/orderSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "./AxiosInstance";

// Optional helper to normalize error payloads (same pattern as adverts/products)
const toErrorPayload = (error, fallback) => {
  const server =
    error.response?.data?.message ??
    (typeof error.response?.data === "string" ? error.response.data : null);
  return server || error.message || fallback;
};

// localStorage getItem is patched to auto-parse JSON, so the returned
// value may already be an array. Only plain strings need parsing.
const parseStoredUserOrders = () => {
  try {
    const raw = localStorage.getItem("userOrders");
    if (!raw) return [];
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// Async thunks
export const fetchOrdersByDate = createAsyncThunk(
  "orders/fetchOrdersByDate",
  async ({ from, to }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/", {
        params: {
          endpoint: `/Order/GetOrdersByDate/${from}/${to}`,
        },
      });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch orders by date"
      );
    }
  }
);

export const checkOutOrder = createAsyncThunk(
  "orders/checkOutOrder",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(
        "/",
        payload,
        {
          params: {
            endpoint: "/Order/CheckOutDbCart",
          },
        }
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        toErrorPayload(error, "Failed to checkout order")
      );
    }
  }
);

// Fetch orders by customer/agent
export const fetchOrdersByCustomer = createAsyncThunk(
  "orders/fetchOrdersByCustomerOrAgent",
  async ({ from, to, customerId }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/", {
        params: {
          endpoint: "/Order/GetOrderByCustomer",
          from,
          to,
          customerId,
        },
      });
      return data || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch orders"
      );
    }
  }
);

// Fetch orders by third-party agent
export const fetchOrdersByThirdParty = createAsyncThunk(
  "orders/fetchOrdersByThirdParty",
  async ({ from, to, ThirdPartyAccountNumber }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/", {
        params: {
          endpoint: "/Order/GetOrderByThirdParty",
          from,
          to,
          ThirdPartyAccountNumber,
        },
      });
      return data || [];
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch orders "
      );
    }
  }
);

export const updateOrderTransition = createAsyncThunk(
  "orders/updateOrderTransition",
  async ({ CycleName, OrderId }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(
        "/",
        null,
        {
          params: {
            endpoint: `/Order/UpdateOrderTransition/${CycleName}/${OrderId}`,
          },
        }
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update order transition"
      );
    }
  }
);

export const fetchOrderLifeCycle = createAsyncThunk(
  "orders/fetchOrderLifeCycle",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/", {
        params: {
          endpoint: "/Order/OrderLifeCycle-Get",
        },
      });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch order lifecycle"
      );
    }
  }
);

export const fetchSalesOrderById = createAsyncThunk(
  "orders/fetchSalesOrderById",
  async (orderId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/", {
        params: {
          endpoint: `/Order/SalesOrderGet/${orderId}`,
        },
      });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch sales order"
      );
    }
  }
);

export const updateOrderDelivery = createAsyncThunk(
  "orders/updateOrderDelivery",
  async ({ orderCode, ...payload }, { rejectWithValue }) => {
    try {
      const OrderCode = payload?.OrderCode ?? orderCode;
      if (!OrderCode) {
        throw new Error("OrderCode is required.");
      }

      // Include OrderCode in the body with correct casing
      const body = { ...payload, OrderCode };

      const { data } = await axiosInstance.post(
        "/",
        body,
        {
          params: {
            endpoint: `/Order/OrderDeliveryUpdate/${OrderCode}`,
          },
        }
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        toErrorPayload(error, "Failed to update order delivery")
      );
    }
  }
);

export const orderAddress = createAsyncThunk(
  "orders/orderAddress",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post(
        "/",
        payload,
        {
          params: {
            endpoint: "/Order/OrderAddress",
          },
        }
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to update order address"
      );
    }
  }
);

export const fetchOrderDeliveryAddress = createAsyncThunk(
  "orders/fetchOrderDeliveryAddress",
  async (OrderCode, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/", {
        params: {
          endpoint: `/Order/GetOrderDeliveryAddress/${OrderCode}`,
        },
      });
      return data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "Failed to fetch delivery address"
      );
    }
  }
);

// Slice
const orderSlice = createSlice({
  name: "order",
  initialState: {
    orders: [],
    salesOrder: [],
    deliveryAddress: [],
    deliveryUpdate: null,
    lifeCycle: null,

    checkoutDetails: localStorage.getItem("checkoutDetails") || {},
    orderAddressDetails: localStorage.getItem("orderAddressDetails") || {},
    loading: false,
    error: null,
  },
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

    // Save checkout details
    saveCheckoutDetails: (state, action) => {
      const checkoutDetails = action.payload;
      state.checkoutDetails = checkoutDetails;
      localStorage.setItem("checkoutDetails", checkoutDetails);
    },

    // Save order address details
    saveAddressDetails: (state, action) => {
      const orderAddressDetails = action.payload;
      state.orderAddressDetails = orderAddressDetails;
      localStorage.setItem("orderAddressDetails", orderAddressDetails);
    },

    updateOrder: (state, action) => {
      const updated = action.payload;
      const index = state.orders.findIndex((o) => o._id === updated._id);
      if (index !== -1) {
        state.orders[index] = { ...state.orders[index], ...updated };
      }
    },

    // Store the local order
    storeLocalOrder: (state, action) => {
      const { userId, orderId } = action.payload;
      const storedOrders = parseStoredUserOrders();

      const existingOrderIndex = storedOrders.findIndex(
        (order) => order.userId === userId && order.orderId === orderId
      );

      if (existingOrderIndex !== -1) {
        storedOrders[existingOrderIndex] = action.payload;
      } else {
        storedOrders.push(action.payload);
      }

      state.orders = storedOrders;
      localStorage.setItem("userOrders", JSON.stringify(storedOrders));
    },

    // Fetch orders by user
    fetchOrdersByUser: (state, action) => {
      const userId = action.payload;
      const storedOrders = parseStoredUserOrders();
      state.orders = storedOrders.filter((order) => order.userId === userId);
    },

    // Clear orders
    clearOrders: (state) => {
      state.orders = [];
      state.salesOrder = [];
      state.deliveryAddress = [];
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrdersByDate.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrdersByDate.fulfilled, (state, action) => {
        state.orders = action.payload;
        state.loading = false;
      })
      .addCase(fetchOrdersByDate.rejected, (state) => {
        state.loading = false;
      })
      .addCase(updateOrderTransition.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderTransition.fulfilled, (state, action) => {
        state.loading = false;
        const updatedOrder = action.payload;
        const index = state.orders.findIndex(
          (order) => order.orderCode === updatedOrder.orderCode
        );
        if (index !== -1) {
          state.orders[index] = updatedOrder;
        }
      })
      .addCase(updateOrderTransition.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.error.message || "Error updating order lifecycle";
      })
      .addCase(fetchOrderLifeCycle.fulfilled, (state, action) => {
        state.loading = false;
        state.lifeCycle = action.payload;
      })
      .addCase(fetchOrderLifeCycle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || "Failed to fetch order lifecycle";
      })
      .addCase(checkOutOrder.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkOutOrder.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(checkOutOrder.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ||
          action.error?.message ||
          "Failed to checkout order";
      })
      .addCase(orderAddress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(orderAddress.fulfilled, (state, action) => {
        state.loading = false;
        state.deliveryAddress = action.payload;
      })
      .addCase(orderAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to save order address";
      })
      .addCase(fetchOrderDeliveryAddress.fulfilled, (state, action) => {
        state.deliveryAddress = action.payload || null;
      })
      .addCase(fetchOrderDeliveryAddress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch order address";
      })
      .addCase(updateOrderDelivery.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateOrderDelivery.fulfilled, (state, action) => {
        state.loading = false;
        state.deliveryUpdate = action.payload;
      })
      .addCase(updateOrderDelivery.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload ||
          action.error?.message ||
          "Failed to update order delivery";
      })
      .addCase(fetchSalesOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.salesOrder = Array.isArray(action.payload)
          ? action.payload
          : action.payload
          ? [action.payload]
          : [];
      })
      .addCase(fetchSalesOrderById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch sales order";
      })
      .addCase(fetchOrdersByCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrdersByCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchOrdersByCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || action.error?.message || "Failed to fetch orders";
      })
      .addCase(fetchOrdersByThirdParty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrdersByThirdParty.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(fetchOrdersByThirdParty.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || action.error?.message || "Failed to fetch orders";
      });
  },
});

export const {
  storeLocalOrder,
  fetchOrdersByUser,
  clearOrders,
  saveCheckoutDetails,
  updateOrder,
  saveAddressDetails,
  clearLocalStorage,
} = orderSlice.actions;

export default orderSlice.reducer;