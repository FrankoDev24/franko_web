// src/hooks/useTokenMigration.js
import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  migrateCustomerToken,
  logoutCustomer,
} from "../Redux/Slice/customerSlice";
import {
  migrateUserToken,
  logoutUser,
} from "../Redux/Slice/userSlice";

export const useTokenMigration = () => {
  const dispatch = useDispatch();
  const {
    currentCustomer,
    tokenMigrated: customerMigrated,
    isAuthenticated: customerAuth,
  } = useSelector((state) => state.customer);
  const {
    currentUser,
    tokenMigrated: userMigrated,
    isAuthenticated: userAuth,
  } = useSelector((state) => state.user);
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const runMigration = async () => {
      try {
        // ── Customer Migration ──
        if (currentCustomer && !currentCustomer.accessToken && !customerMigrated) {
 

          try {
            const result = await dispatch(migrateCustomerToken()).unwrap();

            if (result) {
      
            } else {
     
              dispatch(logoutCustomer());

              const shown = sessionStorage.getItem("customer_migration_notice");
              if (!shown) {
                sessionStorage.setItem("customer_migration_notice", "true");
                // Optional: show toast instead of alert
                alert("Please log in again to continue shopping.");
              }
            }
          } catch (error) {
            
            dispatch(logoutCustomer());
          }
        }

        // ── User Migration ──
        if (currentUser && !currentUser.accessToken && !userMigrated) {
        

          try {
            const result = await dispatch(migrateUserToken()).unwrap();

            if (result) {
            
            } else {
   
              dispatch(logoutUser());

              if (window.location.pathname.startsWith("/admin")) {
                window.location.href = "/admin/login";
              }
            }
          } catch (error) {
      
            dispatch(logoutUser());

            if (window.location.pathname.startsWith("/admin")) {
              window.location.href = "/admin/login";
            }
          }
        }
      } catch (error) {
 
      }
    };

    // Small delay to let Redux hydrate
    const timer = setTimeout(runMigration, 100);
    return () => clearTimeout(timer);
  }, [currentCustomer, currentUser, customerMigrated, userMigrated, dispatch]);
};