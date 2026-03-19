// src/pages/Checkout.jsx
import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  checkOutOrder,
  updateOrderDelivery,
  saveCheckoutDetails,
  saveAddressDetails,
} from "../Redux/Slice/orderSlice";
import {
  debitCustomer,
  checkTransactionStatus,
} from "../Redux/Slice/paymentSlice";
import { clearCart, getCartById } from "../Redux/Slice/cartSlice";
import { message, Typography, Radio, Divider, Modal, Input } from "antd";
import CheckoutForm from "../Component/CheckoutForm";
import locations from "../Component/Locations";
import {
  ShoppingBagIcon,
  ExclamationTriangleIcon,
  CreditCardIcon,
  MapPinIcon,
  UserIcon,
  PhoneIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  ArrowUturnLeftIcon,
} from "@heroicons/react/24/outline";
import {
  CheckCircleIcon as CheckCircleSolid,
  XCircleIcon as XCircleSolid,
} from "@heroicons/react/24/solid";

import frankoLogo from "../assets/frankoIcon.png";
import mtnLogo from "../assets/momo.png";
import vodafoneLogo from "../assets/voda.jpeg";
import airteltigoLogo from "../assets/AT.png";

const { Text } = Typography;

// ==================== CONSTANTS ====================
const SERVICE_CHARGE_RATE = 0.01;
const SERVICE_CHARGE_CAP = 20.0;
const INITIAL_DELAY_MS = 10000;
const POLL_INTERVAL_MS = 5000;
const MAX_POLL_DURATION_MS = 60000;
const AUTO_CHECK_DELAY_MS = 120000; // 2 minutes

// ==================== NETWORK STEPS CONFIG ====================
const NETWORK_STEPS = {
  mtn: {
    label: "MTN Mobile Money",
    color: "#F59E0B",
    bg: "#FFFBEB",
    border: "#FCD34D",
    logo: mtnLogo,
    ussd: "*170#",
    steps: [
      { num: 1, text: "Dial *170# on your MTN phone" },
      { num: 2, text: "Select 6 — My Wallet (or 10 on some versions)" },
      { num: 3, text: "Select 3 — My Approvals" },
      { num: 4, text: "Enter your MoMo PIN to load pending list" },
      { num: 5, text: "Select the Franko Trading transaction" },
      { num: 6, text: "Select 1 (YES) to approve" },
    ],
    tip: "Or open the MTN MoMo app → Approvals → approve the pending request.",
  },
  vodafone: {
    label: "Vodafone Cash",
    color: "#E11D48",
    bg: "#FFF1F2",
    border: "#FECDD3",
    logo: vodafoneLogo,
    ussd: "*110#",
    steps: [
      { num: 1, text: "Dial *110# on your Vodafone phone" },
      { num: 2, text: "Select 4 — Make Payments" },
      { num: 3, text: "Select 8 — My Approvals" },
      { num: 4, text: "Enter your MoMo PIN to load pending list" },
      { num: 5, text: "Select the Franko Trading transaction" },
      { num: 6, text: "Select 1 (YES) to approve" },
    ],
    tip: "Or open the Vodafone Cash app → Pending Transactions → approve.",
  },
  airteltigo: {
    label: "AirtelTigo Money",
    color: "#2563EB",
    bg: "#EFF6FF",
    border: "#BFDBFE",
    logo: airteltigoLogo,
    ussd: "*110#",
    steps: [
      { num: 1, text: "Dial *110# on your AirtelTigo phone" },
      { num: 2, text: "Select Pending Approvals or Wallet (option 8 or 6)" },
      { num: 3, text: "Enter your 4-digit PIN to view pending transactions" },
      { num: 4, text: "Select the Franko Trading transaction" },
      { num: 5, text: "Choose Approve to confirm the payment" },
    ],
    tip: "Or open the AirtelTigo Money app → Pending Approvals → confirm.",
  },
};

// ==================== UTILITY FUNCTIONS ====================
const formatCurrency = (amount, decimals = 2) => {
  const num = parseFloat(amount) || 0;
  return num.toLocaleString("en-US", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};
const formatGHS = (amount) => `GH₵${formatCurrency(amount, 2)}`;
const getItemUnitPrice = (item) =>
  parseFloat(item.unitPrice) || parseFloat(item.price) || 0;
const getItemQuantity = (item) => parseInt(item.quantity, 10) || 1;
const getItemLineTotal = (item) => getItemUnitPrice(item) * getItemQuantity(item);
const buildCartNarration = (items, maxLen = 120) => {
  if (!items || items.length === 0) return "Franko Trading Purchase";
  const parts = items.map((item) => {
    const name = (item.productName || item.ProductName || "Item").trim();
    const qty = getItemQuantity(item);
    return qty > 1 ? `${name} (x${qty})` : name;
  });
  let narration = parts.join(", ");
  if (narration.length > maxLen) narration = narration.substring(0, maxLen - 3) + "...";
  return narration;
};

// ==================== STYLES ====================
const checkoutStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700;800;900&display=swap');

  :root {
    --co-font: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    --co-green: #14532d;
    --co-green-mid: #166534;
    --co-green-600: #16a34a;
    --co-green-accent: #22c55e;
    --co-green-light: #dcfce7;
    --co-green-lighter: #f0fdf4;
    --co-dark: #1a1a1a;
    --co-mid: #555;
    --co-light: #888;
    --co-border: #e0e0e0;
    --co-bg: #f7f7f7;
    --co-red: #dc2626;
    --co-radius: 4px;
    --co-radius-lg: 8px;
    --co-radius-xl: 12px;
  }

  .co-root, .co-root * {
    font-family: var(--co-font) !important;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  .co-root { min-height: 100vh; background: #fff; }

  .co-container {
    max-width: 1780px;
    margin: 0 auto;
    padding: 24px 16px;
    padding-bottom: 100px;
  }
  @media (min-width: 1024px) {
    .co-container { padding: 32px 40px; padding-bottom: 32px; }
  }

  /* ==================== HEADER ==================== */
  .co-page-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--co-border);
  }
  .co-page-header-accent {
    width: 4px; height: 28px; border-radius: 2px;
    background: var(--co-green); flex-shrink: 0;
  }
  .co-page-title {
    font-size: 22px; font-weight: 800; color: var(--co-dark);
    letter-spacing: -0.02em; margin: 0; line-height: 1.2;
  }
  @media (min-width: 768px) { .co-page-title { font-size: 26px; } }
  .co-page-count {
    font-size: 13px; font-weight: 500; color: var(--co-light); margin-top: 2px;
  }
  .co-page-header-line {
    flex: 1; height: 1px; background: var(--co-border); display: none;
  }
  @media (min-width: 768px) { .co-page-header-line { display: block; } }

  /* ==================== LAYOUT ==================== */
  .co-layout {
    display: flex; flex-direction: column; gap: 20px;
  }
  @media (min-width: 1024px) {
    .co-layout { flex-direction: row; gap: 24px; }
  }
  .co-sidebar { flex-shrink: 0; }
  @media (min-width: 1024px) { .co-sidebar { width: 380px; } }
  .co-main { flex: 1; min-width: 0; }

  /* ==================== CARDS ==================== */
  .co-card {
    background: #fff;
    border: 1px solid var(--co-border);
    border-radius: var(--co-radius);
    overflow: hidden;
  }
  .co-card-header {
    padding: 16px 20px;
    border-bottom: 1px solid #f0f0f0;
  }
  .co-card-title {
    font-size: 16px; font-weight: 800; color: var(--co-dark);
    letter-spacing: -0.01em; margin: 0;
  }
  .co-card-body { padding: 16px 20px; }

  /* ==================== SECTION ACCENT ==================== */
  .co-section-accent {
    display: flex; gap: 4px; margin-top: 8px;
  }
  .co-section-accent-bar {
    height: 2px; width: 32px; border-radius: 1px; background: var(--co-green-600);
  }
  .co-section-accent-line {
    height: 2px; flex: 1; border-radius: 1px; background: #f0f0f0;
  }

  /* ==================== TOGGLE ==================== */
  .co-toggle-wrap {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px; background: var(--co-bg);
    border: 1px solid var(--co-border); border-radius: var(--co-radius);
    cursor: pointer; transition: border-color 0.15s; margin-bottom: 16px;
    user-select: none;
  }
  .co-toggle-wrap:hover { border-color: var(--co-green-accent); }
  .co-toggle-left {
    display: flex; align-items: center; gap: 8px;
    font-size: 14px; font-weight: 600; color: var(--co-mid);
  }
  .co-toggle-track {
    width: 40px; height: 22px; border-radius: 11px;
    padding: 2px; transition: background 0.2s; flex-shrink: 0;
  }
  .co-toggle-track-off { background: #d1d5db; }
  .co-toggle-track-on { background: var(--co-green-600); }
  .co-toggle-knob {
    width: 18px; height: 18px; border-radius: 50%; background: #fff;
    box-shadow: 0 1px 3px rgba(0,0,0,0.15); transition: transform 0.2s;
  }
  .co-toggle-knob-on { transform: translateX(18px); }

  /* ==================== WARNING BANNER ==================== */
  .co-warning-banner {
    display: flex; align-items: flex-start; gap: 10px;
    padding: 10px 14px; background: #fffbeb; border: 1px solid #fde68a;
    border-radius: var(--co-radius); margin-bottom: 16px;
  }
  .co-warning-banner p {
    font-size: 12px; font-weight: 600; color: #92400e; margin: 0; line-height: 1.5;
  }

  /* ==================== CART ITEMS ==================== */
  .co-items-list {
    max-height: 380px; overflow-y: auto; padding-right: 4px;
  }
  .co-item {
    display: flex; align-items: center; justify-content: space-between;
    gap: 12px; padding: 12px 0;
    border-bottom: 1px solid #f5f5f5;
  }
  .co-item:last-child { border-bottom: none; }
  .co-item-left { display: flex; gap: 12px; flex: 1; min-width: 0; }
  .co-item-img {
    width: 56px; height: 56px; border-radius: var(--co-radius);
    object-fit: cover; border: 1px solid #f0f0f0; flex-shrink: 0;
  }
  .co-item-img-placeholder {
    width: 56px; height: 56px; border-radius: var(--co-radius);
    background: var(--co-bg); border: 1px solid var(--co-border);
    display: flex; align-items: center; justify-content: center;
    font-size: 10px; color: var(--co-light); flex-shrink: 0;
  }
  .co-item-info { flex: 1; min-width: 0; }
  .co-item-name {
    font-size: 14px; font-weight: 700; color: var(--co-dark);
    white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
    margin: 0 0 2px;
  }
  .co-item-unit {
    font-size: 12px; color: var(--co-light); margin: 0;
  }
  .co-item-qty {
    display: inline-flex; align-items: center; gap: 4px;
    margin-top: 4px; padding: 2px 8px; border-radius: 100px;
    background: var(--co-green-lighter); font-size: 11px;
    font-weight: 700; color: var(--co-green);
  }
  .co-item-price {
    font-size: 14px; font-weight: 900; color: var(--co-dark);
    flex-shrink: 0;
  }

  /* ==================== TOTALS ==================== */
  .co-totals { padding-top: 16px; border-top: 1px solid var(--co-border); }
  .co-total-row {
    display: flex; align-items: center; justify-content: space-between;
    padding: 6px 0; font-size: 14px;
  }
  .co-total-row-label { font-weight: 500; color: var(--co-mid); }
  .co-total-row-value { font-weight: 700; color: var(--co-dark); }
  .co-total-row-free { font-weight: 700; color: var(--co-green-600); }
  .co-total-row-warning { font-weight: 600; color: #d97706; }

  .co-service-charge {
    display: flex; align-items: center; justify-content: space-between;
    padding: 8px 12px; background: #eff6ff; border-radius: var(--co-radius);
    margin: 8px 0;
  }
  .co-service-charge span {
    font-size: 13px; font-weight: 600; color: #1e40af;
  }

  .co-grand-total {
    display: flex; align-items: center; justify-content: space-between;
    padding: 12px 16px; background: linear-gradient(135deg, #fef2f2, #fff7ed);
    border-radius: var(--co-radius); margin-top: 8px;
    border: 1px solid #fecaca;
  }
  .co-grand-total-label {
    font-size: 16px; font-weight: 800; color: var(--co-red);
  }
  .co-grand-total-value {
    font-size: 18px; font-weight: 900; color: var(--co-red);
  }

  .co-charge-note {
    font-size: 11px; color: var(--co-light); text-align: center;
    font-style: italic; margin-top: 6px;
  }

  /* ==================== PAYMENT METHOD ==================== */
  .co-payment-section { margin-top: 20px; }
  .co-payment-title {
    font-size: 14px; font-weight: 800; color: var(--co-dark);
    margin: 0 0 12px; letter-spacing: -0.01em;
  }
  .co-payment-options { display: flex; flex-direction: column; gap: 8px; }
  .co-payment-option {
    display: flex; align-items: center; gap: 12px;
    padding: 12px 16px; border: 2px solid var(--co-border);
    border-radius: var(--co-radius); cursor: pointer;
    transition: all 0.15s; background: #fff;
  }
  .co-payment-option:hover { border-color: #d1d5db; }
  .co-payment-option-active {
    border-color: var(--co-green-600) !important;
    background: var(--co-green-lighter) !important;
  }
  .co-payment-option-text {
    font-size: 14px; font-weight: 600; color: var(--co-mid);
  }

  /* ==================== BUTTONS ==================== */
  .co-btn-primary {
    width: 100%; padding: 14px; background: var(--co-green);
    color: #fff; border: none; border-radius: var(--co-radius);
    font-size: 15px; font-weight: 700; cursor: pointer;
    transition: all 0.15s; font-family: var(--co-font);
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .co-btn-primary:hover { background: var(--co-green-mid); }
  .co-btn-primary:active { transform: scale(0.98); }
  .co-btn-primary:disabled { background: #d1d5db; cursor: not-allowed; }

  .co-btn-danger {
    width: 100%; padding: 12px; background: #fff;
    color: var(--co-red); border: 1px solid #fecaca;
    border-radius: var(--co-radius); font-size: 14px;
    font-weight: 600; cursor: pointer; transition: all 0.15s;
    font-family: var(--co-font);
    display: flex; align-items: center; justify-content: center; gap: 8px;
  }
  .co-btn-danger:hover { background: #fef2f2; border-color: var(--co-red); }
  .co-btn-danger:disabled { opacity: 0.4; cursor: not-allowed; }

  /* ==================== STICKY MOBILE BUTTON ==================== */
  .co-sticky-bottom {
    position: fixed; bottom: 0; left: 0; right: 0;
    background: #fff; border-top: 1px solid var(--co-border);
    padding: 12px 16px; z-index: 40;
    padding-bottom: max(12px, env(safe-area-inset-bottom));
    box-shadow: 0 -2px 12px rgba(0,0,0,0.06);
    display: block;
  }
  @media (min-width: 1024px) { .co-sticky-bottom { display: none; } }
  .co-desktop-btn { display: none; margin-top: 20px; }
  @media (min-width: 1024px) { .co-desktop-btn { display: block; } }

  /* ==================== EMPTY STATE ==================== */
  .co-empty {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; text-align: center; padding: 60px 24px;
    min-height: 400px;
  }
  .co-empty-icon {
    width: 72px; height: 72px; border-radius: 50%;
    background: var(--co-bg); display: flex; align-items: center;
    justify-content: center; margin-bottom: 16px;
    border: 1px solid var(--co-border);
  }
  .co-empty-title {
    font-size: 22px; font-weight: 800; color: var(--co-dark); margin-bottom: 8px;
  }
  .co-empty-desc {
    font-size: 14px; color: var(--co-light); margin-bottom: 24px;
  }

  /* ==================== LOADING OVERLAY ==================== */
  .co-loading-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.5);
    backdrop-filter: blur(4px); display: flex; align-items: center;
    justify-content: center; z-index: 50;
  }
  .co-loading-card {
    background: #fff; border-radius: var(--co-radius-xl);
    padding: 32px; display: flex; flex-direction: column;
    align-items: center; gap: 16px; box-shadow: 0 20px 60px rgba(0,0,0,0.15);
  }
  .co-spinner {
    width: 40px; height: 40px; border: 4px solid var(--co-green-light);
    border-top-color: var(--co-green-600); border-radius: 50%;
    animation: co-spin 0.8s linear infinite;
  }
  @keyframes co-spin {
    to { transform: rotate(360deg); }
  }
  .co-loading-text {
    font-size: 15px; font-weight: 700; color: var(--co-mid);
  }

  /* ==================== MODAL OVERRIDES ==================== */
  .co-modal .ant-modal {
    max-width: calc(100vw - 32px) !important;
    margin: 16px !important;
  }
  @media (max-width: 640px) {
    .co-modal .ant-modal {
      max-width: calc(100vw - 24px) !important;
      margin: 12px !important;
    }
    .co-modal .ant-modal-content { border-radius: 12px !important; }
  }

  /* ==================== PAYMENT MODAL INTERNALS ==================== */
  .co-pay-header { text-align: center; margin-bottom: 4px; }
  .co-pay-logo { height: 32px; object-fit: contain; margin: 0 auto 8px; display: block; }
  @media (min-width: 768px) { .co-pay-logo { height: 40px; } }
  .co-pay-company {
    font-size: 12px; font-weight: 800; color: var(--co-dark);
    letter-spacing: -0.01em;
  }

  .co-pay-amount-card {
    background: linear-gradient(135deg, var(--co-green-mid), var(--co-green));
    border-radius: var(--co-radius-xl); padding: 16px;
    text-align: center; color: #fff;
  }
  .co-pay-amount-label {
    font-size: 11px; font-weight: 700; color: rgba(255,255,255,0.7);
    text-transform: uppercase; letter-spacing: 0.06em; margin-bottom: 4px;
  }
  .co-pay-amount-value {
    font-size: 28px; font-weight: 900; letter-spacing: -0.02em;
  }
  @media (min-width: 768px) { .co-pay-amount-value { font-size: 32px; } }
  .co-pay-ref {
    font-size: 11px; color: rgba(255,255,255,0.6); margin-top: 6px;
  }

  .co-pay-field {
    background: var(--co-bg); border-radius: var(--co-radius);
    padding: 14px 16px; border: 1px solid #f0f0f0;
  }
  .co-pay-field-label {
    font-size: 13px; font-weight: 800; color: var(--co-dark);
    display: flex; align-items: center; gap: 8px; margin-bottom: 10px;
  }
  .co-pay-step-num {
    width: 22px; height: 22px; background: var(--co-green);
    color: #fff; border-radius: 50%; display: flex; align-items: center;
    justify-content: center; font-size: 11px; font-weight: 900; flex-shrink: 0;
  }

  .co-pay-validation {
    font-size: 12px; font-weight: 600; margin-top: 6px; min-height: 18px;
  }
  .co-pay-validation-error { color: var(--co-red); }
  .co-pay-validation-ok { color: var(--co-green-600); display: flex; align-items: center; gap: 4px; }

  .co-network-option {
    display: flex; align-items: center; padding: 12px;
    border: 2px solid var(--co-border); border-radius: var(--co-radius);
    cursor: pointer; transition: all 0.15s; background: #fff;
  }
  .co-network-option:hover { border-color: #d1d5db; }
  .co-network-logo {
    width: 32px; height: 32px; object-fit: contain; border-radius: 6px;
  }
  @media (min-width: 768px) { .co-network-logo { width: 36px; height: 36px; } }
  .co-network-name { font-size: 14px; font-weight: 700; color: var(--co-dark); }
  .co-network-sub { font-size: 11px; color: var(--co-light); }

  .co-pay-info-box {
    background: #eff6ff; border: 1px solid #bfdbfe;
    border-radius: var(--co-radius); padding: 12px;
  }
  .co-pay-info-title { font-size: 12px; font-weight: 800; color: #1e40af; margin-bottom: 6px; }
  .co-pay-info-list {
    font-size: 12px; color: #2563eb; list-style: decimal;
    padding-left: 16px; margin: 0;
  }
  .co-pay-info-list li { margin-bottom: 3px; }

  /* ==================== PENDING STATE ==================== */
  .co-pending-spinner {
    position: relative; width: 80px; height: 80px; margin: 0 auto;
  }
  @media (min-width: 768px) {
    .co-pending-spinner { width: 96px; height: 96px; }
  }
  .co-pending-ring {
    position: absolute; inset: 0; border: 4px solid var(--co-green-light);
    border-radius: 50%;
  }
  .co-pending-ring-active {
    position: absolute; inset: 0; border: 4px solid var(--co-green-600);
    border-top-color: transparent; border-radius: 50%;
    animation: co-spin 1s linear infinite;
  }
  .co-pending-icon {
    position: absolute; inset: 0; display: flex; align-items: center;
    justify-content: center;
  }

  .co-pending-details {
    background: var(--co-bg); border: 1px solid #f0f0f0;
    border-radius: var(--co-radius); padding: 12px;
  }
  .co-pending-detail-row {
    display: flex; justify-content: space-between;
    font-size: 13px; padding: 4px 0;
  }
  .co-pending-detail-label { color: var(--co-light); font-weight: 500; }
  .co-pending-detail-value { font-weight: 700; color: var(--co-dark); }
  .co-pending-detail-amount { font-weight: 900; color: var(--co-green); }

  .co-progress-bar {
    background: var(--co-green-lighter); border: 1px solid #bbf7d0;
    border-radius: var(--co-radius); padding: 12px;
  }
  .co-progress-bar-top {
    display: flex; justify-content: space-between; align-items: center;
    margin-bottom: 6px;
  }
  .co-progress-bar-label { font-size: 12px; font-weight: 700; color: var(--co-green); }
  .co-progress-bar-count { font-size: 12px; font-weight: 900; color: var(--co-green); }
  .co-progress-track {
    width: 100%; height: 6px; background: #bbf7d0; border-radius: 3px;
    overflow: hidden;
  }
  .co-progress-fill {
    height: 100%; background: var(--co-green-600); border-radius: 3px;
    transition: width 1s linear;
  }

  /* ==================== AUTO CHECK TIMER ==================== */
  .co-auto-check-bar {
    background: #fef3c7; border: 1px solid #fde68a;
    border-radius: var(--co-radius); padding: 10px 14px;
    display: flex; align-items: center; justify-content: space-between;
    margin-top: 8px;
  }
  .co-auto-check-label {
    font-size: 12px; font-weight: 700; color: #92400e;
  }
  .co-auto-check-time {
    font-size: 13px; font-weight: 900; color: #b45309;
    font-variant-numeric: tabular-nums;
  }

  /* ==================== SUCCESS / FAILED ==================== */
  .co-result-state { text-align: center; padding: 32px 0; }
  .co-result-icon {
    width: 72px; height: 72px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px;
  }
  .co-result-icon-success { background: var(--co-green-light); }
  .co-result-icon-failed { background: #fee2e2; }
  .co-result-title { font-size: 22px; font-weight: 900; margin-bottom: 4px; }
  .co-result-title-success { color: var(--co-green); }
  .co-result-title-failed { color: var(--co-red); }
  .co-result-desc { font-size: 14px; color: var(--co-light); }

  /* ==================== ACTION DIALOG ==================== */
  .co-dialog-overlay {
    position: fixed; inset: 0; z-index: 9999;
    display: flex; align-items: center; justify-content: center;
    padding: 16px;
  }
  .co-dialog-backdrop {
    position: absolute; inset: 0; background: rgba(0,0,0,0.5);
    backdrop-filter: blur(4px);
  }
  .co-dialog-card {
    position: relative; background: #fff; border-radius: var(--co-radius-xl);
    width: 100%; max-width: 380px; overflow: hidden;
    box-shadow: 0 20px 60px rgba(0,0,0,0.2);
    animation: co-dialog-pop 0.2s ease-out;
  }
  @keyframes co-dialog-pop {
    from { opacity: 0; transform: translateY(12px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  .co-dialog-bar { height: 4px; width: 100%; }
  .co-dialog-bar-cancel { background: linear-gradient(90deg, #f87171, #ef4444); }
  .co-dialog-bar-warning { background: linear-gradient(90deg, #fbbf24, #f59e0b); }
  .co-dialog-body { padding: 24px; }
  .co-dialog-icon {
    width: 56px; height: 56px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    margin: 0 auto 16px;
  }
  .co-dialog-icon-cancel { background: #fef2f2; }
  .co-dialog-icon-warning { background: #fffbeb; }
  .co-dialog-title {
    font-size: 18px; font-weight: 900; color: var(--co-dark);
    text-align: center; margin-bottom: 6px;
  }
  .co-dialog-desc {
    font-size: 13px; color: var(--co-light); text-align: center;
    line-height: 1.5; margin-bottom: 20px;
  }
  .co-dialog-actions { display: flex; flex-direction: column; gap: 8px; }

  /* ==================== APPROVAL GUIDE ==================== */
  .co-guide-header {
    display: flex; align-items: flex-start; gap: 12px;
  }
  .co-guide-logo-wrap {
    width: 40px; height: 40px; border-radius: var(--co-radius-lg);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0; border: 2px solid;
  }
  @media (min-width: 768px) { .co-guide-logo-wrap { width: 48px; height: 48px; } }
  .co-guide-logo { width: 24px; height: 24px; object-fit: contain; }
  @media (min-width: 768px) { .co-guide-logo { width: 32px; height: 32px; } }

  .co-guide-badge {
    display: inline-flex; align-items: center; gap: 6px;
    font-size: 11px; font-weight: 700; padding: 3px 10px;
    border-radius: 100px; border: 1px solid; margin-bottom: 4px;
  }
  .co-guide-badge-dot {
    width: 6px; height: 6px; border-radius: 50%; animation: co-pulse 2s ease-in-out infinite;
  }
  @keyframes co-pulse {
    0%, 100% { opacity: 0.4; } 50% { opacity: 1; }
  }

  .co-guide-title {
    font-size: 17px; font-weight: 900; color: var(--co-dark);
    line-height: 1.2; margin: 0;
  }
  @media (min-width: 768px) { .co-guide-title { font-size: 19px; } }
  .co-guide-subtitle {
    font-size: 13px; color: var(--co-light); margin-top: 2px;
  }

  .co-guide-info-row {
    display: flex; align-items: center; justify-content: space-between;
    border-radius: var(--co-radius); border: 1px solid;
    padding: 10px 14px;
  }
  .co-guide-info-label {
    font-size: 10px; font-weight: 700; color: var(--co-light);
    text-transform: uppercase; letter-spacing: 0.04em; margin-bottom: 2px;
  }
  .co-guide-info-value {
    font-weight: 900; letter-spacing: -0.01em;
  }

  .co-guide-ussd-row {
    display: flex; align-items: center; gap: 12px;
    border-radius: var(--co-radius); border: 1px solid;
    padding: 10px 14px;
  }
  .co-guide-ussd-icon {
    width: 32px; height: 32px; border-radius: var(--co-radius);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }
  .co-guide-ussd-label {
    font-size: 10px; font-weight: 800; text-transform: uppercase;
    letter-spacing: 0.04em;
  }
  .co-guide-ussd-value {
    font-size: 20px; font-weight: 900;
    font-family: 'SF Mono', 'Fira Code', monospace, var(--co-font);
  }

  .co-guide-steps-wrap {
    background: #fff; border: 1px solid #f0f0f0;
    border-radius: var(--co-radius); overflow: hidden;
  }
  .co-guide-steps-header {
    display: flex; align-items: center; justify-content: space-between;
    padding: 10px 14px; border-bottom: 1px solid #f5f5f5;
  }
  .co-guide-steps-title { font-size: 13px; font-weight: 800; color: var(--co-dark); }
  .co-guide-steps-count {
    font-size: 11px; font-weight: 700; padding: 2px 8px;
    border-radius: 100px; border: 1px solid;
  }
  .co-guide-steps-body {
    padding: 14px; max-height: 240px; overflow-y: auto;
  }
  @media (min-width: 768px) { .co-guide-steps-body { max-height: 320px; } }

  .co-guide-step { display: flex; gap: 12px; }
  .co-guide-step-col {
    display: flex; flex-direction: column; align-items: center;
  }
  .co-guide-step-num {
    width: 24px; height: 24px; border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    font-size: 11px; font-weight: 900; color: #fff; flex-shrink: 0;
  }
  .co-guide-step-line {
    width: 2px; flex: 1; min-height: 12px; margin: 4px 0;
    border-radius: 1px; background: #e5e7eb;
  }
  .co-guide-step-text {
    font-size: 13px; font-weight: 500; color: var(--co-mid);
    padding-top: 2px; padding-bottom: 12px; line-height: 1.4;
  }
  .co-guide-step-text-last {
    font-weight: 700; padding-bottom: 0;
  }

  .co-guide-tip {
    display: flex; gap: 10px; background: #fffbeb;
    border: 1px solid #fde68a; border-radius: var(--co-radius);
    padding: 10px 14px;
  }
  .co-guide-tip-icon {
    width: 24px; height: 24px; background: #fef3c7;
    border-radius: 6px; display: flex; align-items: center;
    justify-content: center; flex-shrink: 0; font-size: 14px;
  }
  .co-guide-tip-text {
    font-size: 12px; font-weight: 600; color: #92400e; line-height: 1.5;
  }

  /* Guide mobile sticky */
  .co-guide-sticky {
    position: fixed; bottom: 0; left: 0; right: 0;
    background: #fff; border-top: 1px solid var(--co-border);
    padding: 12px 16px; z-index: 10000;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
    display: flex; flex-direction: column; gap: 8px;
  }
  @media (min-width: 1024px) { .co-guide-sticky { display: none; } }
  .co-guide-desktop-actions { display: none; flex-direction: column; gap: 8px; padding-top: 4px; }
  @media (min-width: 1024px) { .co-guide-desktop-actions { display: flex; } }
`;

// ==================== ACTION DIALOG COMPONENT ====================
const PaymentActionDialog = ({ open, mode, verifying, onRetry, onCancel, onClose }) => {
  if (!open) return null;
  const isCancel = mode === "cancel";

  return (
    <div className="co-dialog-overlay">
      <div className="co-dialog-backdrop" onClick={() => !verifying && onClose()} />
      <div className="co-dialog-card">
        <div className={`co-dialog-bar ${isCancel ? "co-dialog-bar-cancel" : "co-dialog-bar-warning"}`} />
        <div className="co-dialog-body">
          <div className={`co-dialog-icon ${isCancel ? "co-dialog-icon-cancel" : "co-dialog-icon-warning"}`}>
            {isCancel ? (
              <XCircleSolid style={{ width: 32, height: 32, color: "#ef4444" }} />
            ) : (
              <ExclamationTriangleIcon style={{ width: 32, height: 32, color: "#f59e0b" }} />
            )}
          </div>
          <div className="co-dialog-title">
            {isCancel ? "Cancel this order?" : "Payment not confirmed yet"}
          </div>
          <div className="co-dialog-desc">
            {isCancel
              ? "Are you sure you want to cancel the order?"
              : "We couldn't verify your payment. Please approve via your MoMo app or USSD, then try again."}
          </div>
          <div className="co-dialog-actions">
            <button onClick={onRetry} disabled={verifying} className="co-btn-primary">
              {verifying ? (
                <>
                  <div className="co-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} />
                  Verifying…
                </>
              ) : (
                <>
                  <ArrowUturnLeftIcon style={{ width: 16, height: 16 }} />
                  {isCancel ? "Keep Trying" : "I've Approved — Try Again"}
                </>
              )}
            </button>
            <button onClick={onCancel} disabled={verifying} className="co-btn-danger">
              <XCircleIcon style={{ width: 16, height: 16 }} />
              Yes, Cancel Order
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== MAIN COMPONENT ====================
const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const pollingRef = useRef(null);
  const countdownRef = useRef(null);
  const initialDelayRef = useRef(null);
  const autoCheckRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [orderNote, setOrderNote] = useState("");
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [timeoutCountdown, setTimeoutCountdown] = useState(60);
  const [autoCheckCountdown, setAutoCheckCountdown] = useState(0);

  const [deliveryFee, setDeliveryFee] = useState(0);
  const [deliveryInfo, setDeliveryInfo] = useState({ address: "", fee: 0, feeDisplay: "" });

  const [isValidationModalVisible, setIsValidationModalVisible] = useState(false);
  const [isPaymentModalVisible, setIsPaymentModalVisible] = useState(false);
  const [isGuestWarningVisible, setIsGuestWarningVisible] = useState(false);
  const [isApprovalGuideVisible, setIsApprovalGuideVisible] = useState(false);

  const [actionDialog, setActionDialog] = useState({ open: false, mode: "cancel" });

  const [paymentStatus, setPaymentStatus] = useState("idle");
  const [currentOrderId, setCurrentOrderId] = useState(null);
  const [pendingCheckoutDetails, setPendingCheckoutDetails] = useState(null);
  const [pendingAddressDetails, setPendingAddressDetails] = useState(null);

  const [momoNumber, setMomoNumber] = useState("233");
  const [selectedNetwork, setSelectedNetwork] = useState(null);
  const [payButtonLoading, setPayButtonLoading] = useState(false);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const { cart: reduxCart, cartId: reduxCartId } = useSelector((state) => state.cart);

  const getCartItemsFromLocalStorage = () => {
    try {
      const stored = localStorage.getItem("cart");
      if (!stored) return [];
      return Array.isArray(stored) ? stored : [];
    } catch { return []; }
  };
  const resolveCartItems = () => {
    if (Array.isArray(reduxCart) && reduxCart.length > 0) return reduxCart;
    return getCartItemsFromLocalStorage();
  };
  const [cartItems, setCartItems] = useState(resolveCartItems);
  const getCartId = () => reduxCartId || localStorage.getItem("cartId") || `cart_${Date.now()}`;

  const [customerData, setCustomerData] = useState(null);
  const [isDifferentRecipient, setIsDifferentRecipient] = useState(false);
  const [customerName, setCustomerName] = useState("");
  const [customerNumber, setCustomerNumber] = useState("");

  const customerId = customerData?.customerAccountNumber;
  const customerAccountType = customerData?.accountType;
  const selectedAddress = deliveryInfo?.address || "";
  const isAgent = customerAccountType === "agent";
  const isFreeDelivery =
    deliveryInfo?.fee === 0 &&
    typeof deliveryInfo?.feeDisplay === "string" &&
    deliveryInfo.feeDisplay.toLowerCase().includes("free");
  const isNADelivery =
    deliveryInfo?.fee === 0 &&
    (!deliveryInfo?.feeDisplay ||
      deliveryInfo?.feeDisplay === "N/A" ||
      deliveryInfo?.feeDisplay === "" ||
      (typeof deliveryInfo?.feeDisplay === "string" &&
        deliveryInfo.feeDisplay.toLowerCase() === "n/a"));

  const netCfg = selectedNetwork ? NETWORK_STEPS[selectedNetwork] : null;

  // ==================== CLEANUP ====================
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      if (countdownRef.current) clearInterval(countdownRef.current);
      if (initialDelayRef.current) clearTimeout(initialDelayRef.current);
      if (autoCheckRef.current) clearInterval(autoCheckRef.current);
    };
  }, []);

  // ==================== DATA INIT ====================
  useEffect(() => {
    try {
      const customerObj = localStorage.getItem("customer");
      if (customerObj && typeof customerObj === "object") {
        setCustomerData(customerObj);
        setCustomerName(`${customerObj.firstName || ""} ${customerObj.lastName || ""}`.trim());
        setCustomerNumber(customerObj.contactNumber || customerObj.ContactNumber || "");
      }
    } catch {}
    try {
      const storedInfo = localStorage.getItem("deliveryInfo") || {};
      setDeliveryInfo({
        address: storedInfo?.address || "",
        fee: storedInfo?.fee ?? 0,
        feeDisplay: storedInfo?.feeDisplay || "",
      });
      setDeliveryFee(Number(storedInfo?.fee) || 0);
    } catch {}
  }, []);

  useEffect(() => {
    const activeCartId = reduxCartId || localStorage.getItem("cartId");
    if (activeCartId) dispatch(getCartById(activeCartId));
  }, []);

  useEffect(() => {
    if (isDifferentRecipient) {
      setCustomerName("");
      setCustomerNumber("");
    } else if (customerData) {
      setCustomerName(`${customerData.firstName || ""} ${customerData.lastName || ""}`.trim());
      setCustomerNumber(customerData.contactNumber || customerData.ContactNumber || "");
    }
  }, [isDifferentRecipient]);

  useEffect(() => {
    if (deliveryInfo?.fee !== undefined && !Number.isNaN(Number(deliveryInfo.fee)))
      setDeliveryFee(Number(deliveryInfo.fee));
  }, [deliveryInfo]);

  useEffect(() => {
    if (Array.isArray(reduxCart) && reduxCart.length > 0) setCartItems(reduxCart);
    else {
      const f = getCartItemsFromLocalStorage();
      if (f.length > 0) setCartItems(f);
    }
  }, [reduxCart]);

  // ==================== AUTO-CHECK after 2 minutes when approval guide is visible ====================
  useEffect(() => {
    if (isApprovalGuideVisible && currentOrderId) {
      const totalSeconds = AUTO_CHECK_DELAY_MS / 1000;
      setAutoCheckCountdown(totalSeconds);

      // Countdown timer
      const countdownTimer = setInterval(() => {
        setAutoCheckCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownTimer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Auto-check after 2 minutes
      autoCheckRef.current = setTimeout(async () => {
        try {
          setVerifyingPayment(true);
          const response = await dispatch(
            checkTransactionStatus({ refNo: currentOrderId })
          ).unwrap();

          if (response?.responseMessage === "Successfully Processed Transaction") {
            setPaymentStatus("success");
            setIsApprovalGuideVisible(false);
            try {
              await processDirectCheckout(
                currentOrderId,
                pendingCheckoutDetails,
                pendingAddressDetails
              );
              localStorage.removeItem("checkoutDetails");
              localStorage.removeItem("orderAddressDetails");
              message.success("Payment confirmed! Your order is being processed.");
              setTimeout(() => {
                setIsPaymentModalVisible(false);
                navigate(`/order-success/${currentOrderId}`);
              }, 1200);
            } catch {
              message.error("Payment confirmed but order processing failed. Contact support.");
            }
          } else {
            // Payment not successful after 2 minutes → navigate to cancelled
            setIsApprovalGuideVisible(false);
            setIsPaymentModalVisible(false);
            localStorage.removeItem("checkoutDetails");
            localStorage.removeItem("orderAddressDetails");
            message.error("Payment was not confirmed. Your order has been cancelled.");
            navigate("/order-cancelled");
          }
        } catch {
          // Error checking → navigate to cancelled
          setIsApprovalGuideVisible(false);
          setIsPaymentModalVisible(false);
          localStorage.removeItem("checkoutDetails");
          localStorage.removeItem("orderAddressDetails");
          message.error("Unable to verify payment. Your order has been cancelled.");
          navigate("/order-cancelled");
        } finally {
          setVerifyingPayment(false);
        }
      }, AUTO_CHECK_DELAY_MS);

      return () => {
        clearInterval(countdownTimer);
        if (autoCheckRef.current) clearTimeout(autoCheckRef.current);
      };
    }
  }, [isApprovalGuideVisible, currentOrderId]);

  // ==================== MOMO NUMBER ====================
  const handleMomoNumberChange = (e) => {
    let value = e.target.value.replace(/[^0-9]/g, "");
    if (value.startsWith("0")) value = "233" + value.slice(1);
    if (!value.startsWith("233")) value = "233";
    if (value.length > 12) value = value.slice(0, 12);
    setMomoNumber(value);
  };
  const isValidMomoNumber = () => /^233[1-9]\d{8}$/.test(momoNumber);
  const startsWithZeroAfter233 = () => momoNumber.length > 3 && momoNumber[3] === "0";

  // ==================== CALCULATIONS ====================
  const calculateSubtotal = () =>
    cartItems.reduce((sum, item) => sum + getItemLineTotal(item), 0);
  const calculateTotalAmount = () => calculateSubtotal() + deliveryFee;
  const calculateServiceCharge = () => {
    const base = calculateTotalAmount();
    return base > 2000 ? SERVICE_CHARGE_CAP : base * SERVICE_CHARGE_RATE;
  };
  const calculateDisplayTotalWithCharge = () =>
    calculateTotalAmount() + calculateServiceCharge();
  const generateOrderId = () =>
    `ORD-${new Date().getTime() % 10000}-${Math.floor(Math.random() * 1000)}`;

  // ==================== RETRY HELPERS ====================
  const dispatchOrderCheckoutWithRetry = async (orderId, checkoutDetails, maxRetries = 3) => {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await dispatch(
          checkOutOrder({ cartId: getCartId(), ...checkoutDetails })
        ).unwrap();
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries)
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
    throw new Error(`Checkout failed after ${maxRetries} attempts: ${lastError?.message || "Unknown"}`);
  };
  const dispatchOrderAddressWithRetry = async (orderId, addressDetails, maxRetries = 3) => {
    let lastError;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const result = await dispatch(updateOrderDelivery(addressDetails)).unwrap();
        dispatch(clearCart());
        localStorage.removeItem("cart");
        localStorage.removeItem("cartId");
        return result;
      } catch (error) {
        lastError = error;
        if (attempt < maxRetries)
          await new Promise((r) => setTimeout(r, Math.pow(2, attempt) * 1000));
      }
    }
    throw new Error(`Address update failed after ${maxRetries} attempts: ${lastError?.message || "Unknown"}`);
  };
  const processDirectCheckout = async (orderId, checkoutDetails, addressDetails) => {
    await dispatchOrderCheckoutWithRetry(orderId, checkoutDetails);
    await dispatchOrderAddressWithRetry(orderId, addressDetails);
  };

  // ==================== POLLING ====================
  const startPolling = (orderId, checkoutDetails, addressDetails) => {
    setTimeoutCountdown(60);
    countdownRef.current = setInterval(() => {
      setTimeoutCountdown((prev) => (prev <= 1 ? 0 : prev - 1));
    }, 1000);

    initialDelayRef.current = setTimeout(() => {
      let pollCount = 0;
      const maxPolls = MAX_POLL_DURATION_MS / POLL_INTERVAL_MS;

      pollingRef.current = setInterval(async () => {
        pollCount++;
        try {
          const response = await dispatch(
            checkTransactionStatus({ refNo: orderId })
          ).unwrap();
          if (response?.responseMessage === "Successfully Processed Transaction") {
            clearInterval(pollingRef.current);
            clearInterval(countdownRef.current);
            setPaymentStatus("success");
            try {
              await processDirectCheckout(orderId, checkoutDetails, addressDetails);
              localStorage.removeItem("checkoutDetails");
              localStorage.removeItem("orderAddressDetails");
              message.success("Payment confirmed! Processing your order...");
              setTimeout(() => {
                setIsPaymentModalVisible(false);
                navigate(`/order-success/${orderId}`);
              }, 1200);
            } catch {
              message.error("Payment succeeded, but order processing failed. Contact support.");
            }
            return;
          }
        } catch {}

        if (pollCount >= maxPolls) {
          clearInterval(pollingRef.current);
          clearInterval(countdownRef.current);
          setPaymentStatus("awaiting_manual");
          setIsApprovalGuideVisible(true);
        }
      }, POLL_INTERVAL_MS);
    }, INITIAL_DELAY_MS);
  };

  // ==================== CANCEL ====================
  const performCancelOrder = () => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    if (countdownRef.current) clearInterval(countdownRef.current);
    if (initialDelayRef.current) clearTimeout(initialDelayRef.current);
    if (autoCheckRef.current) clearTimeout(autoCheckRef.current);
    setActionDialog({ open: false, mode: "cancel" });
    setIsApprovalGuideVisible(false);
    setIsPaymentModalVisible(false);
    setPaymentStatus("idle");
    localStorage.removeItem("checkoutDetails");
    localStorage.removeItem("orderAddressDetails");
    navigate("/order-cancelled");
  };

  // ==================== MANUAL CONFIRM ====================
  const handleManualConfirm = async () => {
    if (!currentOrderId) return;
    try {
      setVerifyingPayment(true);
      const response = await dispatch(
        checkTransactionStatus({ refNo: currentOrderId })
      ).unwrap();

      if (response?.responseMessage === "Successfully Processed Transaction") {
        if (autoCheckRef.current) clearTimeout(autoCheckRef.current);
        setActionDialog({ open: false, mode: "cancel" });
        setPaymentStatus("success");
        setIsApprovalGuideVisible(false);
        try {
          await processDirectCheckout(currentOrderId, pendingCheckoutDetails, pendingAddressDetails);
          localStorage.removeItem("checkoutDetails");
          localStorage.removeItem("orderAddressDetails");
          message.success("Payment confirmed! Your order is being processed...");
          setTimeout(() => {
            setIsPaymentModalVisible(false);
            navigate(`/order-success/${currentOrderId}`);
          }, 1200);
        } catch {
          message.error("Payment confirmed but order processing failed. Please contact support.");
        }
      } else {
        setActionDialog({ open: true, mode: "not_confirmed" });
      }
    } catch {
      setActionDialog({ open: true, mode: "not_confirmed" });
    } finally {
      setVerifyingPayment(false);
    }
  };

  const handleCancelFromGuide = () => setActionDialog({ open: true, mode: "cancel" });
  const handleDialogRetry = () => {
    setActionDialog({ open: false, mode: "cancel" });
    if (actionDialog.mode === "not_confirmed") handleManualConfirm();
  };
  const handleDialogCancel = () => performCancelOrder();

  // ==================== VALIDATION ====================
  const validateRequiredFields = () => {
    const errors = [];
    if (!customerName?.trim()) errors.push({ field: "name", message: "Recipient name is required" });
    if (!customerNumber?.trim()) errors.push({ field: "phone", message: "Recipient contact number is required" });
    if (!selectedAddress?.trim()) errors.push({ field: "address", message: "Delivery address is required" });
    if (!paymentMethod) errors.push({ field: "payment", message: "Payment method is required" });
    return errors;
  };
  const getSafeCustomerDetails = () => {
    let name = customerName?.trim();
    let number = customerNumber?.trim();
    if (!name && customerData) name = `${customerData.firstName || ""} ${customerData.lastName || ""}`.trim();
    if (!number && customerData) number = customerData.contactNumber || customerData.ContactNumber || "";
    if (!number) number = "0000000000";
    return { name, number };
  };

  // ==================== PAYMENT HANDLERS ====================
  const handlePaymentMethodChange = (e) => setPaymentMethod(e.target.value);

  const handleCheckout = async () => {
    const { name: safeName, number: safeNumber } = getSafeCustomerDetails();
    setCustomerName(safeName);
    setCustomerNumber(safeNumber);

    const nameLower = safeName.toLowerCase().trim();
    if (nameLower === "guest" || nameLower === "guest user" || nameLower.startsWith("guest ")) {
      setIsGuestWarningVisible(true);
      return;
    }
    const validationErrors = validateRequiredFields();
    if (validationErrors.length > 0) {
      setIsValidationModalVisible(true);
      return;
    }

    const orderId = generateOrderId();
    setCurrentOrderId(orderId);
    const orderDate = new Date().toISOString();
    const totalAmount = calculateSubtotal();
    const cartId = getCartId();

    const checkoutDetails = {
      Cartid: cartId, customerId, orderCode: orderId, PaymentMode: paymentMethod,
      PaymentAccountNumber: safeNumber || "0000000000", customerAccountType,
      paymentService: "Mtn", totalAmount, recipientName: safeName,
      recipientContactNumber: safeNumber, orderNote: orderNote || "N/A", orderDate,
    };
    const addressDetails = {
      orderCode: orderId, address: selectedAddress, Customerid: customerId,
      recipientName: safeName, recipientContactNumber: safeNumber,
      orderNote: orderNote || "N/A", geoLocation: "N/A",
    };

    try {
      setLoading(true);
      if (isAgent || !["Mobile Money"].includes(paymentMethod)) {
        await processDirectCheckout(orderId, checkoutDetails, addressDetails);
        message.success("Your order has been placed successfully!");
        navigate("/order-received");
      } else {
        localStorage.setItem("checkoutDetails", checkoutDetails);
        localStorage.setItem("orderAddressDetails", addressDetails);
        dispatch(saveCheckoutDetails(checkoutDetails));
        dispatch(saveAddressDetails(addressDetails));
        setPendingCheckoutDetails(checkoutDetails);
        setPendingAddressDetails(addressDetails);
        setMomoNumber("233");
        setSelectedNetwork(null);
        setPaymentStatus("input");
        setIsPaymentModalVisible(true);
      }
    } catch (error) {
      message.error(error.message || "An error occurred during checkout.");
    } finally {
      setLoading(false);
    }
  };

  const handlePayNow = async () => {
    if (!isValidMomoNumber()) { message.error("Please enter a valid 9-digit number after 233"); return; }
    if (!selectedNetwork) { message.error("Please select your network provider"); return; }
    const paymentAmount = calculateSubtotal();
    const narration = buildCartNarration(cartItems);
    try {
      setPayButtonLoading(true);
      setPaymentStatus("pending");
      await dispatch(debitCustomer({ refNo: currentOrderId, msisdn: momoNumber, amount: paymentAmount, network: selectedNetwork, narration })).unwrap();
      startPolling(currentOrderId, pendingCheckoutDetails, pendingAddressDetails);
    } catch {
      setPaymentStatus("failed");
      localStorage.removeItem("checkoutDetails");
      localStorage.removeItem("orderAddressDetails");
      message.error("Payment initiation failed. Redirecting...");
      setTimeout(() => { setIsPaymentModalVisible(false); navigate("/order-cancelled"); }, 2000);
    } finally {
      setPayButtonLoading(false);
    }
  };

  // ==================== RENDER HELPERS ====================
  const renderImage = (imagePath) => {
    if (!imagePath) return <div className="co-item-img-placeholder">No Image</div>;
    const imageUrl = `https://ct002.frankotrading.com:444/Media/Products_Images/${imagePath.split("\\").pop()}`;
    return (
      <img src={imageUrl} alt="Product" className="co-item-img"
        onError={(e) => { e.target.style.display = "none"; if (e.target.nextSibling) e.target.nextSibling.style.display = "flex"; }} />
    );
  };

  const getServiceChargeLabel = () =>
    calculateTotalAmount() > 2000 ? "Momo Service Charge:" : "Momo Service Charge (1%):";

  const formatAutoCheckTime = (seconds) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  // ==================== EMPTY CART ====================
  if (!cartItems || cartItems.length === 0) {
    return (
      <>
        <style>{checkoutStyles}</style>
        <div className="co-root">
          <div className="co-container">
            <div className="co-empty">
              <div className="co-empty-icon">
                <ShoppingBagIcon style={{ width: 36, height: 36, color: "var(--co-light)" }} />
              </div>
              <div className="co-empty-title">Your cart is empty</div>
              <div className="co-empty-desc">Add items to your cart to proceed with checkout.</div>
              <button onClick={() => navigate("/")} className="co-btn-primary" style={{ maxWidth: 280 }}>
                Continue Shopping
              </button>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ==================== MAIN RENDER ====================
  return (
    <>
      <style>{checkoutStyles}</style>

      <div className="co-root">
        {loading && (
          <div className="co-loading-overlay">
            <div className="co-loading-card">
              <div className="co-spinner" />
              <div className="co-loading-text">Processing your order…</div>
            </div>
          </div>
        )}

        <div className="co-container">
          {/* Page Header */}
          <div className="co-page-header">
            <div className="co-page-header-accent" />
            <div>
              <h1 className="co-page-title">Checkout</h1>
              <p className="co-page-count">{cartItems.length} item{cartItems.length !== 1 ? "s" : ""} in cart</p>
            </div>
            <div className="co-page-header-line" />
          </div>

          <div className="co-layout">
            {/* ══════ BILLING INFO ══════ */}
            <div className="co-sidebar">
              <div className="co-card">
                <div className="co-card-header">
                  <h3 className="co-card-title">Billing Information</h3>
                  <div className="co-section-accent">
                    <div className="co-section-accent-bar" />
                    <div className="co-section-accent-line" />
                  </div>
                </div>
                <div className="co-card-body">
                  <div className="co-toggle-wrap" onClick={() => setIsDifferentRecipient((v) => !v)}>
                    <div className="co-toggle-left">
                      <UserIcon style={{ width: 16, height: 16, color: "var(--co-light)" }} />
                      <span>Different recipient?</span>
                    </div>
                    <div className={`co-toggle-track ${isDifferentRecipient ? "co-toggle-track-on" : "co-toggle-track-off"}`}>
                      <div className={`co-toggle-knob ${isDifferentRecipient ? "co-toggle-knob-on" : ""}`} />
                    </div>
                  </div>

                  {isDifferentRecipient && (
                    <div className="co-warning-banner">
                      <ExclamationTriangleIcon style={{ width: 16, height: 16, color: "#d97706", flexShrink: 0, marginTop: 1 }} />
                      <p>Enter the recipient's name and contact number below.</p>
                    </div>
                  )}

                  <CheckoutForm
                    customerName={customerName} setCustomerName={setCustomerName}
                    customerNumber={customerNumber} setCustomerNumber={setCustomerNumber}
                    deliveryInfo={deliveryInfo} setDeliveryInfo={setDeliveryInfo}
                    orderNote={orderNote} setOrderNote={setOrderNote}
                    locations={locations} customerAccountType={customerAccountType}
                    firstName={customerData?.firstName || "Guest"}
                    isDifferentRecipient={isDifferentRecipient}
                    readOnlyRecipient={!isDifferentRecipient}
                  />
                </div>
              </div>
            </div>

            {/* ══════ ORDER SUMMARY ══════ */}
            <div className="co-main">
              <div className="co-card">
                <div className="co-card-header">
                  <h3 className="co-card-title">Order Summary</h3>
                  <div className="co-section-accent">
                    <div className="co-section-accent-bar" />
                    <div className="co-section-accent-line" />
                  </div>
                </div>
                <div className="co-card-body">
                  {/* Cart Items */}
                  <div className="co-items-list">
                    {cartItems.map((item, index) => {
                      const unitPrice = getItemUnitPrice(item);
                      const qty = getItemQuantity(item);
                      const lineTotal = unitPrice * qty;
                      return (
                        <div key={item.productId || index} className="co-item">
                          <div className="co-item-left">
                            <div style={{ position: "relative" }}>
                              {renderImage(item.imagePath)}
                              <div className="co-item-img-placeholder" style={{ display: "none" }}>No Image</div>
                            </div>
                            <div className="co-item-info">
                              <p className="co-item-name">{item.productName || "Product"}</p>
                              <p className="co-item-unit">Unit: {formatGHS(unitPrice)}</p>
                              <span className="co-item-qty">Qty {qty}</span>
                            </div>
                          </div>
                          <span className="co-item-price">{formatGHS(lineTotal)}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Totals */}
                  <div className="co-totals">
                    <div className="co-total-row">
                      <span className="co-total-row-label">Subtotal</span>
                      <span className="co-total-row-value">{formatGHS(calculateSubtotal())}</span>
                    </div>

                    <div className="co-total-row">
                      <span className="co-total-row-label">Shipping Fee</span>
                      {isFreeDelivery ? (
                        <span className="co-total-row-free">FREE DELIVERY</span>
                      ) : isNADelivery ? (
                        <span className="co-total-row-warning">{isAgent ? "Agent delivery" : "Delivery charges apply"}</span>
                      ) : deliveryFee > 0 ? (
                        <span className="co-total-row-value">{formatGHS(deliveryFee)}</span>
                      ) : (
                        <span className="co-total-row-warning">Select location</span>
                      )}
                    </div>

                    {paymentMethod === "Mobile Money" && (
                      <div className="co-service-charge">
                        <span>{getServiceChargeLabel()}</span>
                        <span>{formatGHS(calculateServiceCharge())}</span>
                      </div>
                    )}

                    <div className="co-grand-total">
                      <span className="co-grand-total-label">Total Amount</span>
                      <span className="co-grand-total-value">
                        {paymentMethod === "Mobile Money"
                          ? formatGHS(calculateDisplayTotalWithCharge())
                          : formatGHS(calculateTotalAmount())}
                      </span>
                    </div>

                    {paymentMethod === "Mobile Money" && (
                      <p className="co-charge-note">* Service charge is applied by your mobile money provider.</p>
                    )}
                  </div>

                  <Divider style={{ margin: "20px 0" }} />

                  {/* Payment Method */}
                  <div className="co-payment-section">
                    <p className="co-payment-title">Payment Method</p>
                    <Radio.Group value={paymentMethod} onChange={handlePaymentMethodChange} style={{ width: "100%" }}>
                      <div className="co-payment-options">
                        {(isAgent || isFreeDelivery || (deliveryFee > 0 && !isNADelivery)) && (
                          <label className={`co-payment-option ${paymentMethod === "Cash on Delivery" ? "co-payment-option-active" : ""}`}>
                            <Radio value="Cash on Delivery" />
                            <span className="co-payment-option-text">Cash on Delivery</span>
                          </label>
                        )}
                        {!isAgent && (
                          <label className={`co-payment-option ${paymentMethod === "Mobile Money" ? "co-payment-option-active" : ""}`}>
                            <Radio value="Mobile Money" />
                            <span className="co-payment-option-text">Mobile Money</span>
                          </label>
                        )}
                        {isAgent && (
                          <>
                            <label className={`co-payment-option ${paymentMethod === "Pick Up" ? "co-payment-option-active" : ""}`}>
                              <Radio value="Pick Up" />
                              <span className="co-payment-option-text">Pick Up</span>
                            </label>
                            <label className={`co-payment-option ${paymentMethod === "Paid Already" ? "co-payment-option-active" : ""}`}>
                              <Radio value="Paid Already" />
                              <span className="co-payment-option-text">Paid Already</span>
                            </label>
                          </>
                        )}
                      </div>
                    </Radio.Group>
                  </div>

                  {/* Desktop Place Order */}
                  <div className="co-desktop-btn">
                    <button onClick={handleCheckout} disabled={loading} className="co-btn-primary">
                      {loading ? (
                        <><div className="co-spinner" style={{ width: 20, height: 20, borderWidth: 3 }} /> Processing Order...</>
                      ) : (
                        <><ShoppingBagIcon style={{ width: 20, height: 20 }} /> Place Order</>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sticky Mobile Button */}
        <div className="co-sticky-bottom">
          <button onClick={handleCheckout} disabled={loading} className="co-btn-primary">
            {loading ? (
              <><div className="co-spinner" style={{ width: 20, height: 20, borderWidth: 3 }} /> Processing...</>
            ) : (
              <><ShoppingBagIcon style={{ width: 20, height: 20 }} /> Place Order</>
            )}
          </button>
        </div>

        {/* ══════ GUEST WARNING ══════ */}
        <Modal open={isGuestWarningVisible} onCancel={() => setIsGuestWarningVisible(false)} centered footer={null} width={400} className="co-modal">
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "16px 0", gap: 16 }}>
            <div className="co-dialog-icon co-dialog-icon-warning">
              <ExclamationTriangleIcon style={{ width: 28, height: 28, color: "#f59e0b" }} />
            </div>
            <div>
              <div className="co-dialog-title">Real name required</div>
              <div className="co-dialog-desc">Please enter your actual full name before placing an order.</div>
            </div>
            <button onClick={() => setIsGuestWarningVisible(false)} className="co-btn-primary" style={{ maxWidth: 280 }}>
              OK, I'll update my name
            </button>
          </div>
        </Modal>

        {/* ══════ VALIDATION MODAL ══════ */}
        <Modal
          title={<div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--co-red)", fontFamily: "var(--co-font)", fontWeight: 800 }}>
            <ExclamationTriangleIcon style={{ width: 18, height: 18 }} /> Complete Required Fields
          </div>}
          open={isValidationModalVisible} onCancel={() => setIsValidationModalVisible(false)} centered className="co-modal"
          footer={[<button key="ok" onClick={() => setIsValidationModalVisible(false)} className="co-btn-primary" style={{ maxWidth: 140, margin: "0 auto" }}>Got It</button>]}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8, marginTop: 12 }}>
            <p style={{ fontSize: 13, color: "var(--co-light)", marginBottom: 4 }}>Please fill in the following:</p>
            {validateRequiredFields().map((error, index) => {
              const icons = { name: UserIcon, phone: PhoneIcon, address: MapPinIcon, payment: CreditCardIcon };
              const labels = { name: "Recipient Name", phone: "Contact Number", address: "Delivery Address", payment: "Payment Method" };
              const Icon = icons[error.field] || ExclamationTriangleIcon;
              return (
                <div key={index} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 12px", background: "#fef2f2", border: "1px solid #fecaca", borderRadius: "var(--co-radius)" }}>
                  <Icon style={{ width: 16, height: 16, color: "#ef4444", flexShrink: 0 }} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: "#991b1b" }}>{labels[error.field]}</span>
                </div>
              );
            })}
          </div>
        </Modal>

        {/* ══════ PAYMENT MODAL ══════ */}
        {!isAgent && (
          <Modal
            open={isPaymentModalVisible}
            onCancel={() => {
              if (paymentStatus === "input") {
                if (initialDelayRef.current) clearTimeout(initialDelayRef.current);
                if (pollingRef.current) clearInterval(pollingRef.current);
                if (countdownRef.current) clearInterval(countdownRef.current);
                setIsPaymentModalVisible(false);
                setPaymentStatus("idle");
              }
            }}
            footer={null} closable={paymentStatus === "input"} centered width={500}
            styles={{ body: { padding: "16px 20px" } }} className="co-modal"
          >
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Header */}
              <div className="co-pay-header">
                <img src={frankoLogo} alt="Franko" className="co-pay-logo" onError={(e) => { e.target.style.display = "none"; }} />
                <p className="co-pay-company">Franko Trading Limited</p>
              </div>

              {/* Amount */}
              <div className="co-pay-amount-card">
                <p className="co-pay-amount-label">You will be charged</p>
                <p className="co-pay-amount-value">{formatGHS(calculateDisplayTotalWithCharge())}</p>
                <p className="co-pay-ref">Ref: {currentOrderId}</p>
              </div>

              {/* INPUT */}
              {paymentStatus === "input" && (
                <>
                  <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                    <div className="co-pay-field">
                      <label className="co-pay-field-label">
                        <span className="co-pay-step-num">1</span>
                        Mobile Money Number
                      </label>
                      <Input placeholder="233XXXXXXXXX" value={momoNumber} onChange={handleMomoNumberChange}
                        prefix={<PhoneIcon style={{ width: 16, height: 16, color: "#888" }} />}
                        size="large" maxLength={12} style={{ fontSize: 16, fontWeight: 700, borderRadius: "var(--co-radius)" }} />
                      <div className="co-pay-validation">
                        {startsWithZeroAfter233() && <span className="co-pay-validation-error">Do not begin with 0 after 233</span>}
                        {momoNumber.length === 12 && !isValidMomoNumber() && !startsWithZeroAfter233() && (
                          <span className="co-pay-validation-error">Please enter a valid 9-digit number after 233</span>
                        )}
                        {isValidMomoNumber() && (
                          <span className="co-pay-validation-ok">
                            <CheckCircleIcon style={{ width: 14, height: 14 }} /> Valid number
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="co-pay-field">
                      <label className="co-pay-field-label">
                        <span className="co-pay-step-num">2</span>
                        Select Network
                      </label>
                      <Radio.Group value={selectedNetwork} onChange={(e) => setSelectedNetwork(e.target.value)} style={{ width: "100%" }}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {[
                            { value: "mtn", logo: mtnLogo, name: "MTN", sub: "Mobile Money", activeBg: "#fffbeb", activeBorder: "#fcd34d", checkColor: "#d97706" },
                            { value: "vodafone", logo: vodafoneLogo, name: "Vodafone", sub: "Vodafone Cash", activeBg: "#fff1f2", activeBorder: "#fecdd3", checkColor: "#e11d48" },
                            { value: "airteltigo", logo: airteltigoLogo, name: "AirtelTigo", sub: "AirtelTigo Money", activeBg: "#eff6ff", activeBorder: "#bfdbfe", checkColor: "#2563eb" },
                          ].map((net) => (
                            <label key={net.value} className="co-network-option"
                              style={selectedNetwork === net.value ? { background: net.activeBg, borderColor: net.activeBorder } : {}}>
                              <Radio value={net.value} />
                              <div style={{ display: "flex", alignItems: "center", gap: 12, marginLeft: 8, flex: 1 }}>
                                <img src={net.logo} alt={net.name} className="co-network-logo" onError={(e) => { e.target.style.display = "none"; }} />
                                <div>
                                  <p className="co-network-name">{net.name}</p>
                                  <p className="co-network-sub">{net.sub}</p>
                                </div>
                              </div>
                              {selectedNetwork === net.value && <CheckCircleSolid style={{ width: 20, height: 20, color: net.checkColor }} />}
                            </label>
                          ))}
                        </div>
                      </Radio.Group>
                    </div>
                  </div>

                  <button onClick={handlePayNow} disabled={!isValidMomoNumber() || !selectedNetwork || payButtonLoading} className="co-btn-primary">
                    {payButtonLoading ? (
                      <><div className="co-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Sending request…</>
                    ) : (
                      <><CreditCardIcon style={{ width: 18, height: 18 }} /> Pay {formatGHS(calculateDisplayTotalWithCharge())}</>
                    )}
                  </button>

                  <div className="co-pay-info-box">
                    <p className="co-pay-info-title">What happens next?</p>
                    <ol className="co-pay-info-list">
                      <li>You'll receive a payment prompt on your phone</li>
                      <li>Enter your MoMo PIN to approve the payment</li>
                      <li>We check for confirmation every 5 seconds</li>
                      <li>Your order processes immediately after payment</li>
                    </ol>
                  </div>
                </>
              )}

              {/* PENDING */}
              {paymentStatus === "pending" && (
                <div style={{ textAlign: "center", padding: "16px 0", display: "flex", flexDirection: "column", gap: 16 }}>
                  <div className="co-pending-spinner">
                    <div className="co-pending-ring" />
                    <div className="co-pending-ring-active" />
                    <div className="co-pending-icon">
                      <PhoneIcon style={{ width: 28, height: 28, color: "var(--co-green-600)" }} />
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: 17, fontWeight: 900, color: "var(--co-dark)" }}>Awaiting Approval</p>
                    <p style={{ fontSize: 14, color: "var(--co-light)", marginTop: 4 }}>Approve the payment prompt on your phone</p>
                  </div>
                  <div className="co-pending-details">
                    <div className="co-pending-detail-row">
                      <span className="co-pending-detail-label">Number</span>
                      <span className="co-pending-detail-value">{momoNumber}</span>
                    </div>
                    <div className="co-pending-detail-row">
                      <span className="co-pending-detail-label">Network</span>
                      <span className="co-pending-detail-value">{selectedNetwork?.toUpperCase()}</span>
                    </div>
                    <div className="co-pending-detail-row">
                      <span className="co-pending-detail-label">Amount</span>
                      <span className="co-pending-detail-amount">{formatGHS(calculateDisplayTotalWithCharge())}</span>
                    </div>
                  </div>
                  <div className="co-progress-bar">
                    <div className="co-progress-bar-top">
                      <span className="co-progress-bar-label">Checking for payment…</span>
                      <span className="co-progress-bar-count">{timeoutCountdown}s</span>
                    </div>
                    <div className="co-progress-track">
                      <div className="co-progress-fill" style={{ width: `${(timeoutCountdown / 60) * 100}%` }} />
                    </div>
                  </div>
                </div>
              )}

              {/* SUCCESS */}
              {paymentStatus === "success" && (
                <div className="co-result-state">
                  <div className="co-result-icon co-result-icon-success">
                    <CheckCircleSolid style={{ width: 40, height: 40, color: "var(--co-green-600)" }} />
                  </div>
                  <p className="co-result-title co-result-title-success">Payment Confirmed!</p>
                  <p className="co-result-desc">Processing your order now…</p>
                </div>
              )}

              {/* FAILED */}
              {paymentStatus === "failed" && (
                <div className="co-result-state">
                  <div className="co-result-icon co-result-icon-failed">
                    <XCircleIcon style={{ width: 40, height: 40, color: "var(--co-red)" }} />
                  </div>
                  <p className="co-result-title co-result-title-failed">Payment Failed</p>
                  <p className="co-result-desc">Redirecting you…</p>
                  <div className="co-spinner" style={{ width: 24, height: 24, borderWidth: 3, margin: "12px auto 0", borderTopColor: "var(--co-red)" }} />
                </div>
              )}
            </div>
          </Modal>
        )}

        {/* ══════ APPROVAL GUIDE MODAL ══════ */}
        <Modal open={isApprovalGuideVisible} onCancel={undefined} footer={null} closable={false} centered width={520}
          styles={{ body: { padding: "16px 20px", paddingBottom: "100px" } }} className="co-modal">
          {netCfg && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Header */}
              <div className="co-guide-header">
                <div className="co-guide-logo-wrap" style={{ background: netCfg.bg, borderColor: netCfg.border }}>
                  <img src={netCfg.logo} alt={netCfg.label} className="co-guide-logo" onError={(e) => { e.target.style.display = "none"; }} />
                </div>
                <div style={{ flex: 1 }}>
                  <div className="co-guide-badge" style={{ background: netCfg.bg, borderColor: netCfg.border, color: netCfg.color }}>
                    <span className="co-guide-badge-dot" style={{ background: netCfg.color }} />
                    Payment Pending
                  </div>
                  <h3 className="co-guide-title">Approve Your Payment</h3>
                  <p className="co-guide-subtitle">We haven't received confirmation yet. Please approve manually.</p>
                </div>
              </div>

              {/* Amount + number */}
              <div className="co-guide-info-row" style={{ background: netCfg.bg, borderColor: netCfg.border }}>
                <div>
                  <p className="co-guide-info-label">Amount Due</p>
                  <p className="co-guide-info-value" style={{ color: netCfg.color, fontSize: 20 }}>{formatGHS(calculateDisplayTotalWithCharge())}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p className="co-guide-info-label">Number</p>
                  <p className="co-guide-info-value" style={{ color: "var(--co-dark)", fontSize: 13 }}>{momoNumber}</p>
                </div>
              </div>

              {/* USSD */}
              <div className="co-guide-ussd-row" style={{ background: netCfg.bg, borderColor: netCfg.border }}>
                <div className="co-guide-ussd-icon" style={{ background: `${netCfg.color}15` }}>
                  <PhoneIcon style={{ width: 16, height: 16, color: netCfg.color }} />
                </div>
                <div style={{ flex: 1 }}>
                  <p className="co-guide-ussd-label" style={{ color: netCfg.color }}>Quick Dial</p>
                  <p className="co-guide-ussd-value" style={{ color: netCfg.color }}>{netCfg.ussd}</p>
                </div>
                <ArrowPathIcon style={{ width: 16, height: 16, color: "var(--co-light)" }} />
              </div>

              {/* Steps */}
              <div className="co-guide-steps-wrap">
                <div className="co-guide-steps-header">
                  <p className="co-guide-steps-title">Step-by-step approval</p>
                  <span className="co-guide-steps-count" style={{ background: netCfg.bg, borderColor: netCfg.border, color: netCfg.color }}>
                    {netCfg.steps.length} steps
                  </span>
                </div>
                <div className="co-guide-steps-body">
                  {netCfg.steps.map((step, idx) => {
                    const isLast = idx === netCfg.steps.length - 1;
                    return (
                      <div key={idx} className="co-guide-step">
                        <div className="co-guide-step-col">
                          <div className="co-guide-step-num" style={{ background: isLast ? netCfg.color : "#059669" }}>{step.num}</div>
                          {!isLast && <div className="co-guide-step-line" />}
                        </div>
                        <p className={`co-guide-step-text ${isLast ? "co-guide-step-text-last" : ""}`}
                          style={isLast ? { color: netCfg.color } : {}}>
                          {step.text}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Tip */}
              <div className="co-guide-tip">
                <div className="co-guide-tip-icon">💡</div>
                <p className="co-guide-tip-text">{netCfg.tip}</p>
              </div>

              {/* Auto-check countdown */}
              {autoCheckCountdown > 0 && (
                <div className="co-auto-check-bar">
                  <span className="co-auto-check-label">Auto-checking payment in</span>
                  <span className="co-auto-check-time">{formatAutoCheckTime(autoCheckCountdown)}</span>
                </div>
              )}

              {/* Desktop buttons */}
              <div className="co-guide-desktop-actions">
                <button onClick={handleManualConfirm} disabled={verifyingPayment} className="co-btn-primary">
                  {verifyingPayment ? (
                    <><div className="co-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Verifying Payment…</>
                  ) : (
                    <><CheckCircleSolid style={{ width: 18, height: 18 }} /> I've Approved — Confirm Payment</>
                  )}
                </button>
                <button onClick={handleCancelFromGuide} disabled={verifyingPayment} className="co-btn-danger">
                  <XCircleIcon style={{ width: 16, height: 16 }} /> Cancel Order
                </button>
              </div>

              {/* Mobile sticky buttons */}
              <div className="co-guide-sticky">
                <button onClick={handleManualConfirm} disabled={verifyingPayment} className="co-btn-primary">
                  {verifyingPayment ? (
                    <><div className="co-spinner" style={{ width: 18, height: 18, borderWidth: 2 }} /> Verifying…</>
                  ) : (
                    <><CheckCircleSolid style={{ width: 18, height: 18 }} /> I've Approved — Confirm</>
                  )}
                </button>
                <button onClick={handleCancelFromGuide} disabled={verifyingPayment} className="co-btn-danger">
                  <XCircleIcon style={{ width: 14, height: 14 }} /> Cancel Order
                </button>
              </div>
            </div>
          )}
        </Modal>

        {/* ══════ ACTION DIALOG ══════ */}
        <PaymentActionDialog
          open={actionDialog.open} mode={actionDialog.mode} verifying={verifyingPayment}
          onRetry={handleDialogRetry} onCancel={handleDialogCancel}
          onClose={() => !verifyingPayment && setActionDialog((d) => ({ ...d, open: false }))}
        />
      </div>
    </>
  );
};

export default Checkout;