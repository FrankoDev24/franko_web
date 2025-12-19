// src/Redux/Slice/orderSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Async thunks
export const fetchOrdersByDate = createAsyncThunk(
  "orders/fetchOrdersByDate",
  async ({ from, to }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/Order/GetOrdersByDate/${from}/${to}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch orders by date");
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching orders by date:", error);
      return rejectWithValue(
        error.message || "Failed to fetch orders by date"
      );
    }
  }
);

export const checkOutOrder = createAsyncThunk(
  "orders/checkOutOrder",
  async (
    {
      Cartid,
      orderCode,
      customerId,
      PaymentMode,
      paymentService,
      PaymentAccountNumber,
      customerAccountType,
    },
    { rejectWithValue }
  ) => {
    try {
      const payload = {
        Cartid: Cartid,
        orderCode: orderCode,
        customerId: customerId,
        PaymentMode: PaymentMode,
        paymentService: paymentService,
        PaymentAccountNumber: PaymentAccountNumber,
        customerAccountType: customerAccountType,
      };

      const response = await fetch(
        `${API_BASE_URL}/Order/CheckOutDbCart`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to checkout order");
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to checkout order"
      );
    }
  }
);

// New async thunk for fetching orders by customer or agent
export const fetchOrdersByCustomer = createAsyncThunk(
  "orders/fetchOrdersByCustomerOrAgent",
  async ({ from, to, customerId }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/Order/GetOrderByCustomer?from=${from}&to=${to}&customerId=${customerId}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch orders by customer");
      }

      const data = await response.json();
      return data || [];
    } catch (error) {
      console.error("Error fetching orders by customer:", error);
      return rejectWithValue(
        error.message || "Failed to fetch orders by customer"
      );
    }
  }
);

export const fetchOrdersByThirdParty = createAsyncThunk(
  "orders/fetchOrdersByThirdParty",
  async ({ from, to, ThirdPartyAccountNumber }, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/Order/GetOrderByThirdParty?from=${from}&to=${to}&ThirdPartyAccountNumber=${ThirdPartyAccountNumber}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch orders by agent");
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error fetching orders by agent:", error);
      return rejectWithValue(
        error.message || "Failed to fetch orders by agent"
      );
    }
  }
);

export const updateOrderTransition = createAsyncThunk(
  "orders/updateOrderTransition",
  async ({ CycleName, OrderId }, { rejectWithValue }) => {
    try {
      console.log("Updating order transition with CycleName:", CycleName);
      console.log("Updating order transition with OrderId:", OrderId);

      const response = await fetch(
        `${API_BASE_URL}/Order/UpdateOrderTransition/${CycleName}/${OrderId}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to update order transition");
      }

      const data = await response.json();

      if (!data) {
        throw new Error("Invalid response format");
      }

      return data;
    } catch (error) {
      console.error("Error in updateOrderTransition:", error);
      return rejectWithValue(
        error.message || "Failed to update order transition"
      );
    }
  }
);

export const fetchOrderLifeCycle = createAsyncThunk(
  "orders/fetchOrderLifeCycle",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/Order/OrderLifeCycle-Get`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch order lifecycle");
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch order lifecycle"
      );
    }
  }
);

export const fetchSalesOrderById = createAsyncThunk(
  "orders/fetchSalesOrderById",
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/Order/SalesOrderGet/${orderId}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch sales order");
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch sales order"
      );
    }
  }
);

export const updateOrderDelivery = createAsyncThunk(
  "orders/updateOrderDelivery",
  async (
    {
      orderCode,
      address,
      recipientName,
      recipientContactNumber,
      orderNote,
      geoLocation,
      Customerid,
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/Order/OrderDeliveryUpdate/${orderCode}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            Customerid,
            recipientName,
            recipientContactNumber,
            orderCode,
            address,
            geoLocation,
            orderNote,
          }),
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to update order delivery");
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to update order delivery"
      );
    }
  }
);

export const orderAddress = createAsyncThunk(
  "orders/OrderAddress",
  async (
    {
      customerId,
      OrderCode,
      address,
      geoLocation,
      RecipientName,
      RecipientContactNumber,
      orderNote,
    },
    { rejectWithValue }
  ) => {
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

      const response = await fetch(
        `${API_BASE_URL}/Order/OrderAddress`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(requestData),
        }
      );
      
      if (!response.ok) {
        throw new Error("Failed to update order address");
      }

      return await response.json();
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to update order address"
      );
    }
  }
);

export const fetchOrderDeliveryAddress = createAsyncThunk(
  "orders/fetchOrderDeliveryAddress",
  async (OrderCode, { rejectWithValue }) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/Order/GetOrderDeliveryAddress/${OrderCode}`
      );
      
      if (!response.ok) {
        throw new Error("Failed to fetch delivery address");
      }
      
      return await response.json();
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch delivery address"
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
    loading: {
      orders: false,
      deliveryAddress: false,
      deliveryUpdate: false,
      lifeCycle: false,
    },
    error: {
      orders: null,
      deliveryAddress: null,
      deliveryUpdate: null,
      lifeCycle: null,
    },
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

      // Persist in localStorage
      localStorage.setItem("checkoutDetails", checkoutDetails);
    },

    // Save order address details
    saveAddressDetails: (state, action) => {
      const orderAddressDetails = action.payload;
      state.orderAddressDetails = orderAddressDetails;

      // Persist in localStorage
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
      const storedOrders =
        JSON.parse(localStorage.getItem("userOrders")) || [];

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
      const storedOrders =
        JSON.parse(localStorage.getItem("userOrders")) || [];
      state.orders = storedOrders.filter((order) => order.userId === userId);
    },

    // Clear orders
    clearOrders: (state) => {
      state.orders = [];
      state.salesOrder = [];
      state.deliveryAddress = [];
      state.loading = {
        orders: false,
        deliveryAddress: false,
        deliveryUpdate: false,
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
        state.loading.lifeCycle = false;
        state.lifeCycle = action.payload;
      })
      .addCase(fetchOrderLifeCycle.rejected, (state, action) => {
        state.loading.lifeCycle = false;
        state.error.lifeCycle = action.payload;
      })
      .addCase(checkOutOrder.pending, (state) => {
        state.loading = state.loading || {};
        state.loading.orders = true;
        state.error = state.error || {};
        state.error.orders = null;
      })
      .addCase(checkOutOrder.fulfilled, (state, action) => {
        state.loading.orders = false;
        state.orders = Array.isArray(action.payload) ? action.payload : [];
      })
      .addCase(checkOutOrder.rejected, (state, action) => {
        state.loading.orders = false;
        state.error.orders = action.payload;
      })
      .addCase(orderAddress.pending, (state) => {
        state.loading.deliveryAddress = true;
        state.error.deliveryAddress = null;
      })
      .addCase(orderAddress.fulfilled, (state, action) => {
        state.loading.deliveryAddress = false;
        state.deliveryAddress = action.payload;
      })
      .addCase(orderAddress.rejected, (state, action) => {
        state.loading.deliveryAddress = false;
        state.error.deliveryAddress = action.payload;
      })
      .addCase(fetchOrderDeliveryAddress.fulfilled, (state, action) => {
        if (action.payload) {
          state.deliveryAddress = action.payload;
        } else {
          state.deliveryAddress = null;
        }
      })
      .addCase(fetchOrderDeliveryAddress.rejected, (state, action) => {
        state.error = action.payload;
      })
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
        state.error.deliveryUpdate = action.payload;
      })
      .addCase(fetchSalesOrderById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSalesOrderById.fulfilled, (state, action) => {
        state.loading = false;
        state.salesOrder = action.payload;
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
        state.orders = action.payload || [];
      })
      .addCase(fetchOrdersByCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchOrdersByThirdParty.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOrdersByThirdParty.fulfilled, (state, action) => {
        state.loading = false;
        state.orders = action.payload || [];
      })
      .addCase(fetchOrdersByThirdParty.rejected, (state, action) => {
        state.loading = false;
        state.error.orders = action.error.message;
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
} = orderSlice.actions;

export default orderSlice.reducer;