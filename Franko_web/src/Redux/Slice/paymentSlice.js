// src/redux/slice/paymentSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "./AxiosInstance"; // <= adjust path as needed

const PSP = "fte"; // constant PSP query parameter
const COMPANY_CODE = "fte"; // constant company code for report
const LAMBDA_TARGET = "payment"; // tells Lambda to route to payment backend

// ------------------------
// Async Thunks via Lambda
// ------------------------

// 1️⃣ Debit Customer
export const debitCustomer = createAsyncThunk(
  "payment/debitCustomer",
  async ({ refNo, msisdn, amount, network, narration }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "",
        {
          refNo,
          msisdn,
          amount,
          network,
          narration,
        },
        {
          params: {
            endpoint: "/PaymentPrompt/DebitCustomer",
            target: LAMBDA_TARGET,
            PSP,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 2️⃣ Validate Account
export const validateAccount = createAsyncThunk(
  "payment/validateAccount",
  async ({ msisdn, network }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "",
        { msisdn, network },
        {
          params: {
            endpoint: "/PaymentPrompt/ValidateAccount",
            target: LAMBDA_TARGET,
            PSP,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 3️⃣ Check Transaction Status
export const checkTransactionStatus = createAsyncThunk(
  "payment/checkTransactionStatus",
  async ({ refNo }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "",
        { refNo },
        {
          params: {
            endpoint: "/PaymentPrompt/CheckTransactionStatus",
            target: LAMBDA_TARGET,
            PSP,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 4️⃣ Debit by Customer Network Provider ID
export const debitByCustomerNetworkProviderId = createAsyncThunk(
  "payment/debitByCustomerNetworkProviderId",
  async (
    { transactionNumber, contactNumber, customerNetworkProviderId, amount },
    { rejectWithValue }
  ) => {
    try {
      const response = await axiosInstance.post(
        "",
        {
          transactionNumber,
          contactNumber,
          customerNetworkProviderId,
          amountPaid: amount,
        },
        {
          params: {
            endpoint: "/PaymentPrompt/DebitbyCustomerNetworkProviderId",
            target: LAMBDA_TARGET,
            PSP,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 5️⃣ Get Account Hold Name
export const getAccountHoldName = createAsyncThunk(
  "payment/getAccountHoldName",
  async ({ msisdn, network }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "",
        { msisdn, network },
        {
          params: {
            endpoint: "/PaymentPrompt/AccountHoldName",
            target: LAMBDA_TARGET,
            PSP,
          },
        }
      );
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// 6️⃣ Get PSP Transactions By Company
export const getPSPTransactionsByCompany = createAsyncThunk(
  "payment/getPSPTransactionsByCompany",
  async ({ from, to }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("", {
        params: {
          endpoint: "/PSP/GetPSPTransactionsByCompany",
          target: LAMBDA_TARGET,
          from,
          to,
          CompanyCode: COMPANY_CODE,
        },
      });
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// ------------------------
// Slice
// ------------------------
const initialState = {
  debitCustomerData: null,
  validateAccountData: null,
  transactionStatus: null,
  debitNetworkData: null,
  accountHoldName: null,
  pspTransactionsReport: null,
  loading: false,
  error: null,
};

const paymentSlice = createSlice({
  name: "payment",
  initialState,
  reducers: {
    resetPaymentState: (state) => {
      state.debitCustomerData = null;
      state.validateAccountData = null;
      state.transactionStatus = null;
      state.debitNetworkData = null;
      state.accountHoldName = null;
      state.pspTransactionsReport = null;
      state.loading = false;
      state.error = null;
    },
    resetPSPTransactionsReport: (state) => {
      state.pspTransactionsReport = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Debit Customer
      .addCase(debitCustomer.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(debitCustomer.fulfilled, (state, action) => {
        state.loading = false;
        state.debitCustomerData = action.payload;
      })
      .addCase(debitCustomer.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Validate Account
      .addCase(validateAccount.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(validateAccount.fulfilled, (state, action) => {
        state.loading = false;
        state.validateAccountData = action.payload;
      })
      .addCase(validateAccount.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Check Transaction Status
      .addCase(checkTransactionStatus.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(checkTransactionStatus.fulfilled, (state, action) => {
        state.loading = false;
        state.transactionStatus = action.payload;
      })
      .addCase(checkTransactionStatus.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Debit by Customer Network Provider ID
      .addCase(debitByCustomerNetworkProviderId.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(debitByCustomerNetworkProviderId.fulfilled, (state, action) => {
        state.loading = false;
        state.debitNetworkData = action.payload;
      })
      .addCase(debitByCustomerNetworkProviderId.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Account Hold Name
      .addCase(getAccountHoldName.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getAccountHoldName.fulfilled, (state, action) => {
        state.loading = false;
        state.accountHoldName = action.payload;
      })
      .addCase(getAccountHoldName.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })

      // Get PSP Transactions By Company
      .addCase(getPSPTransactionsByCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getPSPTransactionsByCompany.fulfilled, (state, action) => {
        state.loading = false;
        state.pspTransactionsReport = action.payload;
      })
      .addCase(getPSPTransactionsByCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const { resetPaymentState, resetPSPTransactionsReport } =
  paymentSlice.actions;
export default paymentSlice.reducer;