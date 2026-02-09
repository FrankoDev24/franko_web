import { createSlice, createAsyncThunk } from "@reduxjs/toolkit"
import axios from "axios"

// -------------------- CONSTANTS --------------------
const API_BASE_URL = "https://ftetpsapi.salesmate.app/"
const API_KEY = "462a06ad-6bcd-4ecf-ba68-b11d875e9b3f"
const DEFAULT_BCODE = "855"
const DEFAULT_CUSTOMER_ACCOUNT = 20985623

const normalizeName = (s) =>
  String(s ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .toLowerCase()

export const addBranchOrder = createAsyncThunk(
  "branchOrders/addBranchOrder",
  async (payload, { rejectWithValue, getState }) => {
    try {
      const {
        orderCode,
        items = [],
        deliveryAddress,
        geolocation = null,
        bCode = DEFAULT_BCODE,
        orderDate = new Date().toISOString().split("T")[0],
        CustomerAccountNumber = DEFAULT_CUSTOMER_ACCOUNT,
      } = payload || {}

      if (!orderCode) throw new Error("orderCode is required")
      if (!deliveryAddress) throw new Error("deliveryAddress is required")
      if (!Array.isArray(items) || items.length === 0)
        throw new Error("items[] is required")

      // Build branchProducts lookup by productName
      const branchProducts = getState()?.branchProducts?.data || []
      const branchCodeByName = new Map()
      for (const p of branchProducts) {
        const key = normalizeName(p?.productName)
        if (key) branchCodeByName.set(key, p?.productCode)
      }

      // Convert cart items -> branch order lines
      const lines = items.map((it) => {
        const qty = Number(it?.quantity ?? 0)
        if (!qty || qty <= 0) throw new Error("Invalid quantity in items")

        // productId must be the BRANCH productCode
        // 1) Prefer item.productId2 (you said productId2 holds branch code)
        // 2) Else lookup by productName from branchProducts
        let productCode =
          it?.productId2 ?? it?.productCode ?? it?.branchProductCode ?? null

        if (!productCode && it?.productName) {
          productCode = branchCodeByName.get(normalizeName(it.productName)) ?? null
        }

        if (!productCode) {
          throw new Error(
            `Missing productCode for item "${it?.productName ?? "unknown"}". Ensure productId2 contains the branch product code or branchProducts is loaded.`
          )
        }

        return {
          orderRefrenceNumber: orderCode,
          productId: String(productCode),
          quantity: qty,
          deliveryAddress,
          geolocation,
          bCode: String(bCode),
          orderDate,
        }
      })

      const response = await axios.post(
        `${API_BASE_URL}CTP001_3_PO/AddOrder`,
        lines,
        {
          headers: {
            "x-api-key": API_KEY,
            CustomerAccountNumber,
          },
        }
      )

      return response.data
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message || "Failed to add branch order")
    }
  }
)

const branchOrderSlice = createSlice({
  name: "branchOrders",
  initialState: {
    lastPostResponse: null,
    lastPostedLines: null,
    loading: false,
    error: null,
  },
  reducers: {
    clearBranchOrderState: (state) => {
      state.lastPostResponse = null
      state.lastPostedLines = null
      state.loading = false
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(addBranchOrder.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(addBranchOrder.fulfilled, (state, action) => {
        state.loading = false
        state.lastPostResponse = action.payload
      })
      .addCase(addBranchOrder.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload
      })
  },
})

export const { clearBranchOrderState } = branchOrderSlice.actions
export default branchOrderSlice.reducern 