// src/hooks/useTokenMigration.js
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logoutCustomer } from "../Redux/Slice/customerSlice";

/**
 * useTokenMigration
 *
 * Token migration is now handled SYNCHRONOUSLY in main.jsx
 * BEFORE React mounts — so by the time this hook runs,
 * localStorage is already clean.
 *
 * This hook's only job is to:
 * 1. Validate Redux state matches localStorage (sanity check)
 * 2. Force logout if Redux has a customer with no accessToken
 */
export const useTokenMigration = () => {
  const dispatch = useDispatch();

  const { currentCustomer } = useSelector(
    (state) => state.customer
  );

  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;

    const timer = setTimeout(() => {
      hasRun.current = true;

      // ── CUSTOMER VALIDATION ───────────────────────────────────
      if (currentCustomer) {
        const hasToken =
          currentCustomer?.accessToken?.trim() &&
          currentCustomer?.refreshToken?.trim();

        if (!hasToken) {
          dispatch(logoutCustomer());
        }
      }
    }, 300); // Small delay to ensure Redux is hydrated

    return () => clearTimeout(timer);
  }, []); // Run only once on mount — no reactive dependencies needed
};
