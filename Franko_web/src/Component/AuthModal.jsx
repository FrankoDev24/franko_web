import {
  Modal,
  Input,
 
  Typography,
  Space
} from "antd";
import {
  UserOutlined,
  LockOutlined,
  HomeOutlined,
  PhoneOutlined,
  MailOutlined,
 
} from "@ant-design/icons";
import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { createCustomer, loginCustomer } from "../Redux/Slice/customerSlice";
import { v4 as uuidv4 } from "uuid";
import logo from "../assets/frankoIcon.png";

const { Title, Text } = Typography;

// Notification Component
const Notification = ({ message, type, isVisible, onClose }) => {
  const timeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
    };
  }, []);

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

  const bgColor = type === 'success' ? 'bg-green-500' : 'bg-red-500';
  const iconColor = type === 'success' ? 'text-green-100' : 'text-red-100';

  return (
    <div className="fixed top-4 right-4 z-[9999] animate-slide-in">
      <div className={`${bgColor} text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3 min-w-[320px] max-w-md`}>
        <div className={`flex-shrink-0 ${iconColor}`}>
          {type === 'success' ? (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <span className="text-sm font-medium flex-grow">{message}</span>
        <button
          onClick={onClose}
          className="text-white/80 hover:text-white text-lg leading-none flex-shrink-0 ml-2"
        >
          ×
        </button>
      </div>
    </div>
  );
};

const AuthModal = ({ open, onClose }) => {
  const dispatch = useDispatch();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [notification, setNotification] = useState({
    message: '',
    type: 'success',
    isVisible: false
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

  // Notification handlers
  const hideNotification = useCallback(() => {
    setNotification(prev => ({ 
      ...prev, 
      isVisible: false 
    }));
  }, []);

  const showNotification = useCallback((message, type = 'success') => {
    setNotification({ message: '', type: 'success', isVisible: false });
    
    requestAnimationFrame(() => {
      setNotification({
        message,
        type,
        isVisible: true
      });
    });
  }, []);

  useEffect(() => {
    if (open && !isLogin) {
      setSignupData((prev) => ({
        ...prev,
        customerAccountNumber: uuidv4(),
      }));
    }
  }, [open, isLogin]);

  const handleEscapeKey = useCallback((e) => {
    if (e.key === "Escape" && open) {
      onClose();
    }
  }, [onClose, open]);

  useEffect(() => {
    document.addEventListener("keydown", handleEscapeKey);
    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
    };
  }, [handleEscapeKey]);

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
  };

  const validateSignupForm = () => {
    const { firstName, lastName,  contactNumber, password } = signupData;
    
    if (!firstName.trim()) {
      showNotification("First name is required", "error");
      return false;
    }
    if (!lastName.trim()) {
      showNotification("Last name is required", "error");
      return false;
    }

    if (!contactNumber.trim()) {
      showNotification("Contact number is required", "error");
      return false;
    }
    if (contactNumber.length < 10) {
      showNotification("Contact number must be at least 10 digits", "error");
      return false;
    }
    
    if (!password.trim()) {
      showNotification("Password is required", "error");
      return false;
    }
    if (password.length < 6) {
      showNotification("Password must be at least 6 characters long", "error");
      return false;
    }
    
    return true;
  };

  const validateLoginForm = () => {
    const { contactNumber, password } = loginData;
    
    if (!contactNumber.trim()) {
      showNotification("Contact number is required", "error");
      return false;
    }
    if (!password.trim()) {
      showNotification("Password is required", "error");
      return false;
    }
    
    return true;
  };

  const handleSignup = async () => {
    if (!validateSignupForm()) return;
    
    setLoading(true);
    try {
      await dispatch(createCustomer(signupData)).unwrap();
      if (typeof window.fbq === "function") {
        window.fbq("track", "CompleteRegistration", {
          content_name: "Customer Registration",
          status: "success",
          currency: "GHS",
          email: signupData.email,
        });
      }
      showNotification("Registration successful! Welcome aboard!", "success");
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Registration error:", error);
      const errorMessage = error?.message || "Registration failed. Please try again.";
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };
  
  const handleLogin = async () => {
    if (!validateLoginForm()) return;
    
    setLoading(true);
    try {
      await dispatch(loginCustomer(loginData)).unwrap();
      showNotification("Login successful! Welcome back!", "success");
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      const errorMessage = error?.message || "Login failed. Please check your credentials.";
      showNotification(errorMessage, "error");
    } finally {
      setLoading(false);
    }
  };

  // Reset notification when switching between login/signup
  useEffect(() => {
    hideNotification();
  }, [isLogin, hideNotification]);

  // Reset notification when modal closes
  useEffect(() => {
    if (!open) {
      hideNotification();
    }
  }, [open, hideNotification]);

  return (
    <>
      <Notification
        message={notification.message}
        type={notification.type}
        isVisible={notification.isVisible}
        onClose={hideNotification}
      />
      
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        centered
        width={400}
        maskClosable={true}
      >
        <div className="text-center mb-4">
          <img
            src={logo}
            alt="Logo"
            className="h-16 mx-auto mb-2"
          />
          <Title level={4}>
            {isLogin ? "Login" : "Create Your Account"}
          </Title>
        </div>

        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          {isLogin ? (
            <>
              <Input
                name="contactNumber"
                placeholder="Contact Number"
                value={loginData.contactNumber}
                onChange={handleLoginChange}
                prefix={<PhoneOutlined />}
              />
              <Input.Password
                name="password"
                placeholder="Password"
                value={loginData.password}
                onChange={handleLoginChange}
                prefix={<LockOutlined />}
              />
            </>
          ) : (
            <>
              <Input
                name="firstName"
                placeholder="First Name"
                value={signupData.firstName}
                onChange={handleSignupChange}
                prefix={<UserOutlined />}
              />
              <Input
                name="lastName"
                placeholder="Last Name"
                value={signupData.lastName}
                onChange={handleSignupChange}
                prefix={<UserOutlined />}
              />
              <Input
                name="email"
                type="email"
                placeholder="Email"
                value={signupData.email}
                onChange={handleSignupChange}
                prefix={<MailOutlined />}
              />
              <Input
                name="contactNumber"
                placeholder="Contact Number"
                value={signupData.contactNumber}
                onChange={handleSignupChange}
                prefix={<PhoneOutlined />}
              />
              <Input
                name="address"
                placeholder="Address"
                value={signupData.address}
                onChange={handleSignupChange}
                prefix={<HomeOutlined />}
              />
              <Input.Password
                name="password"
                placeholder="Password"
                value={signupData.password}
                onChange={handleSignupChange}
                prefix={<LockOutlined />}
              />
            </>
          )}
        </Space>

        <button
          disabled={loading}
          className={`w-full py-2 px-4 mt-4 rounded-md text-white font-semibold transition duration-200 ease-in-out ${
            loading
              ? "bg-green-400 cursor-not-allowed"
              : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-95"
          }`}
          onClick={isLogin ? handleLogin : handleSignup}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg
                className="animate-spin h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
              Processing...
            </span>
          ) : isLogin ? (
            "Login"
          ) : (
            "Register"
          )}
        </button>

        <div className="text-center mt-4 text-sm text-gray-600">
          {isLogin ? (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => setIsLogin(false)}
                className="text-blue-600 underline underline-offset-4 hover:text-blue-700 font-medium transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Register here
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setIsLogin(true)}
                className="text-blue-600 underline underline-offset-4 hover:text-blue-700 font-medium transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Login
              </button>
            </>
          )}
        </div>
      </Modal>
    </>
  );
};

export default AuthModal;