// src/hooks/useTokenMigration.js
import { useEffect, useRef, useState } from "react";
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
  const [migrationStatus, setMigrationStatus] = useState("pending");

  useEffect(() => {
    if (hasRun.current) {
      console.log("⏭️ Migration already ran, skipping");
      return;
    }

    // Wait for Redux to hydrate
    const timer = setTimeout(async () => {
      hasRun.current = true;

      console.log("🔍 Migration Check Started");
      console.log("Customer in Redux:", currentCustomer);
      console.log("Customer Migrated Flag:", customerMigrated);
      console.log("User in Redux:", currentUser);
      console.log("User Migrated Flag:", userMigrated);

      // Check localStorage directly
      const storedCustomer = localStorage.getItem("customer");
      const storedUser = localStorage.getItem("user");
      
      console.log("Customer in localStorage:", storedCustomer);
      console.log("User in localStorage:", storedUser);

      try {
        // ── Customer Migration ──
        if (currentCustomer) {
          console.log("👤 Customer exists in Redux");
          
          if (!currentCustomer.accessToken) {
            console.warn("⚠️ Customer has NO accessToken");
            
            if (!customerMigrated) {
              console.log("🔄 Starting customer token migration...");
              setMigrationStatus("migrating-customer");

              try {
                const result = await dispatch(migrateCustomerToken()).unwrap();

                if (result) {
                  console.log("✅ Customer token migration SUCCESS:", result);
                  setMigrationStatus("customer-success");
                  
                  // Force page reload to apply new tokens
                  setTimeout(() => {
                    console.log("🔄 Reloading page to apply new tokens...");
                    window.location.reload();
                  }, 500);
                } else {
                  console.error("❌ Migration returned null");
                  setMigrationStatus("customer-failed");
                  dispatch(logoutCustomer());
                  
                  alert("Your session has expired. Please log in again.");
                }
              } catch (error) {
                console.error("❌ Customer migration ERROR:", error);
                setMigrationStatus("customer-error");
                dispatch(logoutCustomer());
                
                alert("Session error. Please log in again.");
              }
            } else {
              console.log("ℹ️ Customer already marked as migrated");
            }
          } else {
            console.log("✅ Customer already has accessToken");
          }
        } else {
          console.log("ℹ️ No customer in Redux");
        }

        // ── User Migration ──
        if (currentUser) {
          console.log("👤 User exists in Redux");
          
          if (!currentUser.accessToken) {
            console.warn("⚠️ User has NO accessToken");
            
            if (!userMigrated) {
              console.log("🔄 Starting user token migration...");
              setMigrationStatus("migrating-user");

              try {
                const result = await dispatch(migrateUserToken()).unwrap();

                if (result) {
                  console.log("✅ User token migration SUCCESS:", result);
                  setMigrationStatus("user-success");
                  
                  // Force page reload to apply new tokens
                  setTimeout(() => {
                    console.log("🔄 Reloading page to apply new tokens...");
                    window.location.reload();
                  }, 500);
                } else {
                  console.error("❌ Migration returned null");
                  setMigrationStatus("user-failed");
                  dispatch(logoutUser());
                  
                  if (window.location.pathname.startsWith("/admin")) {
                    window.location.href = "/admin/login";
                  }
                }
              } catch (error) {
                console.error("❌ User migration ERROR:", error);
                setMigrationStatus("user-error");
                dispatch(logoutUser());
                
                if (window.location.pathname.startsWith("/admin")) {
                  window.location.href = "/admin/login";
                }
              }
            } else {
              console.log("ℹ️ User already marked as migrated");
            }
          } else {
            console.log("✅ User already has accessToken");
          }
        } else {
          console.log("ℹ️ No user in Redux");
        }

        if (!currentCustomer && !currentUser) {
          console.log("ℹ️ No customer or user to migrate");
          setMigrationStatus("none");
        }
      } catch (error) {
        console.error("❌ Migration process error:", error);
        setMigrationStatus("error");
      }
    }, 500); // Wait 500ms for Redux hydration

    return () => clearTimeout(timer);
  }, [currentCustomer, currentUser, customerMigrated, userMigrated, dispatch]);

  // Expose migration status for debugging
  if (typeof window !== "undefined") {
    window.__migrationStatus = migrationStatus;
  }

  return migrationStatus;
};