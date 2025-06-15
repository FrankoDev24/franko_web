import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

// Define the API base URL
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

// Async thunk for creating a new customer
export const createCustomer = createAsyncThunk(
  'customers/createCustomer',
  async (customerData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/Users/Customer-Post`, customerData);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "An unknown error occurred.");
    }
  }
);

// Async thunk for fetching all customers
export const fetchCustomers = createAsyncThunk(
  'customers/fetchCustomers',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_BASE_URL}/Users/Customer-Get`);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || "An unknown error occurred.");
    }
  }
);

// Async thunk for login
export const loginCustomer = createAsyncThunk(
  'customers/loginCustomer',
  async ({ contactNumber, password }, { dispatch, rejectWithValue }) => {
    try {
      const fetchCustomersResult = await dispatch(fetchCustomers()).unwrap();

      const matchingCustomer = fetchCustomersResult.find(
        (customer) =>
          customer.contactNumber === contactNumber && customer.password === password
      );

      if (matchingCustomer) {
        // Save customer to localStorage
        localStorage.setItem('customer', JSON.stringify(matchingCustomer));
        return matchingCustomer;
      } else {
        return rejectWithValue("No customer found with the provided credentials.");
      }
    } catch (error) {
      return rejectWithValue(error.message || "An unknown error occurred.");
    }
  }
);
export const updateAccountStatus = createAsyncThunk(
  "customers/updateAccountStatus",
  async (_, { rejectWithValue }) => {
    try {
      console.log("Fetching customer details from localStorage...");
      const customer = await localStorage.getItem("customer");

      if (!customer) {
        console.error("No customer found in localStorage.");
        return rejectWithValue("No customer found.");
      }

      const parsedCustomer = JSON.parse(customer);
      console.log("Customer details:", parsedCustomer);

      const { customerAccountNumber } = parsedCustomer; // Fix here
      console.log("Customer account number:", customerAccountNumber);

      if (!customerAccountNumber) {
        console.error("Missing customerAccountNumber.");
        return rejectWithValue("Invalid customer data.");
      }

      const response = await axios.post(`${API_BASE_URL}/Users/Customer-Status`, {
        accountNumber: customerAccountNumber, // Fix here
        accountStatus: "0",
      });

      console.log("Response from server:", response.data);

      // Remove customer from localStorage
      await localStorage.removeItem("customer");
      console.log("Customer data removed from localStorage.");

      return response.data;
    } catch (error) {
      console.error("Error updating account status:", error.response?.data || error.message);
      return rejectWithValue(error.response?.data || "Failed to update account status.");
    }
  }
);



// Initial state
const initialState = {
  currentCustomer: JSON.parse(localStorage.getItem('customer')) || null,
  currentCustomerDetails: null,
  customerList: [],
  loading: false,
  error: null,
};

// Create the customer slice
const customerSlice = createSlice({
  name: 'customer',
  initialState,
  reducers: {
    logoutCustomer: (state) => {
      state.currentCustomer = null;
      state.currentCustomerDetails = null;
      localStorage.removeItem('customer'); // Clear from localStorage on logout
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
    
    // New action to manually set current customer (useful for guest accounts)
    setCurrentCustomer: (state, action) => {
      state.currentCustomer = action.payload;
      state.currentCustomerDetails = action.payload;
      // Also update localStorage
      if (action.payload) {
        localStorage.setItem('customer', JSON.stringify(action.payload));
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.loading = false;

        // Handle successful customer creation (including guests)
        if (action.payload && (action.payload.ResponseCode === '1' || action.payload.ResponseCode === '0')) {
          const newCustomer = {
            ...action.meta.arg, // Original customer data sent to API
            ...action.payload,  // Response data from API
          };
          state.currentCustomer = newCustomer;
          state.currentCustomerDetails = newCustomer;
          localStorage.setItem('customer', JSON.stringify(newCustomer));
        } 
        // Handle guest accounts specifically - even if no specific response code
        else if (action.meta.arg.isGuest) {
          // For guest accounts, use the original data we sent since it contains all the info
          const guestCustomer = {
            ...action.meta.arg,
            ...action.payload, // Include any response data from server
          };
          state.currentCustomer = guestCustomer;
          state.currentCustomerDetails = guestCustomer;
          localStorage.setItem('customer', JSON.stringify(guestCustomer));
        } 
        else {
          state.error = action.payload?.ResponseMessage || "Failed to create customer.";
        }
      })
      .addCase(createCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || "An unknown error occurred.";
      })
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
        state.error = action.error?.message || "An unknown error occurred.";
      })
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
       .addCase(updateAccountStatus.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(updateAccountStatus.fulfilled, (state) => {
        state.status = "succeeded";
        state.customerData = null; // Clear customer data from Redux
      })
      .addCase(updateAccountStatus.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || "Failed to update account status.";
      });

  },
});

// Export the actions
export const { 
  logoutCustomer, 
  clearCustomers, 
  setCustomer, 
  clearSelectedCustomer, 
  setCurrentCustomer 
} = customerSlice.actions;

// Export the reducer
export default customerSlice.reducer;