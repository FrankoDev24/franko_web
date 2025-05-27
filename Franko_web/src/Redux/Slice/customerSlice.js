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
  },
  extraReducers: (builder) => {
    builder
      .addCase(createCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createCustomer.fulfilled, (state, action) => {
        state.loading = false;

        if (action.payload && action.payload.ResponseCode === '1') {
          const newCustomer = {
            ...action.meta.arg,
            ...action.payload,
          };
          state.currentCustomer = newCustomer;
          localStorage.setItem('customer', JSON.stringify(newCustomer));
        } else {
          state.error = "Failed to create customer.";
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
      });
  
  },
});

// Export the actions
export const { logoutCustomer, clearCustomers, setCustomer, clearSelectedCustomer } = customerSlice.actions;

// Export the reducer
export default customerSlice.reducer;
