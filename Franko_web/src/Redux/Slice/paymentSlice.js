// src/Redux/Slice/paymentSlice.js
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "./AxiosInstance";

const PSP = "fte";
const COMPANY_CODE = "fte";
const LAMBDA_TARGET = "payment";

// Helper: map error
const toErrorPayload = (error, fallback) => {
  const server =
    error.response?.data?.message ??
    error.response?.data?.responseMessage ??
    (typeof error.response?.data === "string"
      ? error.response.data
      : null);
  return server || error.message || fallback;
};

// ==================== ASYNC THUNKS ====================

// 1️⃣ Debit Customer
export const debitCustomer = createAsyncThunk(
  "payment/debitCustomer",
  async ({ refNo, msisdn, amount, network, narration }, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post(
        "",
        { refNo, msisdn, amount, network, narration },
        {
          params: {
            endpoint: "/PaymentPrompt/DebitCustomer",
            target: LAMBDA_TARGET,
            PSP,
          },
        }
      );

      // Return raw gateway response: { responseCode, responseMessage, ... }
      return response.data;
    } catch (error) {
      return rejectWithValue(toErrorPayload(error, "Payment request failed"));
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
      return rejectWithValue(toErrorPayload(error, "Failed to validate account"));
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
      return response.data; // raw gateway response
    } catch (error) {
      return rejectWithValue(toErrorPayload(error, "Failed to check transaction status"));
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
      return rejectWithValue(
        toErrorPayload(error, "Failed to debit by customer network provider")
      );
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
      return rejectWithValue(toErrorPayload(error, "Failed to get account hold name"));
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
      return rejectWithValue(
        toErrorPayload(error, "Failed to fetch PSP transactions report")
      );
    }
  }
);

// ==================== SLICE ====================
const initialState = {
  debitCustomerData: null,
  validateAccountData: null,
  transactionStatus: null,
  debitNetworkData: null,
  accountHoldName: null,
  pspTransactionsReport: null,

  loading: false,
  validating: false,
  checkingStatus: false,
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
      state.validating = false;
      state.checkingStatus = false;
      state.error = null;
    },
    resetPSPTransactionsReport: (state) => {
      state.pspTransactionsReport = null;
      state.error = null;
    },
    resetValidateAccountData: (state) => {
      state.validateAccountData = null;
      state.validating = false;
    },
    resetTransactionStatus: (state) => {
      state.transactionStatus = null;
      state.checkingStatus = false;
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
        state.error = action.payload || action.error?.message || "Payment failed";
      })

      // Validate Account
      .addCase(validateAccount.pending, (state) => {
        state.validating = true;
        state.error = null;
      })
      .addCase(validateAccount.fulfilled, (state, action) => {
        state.validating = false;
        state.validateAccountData = action.payload;
      })
      .addCase(validateAccount.rejected, (state, action) => {
        state.validating = false;
        state.error = action.payload || action.error?.message;
      })

      // Check Transaction Status
      .addCase(checkTransactionStatus.pending, (state) => {
        state.checkingStatus = true;
        state.error = null;
      })
      .addCase(checkTransactionStatus.fulfilled, (state, action) => {
        state.checkingStatus = false;
        state.transactionStatus = action.payload;
      })
      .addCase(checkTransactionStatus.rejected, (state, action) => {
        state.checkingStatus = false;
        state.error = action.payload || action.error?.message;
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
        state.error = action.payload || action.error?.message;
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
        state.error = action.payload || action.error?.message;
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
        state.error = action.payload || action.error?.message;
      });
  },
});

export const {
  resetPaymentState,
  resetPSPTransactionsReport,
  resetValidateAccountData,
  resetTransactionStatus,
} = paymentSlice.actions;

export default paymentSlice.reducer;