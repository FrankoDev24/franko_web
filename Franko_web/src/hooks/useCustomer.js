// src/hooks/useCustomer.js
import { useCallback, useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";

/* ============================================================================
   "Is a real customer signed in?" — resolved EXACTLY the way Checkout.jsx
   resolves it, so the Tel cart flow and the standard checkout can never
   disagree about who is logged in.

   Sources, in order:
     1. Redux customer slice (AuthModal dispatches setCurrentCustomer on
        successful sign-in / sign-up, so this updates by itself)
     2. localStorage "customer" (written by persistCustomer below)

   A guest account (isGuest === true) is NOT a signed-in customer, which is why
   the Tel flow runs AuthModal with allowGuest={false}.
   ========================================================================== */

export const CUSTOMER_STATE_KEYS = [
  "currentCustomer",
  "customer",
  "customerDetails",
  "customerData",
  "data",
  "user",
  "profile",
];

export const isCustomerRecord = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const id = String(
    value.customerAccountNumber || value.CustomerAccountNumber || value.customerId || ""
  ).trim();
  const phone = String(value.contactNumber || value.ContactNumber || "").trim();
  const name = `${value.firstName || ""} ${value.lastName || ""}`.trim();
  return Boolean(id || phone || name);
};

export const hasCustomerDetails = (customer) => {
  if (!isCustomerRecord(customer)) return false;
  if (
    (customer.isAuthenticated === false || customer.loginStatus === false) &&
    !customer.accessToken
  ) {
    return false;
  }
  if (customer.isGuest === true) return false;
  return Boolean(
    customer.customerAccountNumber ||
      customer.CustomerAccountNumber ||
      customer.contactNumber ||
      customer.ContactNumber
  );
};

/** Mirrors Checkout.jsx's customer resolution against a slice/object. */
export const pickCustomerFromState = (state) => {
  if (!state || typeof state !== "object") return null;
  for (const key of CUSTOMER_STATE_KEYS) {
    if (hasCustomerDetails(state[key])) return state[key];
  }
  return hasCustomerDetails(state) ? state : null;
};

export const readCustomerFromStorage = () => {
  try {
    const raw = window.localStorage.getItem("customer");
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return isCustomerRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

/** Persist the signed-in customer the same way Checkout.jsx does. */
export const persistCustomer = (customer) => {
  try {
    if (customer && typeof customer === "object") {
      window.localStorage.setItem("customer", JSON.stringify(customer));
    }
  } catch {
    /* storage unavailable — Redux still holds the session */
  }
};

export const clearPersistedCustomer = () => {
  try {
    window.localStorage.removeItem("customer");
  } catch {
    /* ignore */
  }
};

/** The id the order API expects (Checkout.jsx posts customerAccountNumber). */
export const getCustomerId = (customer) => {
  if (!customer || typeof customer !== "object") return null;
  return (
    customer.customerAccountNumber ||
    customer.CustomerAccountNumber ||
    customer.customerId ||
    customer.CustomerId ||
    customer.id ||
    null
  );
};

export const getCustomerName = (customer) => {
  if (!customer || typeof customer !== "object") return "";
  const full = [
    customer.firstName || customer.FirstName,
    customer.lastName || customer.LastName,
  ]
    .filter(Boolean)
    .join(" ");
  return (
    full ||
    customer.fullName ||
    customer.FullName ||
    customer.name ||
    customer.email ||
    customer.Email ||
    ""
  );
};

export const getCustomerPhone = (customer) =>
  customer?.contactNumber || customer?.ContactNumber || "";

const useCustomer = ({ poll = false, pollMs = 1000 } = {}) => {
  const customerSlice = useSelector(
    (state) => state.customer ?? state.customerReducer ?? state.customers ?? null
  );

  const fromRedux = useMemo(() => pickCustomerFromState(customerSlice), [customerSlice]);
  const [fromStorage, setFromStorage] = useState(() => readCustomerFromStorage());

  const refresh = useCallback(() => {
    setFromStorage(readCustomerFromStorage());
  }, []);

  useEffect(() => {
    const onStorage = (event) => {
      if (!event.key || event.key === "customer") refresh();
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [refresh]);

  // Optional safety net for flows that only write to localStorage.
  useEffect(() => {
    if (!poll) return undefined;
    const id = setInterval(refresh, pollMs);
    return () => clearInterval(id);
  }, [poll, pollMs, refresh]);

  const customer = useMemo(
    () => (hasCustomerDetails(fromRedux) ? fromRedux : hasCustomerDetails(fromStorage) ? fromStorage : null),
    [fromRedux, fromStorage]
  );

  return {
    customer,
    customerId: getCustomerId(customer),
    customerName: getCustomerName(customer),
    customerPhone: getCustomerPhone(customer),
    isLoggedIn: Boolean(customer),
    refresh,
  };
};

export default useCustomer;
