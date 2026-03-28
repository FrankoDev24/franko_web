import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import {
  createCustomer,
  loginCustomer,
  setCurrentCustomer,
} from "../Redux/Slice/customerSlice";
import { v4 as uuidv4 } from "uuid";
import logo from "../assets/frankoIcon.png";
import {
  XMarkIcon,
  UserIcon,
  LockClosedIcon,
  PhoneIcon,
  EnvelopeIcon,
  HomeIcon,
  EyeIcon,
  EyeSlashIcon,
  ArrowRightIcon,
  UserGroupIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { User, UserPlus, UserCheck } from "lucide-react";

/* ===========================
   Notification Component
=========================== */

const Notification = ({ message, type, isVisible, onClose }) => {
  const timeoutRef = useRef(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    },
    []
  );

  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (isVisible && message) {
      timeoutRef.current = setTimeout(() => {
        onClose();
      }, 4000);
    }
  }, [isVisible, message, onClose]);

  if (!isVisible || !message) return null;

  return (
    <div className="auth-notif-wrap">
      <div className={`auth-notif ${type === "success" ? "auth-notif-ok" : "auth-notif-err"}`}>
        <div className="auth-notif-icon">
          {type === "success" ? (
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                clipRule="evenodd"
              />
            </svg>
          ) : (
            <svg width="18" height="18" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>
        <span className="auth-notif-msg">{message}</span>
        <button onClick={onClose} className="auth-notif-close">×</button>
      </div>
    </div>
  );
};

/* ===========================
   Custom Input Component
=========================== */

const AuthInput = ({ icon: Icon, type = "text", placeholder, name, value, onChange, isPassword }) => {
  const [showPw, setShowPw] = useState(false);
  const inputType = isPassword ? (showPw ? "text" : "password") : type;

  return (
    <div className="auth-field">
      <div className="auth-field-icon">
        <Icon style={{ width: 16, height: 16 }} />
      </div>
      <input
        type={inputType}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        className="auth-field-input"
        autoComplete={isPassword ? "current-password" : "off"}
      />
      {isPassword && (
        <button
          type="button"
          onClick={() => setShowPw((p) => !p)}
          className="auth-field-eye"
        >
          {showPw ? (
            <EyeSlashIcon style={{ width: 16, height: 16 }} />
          ) : (
            <EyeIcon style={{ width: 16, height: 16 }} />
          )}
        </button>
      )}
    </div>
  );
};

/* ===========================
   AuthModal
=========================== */

const AuthModal = ({ open, onClose, onSuccess }) => {
  const dispatch = useDispatch();

  const [authMode, setAuthMode] = useState("signup");
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    message: "",
    type: "success",
    isVisible: false,
  });

  const [signupData, setSignupData] = useState({
    customerAccountNumber: "",
    firstName: "",
    lastName: "",
    contactNumber: "",
    address: "",
    password: "",
    accountType: "customer",
    email: "",
    accountStatus: "1",
  });

  const [loginData, setLoginData] = useState({
    contactNumber: "",
    password: "",
  });

  const [guestData, setGuestData] = useState({
    contactNumber: "",
  });

  const generateCustomerAccountNumber = () => uuidv4();

  const hideNotification = useCallback(
    () => setNotification((prev) => ({ ...prev, isVisible: false })),
    []
  );

  const showNotification = useCallback((message, type = "success") => {
    setNotification({ message: "", type: "success", isVisible: false });
    requestAnimationFrame(() => {
      setNotification({ message, type, isVisible: true });
    });
  }, []);

  useEffect(() => {
    if (open && authMode === "signup") {
      setSignupData((prev) => ({
        ...prev,
        customerAccountNumber: generateCustomerAccountNumber(),
      }));
    }
  }, [open, authMode]);

  const handleEscapeKey = useCallback(
    (e) => {
      if (e.key === "Escape" && open) onClose();
    },
    [open, onClose]
  );

  useEffect(() => {
    document.addEventListener("keydown", handleEscapeKey);
    return () => document.removeEventListener("keydown", handleEscapeKey);
  }, [handleEscapeKey]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const handleGuestChange = (e) => {
    const { name, value } = e.target;
    setGuestData((prev) => ({ ...prev, [name]: value }));
  };

  const normalizePhone = (value = "") => value.replace(/\D/g, "");

  const validateSignupForm = () => {
    const { firstName, lastName, contactNumber, password } = signupData;
    const normalizedContact = normalizePhone(contactNumber);

    if (!firstName.trim()) { showNotification("First name is required", "error"); return false; }
    if (!lastName.trim()) { showNotification("Last name is required", "error"); return false; }
    if (!normalizedContact) { showNotification("Contact number is required", "error"); return false; }
    if (normalizedContact.length !== 10) { showNotification("Contact number must be exactly 10 digits", "error"); return false; }
    if (!password.trim()) { showNotification("Password is required", "error"); return false; }
    if (password.length < 6) { showNotification("Password must be at least 6 characters long", "error"); return false; }
    return true;
  };

  const validateLoginForm = () => {
    const { contactNumber, password } = loginData;
    const normalizedContact = normalizePhone(contactNumber);

    if (!normalizedContact) { showNotification("Contact number is required", "error"); return false; }
    if (normalizedContact.length !== 10) { showNotification("Contact number must be exactly 10 digits", "error"); return false; }
    if (!password.trim()) { showNotification("Password is required", "error"); return false; }
    return true;
  };

  const validateGuestForm = () => {
    const { contactNumber } = guestData;
    const normalizedContact = normalizePhone(contactNumber);

    if (!normalizedContact) { showNotification("Contact number is required", "error"); return false; }
    if (normalizedContact.length !== 10) { showNotification("Contact number must be exactly 10 digits", "error"); return false; }
    return true;
  };

  /* ===========================
     SIGNUP
  ============================ */

  const handleSignup = async () => {
    if (!validateSignupForm()) return;
    setLoading(true);

    try {
      let result = await dispatch(createCustomer(signupData)).unwrap();

      if (typeof result === "string") {
        try { result = JSON.parse(result); } catch { /* leave as is */ }
      }

      if (result && typeof result === "object" && "ResponseCode" in result) {
        if (result.ResponseCode === "2") {
          const message = result.ResponseMessage || "Account already exists";
          showNotification(`${message}. Please login with your existing account.`, "error");
          setTimeout(() => {
            setAuthMode("login");
            setLoginData((prev) => ({ ...prev, contactNumber: signupData.contactNumber }));
          }, 2500);
          return;
        }
        if (result.ResponseCode && result.ResponseCode !== "1" && result.ResponseCode !== "0") {
          showNotification(result.ResponseMessage || "Registration failed", "error");
          return;
        }
      }

      const customer =
        result && typeof result === "object" && result.customerAccountNumber
          ? result
          : { ...signupData, ...(result || {}) };

      dispatch(setCurrentCustomer(customer));
      try { localStorage.setItem("customer", JSON.stringify(customer)); } catch (e) { console.warn("Failed to write customer to localStorage:", e); }

      try {
        if (typeof window.fbq === "function") {
          window.fbq("track", "CompleteRegistration", { content_name: "Customer Registration", status: "success", currency: "GHS", email: signupData.email, customer_type: "registered", contact_number: signupData.contactNumber });
        }
        if (typeof window.gtag === "function") {
          window.gtag("event", "sign_up", { method: "email", customer_type: "registered", contact_number: signupData.contactNumber });
        }
      } catch { /* silent */ }

      showNotification("Registration successful!", "success");
      setTimeout(() => { if (onSuccess && typeof onSuccess === "function") onSuccess(); else onClose(); }, 1500);
    } catch (error) {
      console.error("Registration error:", error);
      let errorMessage = "Registration failed. Please try again.";
      if (error?.message) errorMessage = error.message;
      else if (error?.response?.data?.message) errorMessage = error.response.data.message;
      else if (error?.response?.data?.error) errorMessage = error.response.data.error;
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  /* ===========================
     LOGIN
  ============================ */

  const handleLogin = async () => {
    if (!validateLoginForm()) return;
    setLoading(true);

    try {
      const customer = await dispatch(loginCustomer(loginData)).unwrap();

      if (!customer || !customer.contactNumber) {
        showNotification("No customer found with the provided contact number.", "error");
        return;
      }

      dispatch(setCurrentCustomer(customer));
      try { localStorage.setItem("customer", JSON.stringify(customer)); } catch (e) { console.warn("Failed to write customer to localStorage:", e); }

      showNotification("Login successful!", "success");
      setTimeout(() => { if (onSuccess && typeof onSuccess === "function") onSuccess(); else onClose(); }, 1500);
    } catch (error) {
      console.error("Login error:", error);
      const message = error?.response?.data?.message || error?.message || "Login failed. Please check your credentials.";
      showNotification(message, "error");
    } finally {
      setLoading(false);
    }
  };

  /* ===========================
     GUEST
  ============================ */

  const handleGuestContinue = async () => {
    if (!validateGuestForm()) return;
    setLoading(true);

    const guestCustomerData = {
      customerAccountNumber: generateCustomerAccountNumber(),
      firstName: "Guest",
      lastName: guestData.contactNumber.slice(-4),
      contactNumber: guestData.contactNumber,
      address: "Guest Address",
      password: guestData.contactNumber,
      accountType: "customer",
      email: `guest${guestData.contactNumber}@franko.com`,
      accountStatus: "1",
      isGuest: true,
      createdAt: new Date().toISOString(),
      guestCreatedAt: new Date().toISOString(),
    };

    let dbResult;

    try {
      dbResult = await dispatch(createCustomer(guestCustomerData)).unwrap();
    } catch (error) {
      setLoading(false);
      let errorMessage = "Failed to create guest account. Please try again.";
      if (error?.message) errorMessage = error.message;
      else if (error?.response?.data?.message) errorMessage = error.response.data.message;
      else if (error?.response?.data?.error) errorMessage = error.response.data.error;
      showNotification(errorMessage, "error");
      return;
    }

    if (typeof dbResult === "string") {
      try { dbResult = JSON.parse(dbResult); } catch { /* leave as is */ }
    }

    if (dbResult && typeof dbResult === "object" && "ResponseCode" in dbResult) {
      if (dbResult.ResponseCode === "2") {
        setLoading(false);
        const message = dbResult.ResponseMessage || "Account already exists";
        showNotification(`${message}. Please login with your existing account.`, "error");
        setTimeout(() => {
          setAuthMode("login");
          setLoginData((prev) => ({ ...prev, contactNumber: guestData.contactNumber }));
        }, 2500);
        return;
      }
      if (dbResult.ResponseCode && dbResult.ResponseCode !== "1" && dbResult.ResponseCode !== "0") {
        setLoading(false);
        showNotification(dbResult.ResponseMessage || "Failed to create guest account", "error");
        return;
      }
    }

    const guestCustomer =
      dbResult && typeof dbResult === "object" && dbResult.customerAccountNumber
        ? dbResult
        : { ...guestCustomerData, ...(dbResult || {}) };

    dispatch(setCurrentCustomer(guestCustomer));
    try { localStorage.setItem("customer", JSON.stringify(guestCustomer)); } catch (e) { console.warn("Failed to write guest customer to localStorage:", e); }

    try {
      if (typeof window.fbq === "function") {
        window.fbq("track", "CompleteRegistration", { content_name: "Guest Registration", status: "success", currency: "GHS", email: guestCustomer.email, customer_type: "guest", contact_number: guestCustomer.contactNumber });
      }
      if (typeof window.gtag === "function") {
        window.gtag("event", "sign_up", { method: "guest", customer_type: "guest", contact_number: guestCustomer.contactNumber });
      }
    } catch { /* silent */ }

    setLoading(false);
    showNotification("Guest account created!", "success");
    setTimeout(() => { if (onSuccess && typeof onSuccess === "function") onSuccess(); else onClose(); }, 1500);
  };

  /* ===========================
     UI helpers
  ============================ */

  useEffect(() => { hideNotification(); }, [authMode, hideNotification]);

  useEffect(() => {
    if (!open) {
      hideNotification();
      setAuthMode("signup");
    }
  }, [open, hideNotification]);

  const handleMainAction = () => {
    if (authMode === "login") return handleLogin();
    if (authMode === "signup") return handleSignup();
    if (authMode === "guest") return handleGuestContinue();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !loading) handleMainAction();
  };

  if (!open) return null;

  const tabs = [
    { key: "login", label: "Sign In", icon: User },
    { key: "signup", label: "Register", icon: UserPlus },
    { key: "guest", label: "Guest", icon: UserCheck },
  ];

  return (
    <>
      <style>{`
        .auth-overlay {
          position: fixed;
          inset: 0;
          z-index: 9998;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: auth-fade-in 0.2s ease;
        }

        @keyframes auth-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .auth-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }

        .auth-modal {
          position: relative;
          background: #fff;
          border-radius: 8px;
          width: 100%;
          max-width: 420px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.05);
          animation: auth-modal-in 0.25s ease;
          overflow: hidden;
          font-family: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          max-height: 90vh;
          overflow-y: auto;
        }

        .auth-modal::-webkit-scrollbar { width: 3px; }
        .auth-modal::-webkit-scrollbar-thumb { background: #ddd; border-radius: 2px; }

        @keyframes auth-modal-in {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .auth-close {
          position: absolute;
          top: 12px;
          right: 12px;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #eee;
          border-radius: 6px;
          background: #fff;
          cursor: pointer;
          transition: all 0.15s;
          z-index: 2;
        }

        .auth-close:hover { background: #f5f5f5; border-color: #ddd; }
        .auth-close:active { transform: scale(0.95); }

        .auth-header {
          padding: 28px 28px 0;
          text-align: center;
        }

        .auth-logo {
          height: 42px;
          width: auto;
          margin-bottom: 8px;
        }

        .auth-title {
          font-size: 20px;
          font-weight: 700;
          color: #1a1a1a;
          margin: 0 0 2px;
          letter-spacing: -0.02em;
          font-family: inherit;
        }

        .auth-subtitle {
          font-size: 13px;
          color: #888;
          font-weight: 450;
          margin: 0;
          font-family: inherit;
        }

        .auth-tabs {
          display: flex;
          margin: 20px 28px 0;
          background: #f7f7f7;
          border-radius: 6px;
          padding: 3px;
          gap: 2px;
        }

        .auth-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          padding: 9px 8px;
          font-size: 12.5px;
          font-weight: 600;
          color: #888;
          border: none;
          background: none;
          cursor: pointer;
          border-radius: 5px;
          transition: all 0.2s ease;
          font-family: inherit;
          white-space: nowrap;
        }

        .auth-tab:hover:not(.auth-tab-on) {
          color: #555;
          background: rgba(255, 255, 255, 0.5);
        }

        .auth-tab-on {
          background: #fff;
          color: #14532d;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        .auth-body {
          padding: 24px 28px;
        }

        .auth-fields {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .auth-field-row {
          display: flex;
          gap: 10px;
        }

        .auth-field-row .auth-field {
          flex: 1;
        }

        .auth-field {
          display: flex;
          align-items: center;
          border: 1.5px solid #e0e0e0;
          border-radius: 6px;
          background: #fff;
          height: 42px;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .auth-field:focus-within {
          border-color: #22c55e;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.1);
        }

        .auth-field-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 40px;
          height: 100%;
          color: #b0b0b0;
          flex-shrink: 0;
          transition: color 0.2s;
        }

        .auth-field:focus-within .auth-field-icon {
          color: #22c55e;
        }

        .auth-field-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 13.5px;
          font-weight: 450;
          color: #1a1a1a;
          background: transparent;
          height: 100%;
          padding-right: 12px;
          font-family: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .auth-field-input::placeholder {
          color: #b0b0b0;
          font-weight: 400;
        }

        .auth-field-eye {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 38px;
          height: 100%;
          border: none;
          background: none;
          color: #b0b0b0;
          cursor: pointer;
          flex-shrink: 0;
          transition: color 0.15s;
        }

        .auth-field-eye:hover { color: #555; }

        .auth-btn {
          width: 100%;
          height: 44px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 8px;
          border: none;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s ease;
          font-family: inherit;
          letter-spacing: -0.01em;
        }

        .auth-btn-primary {
          background: linear-gradient(135deg, #14532d 0%, #166534 100%);
          color: #fff;
          box-shadow: 0 2px 8px rgba(20, 83, 45, 0.25);
        }

        .auth-btn-primary:hover:not(:disabled) {
          background: linear-gradient(135deg, #166534 0%, #14532d 100%);
          box-shadow: 0 4px 12px rgba(20, 83, 45, 0.35);
          transform: translateY(-1px);
        }

        .auth-btn-primary:active:not(:disabled) {
          transform: translateY(0) scale(0.99);
          box-shadow: 0 1px 4px rgba(20, 83, 45, 0.2);
        }

        .auth-btn-primary:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .auth-btn-guest {
          background: #fff;
          color: #555;
          border: 1.5px solid #e0e0e0;
          box-shadow: none;
          margin-top: 0;
        }

        .auth-btn-guest:hover {
          background: #f7f7f7;
          border-color: #ccc;
          color: #1a1a1a;
        }

        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 18px 0;
        }

        .auth-divider-line {
          flex: 1;
          height: 1px;
          background: #eee;
        }

        .auth-divider-text {
          font-size: 11px;
          font-weight: 600;
          color: #bbb;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          font-family: inherit;
        }

        .auth-footer {
          padding: 0 28px 24px;
          text-align: center;
        }

        .auth-switch {
          font-size: 13px;
          color: #888;
          font-weight: 450;
          font-family: inherit;
        }

        .auth-switch-link {
          color: #14532d;
          font-weight: 600;
          cursor: pointer;
          border: none;
          background: none;
          padding: 0;
          font-size: 13px;
          font-family: inherit;
          text-decoration: none;
          transition: color 0.15s;
          border-bottom: 1px solid transparent;
        }

        .auth-switch-link:hover {
          color: #166534;
          border-bottom-color: #166534;
        }

        .auth-guest-info {
          text-align: center;
          margin-bottom: 16px;
        }

        .auth-guest-icon-wrap {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: linear-gradient(135deg, #dcfce7 0%, #f0fdf4 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 12px;
          border: 2px solid #bbf7d0;
        }

        .auth-guest-title {
          font-size: 15px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0 0 4px;
          font-family: inherit;
        }

        .auth-guest-desc {
          font-size: 12.5px;
          color: #888;
          font-weight: 400;
          margin: 0;
          line-height: 1.5;
          font-family: inherit;
        }

        .auth-spinner {
          width: 18px;
          height: 18px;
          animation: auth-spin 0.8s linear infinite;
        }

        @keyframes auth-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .auth-secure {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          margin-top: 14px;
          font-size: 11px;
          color: #bbb;
          font-weight: 500;
          font-family: inherit;
        }

        .auth-secure svg {
          color: #22c55e;
        }

        /* Notification */
        .auth-notif-wrap {
          position: fixed;
          top: 16px;
          right: 16px;
          z-index: 99999;
          animation: auth-notif-in 0.3s ease;
        }

        @keyframes auth-notif-in {
          from { opacity: 0; transform: translateX(20px); }
          to { opacity: 1; transform: translateX(0); }
        }

        .auth-notif {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 12px 16px;
          border-radius: 8px;
          min-width: 300px;
          max-width: 420px;
          box-shadow: 0 8px 30px rgba(0, 0, 0, 0.15);
          font-family: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .auth-notif-ok {
          background: linear-gradient(135deg, #14532d 0%, #166534 100%);
          color: #fff;
        }

        .auth-notif-err {
          background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
          color: #fff;
        }

        .auth-notif-icon {
          flex-shrink: 0;
          opacity: 0.9;
        }

        .auth-notif-msg {
          flex: 1;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.4;
        }

        .auth-notif-close {
          flex-shrink: 0;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
          width: 22px;
          height: 22px;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 14px;
          font-weight: 700;
          transition: background 0.15s;
          line-height: 1;
        }

        .auth-notif-close:hover { background: rgba(255, 255, 255, 0.35); }

        @media (max-width: 480px) {
          .auth-modal { max-width: 100%; border-radius: 12px 12px 0 0; max-height: 95vh; }
          .auth-overlay { align-items: flex-end; padding: 0; }
          .auth-header { padding: 24px 20px 0; }
          .auth-tabs { margin: 16px 20px 0; }
          .auth-body { padding: 20px; }
          .auth-footer { padding: 0 20px 20px; }
          .auth-field-row { flex-direction: column; gap: 12px; }
        }
      `}</style>

      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />

      <div className="auth-overlay" onClick={onClose}>
        <div className="auth-backdrop" />

        <div className="auth-modal" onClick={(e) => e.stopPropagation()} onKeyDown={handleKeyDown}>
          {/* Close Button */}
          <button className="auth-close" onClick={onClose}>
            <XMarkIcon style={{ width: 14, height: 14, color: "#888" }} />
          </button>

          {/* Header */}
          <div className="auth-header">
            <img src={logo} alt="Franko Trading" className="auth-logo" />
            <h2 className="auth-title">
              {authMode === "login" && "Welcome back"}
              {authMode === "signup" && "Create your account"}
              {authMode === "guest" && "Quick checkout"}
            </h2>
            <p className="auth-subtitle">
              {authMode === "login" && "Sign in to your Franko account"}
              {authMode === "signup" && "Join Franko Trading today"}
              {authMode === "guest" && "Continue without creating an account"}
            </p>
          </div>

          {/* Tabs */}
          <div className="auth-tabs">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setAuthMode(tab.key)}
                  className={`auth-tab ${authMode === tab.key ? "auth-tab-on" : ""}`}
                >
                  <Icon style={{ width: 14, height: 14 }} />
                  {tab.label}
                </button>
              );
            })}
          </div>

          {/* Body */}
          <div className="auth-body">
            {authMode === "login" && (
              <div className="auth-fields">
                <AuthInput
                  icon={PhoneIcon}
                  placeholder="Contact Number"
                  name="contactNumber"
                  value={loginData.contactNumber}
                  onChange={handleLoginChange}
                />
                <AuthInput
                  icon={LockClosedIcon}
                  placeholder="Password"
                  name="password"
                  value={loginData.password}
                  onChange={handleLoginChange}
                  isPassword
                />
                <button
                  disabled={loading}
                  onClick={handleLogin}
                  className="auth-btn auth-btn-primary"
                >
                  {loading ? (
                    <>
                      <ArrowPathIcon className="auth-spinner" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      Sign In
                      <ArrowRightIcon style={{ width: 16, height: 16 }} />
                    </>
                  )}
                </button>
              </div>
            )}

            {authMode === "signup" && (
              <div className="auth-fields">
                <div className="auth-field-row">
                  <AuthInput
                    icon={UserIcon}
                    placeholder="First Name"
                    name="firstName"
                    value={signupData.firstName}
                    onChange={handleSignupChange}
                  />
                  <AuthInput
                    icon={UserIcon}
                    placeholder="Last Name"
                    name="lastName"
                    value={signupData.lastName}
                    onChange={handleSignupChange}
                  />
                </div>
                <AuthInput
                  icon={EnvelopeIcon}
                  type="email"
                  placeholder="Email (optional)"
                  name="email"
                  value={signupData.email}
                  onChange={handleSignupChange}
                />
                <AuthInput
                  icon={PhoneIcon}
                  placeholder="Contact Number"
                  name="contactNumber"
                  value={signupData.contactNumber}
                  onChange={handleSignupChange}
                />
                <AuthInput
                  icon={HomeIcon}
                  placeholder="Address"
                  name="address"
                  value={signupData.address}
                  onChange={handleSignupChange}
                />
                <AuthInput
                  icon={LockClosedIcon}
                  placeholder="Create Password"
                  name="password"
                  value={signupData.password}
                  onChange={handleSignupChange}
                  isPassword
                />
                <button
                  disabled={loading}
                  onClick={handleSignup}
                  className="auth-btn auth-btn-primary"
                >
                  {loading ? (
                    <>
                      <ArrowPathIcon className="auth-spinner" />
                      Creating account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <ArrowRightIcon style={{ width: 16, height: 16 }} />
                    </>
                  )}
                </button>
              </div>
            )}

            {authMode === "guest" && (
              <div className="auth-fields">
                <div className="auth-guest-info">
                  <div className="auth-guest-icon-wrap">
                    <UserGroupIcon style={{ width: 24, height: 24, color: "#14532d" }} />
                  </div>
                  <p className="auth-guest-desc">
                    Enter your phone number to continue. A temporary account will be created for you automatically.
                  </p>
                </div>
                <AuthInput
                  icon={PhoneIcon}
                  placeholder="Enter your contact number"
                  name="contactNumber"
                  value={guestData.contactNumber}
                  onChange={handleGuestChange}
                />
                <button
                  disabled={loading}
                  onClick={handleGuestContinue}
                  className="auth-btn auth-btn-primary"
                >
                  {loading ? (
                    <>
                      <ArrowPathIcon className="auth-spinner" />
                      Setting up...
                    </>
                  ) : (
                    <>
                      Continue as Guest
                      <ArrowRightIcon style={{ width: 16, height: 16 }} />
                    </>
                  )}
                </button>
              </div>
            )}

            {/* Secure badge */}
            <div className="auth-secure">
              <LockClosedIcon style={{ width: 12, height: 12 }} />
              Secured by Franko Trading
            </div>
          </div>

          {/* Footer */}
          <div className="auth-footer">
            {authMode === "login" && (
              <div className="auth-switch">
                Don&apos;t have an account?{" "}
                <button onClick={() => setAuthMode("signup")} className="auth-switch-link">
                  Register here
                </button>
              </div>
            )}
            {authMode === "signup" && (
              <div className="auth-switch">
                Already have an account?{" "}
                <button onClick={() => setAuthMode("login")} className="auth-switch-link">
                  Sign in
                </button>
              </div>
            )}
            {authMode === "guest" && (
              <div className="auth-switch">
                Want full access?{" "}
                <button onClick={() => setAuthMode("signup")} className="auth-switch-link" style={{ marginRight: 4 }}>
                  Register
                </button>
                or{" "}
                <button onClick={() => setAuthMode("login")} className="auth-switch-link">
                  Sign in
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthModal;