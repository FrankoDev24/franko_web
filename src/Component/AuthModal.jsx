import {
    Modal,
    Input,
    Button,
    Typography,
    Space,
    message,
  } from "antd";
  import {
    UserOutlined,
    LockOutlined,
    HomeOutlined,
    PhoneOutlined,
    MailOutlined,
  } from "@ant-design/icons";
  import { useState, useEffect, useCallback } from "react";
  import { useDispatch } from "react-redux";
  import { createCustomer, loginCustomer } from "../Redux/Slice/customerSlice";
 import { v4 as uuidv4 } from "uuid";
  import logo from "../assets/frankoIcon.png";
  
  const { Title, Text } = Typography;
  
  const AuthModal = ({ open, onClose }) => {
    const dispatch = useDispatch();

    const [isLogin, setIsLogin] = useState(true);
    const [loading, setLoading] = useState(false);
  
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
  
    const handleSignup = async () => {
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
        message.success("Registration successful!");
        onClose(); // ✅ Just close the modal
      } catch (error) {
        console.error("Registration error:", error);
        message.error("Registration failed.");
      } finally {
        setLoading(false);
      }
    };
    
    const handleLogin = async () => {
      setLoading(true);
      try {
        await dispatch(loginCustomer(loginData)).unwrap();
        message.success("Login successful!");
        onClose(); // ✅ Just close the modal
      } catch (error) {
        message.error(error || "Login failed.");
      } finally {
        setLoading(false);
      }
    };
    
  
    return (
      <Modal
        open={open}
        onCancel={onClose}
        footer={null}
        centered
        width={400}
        maskClosable={true} // allows closing by clicking outside
      >
        <div className="text-center mb-4">
          <img
            src={logo}
            alt="Logo"
            className="h-16 mx-auto  mb-2"
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
                onChange={handleSignupChange}
                prefix={<UserOutlined />}
              />
              <Input
                name="lastName"
                placeholder="Last Name"
                onChange={handleSignupChange}
                prefix={<UserOutlined />}
              />
              <Input
                name="email"
                type="email"
                placeholder="Email"
                onChange={handleSignupChange}
                prefix={<MailOutlined />}
              />
              <Input
                name="contactNumber"
                placeholder="Contact Number"
                onChange={handleSignupChange}
                prefix={<PhoneOutlined />}
              />
              <Input
                name="address"
                placeholder="Address"
                onChange={handleSignupChange}
                prefix={<HomeOutlined />}
              />
              <Input.Password
                name="password"
                placeholder="Password"
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
      Don’t have an account?{" "}
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
    );
  };
  
  export default AuthModal;
  