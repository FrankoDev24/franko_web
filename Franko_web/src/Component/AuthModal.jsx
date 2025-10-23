import { Modal, Input, Typography, Space, Divider} from "antd";
import {
UserOutlined,
  LockOutlined,
  HomeOutlined,
  PhoneOutlined,
  MailOutlined,
} from "@ant-design/icons";
import { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch } from "react-redux";
import { createCustomer, loginCustomer ,getCustomerById} from "../Redux/Slice/customerSlice";
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

  const [authMode, setAuthMode] = useState('signup'); // 'login', 'signup', 'guest'
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

  const [guestData, setGuestData] = useState({
    contactNumber: "",
  });

  // Generate customer account number for signup and guest
  const generateCustomerAccountNumber = () => {
    return uuidv4();
  };

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
    if (open && authMode === 'signup') {
      setSignupData((prev) => ({
        ...prev,
        customerAccountNumber: generateCustomerAccountNumber(),
      }));
    }
  }, [open, authMode]);

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

  const handleGuestChange = (e) => {
    const { name, value } = e.target;
    setGuestData((prev) => ({ ...prev, [name]: value }));
  };

  const validateSignupForm = () => {
    const { firstName, lastName, contactNumber, password } = signupData;
    
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

  const validateGuestForm = () => {
    const { contactNumber } = guestData;
    
    if (!contactNumber.trim()) {
      showNotification("Contact number is required", "error");
      return false;
    }
    if (contactNumber.length < 10) {
      showNotification("Contact number must be at least 10 digits", "error");
      return false;
    }
    
    return true;
  };

  const handleSignup = async () => {
    if (!validateSignupForm()) return;
    
    setLoading(true);
    try {
      const result = await dispatch(createCustomer(signupData)).unwrap();
      
      // Check if account already exists (ResponseCode: '2')
      if (result?.ResponseCode === '2') {
        const message = result.ResponseMessage || 'Account already exists';
        showNotification(`${message}. Please login with your existing account.`, "error");
        
        setTimeout(() => {
          setAuthMode('login');
          setLoginData(prev => ({
            ...prev,
            contactNumber: signupData.contactNumber
          }));
        }, 2500);
        
        return;
      }

      // Check for other error response codes
      if (result?.ResponseCode && result.ResponseCode !== '1' && result.ResponseCode !== '0') {
        const errorMessage = result.ResponseMessage || 'Registration failed';
        showNotification(errorMessage, "error");
        return;
      }

      // Success case - ResponseCode is '1' or '0'
      try {
        const customerDataForStorage = {
          ...signupData,
          ...(result && typeof result === 'object' ? result : {}),
          isGuest: false,
          customerAccountNumber: signupData.customerAccountNumber,
          contactNumber: signupData.contactNumber,
          firstName: signupData.firstName,
          lastName: signupData.lastName,
          email: signupData.email,
          accountType: "customer",
          accountStatus: "1",
          createdAt: new Date().toISOString(),
          registeredAt: new Date().toISOString(),
        };
        
        localStorage.setItem('customer', (customerDataForStorage));
        console.log('Customer registration data stored in localStorage under "customer" key:', customerDataForStorage);
      } catch (storageError) {
        console.warn('Failed to store registration data in localStorage:', storageError);
      }
      
      // Track Facebook Pixel event
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

      // Track with Google Analytics
      if (typeof window.gtag === "function") {
        window.gtag('event', 'sign_up', {
          method: 'email',
          customer_type: 'registered',
          contact_number: signupData.contactNumber,
        });
      }
      
      showNotification("Registration successful! Welcome aboard!", "success");
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      console.error("Registration error:", error);
      
      let errorMessage = "Registration failed. Please try again.";
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      showNotification(errorMessage, "error");
      
      console.error("Detailed error info:", {
        message: error?.message,
        response: error?.response?.data,
        stack: error?.stack,
        signupData: signupData
      });
      
    } finally {
      setLoading(false);
    }
  };

const handleLogin = async () => {
  if (!validateLoginForm()) return;

  setLoading(true);
  try {
    // Step 1: Attempt login
    const loginResult = await dispatch(loginCustomer(loginData)).unwrap();

    if (!loginResult || !loginResult.contactNumber) {
      showNotification("No customer found with the provided contact number.", "error");
      return;
    }

    // Step 2: Fetch customer details by contact number
    const contactNumber = loginResult.contactNumber;
    const fullCustomerData = await dispatch(getCustomerById(contactNumber)).unwrap();

    // ✅ Handle array response
    const customer = Array.isArray(fullCustomerData) ? fullCustomerData[0] : fullCustomerData;

    if (!customer || !customer.customerAccountNumber) {
      showNotification("Failed to retrieve customer details.", "error");
      return;
    }

    // Step 3: Save to localStorage
    const customerToStore = {
      ...customer,
      isGuest: false,
      loggedInAt: new Date().toISOString(),
    };

    localStorage.setItem("customer", JSON.stringify(customerToStore));
  

    showNotification("Login successful! Welcome back!", "success");
    setTimeout(() => onClose(), 1500);
  } catch (error) {
    console.error("Login error:", error);
    const message =
      error?.response?.data?.message ||
      error?.message ||
      "Login failed. Please check your credentials.";
    showNotification(message, "error");
  } finally {
    setLoading(false);
  }
};


  const handleGuestContinue = async () => {
    if (!validateGuestForm()) return;
    
    setLoading(true);
    
    // Create guest customer account data
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

    let dbResult = null;

    try {
      // Attempt to create guest account in database
      dbResult = await dispatch(createCustomer(guestCustomerData)).unwrap();

      console.log('Guest creation API response:', dbResult);

    } catch (error) {
      console.error("Guest registration error:", error);
      setLoading(false);
      
      let errorMessage = "Failed to create guest account. Please try again.";
      
      if (error?.message) {
        errorMessage = error.message;
      } else if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error?.response?.data?.error) {
        errorMessage = error.response.data.error;
      }
      
      showNotification(errorMessage, "error");
      
      console.error("Detailed error info:", {
        message: error?.message,
        response: error?.response?.data,
        stack: error?.stack,
        guestData: guestCustomerData
      });
      
      return; // Exit on error
    }

    // CRITICAL: Check response code AFTER API call completes
    // CRITICAL: Check if account already exists (ResponseCode: '2')
    if (dbResult?.ResponseCode === '2') {
      // Account already exists - DO NOT create guest account
      // DO NOT store in localStorage
      setLoading(false);
      const message = dbResult.ResponseMessage || 'Account already exists';
      showNotification(`${message}. Please login with your existing account.`, "error");
      
      // Switch to login mode after delay
      setTimeout(() => {
        setAuthMode('login');
        // Pre-fill the contact number in login form
        setLoginData(prev => ({
          ...prev,
          contactNumber: guestData.contactNumber
        }));
      }, 2500);
      
      return; // Exit immediately without storing anything
    }

    // Check for other error response codes (not success)
    // ONLY create guest account when ResponseCode is exactly '1'
    if (dbResult?.ResponseCode !== '1') {
      setLoading(false);
      const errorMessage = dbResult?.ResponseMessage || 'Failed to create guest account';
      showNotification(errorMessage, "error");
      return; // Exit without storing anything
    }

    // SUCCESS: Only proceed if ResponseCode is exactly '1'
    // NOW and ONLY NOW do we store in localStorage
    try {
      const guestCustomerForStorage = {
        ...guestCustomerData,
        ...(dbResult && typeof dbResult === 'object' ? dbResult : {}),
        isGuest: true,
        customerAccountNumber: guestCustomerData.customerAccountNumber,
        contactNumber: guestData.contactNumber,
        firstName: guestCustomerData.firstName,
        lastName: guestCustomerData.lastName,
        email: guestCustomerData.email,
        accountType: "customer",
        accountStatus: "1"
      };
      
      localStorage.setItem('customer',(guestCustomerForStorage));
      console.log('✅ Guest customer details saved to localStorage under "customer" key:', guestCustomerForStorage);
    } catch (storageError) {
      console.error('Failed to save to localStorage:', storageError);
    }

    // Track analytics events only on success
    try {
      if (typeof window.fbq === "function") {
        window.fbq("track", "CompleteRegistration", {
          content_name: "Guest Registration",
          status: "success",
          currency: "GHS",
          email: guestCustomerData.email,
          customer_type: "guest",
          contact_number: guestCustomerData.contactNumber,
        });
      }

      if (typeof window.gtag === "function") {
        window.gtag('event', 'sign_up', {
          method: 'guest',
          customer_type: 'guest',
          contact_number: guestCustomerData.contactNumber,
        });
      }
    } catch (analyticsError) {
      console.warn('Analytics tracking failed:', analyticsError);
    }
    
    setLoading(false);
    showNotification("Guest account created successfully! Welcome!", "success");
    
    setTimeout(() => {
      onClose();
    }, 2000);
  };

  // Reset notification when switching between modes
  useEffect(() => {
    hideNotification();
  }, [authMode, hideNotification]);

  // Reset notification when modal closes
  useEffect(() => {
    if (!open) {
      hideNotification();
      setAuthMode('signup');
    }
  }, [open, hideNotification]);

  const renderAuthContent = () => {
    switch (authMode) {
      case 'login':
        return (
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
        );
      
      case 'signup':
        return (
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
        );
      
      case 'guest':
        return (
          <div className="space-y-4">
            <div className="text-center mb-4">
              <Text className="text-gray-600">
                Continue as a guest with just your contact number
              </Text>
            </div>
            <Input
              name="contactNumber"
              placeholder="Enter your contact number"
              value={guestData.contactNumber}
              onChange={handleGuestChange}
              prefix={<PhoneOutlined />}
              size="large"
            />
            <div className="text-xs text-gray-500 text-center">
              A guest account will be automatically created for you
            </div>
          </div>
        );
      
      default:
        return null;
    }
  };

  const getButtonText = () => {
    if (loading) return "Processing...";
    switch (authMode) {
      case 'login':
        return "Login";
      case 'signup':
        return "Register";
      case 'guest':
        return "Continue as Guest";
      default:
        return "Continue";
    }
  };

  const handleMainAction = () => {
    switch (authMode) {
      case 'login':
        return handleLogin();
      case 'signup':
        return handleSignup();
      case 'guest':
        return handleGuestContinue();
      default:
        return;
    }
  };

  const getModalTitle = () => {
    switch (authMode) {
      case 'login':
        return "Login";
      case 'signup':
        return "Create Your Account";
      case 'guest':
        return "Continue as Guest";
      default:
        return "Login";
    }
  };

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
            {getModalTitle()}
          </Title>
        </div>

        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          {renderAuthContent()}
        </Space>

        <button
          disabled={loading}
          className={`w-full py-2 px-4 mt-4 rounded-md text-white font-semibold transition duration-200 ease-in-out ${
            loading
              ? "bg-green-400 cursor-not-allowed"
              : "bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 active:scale-95"
          }`}
          onClick={handleMainAction}
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
          ) : (
            getButtonText()
          )}
        </button>

        {/* Auth Mode Navigation */}
        {authMode !== 'guest' && (
          <>
            <Divider className="my-4">
              <Text className="text-gray-400 text-xs">OR</Text>
            </Divider>
            
            <button
              type="button"
              onClick={() => setAuthMode('guest')}
              className="w-full py-2 px-4 rounded-md border border-gray-300 text-gray-700 font-medium transition duration-200 ease-in-out hover:bg-gray-50 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-400"
            >
              Continue as Guest
            </button>
          </>
        )}

        <div className="text-center mt-4 text-sm text-gray-600">
          {authMode === 'login' ? (
            <>
              Don't have an account?{" "}
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className="text-blue-600 underline underline-offset-4 hover:text-blue-700 font-medium transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Register here
              </button>
            </>
          ) : authMode === 'signup' ? (
            <>
              Already have an account?{" "}
              <button
                type="button"
                onClick={() => setAuthMode('login')}
                className="text-blue-600 underline underline-offset-4 hover:text-blue-700 font-medium transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400"
              >
                Login
              </button>
            </>
          ) : (
            <>
              Need a customer account?{" "}
              <button
                type="button"
                onClick={() => setAuthMode('signup')}
                className="text-blue-600 underline underline-offset-4 hover:text-blue-700 font-medium transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-400 mr-2"
              >
                Register
              </button>
              or{" "}
              <button
                type="button"
                onClick={() => setAuthMode('login')}
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