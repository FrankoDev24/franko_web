// main.jsx (or index.jsx)
import "./utils/secureLocalStorageInit";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from "react-redux";
import { store, persistor } from "./Redux/store.js";
import { PersistGate } from 'redux-persist/integration/react';
import { ThemeProvider } from '@material-tailwind/react';
import TagManager from 'react-gtm-module';
import { startAutoLogoutCheck } from './Redux/Slice/userSlice';
import { migrateCustomerToken, logoutCustomer } from './Redux/Slice/customerSlice';
import { migrateUserToken, logoutUser } from './Redux/Slice/userSlice';

// ═══════════════════════════════════════════════════════════════════
// FORCE TOKEN CHECK & MIGRATION
// ═══════════════════════════════════════════════════════════════════

const forceTokenCheck = async () => {
  console.log("🔍 Force Token Check - Starting...");

  try {
    // Get stored data directly from localStorage
    const customerRaw = localStorage.getItem("customer");
    const userRaw = localStorage.getItem("user");

    // Parse if exists
    let customer = null;
    let user = null;

    try {
      customer = customerRaw ? (typeof customerRaw === "object" ? customerRaw : JSON.parse(customerRaw)) : null;
    } catch (e) {
      console.error("Failed to parse customer:", e);
      localStorage.removeItem("customer");
    }

    try {
      user = userRaw ? (typeof userRaw === "object" ? userRaw : JSON.parse(userRaw)) : null;
    } catch (e) {
      console.error("Failed to parse user:", e);
      localStorage.removeItem("user");
    }

    // ── CUSTOMER TOKEN CHECK ──
    if (customer) {
      console.log("👤 Customer found:", customer.contactNumber || customer.contact);

      if (!customer.accessToken) {
        console.warn("⚠️ Customer has NO accessToken - attempting migration");

        const migrationFlag = localStorage.getItem("customer_token_migrated");
        const contactNumber = customer.contactNumber || customer.contact;

        if (migrationFlag === "true") {
          console.warn("❌ Migration already attempted but failed - forcing logout");
          localStorage.removeItem("customer");
          localStorage.removeItem("customer_token_migrated");
          
          // Show alert after app loads
          setTimeout(() => {
            alert("Your session has expired. Please log in again to continue shopping.");
          }, 1000);
        } else if (contactNumber) {
          console.log(`🔄 Attempting to generate token for customer: ${contactNumber}`);

          try {
            // Call token generation endpoint directly
            const response = await fetch(
              "https://02yo3gbfxe.execute-api.us-east-1.amazonaws.com/default/FrankoAPI/?endpoint=/Users/GenerateCustomerToken",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Identifier": "Franko",
                },
                body: JSON.stringify({ contactNumber }),
              }
            );

            const data = await response.json();

            console.log("📥 Token generation response:", data);

            if (
              response.ok &&
              data.accessToken &&
              data.refreshToken &&
              data.response?.responseCode === "1"
            ) {
              // Update customer with tokens
              const updatedCustomer = {
                ...customer,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
              };

              localStorage.setItem("customer", JSON.stringify(updatedCustomer));
              localStorage.setItem("customer_token_migrated", "true");

              console.log("✅ Customer token migration SUCCESS");
              console.log("🔄 Reloading page to apply new tokens...");

              // Reload page to apply new tokens
              setTimeout(() => {
                window.location.reload();
              }, 500);

              return; // Stop execution, page will reload
            } else {
              console.error("❌ Token generation failed:", data);
              
              // Mark as migrated to prevent retry loops
              localStorage.setItem("customer_token_migrated", "true");
              
              // Remove customer data
              localStorage.removeItem("customer");

              setTimeout(() => {
                alert("Unable to restore your session. Please log in again.");
              }, 1000);
            }
          } catch (error) {
            console.error("❌ Token generation request failed:", error);
            
            // Mark as migrated to prevent retry loops
            localStorage.setItem("customer_token_migrated", "true");
            
            // Remove customer data
            localStorage.removeItem("customer");

            setTimeout(() => {
              alert("Network error. Please log in again.");
            }, 1000);
          }
        } else {
          console.error("❌ No contact number found for customer");
          localStorage.removeItem("customer");
        }
      } else {
        console.log("✅ Customer already has accessToken");
      }
    } else {
      console.log("ℹ️ No customer in localStorage");
    }

    // ── USER TOKEN CHECK ──
    if (user) {
      console.log("👤 User found:", user.contactNumber || user.contact);

      if (!user.accessToken) {
        console.warn("⚠️ User has NO accessToken - attempting migration");

        const migrationFlag = localStorage.getItem("user_token_migrated");
        const contactNumber = user.contactNumber || user.contact;

        if (migrationFlag === "true") {
          console.warn("❌ Migration already attempted but failed - forcing logout");
          localStorage.removeItem("user");
          localStorage.removeItem("user_token_migrated");
          localStorage.removeItem("loginTime");
          
          // Redirect to admin login if on admin pages
          if (window.location.pathname.startsWith("/admin") ||
              window.location.pathname.startsWith("/dev") ||
              window.location.pathname.startsWith("/fulfillment")) {
            window.location.href = "/admin/login";
          }
        } else if (contactNumber) {
          console.log(`🔄 Attempting to generate token for user: ${contactNumber}`);

          try {
            // Call token generation endpoint directly
            const response = await fetch(
              "https://02yo3gbfxe.execute-api.us-east-1.amazonaws.com/default/FrankoAPI/?endpoint=/Users/GenerateUserToken",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Identifier": "Franko",
                },
                body: JSON.stringify({ contactNumber }),
              }
            );

            const data = await response.json();

            console.log("📥 Token generation response:", data);

            if (
              response.ok &&
              data.accessToken &&
              data.refreshToken &&
              data.response?.responseCode === "1"
            ) {
              // Update user with tokens
              const updatedUser = {
                ...user,
                accessToken: data.accessToken,
                refreshToken: data.refreshToken,
              };

              localStorage.setItem("user", JSON.stringify(updatedUser));
              localStorage.setItem("user_token_migrated", "true");
              localStorage.setItem("loginTime", String(Date.now()));

              console.log("✅ User token migration SUCCESS");
              console.log("🔄 Reloading page to apply new tokens...");

              // Reload page to apply new tokens
              setTimeout(() => {
                window.location.reload();
              }, 500);

              return; // Stop execution, page will reload
            } else {
              console.error("❌ Token generation failed:", data);
              
              // Mark as migrated to prevent retry loops
              localStorage.setItem("user_token_migrated", "true");
              
              // Remove user data
              localStorage.removeItem("user");
              localStorage.removeItem("loginTime");

              // Redirect to admin login if on admin pages
              if (window.location.pathname.startsWith("/admin") ||
                  window.location.pathname.startsWith("/dev") ||
                  window.location.pathname.startsWith("/fulfillment")) {
                window.location.href = "/admin/login";
              }
            }
          } catch (error) {
            console.error("❌ Token generation request failed:", error);
            
            // Mark as migrated to prevent retry loops
            localStorage.setItem("user_token_migrated", "true");
            
            // Remove user data
            localStorage.removeItem("user");
            localStorage.removeItem("loginTime");

            // Redirect to admin login if on admin pages
            if (window.location.pathname.startsWith("/admin") ||
                window.location.pathname.startsWith("/dev") ||
                window.location.pathname.startsWith("/fulfillment")) {
              window.location.href = "/admin/login";
            }
          }
        } else {
          console.error("❌ No contact number found for user");
          localStorage.removeItem("user");
          localStorage.removeItem("loginTime");
        }
      } else {
        console.log("✅ User already has accessToken");
      }
    } else {
      console.log("ℹ️ No user in localStorage");
    }

    console.log("✅ Force Token Check - Complete");
  } catch (error) {
    console.error("❌ Force Token Check - Error:", error);
  }
};

// ═══════════════════════════════════════════════════════════════════
// RUN TOKEN CHECK BEFORE APP INITIALIZATION
// ═══════════════════════════════════════════════════════════════════

// Run token check and then initialize app
forceTokenCheck().then(() => {
  console.log("🚀 Initializing React App...");

  // ✅ Initialize GTM
  TagManager.initialize({
    gtmId: 'GTM-WKCL4JTV',
  });

  // ✅ Start auto-logout check for users
  startAutoLogoutCheck(store.dispatch);

  // ✅ Render React app
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <Provider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <ThemeProvider>
              <App />
            </ThemeProvider>
          </PersistGate>
        </Provider>
      </BrowserRouter>
    </StrictMode>
  );
});