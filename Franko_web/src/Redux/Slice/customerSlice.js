import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// -------------------------
// ✅ Secure LocalStorage Helper
// -------------------------
const secureStorage = {
  get: (key) => localStorage.getItem(key), // already decrypted by your patch
  set: (key, value) => localStorage.setItem(key, value),
  remove: (key) => localStorage.removeItem(key),
};

// -------------------------
// 🔹 Async Thunks
// -------------------------

// Create a new customer
export const createCustomer = createAsyncThunk(
  "customers/createCustomer",
  async (customerData, { rejectWithValue }) => {
    try {
      const response = await axios.post(
        `${API_BASE_URL}/Users/Customer-Post`,
        customerData
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "An unknown error occurred."
      );
    }
  }
);

// Fetch all customers
export const fetchCustomers = createAsyncThunk(
  "customers/fetchCustomers",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/Users/Customer-Get`);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data || "An unknown error occurred."
      );
    }
  }
);

// Customer login
export const loginCustomer = createAsyncThunk(
  "customers/loginCustomer",
  async ({ contactNumber, password }, { dispatch, rejectWithValue }) => {
    try {
      const customers = await dispatch(fetchCustomers()).unwrap();

      const matchingCustomer = customers.find(
        (c) => c.contactNumber === contactNumber && c.password === password
      );

      if (matchingCustomer) {
        secureStorage.set("customer", matchingCustomer);
        return matchingCustomer;
      } else {
        return rejectWithValue(
          "No customer found with the provided credentials."
        );
      }
    } catch (error) {
      return rejectWithValue(error.message || "An unknown error occurred.");
    }
  }
);

// Update account status (e.g. deactivate)
export const updateAccountStatus = createAsyncThunk(
  "customers/updateAccountStatus",
  async (_, { rejectWithValue }) => {
    try {
      console.log("Fetching customer details from secure localStorage...");
      const customer = secureStorage.get("customer");

      if (!customer) {
        console.error("No customer found in localStorage.");
        return rejectWithValue("No customer found.");
      }

      const { customerAccountNumber } = customer;
      if (!customerAccountNumber) {
        return rejectWithValue("Invalid customer data.");
      }

      const response = await axios.post(`${API_BASE_URL}/Users/Customer-Status`, {
        accountNumber: customerAccountNumber,
        accountStatus: "0",
      });

      console.log("Response from server:", response.data);
      secureStorage.remove("customer");
      console.log("Customer removed from localStorage.");

      return response.data;
    } catch (error) {
      console.error("Error updating account status:", error);
      return rejectWithValue(
        error.response?.data || "Failed to update account status."
      );
    }
  }
);

// -------------------------
// 🔹 Initial State
// -------------------------
const initialState = {
  currentCustomer: secureStorage.get("customer") || null,
  currentCustomerDetails: secureStorage.get("customer") || null,
  customerList: [],
  loading: false,
  error: null,
};

// -------------------------
// 🔹 Slice Definition
// -------------------------
const customerSlice = createSlice({
  name: "customer",
  initialState,
  reducers: {
    logoutCustomer: (state) => {
      state.currentCustomer = null;
      state.currentCustomerDetails = null;
      secureStorage.remove("customer");
    },

    clearCustomers: (state) => {
      state.customerList = [];
    },

    setCustomer: (state, action) => {
      state.selectedCustomer = action.payload;
    },

    clearSelectedCustomer: (state) => {
      state.selectedCustomer = null;
    },

    setCurrentCustomer: (state, action) => {
      state.currentCustomer = action.payload;
      state.currentCustomerDetails = action.payload;
      if (action.payload) {
        secureStorage.set("customer", action.payload);
      }
    },
  },

  extraReducers: (builder) => {
    builder
      // CREATE
      .addCase(createCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.loading = false;
        const { ResponseCode } = action.payload || {};

        if (ResponseCode === "1") {
          const customer = { ...action.meta.arg, ...action.payload };
          state.currentCustomer = customer;
          state.currentCustomerDetails = customer;
          secureStorage.set("customer", customer);
        } else {
          state.error =
            action.payload?.ResponseMessage ||
            "Account creation failed. Invalid server response.";
        }
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || action.error?.message || "An unknown error occurred.";
      })

      // FETCH
      .addCase(fetchCustomers.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCustomers.fulfilled, (state, action) => {
        state.loading = false;
        state.customerList = action.payload;
      })
      .addCase(fetchCustomers.rejected, (state, action) => {
        state.loading = false;
        state.error =
          action.payload || action.error?.message || "An unknown error occurred.";
      })

      // LOGIN
      .addCase(loginCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.currentCustomer = action.payload;
        state.currentCustomerDetails = action.payload;
      })
      .addCase(loginCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Login failed.";
      })

      // UPDATE STATUS
      .addCase(updateAccountStatus.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateAccountStatus.fulfilled, (state) => {
        state.status = "succeeded";
        state.currentCustomer = null;
      })
      .addCase(updateAccountStatus.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          action.payload || "Failed to update account status.";
      });
  },
});

// -------------------------
// 🔹 Exports
// -------------------------
export const {
  logoutCustomer,
  clearCustomers,
  setCustomer,
  clearSelectedCustomer,
  setCurrentCustomer,
} = customerSlice.actions;

export default customerSlice.reducer;
