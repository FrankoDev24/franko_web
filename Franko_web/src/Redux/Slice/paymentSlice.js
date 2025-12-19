// src/redux/slices/paymentSlice.js
import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axiosInstance from './AxiosInstance'; // adjust path if needed

// Post Hubtel callback
export const postHubtelCallback = createAsyncThunk(
  'payment/postHubtelCallback',
  async (responseData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        '/PaymentSystem/PostHubtelCallBack',
        { responseData }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Something went wrong');
    }
  }
);

// Get Hubtel callback by Order ID (clientReference)
export const getHubtelCallbackById = createAsyncThunk(
  'payment/getHubtelCallbackById',
  async (orderId, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        '/PaymentSystem/GetHubtelCallBackById',
        {
          params: {
            Orderid: orderId,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Something went wrong');
    }
  }
);

// Get all Hubtel callback records
export const getAllHubtelCallbackRecords = createAsyncThunk(
  'payment/getAllHubtelCallbackRecords',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(
        '/PaymentSystem/GetHubtelCallBackAllRecords'
      );

      const sortedData = response.data?.slice().reverse(); // newest to oldest based on position

      return sortedData;
    } catch (error) {
      return rejectWithValue(error.response?.data || 'Something went wrong');
    }
  }
);

const paymentSlice = createSlice({
  name: 'payment',
  initialState: {
    callbackData: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearPaymentState: (state) => {
      state.callbackData = null;
      state.loading = false;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // postHubtelCallback
      .addCase(postHubtelCallback.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(postHubtelCallback.fulfilled, (state, action) => {
        state.loading = false;
        state.callbackData = action.payload;
      })
      .addCase(postHubtelCallback.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // getHubtelCallbackById
      .addCase(getHubtelCallbackById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getHubtelCallbackById.fulfilled, (state, action) => {
        state.loading = false;
        state.callbackData = action.payload;
      })
      .addCase(getHubtelCallbackById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // getAllHubtelCallbackRecords
      .addCase(getAllHubtelCallbackRecords.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAllHubtelCallbackRecords.fulfilled, (state, action) => {
        state.loading = false;
        state.callbackData = action.payload;
      })
      .addCase(getAllHubtelCallbackRecords.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { clearPaymentState } = paymentSlice.actions;

export default paymentSlice.reducer;