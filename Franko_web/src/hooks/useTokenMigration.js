// src/hooks/useTokenMigration.js
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { logoutCustomer, triggerForceLogout } from "../Redux/Slice/customerSlice";
import { logoutUser } from "../Redux/Slice/userSlice";

/**
 * useTokenMigration
 *
 * Token migration is now handled SYNCHRONOUSLY in main.jsx
 * BEFORE React mounts — so by the time this hook runs,
 * localStorage is already clean.
 *
 * This hook's only job is to:
 * 1. Validate Redux state matches localStorage (sanity check)
 * 2. Force logout if Redux has a customer/user with no accessToken
 * 3. Sync the forceLogout flag from localStorage into Redux
 */
export const useTokenMigration = () => {
  const dispatch = useDispatch();

  const { currentCustomer, isAuthenticated: customerAuth } = useSelector(
    (state) => state.customer
  );
  const { currentUser, isAuthenticated: userAuth } = useSelector(
    (state) => state.user
  );

  const hasRun = useRef(false);

  useEffect(() => {
    // ✅ Only run once after Redux hydrates
    if (hasRun.current) return;

    const timer = setTimeout(() => {
      hasRun.current = true;

      console.log("🔍 Post-mount token validation — Starting...");

      // ── CUSTOMER VALIDATION ───────────────────────────────────
      if (currentCustomer) {
        const hasToken =
          currentCustomer?.accessToken?.trim() &&
          currentCustomer?.refreshToken?.trim();

        if (!hasToken) {
          console.warn(
            "⚠️ Redux has customer with no valid token — forcing logout"
          );
          // ✅ Use triggerForceLogout so AuthModal shows security banner
          dispatch(triggerForceLogout());
        } else {
          console.log("✅ Customer token valid in Redux");
        }
      } else {
        console.log("ℹ️ No customer in Redux");
      }

      // ── USER VALIDATION ───────────────────────────────────────
      if (currentUser) {
        const hasToken =
          currentUser?.accessToken?.trim() &&
          currentUser?.refreshToken?.trim();

        if (!hasToken) {
          console.warn(
            "⚠️ Redux has user with no valid token — forcing logout"
          );
          dispatch(logoutUser());

          // Redirect staff users to login
          const currentPath = window.location.pathname;
          const isStaffPath = [
            "/admin",
            "/dev",
            "/fulfillment",
            "/content",
            "/agent",
            "/digi",
          ].some((p) => currentPath.startsWith(p));

          if (isStaffPath && currentPath !== "/admin/login") {
            console.log("↗️ Redirecting staff to login");
            setTimeout(() => {
              window.location.replace("/admin/login");
            }, 100);
          }
        } else {
          console.log("✅ User token valid in Redux");
        }
      } else {
        console.log("ℹ️ No user in Redux");
      }

      console.log("✅ Post-mount token validation — Complete");
    }, 300); // Small delay to ensure Redux is hydrated

    return () => clearTimeout(timer);
  }, []); // ✅ Run only once on mount — no reactive dependencies needed
};