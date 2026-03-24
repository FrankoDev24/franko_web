// src/pages/PSPTransactionsReport.jsx
import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { getPSPTransactionsByCompany } from "../../../Redux/Slice/paymentSlice";

const PSPTransactionsReport = () => {
  const dispatch = useDispatch();
  const { pspTransactionsReport, loading, error } = useSelector(
    (state) => state.payment
  );

  const today = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    from: today,
    to: today,
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    dispatch(
      getPSPTransactionsByCompany({
        from: formData.from,
        to: formData.to,
      })
    );
  };

  const renderTable = () => {
    let rows = [];

    if (Array.isArray(pspTransactionsReport)) {
      rows = pspTransactionsReport;
    } else if (Array.isArray(pspTransactionsReport?.data)) {
      rows = pspTransactionsReport.data;
    } else if (Array.isArray(pspTransactionsReport?.result)) {
      rows = pspTransactionsReport.result;
    } else {
      return (
        <pre
          style={{
            background: "#f4f4f4",
            padding: "1rem",
            borderRadius: "8px",
            overflowX: "auto",
          }}
        >
          {JSON.stringify(pspTransactionsReport, null, 2)}
        </pre>
      );
    }

    if (!rows.length) {
      return <p>No transactions found for the selected date range.</p>;
    }

    const columns = Object.keys(rows[0] || {});

    return (
      <div style={{ overflowX: "auto", marginTop: "1rem" }}>
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            background: "#fff",
          }}
        >
          <thead>
            <tr>
              {columns.map((col) => (
                <th
                  key={col}
                  style={{
                    border: "1px solid #ddd",
                    padding: "10px",
                    textAlign: "left",
                    background: "#f8f8f8",
                  }}
                >
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {columns.map((col) => (
                  <td
                    key={col}
                    style={{
                      border: "1px solid #ddd",
                      padding: "10px",
                    }}
                  >
                    {typeof row[col] === "object"
                      ? JSON.stringify(row[col])
                      : String(row[col] ?? "")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>PSP Transactions Report</h2>
      <p>Company Code: <strong>fte</strong></p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "flex",
          gap: "1rem",
          flexWrap: "wrap",
          alignItems: "end",
          marginTop: "1rem",
          marginBottom: "1.5rem",
        }}
      >
        <div>
          <label htmlFor="from" style={{ display: "block", marginBottom: 6 }}>
            From
          </label>
          <input
            type="date"
            id="from"
            name="from"
            value={formData.from}
            onChange={handleChange}
            required
            style={{ padding: "8px" }}
          />
        </div>

        <div>
          <label htmlFor="to" style={{ display: "block", marginBottom: 6 }}>
            To
          </label>
          <input
            type="date"
            id="to"
            name="to"
            value={formData.to}
            onChange={handleChange}
            required
            style={{ padding: "8px" }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px 16px",
            background: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            cursor: "pointer",
          }}
        >
          {loading ? "Fetching..." : "Get Report"}
        </button>
      </form>

      {error && (
        <div
          style={{
            color: "red",
            marginBottom: "1rem",
            background: "#ffe6e6",
            padding: "10px",
            borderRadius: "6px",
          }}
        >
          <strong>Error:</strong>{" "}
          {typeof error === "string" ? error : JSON.stringify(error)}
        </div>
      )}

      {pspTransactionsReport && (
        <div>
          <h3>Report Result</h3>
          {renderTable()}
        </div>
      )}
    </div>
  );
};

export default PSPTransactionsReport;