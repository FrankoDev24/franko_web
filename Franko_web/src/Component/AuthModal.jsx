import { useState, useEffect, useCallback, useRef, useMemo } from "react";
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
  CheckCircleIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { User, UserPlus, UserCheck } from "lucide-react";

/* ===========================
   Password Strength Utility
=========================== */
const getPasswordStrength = (password) => {
  const checks = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?`~]/.test(password),
  };

  const passedCount = Object.values(checks).filter(Boolean).length;

  let level = "weak";
  let color = "#ef4444";
  let label = "Weak";
  let percent = 20;

  if (passedCount >= 5) {
    level = "strong";
    color = "#16a34a";
    label = "Strong";
    percent = 100;
  } else if (passedCount >= 4) {
    level = "good";
    color = "#22c55e";
    label = "Good";
    percent = 80;
  } else if (passedCount >= 3) {
    level = "fair";
    color = "#f59e0b";
    label = "Fair";
    percent = 60;
  } else if (passedCount >= 2) {
    level = "weak";
    color = "#f97316";
    label = "Weak";
    percent = 40;
  }

  return { checks, passedCount, level, color, label, percent };
};

/* ===========================
   Notification Component
=========================== */
const Notification = ({ message, type, isVisible, onClose }) => {
  const timeoutRef = useRef(null);

  useEffect(
    () => () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    },
    []
  );

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    if (isVisible && message) {
      timeoutRef.current = setTimeout(onClose, 4000);
    }
  }, [isVisible, message, onClose]);

  if (!isVisible || !message) return null;

  return (
    <div className="auth-notif-wrap">
      <div
        className={`auth-notif ${
          type === "success" ? "auth-notif-ok" : "auth-notif-err"
        }`}
      >
        <div className="auth-notif-icon">
          {type === "success" ? (
            <CheckCircleIcon style={{ width: 20, height: 20 }} />
          ) : (
            <ExclamationCircleIcon style={{ width: 20, height: 20 }} />
          )}
        </div>
        <span className="auth-notif-msg">{message}</span>
        <button onClick={onClose} className="auth-notif-close">
          ×
        </button>
      </div>
    </div>
  );
};

/* ===========================
   Password Strength Meter
=========================== */
const PasswordStrengthMeter = ({ password }) => {
  const strength = useMemo(() => getPasswordStrength(password), [password]);

  if (!password) return null;

  const requirements = [
    { key: "minLength", label: "At least 8 characters" },
    { key: "hasUppercase", label: "One uppercase letter (A-Z)" },
    { key: "hasLowercase", label: "One lowercase letter (a-z)" },
    { key: "hasNumber", label: "One number (0-9)" },
    { key: "hasSpecial", label: "One special character (!@#$...)" },
  ];

  return (
    <div className="auth-pw-strength">
      <div className="auth-pw-bar-wrap">
        <div className="auth-pw-bar-track">
          <div
            className="auth-pw-bar-fill"
            style={{
              width: `${strength.percent}%`,
              background: strength.color,
            }}
          />
        </div>
        <span
          className="auth-pw-bar-label"
          style={{ color: strength.color }}
        >
          {strength.label}
        </span>
      </div>
      <div className="auth-pw-reqs">
        {requirements.map((req) => (
          <div
            key={req.key}
            className={`auth-pw-req ${
              strength.checks[req.key]
                ? "auth-pw-req-pass"
                : "auth-pw-req-fail"
            }`}
          >
            {strength.checks[req.key] ? (
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
              >
                <path
                  d="M10 3L4.5 8.5L2 6"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            ) : (
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
              >
                <circle
                  cx="6"
                  cy="6"
                  r="2"
                  fill="currentColor"
                  opacity="0.4"
                />
              </svg>
            )}
            <span>{req.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ===========================
   Custom Input Component
=========================== */
const AuthInput = ({
  icon: Icon,
  type = "text",
  placeholder,
  name,
  value,
  onChange,
  isPassword,
  error,
}) => {
  const [showPw, setShowPw] = useState(false);
  const inputType = isPassword ? (showPw ? "text" : "password") : type;

  return (
    <div className={`auth-field-wrap ${error ? "auth-field-error" : ""}`}>
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
          autoComplete={
            isPassword
              ? "current-password"
              : name === "email"
              ? "email"
              : "off"
          }
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPw((p) => !p)}
            className="auth-field-eye"
            tabIndex={-1}
            aria-label={showPw ? "Hide password" : "Show password"}
          >
            {showPw ? (
              <EyeSlashIcon style={{ width: 16, height: 16 }} />
            ) : (
              <EyeIcon style={{ width: 16, height: 16 }} />
            )}
          </button>
        )}
      </div>
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

    if (!firstName.trim()) {
      showNotification("First name is required", "error");
      return false;
    }
    if (!lastName.trim()) {
      showNotification("Last name is required", "error");
      return false;
    }
    if (!normalizedContact) {
      showNotification("Contact number is required", "error");
      return false;
    }
    if (normalizedContact.length !== 10) {
      showNotification("Contact number must be exactly 10 digits", "error");
      return false;
    }
    if (!password.trim()) {
      showNotification("Password is required", "error");
      return false;
    }

    // Strong password validation
    const strength = getPasswordStrength(password);
    if (!strength.checks.minLength) {
      showNotification("Password must be at least 8 characters long", "error");
      return false;
    }
    if (!strength.checks.hasUppercase) {
      showNotification(
        "Password must contain at least one uppercase letter",
        "error"
      );
      return false;
    }
    if (!strength.checks.hasLowercase) {
      showNotification(
        "Password must contain at least one lowercase letter",
        "error"
      );
      return false;
    }
    if (!strength.checks.hasNumber) {
      showNotification(
        "Password must contain at least one number",
        "error"
      );
      return false;
    }
    if (!strength.checks.hasSpecial) {
      showNotification(
        "Password must contain at least one special character (!@#$...)",
        "error"
      );
      return false;
    }
    return true;
  };

  const validateLoginForm = () => {
    const { contactNumber, password } = loginData;
    const normalizedContact = normalizePhone(contactNumber);

    if (!normalizedContact) {
      showNotification("Contact number is required", "error");
      return false;
    }
    if (normalizedContact.length !== 10) {
      showNotification("Contact number must be exactly 10 digits", "error");
      return false;
    }
    if (!password.trim()) {
      showNotification("Password is required", "error");
      return false;
    }
    return true;
  };

  const validateGuestForm = () => {
    const { contactNumber } = guestData;
    const normalizedContact = normalizePhone(contactNumber);

    if (!normalizedContact) {
      showNotification("Contact number is required", "error");
      return false;
    }
    if (normalizedContact.length !== 10) {
      showNotification("Contact number must be exactly 10 digits", "error");
      return false;
    }
    return true;
  };

  /* ===== SIGNUP ===== */
  const handleSignup = async () => {
    if (!validateSignupForm()) return;
    setLoading(true);

    try {
      let result = await dispatch(createCustomer(signupData)).unwrap();

      if (typeof result === "string") {
        try {
          result = JSON.parse(result);
        } catch {
          /* leave as is */
        }
      }

      if (result && typeof result === "object" && "ResponseCode" in result) {
        if (result.ResponseCode === "2") {
          const message =
            result.ResponseMessage || "Account already exists";
          showNotification(
            `${message}. Please login with your existing account.`,
            "error"
          );
          setTimeout(() => {
            setAuthMode("login");
            setLoginData((prev) => ({
              ...prev,
              contactNumber: signupData.contactNumber,
            }));
          }, 2500);
          return;
        }
        if (
          result.ResponseCode &&
          result.ResponseCode !== "1" &&
          result.ResponseCode !== "0"
        ) {
          showNotification(
            result.ResponseMessage || "Registration failed",
            "error"
          );
          return;
        }
      }

      const customer =
        result &&
        typeof result === "object" &&
        result.customerAccountNumber
          ? result
          : { ...signupData, ...(result || {}) };

      dispatch(setCurrentCustomer(customer));

      try {
        if (typeof window.fbq === "function") {
          window.fbq("track", "CompleteRegistration", {
            content_name: "Customer Registration",
            status: "success",
            currency: "GHS",
            email: signupData.email,
            customer_type: "registered",
            contact_number: signupData.contactNumber,
          });
        }
        if (typeof window.gtag === "function") {
          window.gtag("event", "sign_up", {
            method: "email",
            customer_type: "registered",
            contact_number: signupData.contactNumber,
          });
        }
      } catch {
        /* silent */
      }

      showNotification("Registration successful!", "success");
      setTimeout(() => {
        if (onSuccess && typeof onSuccess === "function") onSuccess();
        else onClose();
      }, 1500);
    } catch (error) {
      let errorMessage = "Registration failed. Please try again.";
      if (error?.message) errorMessage = error.message;
      else if (error?.response?.data?.message)
        errorMessage = error.response.data.message;
      else if (error?.response?.data?.error)
        errorMessage = error.response.data.error;
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  /* ===== LOGIN ===== */
  const handleLogin = async () => {
    if (!validateLoginForm()) return;
    setLoading(true);

    try {
      const customer = await dispatch(loginCustomer(loginData)).unwrap();

      if (!customer || !customer.contactNumber) {
        showNotification(
          "No customer found with the provided contact number.",
          "error"
        );
        return;
      }

      dispatch(setCurrentCustomer(customer));

      showNotification("Login successful!", "success");
      setTimeout(() => {
        if (onSuccess && typeof onSuccess === "function") onSuccess();
        else onClose();
      }, 1500);
    } catch (error) {
      const message =
        error?.response?.data?.message ||
        error?.message ||
        "Login failed. Please check your credentials.";
      showNotification(message, "error");
    } finally {
      setLoading(false);
    }
  };

  /* ===== GUEST ===== */
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
      dbResult = await dispatch(
        createCustomer(guestCustomerData)
      ).unwrap();
    } catch (error) {
      setLoading(false);
      let errorMessage =
        "Failed to create guest account. Please try again.";
      if (error?.message) errorMessage = error.message;
      else if (error?.response?.data?.message)
        errorMessage = error.response.data.message;
      else if (error?.response?.data?.error)
        errorMessage = error.response.data.error;
      showNotification(errorMessage, "error");
      return;
    }

    if (typeof dbResult === "string") {
      try {
        dbResult = JSON.parse(dbResult);
      } catch {
        /* leave as is */
      }
    }

    if (
      dbResult &&
      typeof dbResult === "object" &&
      "ResponseCode" in dbResult
    ) {
      if (dbResult.ResponseCode === "2") {
        setLoading(false);
        const message =
          dbResult.ResponseMessage || "Account already exists";
        showNotification(
          `${message}. Please login with your existing account.`,
          "error"
        );
        setTimeout(() => {
          setAuthMode("login");
          setLoginData((prev) => ({
            ...prev,
            contactNumber: guestData.contactNumber,
          }));
        }, 2500);
        return;
      }
      if (
        dbResult.ResponseCode &&
        dbResult.ResponseCode !== "1" &&
        dbResult.ResponseCode !== "0"
      ) {
        setLoading(false);
        showNotification(
          dbResult.ResponseMessage || "Failed to create guest account",
          "error"
        );
        return;
      }
    }

    const guestCustomer =
      dbResult &&
      typeof dbResult === "object" &&
      dbResult.customerAccountNumber
        ? dbResult
        : { ...guestCustomerData, ...(dbResult || {}) };

    dispatch(setCurrentCustomer(guestCustomer));

    try {
      if (typeof window.fbq === "function") {
        window.fbq("track", "CompleteRegistration", {
          content_name: "Guest Registration",
          status: "success",
          currency: "GHS",
          email: guestCustomer.email,
          customer_type: "guest",
          contact_number: guestCustomer.contactNumber,
        });
      }
      if (typeof window.gtag === "function") {
        window.gtag("event", "sign_up", {
          method: "guest",
          customer_type: "guest",
          contact_number: guestCustomer.contactNumber,
        });
      }
    } catch {
      /* silent */
    }

    setLoading(false);
    showNotification("Guest account created!", "success");
    setTimeout(() => {
      if (onSuccess && typeof onSuccess === "function") onSuccess();
      else onClose();
    }, 1500);
  };

  /* ===== Mode Change Reset ===== */
  useEffect(() => {
    hideNotification();
  }, [authMode, hideNotification]);

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
        /* ===========================
           Base & Overlay
        =========================== */
        .auth-overlay {
          position: fixed;
          inset: 0;
          z-index: 9998;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 16px;
          animation: auth-fade-in 0.25s ease;
        }

        @keyframes auth-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }

        .auth-backdrop {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
        }

        /* ===========================
           Modal Container
        =========================== */
        .auth-modal {
          position: relative;
          background: #fff;
          border-radius: 16px;
          width: 100%;
          max-width: 480px;
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(0, 0, 0, 0.04);
          animation: auth-modal-in 0.3s cubic-bezier(0.16, 1, 0.3, 1);
          overflow: hidden;
          font-family: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          -webkit-font-smoothing: antialiased;
          max-height: 92vh;
          display: flex;
          flex-direction: column;
        }

        @keyframes auth-modal-in {
          from { opacity: 0; transform: translateY(20px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }

        .auth-modal-scroll {
          overflow-y: auto;
          flex: 1;
          -webkit-overflow-scrolling: touch;
        }

        .auth-modal-scroll::-webkit-scrollbar { width: 4px; }
        .auth-modal-scroll::-webkit-scrollbar-track { background: transparent; }
        .auth-modal-scroll::-webkit-scrollbar-thumb { background: #e0e0e0; border-radius: 4px; }
        .auth-modal-scroll::-webkit-scrollbar-thumb:hover { background: #ccc; }

        /* ===========================
           Close Button
        =========================== */
        .auth-close {
          position: absolute;
          top: 14px;
          right: 14px;
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #e8e8e8;
          border-radius: 10px;
          background: rgba(255,255,255,0.9);
          cursor: pointer;
          transition: all 0.2s;
          z-index: 3;
          backdrop-filter: blur(4px);
        }

        .auth-close:hover { background: #f0f0f0; border-color: #d0d0d0; transform: scale(1.05); }
        .auth-close:active { transform: scale(0.95); }

        /* ===========================
           Header
        =========================== */
        .auth-header {
          padding: 32px 32px 0;
          text-align: center;
        }

        .auth-logo-wrap {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
          background: linear-gradient(145deg, #f0fdf4, #dcfce7);
          border: 1px solid #bbf7d0;
          box-shadow: 0 2px 8px rgba(34, 197, 94, 0.1);
        }

        .auth-logo {
          height: 32px;
          width: auto;
        }

        .auth-title {
          font-size: 22px;
          font-weight: 800;
          color: #111;
          margin: 0 0 4px;
          letter-spacing: -0.03em;
          line-height: 1.2;
        }

        .auth-subtitle {
          font-size: 14px;
          color: #777;
          font-weight: 400;
          margin: 0;
          line-height: 1.4;
        }

        /* ===========================
           Tabs
        =========================== */
        .auth-tabs {
          display: flex;
          margin: 24px 32px 0;
          background: #f5f5f5;
          border-radius: 10px;
          padding: 4px;
          gap: 3px;
        }

        .auth-tab {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 10px 8px;
          font-size: 13px;
          font-weight: 600;
          color: #999;
          border: none;
          background: none;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.25s ease;
          font-family: inherit;
          white-space: nowrap;
          position: relative;
        }

        .auth-tab:hover:not(.auth-tab-on) {
          color: #666;
          background: rgba(255, 255, 255, 0.6);
        }

        .auth-tab-on {
          background: #fff;
          color: #14532d;
          box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08), 0 0 0 1px rgba(0, 0, 0, 0.03);
        }

        /* ===========================
           Body
        =========================== */
        .auth-body {
          padding: 24px 32px 20px;
        }

        .auth-fields {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .auth-field-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        /* ===========================
           Field / Input
        =========================== */
        .auth-field-wrap { width: 100%; }

        .auth-field-wrap.auth-field-error .auth-field {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1);
        }

        .auth-field {
          display: flex;
          align-items: center;
          border: 1.5px solid #e2e2e2;
          border-radius: 10px;
          background: #fafafa;
          height: 46px;
          overflow: hidden;
          transition: all 0.2s ease;
        }

        .auth-field:focus-within {
          border-color: #22c55e;
          box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.08);
          background: #fff;
        }

        .auth-field-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 44px;
          height: 100%;
          color: #bbb;
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
          font-size: 14px;
          font-weight: 450;
          color: #111;
          background: transparent;
          height: 100%;
          padding-right: 12px;
          font-family: inherit;
          min-width: 0;
        }

        .auth-field-input::placeholder {
          color: #b0b0b0;
          font-weight: 400;
        }

        .auth-field-eye {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 42px;
          height: 100%;
          border: none;
          background: none;
          color: #bbb;
          cursor: pointer;
          flex-shrink: 0;
          transition: color 0.15s;
        }

        .auth-field-eye:hover { color: #666; }

        /* ===========================
           Password Strength Meter
        =========================== */
        .auth-pw-strength {
          margin-top: -4px;
          animation: auth-pw-slide-in 0.3s ease;
        }

        @keyframes auth-pw-slide-in {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }

        .auth-pw-bar-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          margin-bottom: 8px;
        }

        .auth-pw-bar-track {
          flex: 1;
          height: 4px;
          background: #eee;
          border-radius: 4px;
          overflow: hidden;
        }

        .auth-pw-bar-fill {
          height: 100%;
          border-radius: 4px;
          transition: all 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .auth-pw-bar-label {
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          flex-shrink: 0;
          min-width: 42px;
          text-align: right;
        }

        .auth-pw-reqs {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 3px 12px;
          padding: 8px 10px;
          background: #f8f8f8;
          border-radius: 8px;
          border: 1px solid #f0f0f0;
        }

        .auth-pw-req {
          display: flex;
          align-items: center;
          gap: 5px;
          font-size: 11px;
          font-weight: 500;
          transition: all 0.2s;
          line-height: 1.3;
          padding: 2px 0;
        }

        .auth-pw-req-pass {
          color: #16a34a;
        }

        .auth-pw-req-fail {
          color: #aaa;
        }

        /* ===========================
           Buttons
        =========================== */
        .auth-btn {
          width: 100%;
          height: 48px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          margin-top: 4px;
          border: none;
          border-radius: 10px;
          font-size: 14.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          font-family: inherit;
          letter-spacing: -0.01em;
          position: relative;
          overflow: hidden;
        }

        .auth-btn-primary {
          background: linear-gradient(145deg, #166534 0%, #14532d 100%);
          color: #fff;
          box-shadow: 0 2px 10px rgba(20, 83, 45, 0.3), inset 0 1px 0 rgba(255,255,255,0.1);
        }

        .auth-btn-primary:hover:not(:disabled) {
          box-shadow: 0 6px 20px rgba(20, 83, 45, 0.4), inset 0 1px 0 rgba(255,255,255,0.1);
          transform: translateY(-1px);
        }

        .auth-btn-primary:active:not(:disabled) {
          transform: translateY(0) scale(0.99);
          box-shadow: 0 1px 4px rgba(20, 83, 45, 0.2);
        }

        .auth-btn-primary:disabled {
          opacity: 0.65;
          cursor: not-allowed;
          transform: none;
        }

        /* ===========================
           Divider
        =========================== */
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
        }

        /* ===========================
           Footer
        =========================== */
        .auth-footer {
          padding: 0 32px 28px;
          text-align: center;
        }

        .auth-switch {
          font-size: 13.5px;
          color: #888;
          font-weight: 400;
        }

        .auth-switch-link {
          color: #14532d;
          font-weight: 700;
          cursor: pointer;
          border: none;
          background: none;
          padding: 0;
          font-size: 13.5px;
          font-family: inherit;
          text-decoration: none;
          transition: all 0.15s;
          border-bottom: 1.5px solid transparent;
        }

        .auth-switch-link:hover {
          color: #166534;
          border-bottom-color: #16a34a;
        }

        /* ===========================
           Guest Section
        =========================== */
        .auth-guest-info {
          text-align: center;
          margin-bottom: 16px;
        }

        .auth-guest-icon-wrap {
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: linear-gradient(145deg, #dcfce7 0%, #f0fdf4 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 14px;
          border: 2px solid #bbf7d0;
          box-shadow: 0 4px 12px rgba(34, 197, 94, 0.12);
        }

        .auth-guest-desc {
          font-size: 13px;
          color: #777;
          font-weight: 400;
          margin: 0;
          line-height: 1.6;
          max-width: 280px;
          margin: 0 auto;
        }

        /* ===========================
           Spinner
        =========================== */
        .auth-spinner {
          width: 18px;
          height: 18px;
          animation: auth-spin 0.7s linear infinite;
        }

        @keyframes auth-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* ===========================
           Secure Badge
        =========================== */
        .auth-secure {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          margin-top: 18px;
          font-size: 11.5px;
          color: #bbb;
          font-weight: 500;
        }

        .auth-secure svg {
          color: #22c55e;
        }

        /* ===========================
           Notification
        =========================== */
        .auth-notif-wrap {
          position: fixed;
          top: 20px;
          right: 20px;
          z-index: 99999;
          animation: auth-notif-in 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        @keyframes auth-notif-in {
          from { opacity: 0; transform: translateX(30px) scale(0.95); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }

        .auth-notif {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 14px 18px;
          border-radius: 12px;
          min-width: 320px;
          max-width: 440px;
          box-shadow: 0 12px 40px rgba(0, 0, 0, 0.18);
          font-family: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .auth-notif-ok {
          background: linear-gradient(145deg, #14532d 0%, #166534 100%);
          color: #fff;
        }

        .auth-notif-err {
          background: linear-gradient(145deg, #dc2626 0%, #b91c1c 100%);
          color: #fff;
        }

        .auth-notif-icon {
          flex-shrink: 0;
          opacity: 0.95;
          display: flex;
        }

        .auth-notif-msg {
          flex: 1;
          font-size: 13.5px;
          font-weight: 500;
          line-height: 1.4;
        }

        .auth-notif-close {
          flex-shrink: 0;
          border: none;
          background: rgba(255, 255, 255, 0.2);
          color: #fff;
          width: 24px;
          height: 24px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 15px;
          font-weight: 700;
          transition: background 0.15s;
          line-height: 1;
        }

        .auth-notif-close:hover { background: rgba(255, 255, 255, 0.35); }

        /* ===========================
           Form Section Labels
        =========================== */
        .auth-section-label {
          font-size: 11.5px;
          font-weight: 600;
          color: #999;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          margin-bottom: -4px;
          padding-left: 2px;
        }

        /* ===========================
           MOBILE RESPONSIVE
        =========================== */
        @media (max-width: 480px) {
          .auth-overlay {
            align-items: flex-end;
            padding: 0;
          }

          .auth-modal {
            max-width: 100%;
            border-radius: 20px 20px 0 0;
            max-height: 96vh;
            animation: auth-modal-in-mobile 0.35s cubic-bezier(0.16, 1, 0.3, 1);
          }

          @keyframes auth-modal-in-mobile {
            from { opacity: 0; transform: translateY(100%); }
            to { opacity: 1; transform: translateY(0); }
          }

          .auth-header {
            padding: 24px 20px 0;
          }

          .auth-logo-wrap {
            width: 48px;
            height: 48px;
            border-radius: 12px;
            margin-bottom: 12px;
          }

          .auth-logo {
            height: 28px;
          }

          .auth-title {
            font-size: 20px;
          }

          .auth-subtitle {
            font-size: 13px;
          }

          .auth-tabs {
            margin: 18px 20px 0;
            border-radius: 10px;
            padding: 4px;
          }

          .auth-tab {
            padding: 10px 6px;
            font-size: 12px;
            gap: 4px;
          }

          .auth-body {
            padding: 20px;
          }

          .auth-fields {
            gap: 12px;
          }

          .auth-field-row {
            grid-template-columns: 1fr;
            gap: 12px;
          }

          .auth-field {
            height: 48px;
            border-radius: 12px;
          }

          .auth-field-input {
            font-size: 15px;
          }

          .auth-btn {
            height: 50px;
            border-radius: 12px;
            font-size: 15px;
          }

          .auth-footer {
            padding: 0 20px 24px;
          }

          .auth-pw-reqs {
            grid-template-columns: 1fr;
            gap: 4px;
            padding: 10px 12px;
          }

          .auth-pw-req {
            font-size: 12px;
          }

          .auth-notif-wrap {
            top: auto;
            bottom: 16px;
            left: 16px;
            right: 16px;
          }

          .auth-notif {
            min-width: 0;
            max-width: 100%;
            width: 100%;
            border-radius: 14px;
          }

          .auth-close {
            top: 12px;
            right: 12px;
            width: 36px;
            height: 36px;
            border-radius: 12px;
          }

          .auth-guest-icon-wrap {
            width: 52px;
            height: 52px;
          }

          .auth-switch {
            font-size: 14px;
          }

          .auth-switch-link {
            font-size: 14px;
          }

          .auth-section-label {
            font-size: 12px;
          }
        }

        /* Handle safe area on modern phones */
        @supports (padding-bottom: env(safe-area-inset-bottom)) {
          @media (max-width: 480px) {
            .auth-footer {
              padding-bottom: calc(24px + env(safe-area-inset-bottom));
            }
          }
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

        <div
          className="auth-modal"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKeyDown}
          role="dialog"
          aria-modal="true"
          aria-label="Authentication"
        >
          {/* Close Button */}
          <button
            className="auth-close"
            onClick={onClose}
            aria-label="Close"
          >
            <XMarkIcon style={{ width: 16, height: 16, color: "#888" }} />
          </button>

          <div className="auth-modal-scroll">
            {/* Header */}
            <div className="auth-header">
              <div className="auth-logo-wrap">
                <img
                  src={logo}
                  alt="Franko Trading"
                  className="auth-logo"
                />
              </div>
              <h2 className="auth-title">
                {authMode === "login" && "Welcome back"}
                {authMode === "signup" && "Create account"}
                {authMode === "guest" && "Quick checkout"}
              </h2>
              <p className="auth-subtitle">
                {authMode === "login" &&
                  "Sign in to your Franko account"}
                {authMode === "signup" &&
                  "Join Franko Trading"}
                {authMode === "guest" &&
                  "Continue without creating an account"}
              </p>
            </div>

            {/* Tabs */}
            <div className="auth-tabs">
              {tabs.map((tab) => {
                const TabIcon = tab.icon;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setAuthMode(tab.key)}
                    className={`auth-tab ${
                      authMode === tab.key ? "auth-tab-on" : ""
                    }`}
                  >
                    <TabIcon style={{ width: 14, height: 14 }} />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Body */}
            <div className="auth-body">
              {/* ===== LOGIN ===== */}
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
                        <ArrowRightIcon
                          style={{ width: 16, height: 16 }}
                        />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* ===== SIGNUP ===== */}
              {authMode === "signup" && (
                <div className="auth-fields">
                  <span className="auth-section-label">
                    Personal Information
                  </span>
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

                  <span className="auth-section-label">
                    Contact Details
                  </span>
                  <AuthInput
                    icon={PhoneIcon}
                    placeholder="Contact Number"
                    name="contactNumber"
                    value={signupData.contactNumber}
                    onChange={handleSignupChange}
                  />
                  <AuthInput
                    icon={EnvelopeIcon}
                    type="email"
                    placeholder="Email (optional)"
                    name="email"
                    value={signupData.email}
                    onChange={handleSignupChange}
                  />
                  <AuthInput
                    icon={HomeIcon}
                    placeholder="Delivery Address"
                    name="address"
                    value={signupData.address}
                    onChange={handleSignupChange}
                  />

                  <span className="auth-section-label">Security</span>
                  <AuthInput
                    icon={LockClosedIcon}
                    placeholder="Create a strong password"
                    name="password"
                    value={signupData.password}
                    onChange={handleSignupChange}
                    isPassword
                  />
                  <PasswordStrengthMeter
                    password={signupData.password}
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
                        <ArrowRightIcon
                          style={{ width: 16, height: 16 }}
                        />
                      </>
                    )}
                  </button>
                </div>
              )}

              {/* ===== GUEST ===== */}
              {authMode === "guest" && (
                <div className="auth-fields">
                  <div className="auth-guest-info">
                    
                    <p className="auth-guest-desc">
                      Enter your phone number to continue. 
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
                        <ArrowRightIcon
                          style={{ width: 16, height: 16 }}
                        />
                      </>
                    )}
                  </button>
                </div>
              )}

             
            </div>

            {/* Footer */}
            <div className="auth-footer">
              {authMode === "login" && (
                <div className="auth-switch">
                  Don&apos;t have an account?{" "}
                  <button
                    onClick={() => setAuthMode("signup")}
                    className="auth-switch-link"
                  >
                    Register here
                  </button>
                </div>
              )}
              {authMode === "signup" && (
                <div className="auth-switch">
                  Already have an account?{" "}
                  <button
                    onClick={() => setAuthMode("login")}
                    className="auth-switch-link"
                  >
                    Sign in
                  </button>
                </div>
              )}
              {authMode === "guest" && (
                <div className="auth-switch">
                  Want full access?{" "}
                  <button
                    onClick={() => setAuthMode("signup")}
                    className="auth-switch-link"
                    style={{ marginRight: 4 }}
                  >
                    Register
                  </button>
                  or{" "}
                  <button
                    onClick={() => setAuthMode("login")}
                    className="auth-switch-link"
                  >
                    Sign in
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthModal;