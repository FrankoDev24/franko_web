import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "./AxiosInstance";

const ORDER_PREFIX = "/Order";
const CHECKOUT_DETAILS_KEY = "checkoutDetails";
const ORDER_ADDRESS_KEY = "orderAddressDetails";
const USER_ORDERS_KEY = "userOrders";

export const FRIENDLY_PRICE_UPDATE_MSG =
  "Prices have been updated. Your cart has been cleared to reflect the latest prices. Please add your items again and place your order.";

/* ── Response, storage, and validation helpers ─────────────────────────── */

const isTechnicalMessage = (message) => {
  const lower = String(message || "").toLowerCase();
  return (
    lower.includes("datareader") ||
    lower.includes("transaction failed") ||
    lower.includes("open datareader")
  );
};

const parseApiResponse = (value) => {
  if (typeof value !== "string") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
};

const responseObject = (value) => {
  const parsed = parseApiResponse(value);
  if (Array.isArray(parsed)) return parsed[0] ?? {};
  if (Array.isArray(parsed?.data)) return parsed.data[0] ?? {};
  if (Array.isArray(parsed?.result)) return parsed.result[0] ?? {};
  return parsed && typeof parsed === "object" ? parsed : {};
};

const getResponseCode = (value) => {
  const data = responseObject(value);
  return String(
    data?.responseCode ??
      data?.ResponseCode ??
      data?.response?.responseCode ??
      data?.data?.responseCode ??
      data?.code ??
      ""
  ).trim();
};

const getResponseMessage = (value) => {
  const parsed = parseApiResponse(value);
  if (typeof parsed === "string") return parsed;
  const data = responseObject(parsed);
  return (
    data?.responseMessage ??
    data?.ResponseMessage ??
    data?.response?.responseMessage ??
    data?.data?.responseMessage ??
    data?.message ??
    data?.error ??
    ""
  );
};

const toErrorPayload = (error, fallback) => {
  if (error?.isAuthError || error?.authExpired) {
    return {
      isAuthError: true,
      authExpired: true,
      status: 401,
      message: error?.authMessage || "Your session expired. Please sign in again.",
    };
  }

  const data = error?.response?.data;
  const serverMessage =
    data?.message ??
    data?.responseMessage ??
    data?.response?.responseMessage ??
    (typeof data === "string" ? data : null);
  const message = serverMessage || error?.message || fallback;
  // ValidateCart is the only endpoint that identifies a price change.
  return isTechnicalMessage(message) ? fallback : message;
};

const toOrderCreationFailure = (value) => {
  const rawMessage = getResponseMessage(value);
  return {
    message:
      (rawMessage && !isTechnicalMessage(rawMessage) ? rawMessage : "") ||
      "Cart validation passed, but the order could not be created. Please try again.",
    responseCode: getResponseCode(value),
    raw: value,
    isOrderCreationFailure: true,
    isPriceUpdate: false,
  };
};

const toPriceUpdateFailure = (value) => ({
  message: FRIENDLY_PRICE_UPDATE_MSG,
  rawMessage: getResponseMessage(value),
  responseCode: getResponseCode(value) || "0",
  raw: value,
  isCartValidationFailure: true,
  isCheckoutFailure: true,
  isPriceUpdate: true,
});

const isPriceUpdateResponse = (value) =>
  getResponseCode(value) === "0" || isTechnicalMessage(getResponseMessage(value));

const isOrderCreationFailure = (value) => {
  const data = responseObject(value);
  const code = getResponseCode(value);
  return (
    data?.status === false ||
    data?.success === false ||
    (code !== "" && code !== "1" && code !== "01")
  );
};

const createValidationError = (message) => {
  const error = new Error(message);
  error.isClientValidation = true;
  return error;
};

const encodePart = (value) => encodeURIComponent(String(value));

const resolveOrderCode = (arg) => {
  if (typeof arg === "string" || typeof arg === "number") return arg;
  return arg?.OrderCode ?? arg?.orderCode ?? arg?.orderId ?? null;
};

const getValidationDefaults = (arg) =>
  arg?.validationData ??
  arg?.validationPayload ??
  arg?.orderPayload ??
  arg?.checkoutDetails ??
  arg?.checkout ??
  arg?.order ??
  arg ??
  {};

const resolveCartId = (arg, items = []) => {
  if (typeof arg === "string" || typeof arg === "number") return arg;
  const defaults = getValidationDefaults(arg);
  return (
    arg?.cartId ??
    arg?.CartId ??
    arg?.Cartid ??
    arg?.cartID ??
    arg?.CartID ??
    defaults?.cartId ??
    defaults?.CartId ??
    defaults?.Cartid ??
    defaults?.cartID ??
    defaults?.CartID ??
    items[0]?.cartId ??
    items[0]?.CartId ??
    items[0]?.Cartid ??
    items[0]?.CartID ??
    null
  );
};

const getItemsFromValidationArg = (arg) => {
  if (Array.isArray(arg)) return arg;
  const singleItemId =
    arg?.productId ?? arg?.productID ?? arg?.ProductId ?? arg?.ProductID ?? arg?.id;
  if (singleItemId != null) return [arg];

  const defaults = getValidationDefaults(arg);
  const candidates = [
    arg?.items,
    arg?.cartItems,
    arg?.products,
    arg?.body,
    arg?.cartDetails?.cartItems,
    arg?.cart,
    arg?.CartItems,
    arg?.cartDetails,
    defaults?.items,
    defaults?.cartItems,
    defaults?.products,
    defaults?.body,
    defaults?.cartDetails?.cartItems,
  ];
  return candidates.find(Array.isArray) || [];
};

const toDateOnly = (value) => {
  if (value instanceof Date && !Number.isNaN(value.getTime())) {
    return value.toISOString().slice(0, 10);
  }
  if (value != null && String(value).trim()) {
    const raw = String(value).trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
};

const buildValidateCartRows = (arg, cartId, items) => {
  const defaults = getValidationDefaults(arg);
  return items.map((item) => {
    const quantity = Number(item?.quantity ?? item?.Quantity ?? item?.qty ?? 1);
    const amount = Number(
      item?.amount ?? item?.Amount ?? item?.total ?? item?.totalPrice ?? item?.TotalPrice
    );
    const rawPrice =
      item?.price ??
      item?.Price ??
      item?.unitPrice ??
      item?.UnitPrice ??
      item?.productPrice ??
      item?.ProductPrice ??
      (Number.isFinite(amount) && quantity > 0 ? amount / quantity : 0);

    return {
      cartId: String(cartId),
      productId: String(
        item?.productId ?? item?.productID ?? item?.ProductId ?? item?.ProductID ?? item?.id ?? ""
      ).trim(),
      price: Number(rawPrice),
      quantity,
      customerid: String(
        item?.customerid ??
          item?.customerId ??
          item?.customerID ??
          item?.Customerid ??
          item?.CustomerId ??
          item?.CustomerID ??
          defaults?.customerid ??
          defaults?.customerId ??
          defaults?.customerID ??
          defaults?.Customerid ??
          defaults?.CustomerId ??
          defaults?.CustomerID ??
          ""
      ),
      orderDate: toDateOnly(
        item?.orderDate ?? item?.OrderDate ?? defaults?.orderDate ?? defaults?.OrderDate
      ),
      paymentMode: String(
        item?.paymentMode ??
          item?.PaymentMode ??
          defaults?.paymentMode ??
          defaults?.PaymentMode ??
          ""
      ),
      paymentService: String(
        item?.paymentService ??
          item?.PaymentService ??
          defaults?.paymentService ??
          defaults?.PaymentService ??
          ""
      ),
      paymentAccountNumber: String(
        item?.paymentAccountNumber ??
          item?.PaymentAccountNumber ??
          defaults?.paymentAccountNumber ??
          defaults?.PaymentAccountNumber ??
          ""
      ),
      customerAccountType: String(
        item?.customerAccountType ??
          item?.CustomerAccountType ??
          defaults?.customerAccountType ??
          defaults?.CustomerAccountType ??
          ""
      ),
    };
  });
};

const readLocalStorage = (key, fallback) => {
  try {
    if (typeof localStorage === "undefined") return fallback;
    const value = localStorage.getItem(key);
    if (value == null || value === "") return fallback;
    if (typeof value !== "string") return value;
    try {
      return JSON.parse(value);
    } catch {
      return value;
    }
  } catch {
    return fallback;
  }
};

const writeLocalStorage = (key, value) => {
  try {
    if (typeof localStorage === "undefined") return;
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Persistence is best-effort and must not interrupt order actions.
  }
};

const removeLocalStorage = (keys) => {
  try {
    if (typeof localStorage === "undefined") return;
    keys.forEach((key) => localStorage.removeItem(key));
  } catch {
    // Persistence is best-effort.
  }
};

const parseStoredUserOrders = () => {
  const orders = readLocalStorage(USER_ORDERS_KEY, []);
  return Array.isArray(orders) ? orders : [];
};

const asArray = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.result)) return payload.result;
  if (Array.isArray(payload?.orders)) return payload.orders;
  return [];
};

/* ── Loading and error-state helpers ────────────────────────────────────── */

const getInitialLoadingStatus = () => ({
  orders: false,
  validateCart: false,
  checkout: false,
  deliveryAddress: false,
  deliveryUpdate: false,
  lifeCycle: false,
  salesOrder: false,
  cancelOrder: false,
});

const getInitialErrorState = () => ({
  orders: null,
  validateCart: null,
  checkout: null,
  deliveryAddress: null,
  deliveryUpdate: null,
  lifeCycle: null,
  salesOrder: null,
  cancelOrder: null,
});

const syncGlobalLoading = (state) => {
  state.loading = Object.values(state.loadingStatus).some(Boolean);
};

const setLoadingStatus = (state, key, value) => {
  state.loadingStatus[key] = value;
  syncGlobalLoading(state);
};

const startLoading = (state, key) => {
  setLoadingStatus(state, key, true);
  state.errorStatus[key] = null;
};

const stopLoading = (state, key) => setLoadingStatus(state, key, false);

const rejectLoading = (state, key, action, fallbackMessage) => {
  stopLoading(state, key);
  const payloadMessage =
    action.payload?.message ??
    (typeof action.payload === "string" ? action.payload : null) ??
    action.error?.message ??
    fallbackMessage;
  state.errorStatus[key] = payloadMessage;
  state.error[key] = action.payload ?? payloadMessage;
};

const addAsyncStateHandlers = (builder, thunk, key, fallback, onFulfilled) => {
  builder
    .addCase(thunk.pending, (state) => startLoading(state, key))
    .addCase(thunk.fulfilled, (state, action) => {
      stopLoading(state, key);
      state.errorStatus[key] = null;
      state.error[key] = null;
      if (onFulfilled) onFulfilled(state, action);
    })
    .addCase(thunk.rejected, (state, action) =>
      rejectLoading(state, key, action, fallback)
    );
};

/* ── API thunks ──────────────────────────────────────────────────────────── */

export const fetchOrdersByDate = createAsyncThunk(
  "orders/fetchOrdersByDate",
  async ({ from, to }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/", {
        params: {
          endpoint: `${ORDER_PREFIX}/GetOrdersByDate/${encodePart(from)}/${encodePart(to)}`,
        },
      });
      return data ?? [];
    } catch (error) {
      return rejectWithValue(toErrorPayload(error, "Failed to fetch orders by date"));
    }
  }
);

/**
 * Validate prices/availability before order submission.
 * The cartId query parameter is a single string. The JSON body is an array
 * containing one row per cart item, as required by /Order/ValidateCart.
 */
export const validateCart = createAsyncThunk(
  "orders/validateCart",
  async (arg, { rejectWithValue }) => {
    try {
      const items = getItemsFromValidationArg(arg);
      const rawCartId = resolveCartId(arg, items);
      const cartId = rawCartId == null ? "" : String(rawCartId).trim();

      if (!cartId) throw createValidationError("A cartId is required to validate the cart.");
      if (!items.length) throw createValidationError("Add at least one item before validating the cart.");

      const body = buildValidateCartRows(arg, cartId, items);
      const invalidIndex = body.findIndex(
        (item) =>
          !item.productId ||
          !Number.isFinite(item.price) ||
          item.price < 0 ||
          !Number.isFinite(item.quantity) ||
          item.quantity <= 0
      );
      if (invalidIndex !== -1) {
        throw createValidationError(`Cart item ${invalidIndex + 1} is missing a valid productId, price, or quantity.`);
      }

      const { data } = await axiosInstance.post("/", body, {
        params: {
          endpoint: `${ORDER_PREFIX}/ValidateCart`,
          cartId,
        },
        headers: { "Content-Type": "application/json" },
      });

      const code = getResponseCode(data);
      if (code === "1") return parseApiResponse(data);
      if (isPriceUpdateResponse(data)) {
        return rejectWithValue(toPriceUpdateFailure(data));
      }

      return rejectWithValue({
        message:
          getResponseMessage(data) ||
          "We could not validate your cart. Please try again.",
        responseCode: code,
        raw: data,
        isCartValidationFailure: true,
        isPriceUpdate: false,
      });
    } catch (error) {
      if (error?.isClientValidation) {
        return rejectWithValue({ message: error.message, isClientValidation: true });
      }
      if (error?.isAuthError || error?.authExpired) {
        return rejectWithValue(toErrorPayload(error, "Your session expired. Please sign in again."));
      }
      if (isPriceUpdateResponse(error?.response?.data)) {
        return rejectWithValue(toPriceUpdateFailure(error.response.data));
      }
      return rejectWithValue(toErrorPayload(error, "Failed to validate cart"));
    }
  }
);

/**
 * Posts the order only. Price validation belongs exclusively to validateCart.
 * COD screens can use validateAndCheckOutOrder; Mobile Money screens should
 * validate before starting payment and dispatch this thunk only after payment
 * success is confirmed.
 */
export const checkOutOrder = createAsyncThunk(
  "orders/checkOutOrder",
  async (orderPayload, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/", orderPayload, {
        params: { endpoint: `${ORDER_PREFIX}/CheckOutDbCart` },
        headers: { "Content-Type": "application/json" },
      });

      if (isOrderCreationFailure(data)) {
        return rejectWithValue(toOrderCreationFailure(data));
      }
      return parseApiResponse(data);
    } catch (error) {
      const backendData = error?.response?.data;
      if (error?.isAuthError || error?.authExpired) {
        return rejectWithValue(toErrorPayload(error, "Your session expired. Please sign in again."));
      }
      if (backendData && isOrderCreationFailure(backendData)) {
        return rejectWithValue(toOrderCreationFailure(backendData));
      }
      return rejectWithValue(toErrorPayload(error, "Failed to create checkout order"));
    }
  }
);

/**
 * Convenience flow for Cash on Delivery: ValidateCart must return code 1
 * before CheckOutDbCart is called. For Mobile Money, call validateCart first,
 * then call checkOutOrder only after confirmed payment success.
 */
export const validateAndCheckOutOrder = createAsyncThunk(
  "orders/validateAndCheckOutOrder",
  async ({ validationPayload, orderPayload }, { dispatch, rejectWithValue }) => {
    try {
      await dispatch(validateCart(validationPayload)).unwrap();
      return await dispatch(checkOutOrder(orderPayload)).unwrap();
    } catch (error) {
      return rejectWithValue(error);
    }
  }
);

export const fetchOrdersByCustomer = createAsyncThunk(
  "orders/fetchOrdersByCustomerOrAgent",
  async ({ from, to, customerId }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/", {
        params: {
          endpoint: `${ORDER_PREFIX}/GetOrderByCustomer`,
          from,
          to,
          customerId,
        },
      });
      return data ?? [];
    } catch (error) {
      return rejectWithValue(toErrorPayload(error, "Failed to fetch orders"));
    }
  }
);

export const fetchOrdersByThirdParty = createAsyncThunk(
  "orders/fetchOrdersByThirdParty",
  async ({ from, to, ThirdPartyAccountNumber }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/", {
        params: {
          endpoint: `${ORDER_PREFIX}/GetOrderByThirdParty`,
          from,
          to,
          ThirdPartyAccountNumber,
        },
      });
      return data ?? [];
    } catch (error) {
      return rejectWithValue(toErrorPayload(error, "Failed to fetch orders"));
    }
  }
);

export const updateOrderTransition = createAsyncThunk(
  "orders/updateOrderTransition",
  async ({ CycleName, OrderId }, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/", null, {
        params: {
          endpoint: `${ORDER_PREFIX}/UpdateOrderTransition/${encodePart(CycleName)}/${encodePart(OrderId)}`,
        },
      });
      return data;
    } catch (error) {
      return rejectWithValue(toErrorPayload(error, "Failed to update order transition"));
    }
  }
);

export const fetchOrderLifeCycle = createAsyncThunk(
  "orders/fetchOrderLifeCycle",
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/", {
        params: { endpoint: `${ORDER_PREFIX}/OrderLifeCycle-Get` },
      });
      return data;
    } catch (error) {
      return rejectWithValue(toErrorPayload(error, "Failed to fetch order lifecycle"));
    }
  }
);

export const fetchSalesOrderById = createAsyncThunk(
  "orders/fetchSalesOrderById",
  async (orderId, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/", {
        params: { endpoint: `${ORDER_PREFIX}/SalesOrderGet/${encodePart(orderId)}` },
      });
      return data;
    } catch (error) {
      return rejectWithValue(toErrorPayload(error, "Failed to fetch sales order"));
    }
  }
);

/** Delivery updates are not a cart-price validation endpoint. */
export const updateOrderDelivery = createAsyncThunk(
  "orders/updateOrderDelivery",
  async ({ orderCode, ...payload }, { rejectWithValue }) => {
    try {
      const OrderCode = payload?.OrderCode ?? orderCode;
      if (!OrderCode) throw createValidationError("OrderCode is required.");

      const { data } = await axiosInstance.post(
        "/",
        { ...payload, OrderCode },
        {
          params: {
            endpoint: `${ORDER_PREFIX}/OrderDeliveryUpdate/${encodePart(OrderCode)}`,
          },
          headers: { "Content-Type": "application/json" },
        }
      );
      return data;
    } catch (error) {
      return rejectWithValue(
        error?.isClientValidation
          ? { message: error.message, isClientValidation: true }
          : toErrorPayload(error, "Failed to update order delivery")
      );
    }
  }
);

export const orderAddress = createAsyncThunk(
  "orders/orderAddress",
  async (payload, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.post("/", payload, {
        params: { endpoint: `${ORDER_PREFIX}/OrderAddress` },
        headers: { "Content-Type": "application/json" },
      });
      return data;
    } catch (error) {
      return rejectWithValue(toErrorPayload(error, "Failed to update order address"));
    }
  }
);

export const fetchOrderDeliveryAddress = createAsyncThunk(
  "orders/fetchOrderDeliveryAddress",
  async (OrderCode, { rejectWithValue }) => {
    try {
      const { data } = await axiosInstance.get("/", {
        params: {
          endpoint: `${ORDER_PREFIX}/GetOrderDeliveryAddress/${encodePart(OrderCode)}`,
        },
      });
      return data;
    } catch (error) {
      return rejectWithValue(toErrorPayload(error, "Failed to fetch delivery address"));
    }
  }
);

export const cancelOrder = createAsyncThunk(
  "orders/cancelOrder",
  async (arg, { rejectWithValue }) => {
    const OrderCode = resolveOrderCode(arg);
    if (!OrderCode) {
      return rejectWithValue({ message: "OrderCode is required.", isClientValidation: true });
    }

    try {
      const { data } = await axiosInstance.get("/", {
        params: {
          endpoint: `${ORDER_PREFIX}/CancelOrder/${encodePart(OrderCode)}`,
        },
      });
      return data;
    } catch (error) {
      return rejectWithValue(toErrorPayload(error, "Failed to cancel order"));
    }
  }
);

/** Compatibility alias for callers using the explicit name. */
export const validateCartId = validateCart;

/* ── Local order slice ──────────────────────────────────────────────────── */

const initialState = {
  orders: [],
  salesOrder: [],
  deliveryAddress: [],
  deliveryUpdate: null,
  lifeCycle: null,
  cancelResult: null,
  checkoutResult: null,
  cartValidation: null,
  checkoutDetails: readLocalStorage(CHECKOUT_DETAILS_KEY, {}),
  orderAddressDetails: readLocalStorage(ORDER_ADDRESS_KEY, {}),
  loading: false,
  error: getInitialErrorState(),
  loadingStatus: getInitialLoadingStatus(),
  errorStatus: getInitialErrorState(),
};

const orderSlice = createSlice({
  // Preserve the existing action namespace for current web callers.
  name: "order",
  initialState,
  reducers: {
    clearLocalStorage: (state) => {
      removeLocalStorage([CHECKOUT_DETAILS_KEY, ORDER_ADDRESS_KEY, USER_ORDERS_KEY]);
      state.checkoutDetails = null;
      state.orderAddressDetails = null;
      state.orders = [];
      state.cartValidation = null;
    },
    saveCheckoutDetails: (state, action) => {
      state.checkoutDetails = action.payload;
      writeLocalStorage(CHECKOUT_DETAILS_KEY, action.payload);
    },
    saveAddressDetails: (state, action) => {
      state.orderAddressDetails = action.payload;
      writeLocalStorage(ORDER_ADDRESS_KEY, action.payload);
    },
    updateOrder: (state, action) => {
      const updated = action.payload;
      const index = state.orders.findIndex(
        (order) =>
          (order._id && order._id === updated?._id) ||
          (order.orderCode && order.orderCode === updated?.orderCode)
      );
      if (index !== -1) state.orders[index] = { ...state.orders[index], ...updated };
    },
    storeLocalOrder: (state, action) => {
      const { userId, orderId } = action.payload || {};
      if (!userId || !orderId) return;
      const storedOrders = parseStoredUserOrders();
      const index = storedOrders.findIndex(
        (order) => order.userId === userId && order.orderId === orderId
      );
      if (index >= 0) storedOrders[index] = action.payload;
      else storedOrders.push(action.payload);
      state.orders = storedOrders;
      writeLocalStorage(USER_ORDERS_KEY, storedOrders);
    },
    fetchOrdersByUser: (state, action) => {
      const userId = action.payload;
      state.orders = parseStoredUserOrders().filter((order) => order.userId === userId);
    },
    clearOrders: (state) => {
      state.orders = [];
      state.salesOrder = [];
      state.deliveryAddress = [];
      state.deliveryUpdate = null;
      state.lifeCycle = null;
      state.cancelResult = null;
      state.checkoutResult = null;
      state.cartValidation = null;
      state.loadingStatus = getInitialLoadingStatus();
      state.errorStatus = getInitialErrorState();
      state.error = getInitialErrorState();
      state.loading = false;
    },
    clearError: (state) => {
      state.error = getInitialErrorState();
      state.errorStatus = getInitialErrorState();
    },
    clearLoading: (state) => {
      state.loadingStatus = getInitialLoadingStatus();
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    addAsyncStateHandlers(builder, validateCart, "validateCart", "Failed to validate cart", (state, action) => {
      state.cartValidation = action.payload;
    });
    // Preserve the existing `orders` loading/error channel for checkout callers.
    addAsyncStateHandlers(builder, checkOutOrder, "orders", "Failed to create checkout order", (state, action) => {
      state.checkoutResult = action.payload;
      state.checkoutDetails = action.payload || {};
      if (Array.isArray(action.payload)) state.orders = action.payload;
    });

    addAsyncStateHandlers(builder, fetchOrdersByDate, "orders", "Failed to fetch orders by date", (state, action) => {
      state.orders = asArray(action.payload);
    });
    addAsyncStateHandlers(builder, fetchOrdersByCustomer, "orders", "Failed to fetch orders", (state, action) => {
      state.orders = asArray(action.payload);
    });
    addAsyncStateHandlers(builder, fetchOrdersByThirdParty, "orders", "Failed to fetch orders", (state, action) => {
      state.orders = asArray(action.payload);
    });
    addAsyncStateHandlers(builder, updateOrderTransition, "orders", "Failed to update order transition", (state, action) => {
      const updated = responseObject(action.payload);
      const key = updated.orderCode ?? updated.OrderCode;
      const index = state.orders.findIndex((order) =>
        String(order.orderCode ?? order.OrderCode ?? "") === String(key ?? "")
      );
      if (index !== -1) state.orders[index] = { ...state.orders[index], ...updated };
    });
    addAsyncStateHandlers(builder, fetchOrderLifeCycle, "lifeCycle", "Failed to fetch order lifecycle", (state, action) => {
      state.lifeCycle = action.payload;
    });
    addAsyncStateHandlers(builder, fetchSalesOrderById, "salesOrder", "Failed to fetch sales order", (state, action) => {
      state.salesOrder = Array.isArray(action.payload) ? action.payload : action.payload ? [action.payload] : [];
    });
    addAsyncStateHandlers(builder, updateOrderDelivery, "deliveryUpdate", "Failed to update order delivery", (state, action) => {
      state.deliveryUpdate = action.payload;
    });
    addAsyncStateHandlers(builder, orderAddress, "deliveryAddress", "Failed to save order address", (state, action) => {
      state.deliveryAddress = action.payload;
    });
    addAsyncStateHandlers(builder, fetchOrderDeliveryAddress, "deliveryAddress", "Failed to fetch delivery address", (state, action) => {
      state.deliveryAddress = action.payload || null;
    });
    addAsyncStateHandlers(builder, cancelOrder, "cancelOrder", "Failed to cancel order", (state, action) => {
      state.cancelResult = action.payload || null;
      const requestedCode = resolveOrderCode(action.meta.arg);
      if (!requestedCode) return;
      const index = state.orders.findIndex(
        (order) =>
          String(order.orderCode ?? order.OrderCode ?? order.orderId ?? "").trim() ===
          String(requestedCode).trim()
      );
      if (index !== -1) {
        state.orders[index] = {
          ...state.orders[index],
          orderCycle: "Cancelled",
          OrderCycle: "Cancelled",
        };
      }
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
  clearError,
  clearLoading,
} = orderSlice.actions;

export const selectOrderSlice = (state) => state.orders;
export const selectOrders = (state) => state.orders.orders;
export const selectSalesOrder = (state) => state.orders.salesOrder;
export const selectDeliveryAddress = (state) => state.orders.deliveryAddress;
export const selectDeliveryUpdate = (state) => state.orders.deliveryUpdate;
export const selectOrderLifeCycle = (state) => state.orders.lifeCycle;
export const selectCancelResult = (state) => state.orders.cancelResult;
export const selectCartValidation = (state) => state.orders.cartValidation;
export const selectCheckoutResult = (state) => state.orders.checkoutResult;

export const selectOrderLoading = (state) => state.orders.loading;
export const selectIsAnyOrderLoading = (state) => state.orders.loading;
export const selectOrderLoadingStatus = (state) => state.orders.loadingStatus;
export const selectOrdersLoading = (state) => state.orders.loadingStatus?.orders;
export const selectValidateCartLoading = (state) => state.orders.loadingStatus?.validateCart;
export const selectCheckoutLoading = (state) => state.orders.loadingStatus?.orders;
export const selectSalesOrderLoading = (state) => state.orders.loadingStatus?.salesOrder;
export const selectDeliveryAddressLoading = (state) => state.orders.loadingStatus?.deliveryAddress;
export const selectDeliveryUpdateLoading = (state) => state.orders.loadingStatus?.deliveryUpdate;
export const selectLifeCycleLoading = (state) => state.orders.loadingStatus?.lifeCycle;
export const selectCancelOrderLoading = (state) => state.orders.loadingStatus?.cancelOrder;

export const selectOrderErrors = (state) => state.orders.errorStatus || state.orders.error;
export const selectOrdersError = (state) => state.orders.errorStatus?.orders || state.orders.error;
export const selectValidateCartError = (state) => state.orders.errorStatus?.validateCart;
export const selectCheckoutError = (state) => state.orders.errorStatus?.orders;
export const selectSalesOrderError = (state) => state.orders.errorStatus?.salesOrder;
export const selectDeliveryAddressError = (state) => state.orders.errorStatus?.deliveryAddress;
export const selectDeliveryUpdateError = (state) => state.orders.errorStatus?.deliveryUpdate;
export const selectLifeCycleError = (state) => state.orders.errorStatus?.lifeCycle;
export const selectCancelOrderError = (state) => state.orders.errorStatus?.cancelOrder;

export default orderSlice.reducer;
