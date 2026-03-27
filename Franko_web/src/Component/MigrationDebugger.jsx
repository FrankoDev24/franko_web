// src/components/MigrationDebugger.jsx
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { migrateCustomerToken } from "../Redux/Slice/customerSlice";
import { migrateUserToken } from "../Redux/Slice/userSlice";

export const MigrationDebugger = () => {
  const dispatch = useDispatch();
  const [status, setStatus] = useState("");
  const customer = useSelector((state) => state.customer.currentCustomer);
  const user = useSelector((state) => state.user.currentUser);

  const handleMigrateCustomer = async () => {
    setStatus("Migrating customer...");
    try {
      const result = await dispatch(migrateCustomerToken()).unwrap();
      setStatus(`Success: ${JSON.stringify(result)}`);
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const handleMigrateUser = async () => {
    setStatus("Migrating user...");
    try {
      const result = await dispatch(migrateUserToken()).unwrap();
      setStatus(`Success: ${JSON.stringify(result)}`);
      setTimeout(() => window.location.reload(), 1000);
    } catch (error) {
      setStatus(`Error: ${error.message}`);
    }
  };

  const handleCheckStorage = () => {
    const storedCustomer = localStorage.getItem("customer");
    const storedUser = localStorage.getItem("user");
    
    console.log("=== STORAGE DEBUG ===");
    console.log("Customer in localStorage:", storedCustomer);
    console.log("User in localStorage:", storedUser);
    console.log("Customer in Redux:", customer);
    console.log("User in Redux:", user);
    console.log("Migration Flags:", {
      customer: localStorage.getItem("customer_token_migrated"),
      user: localStorage.getItem("user_token_migrated"),
    });
    
    setStatus("Check console for details");
  };

  // Only show in development or when needed
  if (process.env.NODE_ENV === "production") return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        background: "white",
        border: "2px solid #333",
        borderRadius: 8,
        padding: 16,
        zIndex: 9999,
        boxShadow: "0 4px 8px rgba(0,0,0,0.2)",
        maxWidth: 300,
      }}
    >
      <h3 style={{ margin: "0 0 12px 0", fontSize: 14 }}>
        🔧 Migration Debugger
      </h3>
      
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        <button
          onClick={handleCheckStorage}
          style={{
            padding: "8px 12px",
            background: "#0066cc",
            color: "white",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}
        >
          Check Storage
        </button>

        {customer && !customer.accessToken && (
          <button
            onClick={handleMigrateCustomer}
            style={{
              padding: "8px 12px",
              background: "#28a745",
              color: "white",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Migrate Customer Token
          </button>
        )}

        {user && !user.accessToken && (
          <button
            onClick={handleMigrateUser}
            style={{
              padding: "8px 12px",
              background: "#ffc107",
              color: "black",
              border: "none",
              borderRadius: 4,
              cursor: "pointer",
            }}
          >
            Migrate User Token
          </button>
        )}
      </div>

      {status && (
        <div
          style={{
            marginTop: 12,
            padding: 8,
            background: "#f0f0f0",
            borderRadius: 4,
            fontSize: 12,
            wordBreak: "break-word",
          }}
        >
          {status}
        </div>
      )}
    </div>
  );
};