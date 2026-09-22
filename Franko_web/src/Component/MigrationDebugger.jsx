// src/components/MigrationDebugger.jsx
import { useState } from "react";

export const MigrationDebugger = () => {
  const [status, setStatus] = useState("");

  const handleCheckStorage = () => {
    const storedCustomer = localStorage.getItem("customer");

    console.log("=== STORAGE DEBUG ===");
    console.log("Customer in localStorage:", storedCustomer);

    setStatus("Check console for details");
  };

  // Only show in development or when needed
  if (import.meta.env.PROD) return null;

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
        Storage Debugger
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
