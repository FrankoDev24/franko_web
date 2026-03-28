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

      

      // ── CUSTOMER VALIDATION ───────────────────────────────────
      if (currentCustomer) {
        const hasToken =
          currentCustomer?.accessToken?.trim() &&
          currentCustomer?.refreshToken?.trim();

        if (!hasToken) {
        
          // ✅ Use triggerForceLogout so AuthModal shows security banner
          dispatch(triggerForceLogout());
        } else {
         
        }
      } else {
       
      }

      // ── USER VALIDATION ───────────────────────────────────────
      if (currentUser) {
        const hasToken =
          currentUser?.accessToken?.trim() &&
          currentUser?.refreshToken?.trim();

        if (!hasToken) {
        
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
          
            setTimeout(() => {
              window.location.replace("/admin/login");
            }, 100);
          }
        } else {
        
        }
      } else {
        
      }

     
    }, 300); // Small delay to ensure Redux is hydrated

    return () => clearTimeout(timer);
  }, []); // ✅ Run only once on mount — no reactive dependencies needed
};