// src/Components/AuthModal.jsx
import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import {
  createCustomer,
  loginCustomer,
  setCurrentCustomer,
  updateCustomerPassword,
  getCustomerById,
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
  ArrowPathIcon,
  ShieldCheckIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { User, UserPlus, UserCheck } from "lucide-react";

// ─────────────────────────────────────────────
// Password strength helpers
// ─────────────────────────────────────────────
const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters",         test: (p) => p.length >= 8 },
  { id: "upper",  label: "At least one uppercase letter",  test: (p) => /[A-Z]/.test(p) },
  { id: "lower",  label: "At least one lowercase letter",  test: (p) => /[a-z]/.test(p) },
  { id: "number", label: "At least one number",            test: (p) => /\d/.test(p) },
  { id: "symbol", label: "At least one special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const getStrength = (password) => {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  if (passed <= 1) return { score: passed, label: "Very weak",  color: "#ef4444" };
  if (passed === 2) return { score: passed, label: "Weak",       color: "#f97316" };
  if (passed === 3) return { score: passed, label: "Fair",       color: "#eab308" };
  if (passed === 4) return { score: passed, label: "Strong",     color: "#22c55e" };
  return              { score: passed, label: "Very strong", color: "#15803d" };
};

const isStrongPassword = (p) => PASSWORD_RULES.every((r) => r.test(p));

// ─────────────────────────────────────────────
// Notification
// ─────────────────────────────────────────────
const Notification = ({ message, type, isVisible, onClose }) => {
  const timerRef = useRef(null);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (isVisible && message) timerRef.current = setTimeout(onClose, 4500);
    return () => clearTimeout(timerRef.current);
  }, [isVisible, message, onClose]);

  if (!isVisible || !message) return null;

  return (
    <div className="ft-notif-wrap">
      <div className={`ft-notif ${type === "success" ? "ft-notif-ok" : "ft-notif-err"}`}>
        <span className="ft-notif-dot" />
        <span className="ft-notif-msg">{message}</span>
        <button onClick={onClose} className="ft-notif-x">×</button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Input field
// ─────────────────────────────────────────────
const Field = ({
  icon: Icon, type = "text", placeholder,
  name, value, onChange, isPassword, onKeyDown,
}) => {
  const [show, setShow] = useState(false);
  return (
    <div className="ft-field">
      <span className="ft-field-ico"><Icon /></span>
      <input
        type={isPassword ? (show ? "text" : "password") : type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onKeyDown={onKeyDown}
        className="ft-field-inp"
        autoComplete={isPassword ? "current-password" : "off"}
      />
      {isPassword && (
        <button type="button" onClick={() => setShow((s) => !s)} className="ft-field-eye">
          {show ? <EyeSlashIcon /> : <EyeIcon />}
        </button>
      )}
    </div>
  );
};

// ─────────────────────────────────────────────
// Password Strength Meter
// ─────────────────────────────────────────────
const StrengthMeter = ({ password }) => {
  if (!password) return null;
  const { score, label, color } = getStrength(password);
  return (
    <div className="ft-strength">
      <div className="ft-strength-bars">
        {Array.from({ length: PASSWORD_RULES.length }).map((_, i) => (
          <div
            key={i}
            className="ft-strength-bar"
            style={{ background: i < score ? color : "#e5e7eb" }}
          />
        ))}
      </div>
      <span className="ft-strength-label" style={{ color }}>{label}</span>
      <ul className="ft-strength-rules">
        {PASSWORD_RULES.map((rule) => {
          const ok = rule.test(password);
          return (
            <li key={rule.id} className={`ft-rule ${ok ? "ft-rule-ok" : ""}`}>
              <span className="ft-rule-dot" style={{ background: ok ? color : "#d1d5db" }} />
              {rule.label}
            </li>
          );
        })}
      </ul>
    </div>
  );
};

// ─────────────────────────────────────────────
// Force Change Password Modal
// ─────────────────────────────────────────────
const ForceChangePasswordModal = ({ customer, onSuccess, onClose }) => {
  const dispatch = useDispatch();
  const [form, setForm]     = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]   = useState("");
  const [done, setDone]     = useState(false);

  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

// In the ForceChangePasswordModal submit function, update this part:

const submit = async () => {
  setError("");
  if (!form.oldPassword) return setError("Please enter your current password.");
  if (!isStrongPassword(form.newPassword)) return setError("New password does not meet strength requirements.");
  if (form.newPassword !== form.confirmPassword) return setError("Passwords do not match.");
  if (form.oldPassword === form.newPassword) return setError("New password must differ from current password.");

  setLoading(true);
  try {
    await dispatch(updateCustomerPassword({
      contactNumber: customer.contactNumber,
      oldPassword: form.oldPassword,
      newPassword: form.newPassword,
    })).unwrap();

    // After successful password update, fetch the customer profile with the token
    const updated = await dispatch(getCustomerById({
      contactNumber: customer.contactNumber,
      accessToken: customer.accessToken // Pass the access token
    })).unwrap();
    
    // Merge the updated profile with tokens
    const completeCustomer = {
      ...updated,
      accessToken: customer.accessToken,
      refreshToken: customer.refreshToken,
      loginStatus: true // Now the status should be true after password change
    };
    
    dispatch(setCurrentCustomer(completeCustomer));
    setDone(true);
    setTimeout(onSuccess, 1800);
  } catch (err) {
    const msg = typeof err === "object"
      ? err?.message || "Password update failed."
      : err || "Password update failed.";
    setError(msg);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="ft-force-overlay">
      <div className="ft-force-backdrop" />
      <div className="ft-force-card">
        <div className="ft-force-strip" />
        <div className="ft-force-head">
          <div className="ft-force-shield"><ShieldCheckIcon /></div>
          <h3 className="ft-force-title">Password Reset Required</h3>
          <p className="ft-force-sub">
            Your account requires a password update before you can continue.
            Please set a strong new password.
          </p>
        </div>

        {done ? (
          <div className="ft-force-success">
            <CheckCircleIcon className="ft-force-check" />
            <p>Password updated successfully!</p>
          </div>
        ) : (
          <div className="ft-force-body">
            {error && <div className="ft-force-err">{error}</div>}
            <Field icon={LockClosedIcon} placeholder="Current Password"     name="oldPassword"     value={form.oldPassword}     onChange={handle} isPassword />
            <Field icon={LockClosedIcon} placeholder="New Password"         name="newPassword"     value={form.newPassword}     onChange={handle} isPassword />
            <StrengthMeter password={form.newPassword} />
            <Field icon={LockClosedIcon} placeholder="Confirm New Password" name="confirmPassword" value={form.confirmPassword} onChange={handle} isPassword />
            <button className="ft-btn ft-btn-primary" onClick={submit} disabled={loading}>
              {loading
                ? <><ArrowPathIcon className="ft-spin" /> Updating…</>
                : <>Update Password <ArrowRightIcon /></>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Change Password Panel
// ─────────────────────────────────────────────
const ChangePasswordPanel = ({ customer, showNotification, onClose }) => {
  const dispatch = useDispatch();
  const [form, setForm]       = useState({ oldPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(false);

  const handle = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }));

  const submit = async () => {
    if (!form.oldPassword)                  return showNotification("Enter your current password.", "error");
    if (!isStrongPassword(form.newPassword)) return showNotification("New password doesn't meet requirements.", "error");
    if (form.newPassword !== form.confirmPassword) return showNotification("Passwords do not match.", "error");
    if (form.oldPassword === form.newPassword)    return showNotification("New password must differ from current.", "error");

    setLoading(true);
    try {
      await dispatch(updateCustomerPassword({
        contactNumber: customer?.contactNumber,
        oldPassword: form.oldPassword,
        newPassword: form.newPassword,
      })).unwrap();
      showNotification("Password changed successfully!", "success");
      setForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(onClose, 1500);
    } catch (err) {
      const msg = typeof err === "object"
        ? err?.message || "Failed to change password."
        : err || "Failed to change password.";
      showNotification(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="ft-cp-panel">
      <div className="ft-cp-panel-head">
        <div className="ft-cp-panel-icon"><ShieldCheckIcon /></div>
        <div>
          <p className="ft-cp-panel-title">Change Password</p>
          <p className="ft-cp-panel-sub">Update your account password securely</p>
        </div>
      </div>
      <div className="ft-fields">
        <Field icon={LockClosedIcon} placeholder="Current Password"     name="oldPassword"     value={form.oldPassword}     onChange={handle} isPassword />
        <Field icon={LockClosedIcon} placeholder="New Password"         name="newPassword"     value={form.newPassword}     onChange={handle} isPassword />
        <StrengthMeter password={form.newPassword} />
        <Field icon={LockClosedIcon} placeholder="Confirm New Password" name="confirmPassword" value={form.confirmPassword} onChange={handle} isPassword />
        <button className="ft-btn ft-btn-primary" onClick={submit} disabled={loading}>
          {loading
            ? <><ArrowPathIcon className="ft-spin" /> Updating…</>
            : <>Update Password <ArrowRightIcon /></>}
        </button>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main AuthModal
// ─────────────────────────────────────────────
const AuthModal = ({ open, onClose, onSuccess, currentCustomer }) => {
  const dispatch = useDispatch();

  const [authMode, setAuthMode]                 = useState("login");
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [loading, setLoading]                   = useState(false);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [pendingCustomer, setPendingCustomer]   = useState(null);
  const [redirecting, setRedirecting]           = useState(false);
  const [notification, setNotification]         = useState({
    message: "", type: "success", isVisible: false,
  });

  const [signupData, setSignupData] = useState({
    customerAccountNumber: "",
    firstName: "", lastName: "", contactNumber: "",
    address: "", password: "", accountType: "customer",
    email: "", accountStatus: "1",
  });
  const [loginData, setLoginData]   = useState({ contactNumber: "", password: "" });
  const [guestData, setGuestData]   = useState({ contactNumber: "" });

  // ── Notification helpers ───────────────────
  const hideNotif = useCallback(
    () => setNotification((p) => ({ ...p, isVisible: false })),
    []
  );
  const showNotif = useCallback((message, type = "success") => {
    setNotification({ message: "", type, isVisible: false });
    requestAnimationFrame(() => setNotification({ message, type, isVisible: true }));
  }, []);

  const normalizePhone = (v = "") => v.replace(/\D/g, "");

  // ── Side-effects ───────────────────────────
  useEffect(() => {
    if (open && authMode === "signup") {
      setSignupData((p) => ({ ...p, customerAccountNumber: uuidv4() }));
    }
  }, [open, authMode]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape" && open) onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  useEffect(() => {
    if (!open) {
      hideNotif();
      setAuthMode("login");
      setShowChangePassword(false);
      setForcePasswordChange(false);
      setPendingCustomer(null);
      setRedirecting(false);
      setLoginData({ contactNumber: "", password: "" });
    }
  }, [open, hideNotif]);

  useEffect(() => {
    hideNotif();
    setShowChangePassword(false);
    setRedirecting(false);
  }, [authMode, hideNotif]);

  // ── Validation ─────────────────────────────
  const validateSignup = () => {
    const { firstName, lastName, contactNumber, password } = signupData;
    const phone = normalizePhone(contactNumber);
    if (!firstName.trim())           { showNotif("First name is required.", "error");                    return false; }
    if (!lastName.trim())            { showNotif("Last name is required.", "error");                     return false; }
    if (!phone)                      { showNotif("Contact number is required.", "error");                 return false; }
    if (phone.length !== 10)         { showNotif("Contact number must be exactly 10 digits.", "error");  return false; }
    if (!isStrongPassword(password)) { showNotif("Password doesn't meet strength requirements.", "error"); return false; }
    return true;
  };

  const validateLogin = () => {
    const phone = normalizePhone(loginData.contactNumber);
    if (!phone)              { showNotif("Contact number is required.", "error");                return false; }
    if (phone.length !== 10) { showNotif("Contact number must be exactly 10 digits.", "error"); return false; }
    if (!loginData.password) { showNotif("Password is required.", "error");                     return false; }
    return true;
  };

  const validateGuest = () => {
    const phone = normalizePhone(guestData.contactNumber);
    if (!phone)              { showNotif("Contact number is required.", "error");                return false; }
    if (phone.length !== 10) { showNotif("Contact number must be exactly 10 digits.", "error"); return false; }
    return true;
  };

  // ── Signup ─────────────────────────────────
  const handleSignup = async () => {
    if (!validateSignup()) return;
    setLoading(true);
    try {
      const result = await dispatch(createCustomer(signupData)).unwrap();

      // Account already exists
      if (result?.ResponseCode === "2") {
        showNotif((result.ResponseMessage || "Account already exists.") + " Please login.", "error");
        setTimeout(() => {
          setLoginData((p) => ({ ...p, contactNumber: signupData.contactNumber }));
          setAuthMode("login");
        }, 2500);
        return;
      }

      if (result?.ResponseCode && result.ResponseCode !== "1") {
        showNotif(result.ResponseMessage || "Registration failed.", "error");
        return;
      }

      const customer = result?.customerAccountNumber
        ? result
        : { ...signupData, ...(result || {}) };

      dispatch(setCurrentCustomer(customer));
      showNotif("Account created successfully!", "success");
      setTimeout(() => { onSuccess ? onSuccess() : onClose(); }, 1500);
    } catch (err) {
      const msg = typeof err === "object"
        ? err?.message || "Registration failed."
        : err || "Registration failed.";
      showNotif(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Login ──────────────────────────────────
  const handleLogin = async () => {
    if (!validateLogin()) return;
    setLoading(true);
    try {
      const result = await dispatch(loginCustomer({
        contactNumber: normalizePhone(loginData.contactNumber),
        password: loginData.password,
      })).unwrap();

      // Check if login requires password change
      // loginStatus === false means password change is required
      if (result.requiresPasswordChange || result.loginStatus === false) {
        setPendingCustomer(result);
        setForcePasswordChange(true);
        return;
      }

      // Login successful and no password change required
      if (!result?.contactNumber) {
        showNotif("Login succeeded but account data is missing. Please try again.", "error");
        return;
      }

      // Everything is good, proceed with login
      dispatch(setCurrentCustomer(result));
      showNotif("Welcome back!", "success");
      setTimeout(() => { onSuccess ? onSuccess() : onClose(); }, 1500);

    } catch (err) {
      const message = typeof err === "object"
        ? err?.message || "Login failed."
        : err || "Login failed.";

      const isAccountNotFound =
        typeof err === "object" && err?.isAccountNotFound === true;

      if (isAccountNotFound) {
        // Show banner + auto-redirect to signup
        setRedirecting(true);
        showNotif(
          "No account found with this number. Redirecting you to register…",
          "error"
        );

        // Pre-fill signup form with the phone number they typed
        setSignupData((prev) => ({
          ...prev,
          contactNumber: loginData.contactNumber,
          customerAccountNumber: uuidv4(),
        }));

        setTimeout(() => {
          setRedirecting(false);
          setAuthMode("signup");
        }, 2200);
        return;
      }

      showNotif(message, "error");
    } finally {
      setLoading(false);
    }
  };

  // ── Guest ──────────────────────────────────
  const handleGuest = async () => {
    if (!validateGuest()) return;
    setLoading(true);
    const phone = normalizePhone(guestData.contactNumber);
    const guestPayload = {
      customerAccountNumber: uuidv4(),
      firstName: "Guest", lastName: phone.slice(-4),
      contactNumber: phone, address: "Guest Address",
      password: phone, accountType: "customer",
      email: `guest${phone}@franko.com`, accountStatus: "1",
      isGuest: true, createdAt: new Date().toISOString(),
    };
    try {
      const result = await dispatch(createCustomer(guestPayload)).unwrap();

      if (result?.ResponseCode === "2") {
        showNotif((result.ResponseMessage || "Number already registered.") + " Please login.", "error");
        setTimeout(() => {
          setLoginData((p) => ({ ...p, contactNumber: phone }));
          setAuthMode("login");
        }, 2500);
        return;
      }

      if (result?.ResponseCode && result.ResponseCode !== "1") {
        showNotif(result.ResponseMessage || "Failed to create guest account.", "error");
        return;
      }

      const guestCustomer = result?.customerAccountNumber
        ? result
        : { ...guestPayload, ...(result || {}) };

      dispatch(setCurrentCustomer(guestCustomer));
      showNotif("Continuing as guest!", "success");
      setTimeout(() => { onSuccess ? onSuccess() : onClose(); }, 1500);
    } catch (err) {
      const msg = typeof err === "object"
        ? err?.message || "Failed to create guest session."
        : err || "Failed to create guest session.";
      showNotif(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key !== "Enter" || loading) return;
    if (authMode === "login")  handleLogin();
    if (authMode === "signup") handleSignup();
    if (authMode === "guest")  handleGuest();
  };

  if (!open) return null;

  const tabs = [
    { key: "login",  label: "Sign In",  Icon: User },
    { key: "signup", label: "Register", Icon: UserPlus },
    { key: "guest",  label: "Guest",    Icon: UserCheck },
  ];

  const headings = {
    login:  ["Welcome back",   "Sign in to your Franko account"],
    signup: ["Create account", "Join Franko Trading today"],
    guest:  ["Quick checkout", "Continue without creating an account"],
  };

  return (
    <>
      <style>{CSS}</style>

      <Notification {...notification} onClose={hideNotif} />

      {/* Force Change Password overlay */}
      {forcePasswordChange && pendingCustomer && (
        <ForceChangePasswordModal
          customer={pendingCustomer}
          onSuccess={() => {
            setForcePasswordChange(false);
            setPendingCustomer(null);
            showNotif("Password updated! You're now logged in.", "success");
            setTimeout(() => { onSuccess ? onSuccess() : onClose(); }, 1500);
          }}
          onClose={() => { 
            setForcePasswordChange(false); 
            setPendingCustomer(null);
            showNotif("Password change cancelled. Please login again.", "error");
          }}
        />
      )}

      <div className="ft-overlay" onClick={onClose}>
        <div className="ft-backdrop" />
        <div
          className="ft-modal"
          onClick={(e) => e.stopPropagation()}
          onKeyDown={handleKey}
        >
          {/* Close */}
          <button className="ft-close" onClick={onClose}><XMarkIcon /></button>

          {/* Header */}
          <div className="ft-head">
            <img src={logo} alt="Franko" className="ft-logo" />
            <h2 className="ft-title">{headings[authMode][0]}</h2>
            <p className="ft-sub">{headings[authMode][1]}</p>
          </div>

          {/* Tabs */}
          <div className="ft-tabs">
            {tabs.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setAuthMode(key)}
                className={`ft-tab ${authMode === key ? "ft-tab-on" : ""}`}
              >
                <Icon className="ft-tab-ico" />
                <span>{label}</span>
              </button>
            ))}
          </div>

          {/* Body */}
          <div className="ft-body">

            {/* ── Inline Change Password ── */}
            {showChangePassword ? (
              <div>
                <button
                  className="ft-back-link"
                  onClick={() => setShowChangePassword(false)}
                >
                  ← Back to {authMode === "signup" ? "Register" : "Sign In"}
                </button>
                <ChangePasswordPanel
                  customer={currentCustomer}
                  showNotification={showNotif}
                  onClose={() => { setShowChangePassword(false); onClose(); }}
                />
              </div>
            ) : (
              <>
                {/* ── Redirect banner ── */}
                {redirecting && (
                  <div className="ft-redirect-banner">
                    <ExclamationTriangleIcon className="ft-redirect-ico" />
                    <div>
                      <p className="ft-redirect-title">Account not found</p>
                      <p className="ft-redirect-sub">
                        Redirecting you to register…
                      </p>
                    </div>
                    <ArrowPathIcon className="ft-spin ft-redirect-spin" />
                  </div>
                )}

                {/* ── LOGIN ── */}
                {authMode === "login" && (
                  <div className="ft-fields">
                    <Field
                      icon={PhoneIcon}
                      placeholder="Contact Number (10 digits)"
                      name="contactNumber"
                      value={loginData.contactNumber}
                      onChange={(e) => setLoginData((p) => ({ ...p, [e.target.name]: e.target.value }))}
                    />
                    <Field
                      icon={LockClosedIcon}
                      placeholder="Password"
                      name="password"
                      value={loginData.password}
                      onChange={(e) => setLoginData((p) => ({ ...p, [e.target.name]: e.target.value }))}
                      isPassword
                    />
                    <button
                      className="ft-btn ft-btn-primary"
                      onClick={handleLogin}
                      disabled={loading || redirecting}
                    >
                      {loading
                        ? <><ArrowPathIcon className="ft-spin" />Signing in…</>
                        : <>Sign In <ArrowRightIcon /></>}
                    </button>
                    <div className="ft-alt-links">
                      <span>No account?</span>
                      <button className="ft-link" onClick={() => setAuthMode("signup")}>Register</button>
                      <span>·</span>
                      <button className="ft-link" onClick={() => setAuthMode("guest")}>Continue as guest</button>
                    </div>
                    {currentCustomer && (
                      <>
                        <div className="ft-divider">
                          <span /><span className="ft-divider-text">account settings</span><span />
                        </div>
                        <div className="ft-cp-link-wrap">
                          <button className="ft-cp-link" onClick={() => setShowChangePassword(true)}>
                            <ShieldCheckIcon className="ft-cp-link-ico" />
                            Change Password
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                )}

                {/* ── SIGNUP ── */}
                {authMode === "signup" && (
                  <div className="ft-fields">
                    <div className="ft-row">
                      <Field icon={UserIcon} placeholder="First Name" name="firstName" value={signupData.firstName} onChange={(e) => setSignupData((p) => ({ ...p, [e.target.name]: e.target.value }))} />
                      <Field icon={UserIcon} placeholder="Last Name"  name="lastName"  value={signupData.lastName}  onChange={(e) => setSignupData((p) => ({ ...p, [e.target.name]: e.target.value }))} />
                    </div>
                    <Field icon={EnvelopeIcon} type="email" placeholder="Email (optional)" name="email"        value={signupData.email}        onChange={(e) => setSignupData((p) => ({ ...p, [e.target.name]: e.target.value }))} />
                    <Field icon={PhoneIcon}    placeholder="Contact Number (10 digits)"    name="contactNumber" value={signupData.contactNumber} onChange={(e) => setSignupData((p) => ({ ...p, [e.target.name]: e.target.value }))} />
                    <Field icon={HomeIcon}     placeholder="Address"                       name="address"       value={signupData.address}       onChange={(e) => setSignupData((p) => ({ ...p, [e.target.name]: e.target.value }))} />
                    <Field icon={LockClosedIcon} placeholder="Create Password"             name="password"      value={signupData.password}      onChange={(e) => setSignupData((p) => ({ ...p, [e.target.name]: e.target.value }))} isPassword />
                    <StrengthMeter password={signupData.password} />
                    <button className="ft-btn ft-btn-primary" onClick={handleSignup} disabled={loading}>
                      {loading
                        ? <><ArrowPathIcon className="ft-spin" />Creating account…</>
                        : <>Create Account <ArrowRightIcon /></>}
                    </button>
                    <div className="ft-alt-links">
                      <span>Already have an account?</span>
                      <button className="ft-link" onClick={() => setAuthMode("login")}>Sign in</button>
                    </div>
                  </div>
                )}

                {/* ── GUEST ── */}
                {authMode === "guest" && (
                  <div className="ft-fields">
                    <div className="ft-guest-banner">
                      <UserCheck className="ft-guest-ico" />
                      <p>Enter your phone number to continue without creating an account.</p>
                    </div>
                    <Field
                      icon={PhoneIcon}
                      placeholder="Contact Number (10 digits)"
                      name="contactNumber"
                      value={guestData.contactNumber}
                      onChange={(e) => setGuestData((p) => ({ ...p, [e.target.name]: e.target.value }))}
                    />
                    <button className="ft-btn ft-btn-primary" onClick={handleGuest} disabled={loading}>
                      {loading
                        ? <><ArrowPathIcon className="ft-spin" />Setting up…</>
                        : <>Continue as Guest <ArrowRightIcon /></>}
                    </button>
                    <div className="ft-alt-links">
                      <button className="ft-link" onClick={() => setAuthMode("signup")}>Register</button>
                      <span>·</span>
                      <button className="ft-link" onClick={() => setAuthMode("login")}>Sign in</button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default AuthModal;

// ─────────────────────────────────────────────
// CSS
// ─────────────────────────────────────────────
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700;1,9..40,400&display=swap');

  :root {
    --ft-green:       #14532d;
    --ft-green-mid:   #16a34a;
    --ft-green-light: #dcfce7;
    --ft-accent:      #22c55e;
    --ft-red:         #dc2626;
    --ft-amber:       #eab308;
    --ft-orange:      #f97316;
    --ft-bg:          #fff;
    --ft-border:      #e4e4e7;
    --ft-text:        #18181b;
    --ft-muted:       #71717a;
    --ft-subtle:      #f4f4f5;
    --ft-radius:      10px;
    --ft-font:        'DM Sans', -apple-system, BlinkMacSystemFont, sans-serif;
  }

  /* ── Overlay & Modal ── */
  .ft-overlay {
    position: fixed; inset: 0; z-index: 9998;
    display: flex; align-items: center; justify-content: center; padding: 16px;
    animation: ftFadeIn .2s ease;
  }
  @keyframes ftFadeIn { from { opacity:0 } to { opacity:1 } }

  .ft-backdrop {
    position: absolute; inset: 0;
    background: rgba(0,0,0,.52); backdrop-filter: blur(6px);
  }

  .ft-modal {
    position: relative; z-index: 1;
    background: var(--ft-bg); border-radius: var(--ft-radius);
    width: 100%; max-width: 430px;
    box-shadow: 0 32px 80px rgba(0,0,0,.22), 0 0 0 1px rgba(0,0,0,.06);
    font-family: var(--ft-font); -webkit-font-smoothing: antialiased;
    max-height: 90vh; overflow-y: auto;
    animation: ftModalIn .25s cubic-bezier(.32,.72,0,1);
  }
  .ft-modal::-webkit-scrollbar { width: 4px; }
  .ft-modal::-webkit-scrollbar-thumb { background: #ddd; border-radius: 4px; }

  @keyframes ftModalIn {
    from { opacity:0; transform: translateY(14px) scale(.97) }
    to   { opacity:1; transform: translateY(0) scale(1) }
  }

  /* ── Close ── */
  .ft-close {
    position: absolute; top: 14px; right: 14px; z-index: 2;
    width: 30px; height: 30px;
    display: flex; align-items: center; justify-content: center;
    border: 1px solid var(--ft-border); border-radius: 6px;
    background: var(--ft-bg); cursor: pointer; transition: all .15s;
  }
  .ft-close svg { width: 14px; height: 14px; color: var(--ft-muted); }
  .ft-close:hover { background: var(--ft-subtle); border-color: #d4d4d8; }

  /* ── Header ── */
  .ft-head { padding: 30px 28px 0; text-align: center; }
  .ft-logo { height: 40px; width: auto; margin-bottom: 10px; }
  .ft-title { font-size: 19px; font-weight: 700; color: var(--ft-text); margin: 0 0 3px; letter-spacing: -.03em; }
  .ft-sub   { font-size: 13px; color: var(--ft-muted); margin: 0; font-weight: 400; }

  /* ── Tabs ── */
  .ft-tabs {
    display: flex; gap: 2px;
    margin: 18px 28px 0;
    background: var(--ft-subtle); border-radius: 8px; padding: 3px;
  }
  .ft-tab {
    flex: 1;
    display: flex; align-items: center; justify-content: center; gap: 5px;
    padding: 9px 10px; font-size: 12.5px; font-weight: 600; color: var(--ft-muted);
    border: none; background: none; cursor: pointer; border-radius: 6px;
    transition: all .18s; white-space: nowrap; font-family: inherit;
  }
  .ft-tab-ico { width: 14px; height: 14px; flex-shrink: 0; }
  .ft-tab:hover:not(.ft-tab-on) { color: var(--ft-text); background: rgba(255,255,255,.6); }
  .ft-tab-on { background: #fff; color: var(--ft-green); box-shadow: 0 1px 4px rgba(0,0,0,.1); }

  /* ── Body ── */
  .ft-body { padding: 22px 28px 28px; }
  .ft-fields { display: flex; flex-direction: column; gap: 11px; }
  .ft-row { display: flex; gap: 10px; }
  .ft-row .ft-field { flex: 1; }

  /* ── Field ── */
  .ft-field {
    display: flex; align-items: center;
    border: 1.5px solid var(--ft-border); border-radius: 8px;
    height: 44px; overflow: hidden; transition: all .2s; background: #fff;
  }
  .ft-field:focus-within {
    border-color: var(--ft-accent);
    box-shadow: 0 0 0 3px rgba(34,197,94,.12);
  }
  .ft-field-ico {
    width: 42px; display: flex; align-items: center; justify-content: center;
    color: #a1a1aa; flex-shrink: 0; transition: color .2s;
  }
  .ft-field-ico svg { width: 15px; height: 15px; }
  .ft-field:focus-within .ft-field-ico { color: var(--ft-accent); }
  .ft-field-inp {
    flex: 1; border: none; outline: none; background: transparent;
    font-size: 13.5px; font-weight: 450; color: var(--ft-text);
    height: 100%; padding-right: 10px; font-family: var(--ft-font);
  }
  .ft-field-inp::placeholder { color: #a1a1aa; font-weight: 400; }
  .ft-field-eye {
    width: 38px; height: 100%; display: flex; align-items: center; justify-content: center;
    border: none; background: none; cursor: pointer; color: #a1a1aa; transition: color .15s;
  }
  .ft-field-eye svg { width: 15px; height: 15px; }
  .ft-field-eye:hover { color: var(--ft-text); }

  /* ── Strength ── */
  .ft-strength { padding: 4px 2px 2px; }
  .ft-strength-bars { display: flex; gap: 4px; margin-bottom: 5px; }
  .ft-strength-bar { flex: 1; height: 4px; border-radius: 99px; transition: background .3s; }
  .ft-strength-label { font-size: 11.5px; font-weight: 600; font-family: var(--ft-font); }
  .ft-strength-rules { list-style: none; margin: 8px 0 0; padding: 0; display: flex; flex-direction: column; gap: 4px; }
  .ft-rule { display: flex; align-items: center; gap: 7px; font-size: 11.5px; color: #a1a1aa; font-family: var(--ft-font); transition: color .2s; }
  .ft-rule-ok { color: var(--ft-text); }
  .ft-rule-dot { width: 7px; height: 7px; border-radius: 50%; flex-shrink: 0; transition: background .3s; }

  /* ── Button ── */
  .ft-btn {
    width: 100%; height: 44px; margin-top: 2px;
    display: flex; align-items: center; justify-content: center; gap: 7px;
    border: none; border-radius: 8px;
    font-size: 14px; font-weight: 700; cursor: pointer;
    transition: all .2s; font-family: var(--ft-font); letter-spacing: -.01em;
  }
  .ft-btn svg { width: 16px; height: 16px; }
  .ft-btn-primary {
    background: linear-gradient(135deg, var(--ft-green) 0%, #166534 100%);
    color: #fff; box-shadow: 0 2px 10px rgba(20,83,45,.28);
  }
  .ft-btn-primary:hover:not(:disabled) {
    background: linear-gradient(135deg, #166534 0%, #14532d 100%);
    box-shadow: 0 4px 16px rgba(20,83,45,.38); transform: translateY(-1px);
  }
  .ft-btn-primary:active:not(:disabled) { transform: translateY(0) scale(.99); }
  .ft-btn-primary:disabled { opacity: .65; cursor: not-allowed; transform: none; }

  /* ── Alt links ── */
  .ft-alt-links {
    display: flex; align-items: center; justify-content: center; gap: 6px;
    font-size: 12.5px; color: var(--ft-muted); font-family: var(--ft-font); flex-wrap: wrap;
  }
  .ft-link {
    color: var(--ft-green); font-weight: 600; border: none; background: none;
    cursor: pointer; font-size: 12.5px; font-family: var(--ft-font);
    border-bottom: 1px solid transparent; transition: all .15s; padding: 0;
  }
  .ft-link:hover { color: #166534; border-bottom-color: #166534; }

  /* ── Divider ── */
  .ft-divider { display: flex; align-items: center; gap: 10px; margin: 6px 0 2px; }
  .ft-divider span:first-child,
  .ft-divider span:last-child { flex: 1; height: 1px; background: var(--ft-border); }
  .ft-divider-text {
    font-size: 11px; font-weight: 500; color: #a1a1aa;
    letter-spacing: .04em; text-transform: uppercase;
    font-family: var(--ft-font); white-space: nowrap; flex: none;
  }

  /* ── Change Password link ── */
  .ft-cp-link-wrap { display: flex; justify-content: center; }
  .ft-cp-link {
    display: inline-flex; align-items: center; gap: 6px;
    color: var(--ft-muted); font-size: 12.5px; font-weight: 500;
    border: none; background: none; cursor: pointer;
    font-family: var(--ft-font); padding: 0;
    border-bottom: 1px dashed transparent; transition: all .18s;
  }
  .ft-cp-link:hover { color: var(--ft-green); border-bottom-color: var(--ft-green-mid); }
  .ft-cp-link-ico { width: 14px; height: 14px; flex-shrink: 0; }

  /* ── Back link ── */
  .ft-back-link {
    display: inline-flex; align-items: center; gap: 4px;
    color: var(--ft-muted); font-size: 12.5px; font-weight: 500;
    border: none; background: none; cursor: pointer;
    font-family: var(--ft-font); padding: 0; margin-bottom: 16px;
    transition: color .15s;
  }
  .ft-back-link:hover { color: var(--ft-green); }

  /* ── Change Password Panel ── */
  .ft-cp-panel { display: flex; flex-direction: column; gap: 14px; }
  .ft-cp-panel-head {
    display: flex; align-items: center; gap: 12px;
    background: var(--ft-green-light); border: 1px solid #bbf7d0;
    border-radius: 8px; padding: 12px 14px;
  }
  .ft-cp-panel-icon {
    width: 36px; height: 36px; border-radius: 8px;
    background: #fff; border: 1px solid #bbf7d0;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .ft-cp-panel-icon svg { width: 18px; height: 18px; color: var(--ft-green); }
  .ft-cp-panel-title { font-size: 14px; font-weight: 700; color: var(--ft-green); margin: 0 0 2px; font-family: var(--ft-font); }
  .ft-cp-panel-sub   { font-size: 12px; color: #166534; margin: 0; font-family: var(--ft-font); }

  /* ── Redirect banner ── */
  .ft-redirect-banner {
    display: flex; align-items: center; gap: 12px;
    background: #fffbeb; border: 1px solid #fde68a;
    border-radius: 8px; padding: 12px 14px; margin-bottom: 4px;
    animation: ftFadeIn .3s ease;
  }
  .ft-redirect-ico { width: 20px; height: 20px; color: #d97706; flex-shrink: 0; }
  .ft-redirect-title { font-size: 13px; font-weight: 700; color: #92400e; margin: 0 0 2px; font-family: var(--ft-font); }
  .ft-redirect-sub   { font-size: 12px; color: #b45309; margin: 0; font-family: var(--ft-font); }
  .ft-redirect-spin  { width: 18px; height: 18px; color: #d97706; margin-left: auto; flex-shrink: 0; }

  /* ── Guest banner ── */
  .ft-guest-banner {
    display: flex; align-items: flex-start; gap: 11px;
    background: var(--ft-green-light); border: 1px solid #bbf7d0;
    border-radius: 8px; padding: 12px 14px;
  }
  .ft-guest-ico { width: 18px; height: 18px; color: var(--ft-green); flex-shrink: 0; margin-top: 1px; }
  .ft-guest-banner p { font-size: 13px; color: #166534; margin: 0; line-height: 1.5; font-family: var(--ft-font); }

  /* ── Spinner ── */
  .ft-spin { width: 18px; height: 18px; animation: ftSpin .75s linear infinite; }
  @keyframes ftSpin { to { transform: rotate(360deg) } }

  /* ── Notification ── */
  .ft-notif-wrap {
    position: fixed; top: 16px; right: 16px; z-index: 99999;
    animation: ftNotifIn .3s ease;
  }
  @keyframes ftNotifIn {
    from { opacity:0; transform: translateX(20px) }
    to   { opacity:1; transform: translateX(0) }
  }
  .ft-notif {
    display: flex; align-items: center; gap: 10px;
    padding: 13px 16px; border-radius: 10px;
    min-width: 280px; max-width: 420px;
    box-shadow: 0 8px 32px rgba(0,0,0,.18); font-family: var(--ft-font);
  }
  .ft-notif-ok  { background: linear-gradient(135deg, #14532d, #166534); color: #fff; }
  .ft-notif-err { background: linear-gradient(135deg, #dc2626, #b91c1c); color: #fff; }
  .ft-notif-dot { width: 8px; height: 8px; border-radius: 50%; flex-shrink: 0; background: rgba(255,255,255,.7); }
  .ft-notif-msg { flex: 1; font-size: 13px; font-weight: 500; line-height: 1.4; }
  .ft-notif-x {
    flex-shrink: 0; width: 22px; height: 22px; border-radius: 4px;
    border: none; background: rgba(255,255,255,.2); color: #fff;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer; font-size: 14px; font-weight: 700; transition: background .15s; line-height: 1;
  }
  .ft-notif-x:hover { background: rgba(255,255,255,.35); }

  /* ── Force Password Modal ── */
  .ft-force-overlay {
    position: fixed; inset: 0; z-index: 99997;
    display: flex; align-items: center; justify-content: center; padding: 16px;
    animation: ftFadeIn .2s ease;
  }
  .ft-force-backdrop {
    position: absolute; inset: 0;
    background: rgba(0,0,0,.6); backdrop-filter: blur(8px);
  }
  .ft-force-card {
    position: relative; z-index: 1;
    background: #fff; border-radius: 14px;
    width: 100%; max-width: 400px;
    box-shadow: 0 40px 100px rgba(0,0,0,.3), 0 0 0 1px rgba(0,0,0,.06);
    font-family: var(--ft-font); overflow: hidden;
    animation: ftModalIn .3s cubic-bezier(.32,.72,0,1);
    max-height: 90vh; overflow-y: auto;
  }
  .ft-force-strip {
    height: 5px;
    background: linear-gradient(90deg, var(--ft-green), var(--ft-accent), var(--ft-green));
    background-size: 200%; animation: ftStrip 2.5s ease infinite alternate;
  }
  @keyframes ftStrip { from { background-position: 0% } to { background-position: 100% } }

  .ft-force-head { padding: 28px 28px 18px; text-align: center; }
  .ft-force-shield {
    width: 54px; height: 54px; border-radius: 14px;
    background: linear-gradient(135deg, var(--ft-green-light), #f0fdf4);
    border: 2px solid #bbf7d0;
    display: flex; align-items: center; justify-content: center; margin: 0 auto 14px;
  }
  .ft-force-shield svg { width: 26px; height: 26px; color: var(--ft-green); }
  .ft-force-title { font-size: 18px; font-weight: 700; color: var(--ft-text); margin: 0 0 6px; letter-spacing: -.03em; }
  .ft-force-sub   { font-size: 13px; color: var(--ft-muted); margin: 0; line-height: 1.5; }

  .ft-force-body { padding: 0 28px 28px; display: flex; flex-direction: column; gap: 11px; }
  .ft-force-err {
    background: #fef2f2; border: 1px solid #fecaca;
    border-radius: 7px; padding: 10px 14px;
    font-size: 13px; color: var(--ft-red); line-height: 1.4; font-family: var(--ft-font);
  }
  .ft-force-success {
    display: flex; flex-direction: column; align-items: center;
    padding: 32px 28px; gap: 12px; text-align: center;
  }
  .ft-force-check { width: 52px; height: 52px; color: var(--ft-accent); }
  .ft-force-success p { font-size: 15px; font-weight: 600; color: var(--ft-text); margin: 0; font-family: var(--ft-font); }

  /* ── Responsive ── */
  @media (max-width: 480px) {
    .ft-overlay { align-items: flex-end; padding: 0; }
    .ft-modal { border-radius: 14px 14px 0 0; max-width: 100%; max-height: 95vh; }
    .ft-head { padding: 22px 20px 0; }
    .ft-tabs { margin: 14px 20px 0; }
    .ft-body { padding: 18px 20px 24px; }
    .ft-row  { flex-direction: column; gap: 10px; }
  }
`;