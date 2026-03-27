// UserLogin.jsx
import { useState, useEffect, useCallback } from 'react';
import { Form, Input, Button, message, Alert, Modal, Progress } from 'antd';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate, Link } from 'react-router-dom';
import { 
  UserOutlined, 
  LockOutlined, 

  CheckCircleOutlined,
  ExclamationCircleOutlined,
  ArrowRightOutlined,
  LoadingOutlined,


} from '@ant-design/icons';
import { 
  loginUser, 
  getUserById, 
  setUser, 
  updateUserPassword,
  clearError 
} from '../../Redux/Slice/userSlice';
import logo from "../../assets/frankoIcon.png";
import withAccessCode from '../../Component/withAccessCode';

// ─────────────────────────────────────────────
// Password strength helpers
// ─────────────────────────────────────────────
const PASSWORD_RULES = [
  { id: "length", label: "At least 8 characters", test: (p) => p.length >= 8 },
  { id: "upper", label: "At least one uppercase letter", test: (p) => /[A-Z]/.test(p) },
  { id: "lower", label: "At least one lowercase letter", test: (p) => /[a-z]/.test(p) },
  { id: "number", label: "At least one number", test: (p) => /\d/.test(p) },
  { id: "symbol", label: "At least one special character", test: (p) => /[^A-Za-z0-9]/.test(p) },
];

const getPasswordStrength = (password) => {
  const passed = PASSWORD_RULES.filter((r) => r.test(password)).length;
  const percentage = (passed / PASSWORD_RULES.length) * 100;
  
  if (passed <= 1) return { score: passed, label: "Very weak", color: "#ff4d4f", percentage };
  if (passed === 2) return { score: passed, label: "Weak", color: "#ff7a45", percentage };
  if (passed === 3) return { score: passed, label: "Fair", color: "#faad14", percentage };
  if (passed === 4) return { score: passed, label: "Strong", color: "#52c41a", percentage };
  return { score: passed, label: "Very strong", color: "#389e0d", percentage };
};

const isStrongPassword = (p) => PASSWORD_RULES.every((r) => r.test(p));

// ─────────────────────────────────────────────
// Force Change Password Modal
// ─────────────────────────────────────────────
const ForceChangePasswordModal = ({ visible, user, onSuccess, onCancel }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(null);
  const [done, setDone] = useState(false);

  const handlePasswordChange = (e) => {
    const password = e.target.value;
    if (password) {
      setPasswordStrength(getPasswordStrength(password));
    } else {
      setPasswordStrength(null);
    }
  };

  const handleSubmit = async (values) => {
    const { oldPassword, newPassword } = values;
    
    if (!isStrongPassword(newPassword)) {
      message.error('New password does not meet strength requirements');
      return;
    }

    if (oldPassword === newPassword) {
      message.error('New password must be different from current password');
      return;
    }

    setLoading(true);
    try {
      await dispatch(updateUserPassword({
        contactNumber: user.contactNumber || user.contact,
        oldPassword,
        newPassword
      })).unwrap();

      // After successful password update, fetch the user profile
      const updated = await dispatch(getUserById({
        contactNumber: user.contactNumber || user.contact,
        accessToken: user.accessToken
      })).unwrap();
      
      // Merge the updated profile with tokens
      const completeUser = {
        ...updated,
        accessToken: user.accessToken,
        refreshToken: user.refreshToken,
        loginStatus: true
      };
      
      dispatch(setUser(completeUser));
      setDone(true);
      message.success('Password updated successfully!');
      
      setTimeout(() => {
        onSuccess(completeUser);
      }, 1500);
    } catch (error) {
      const errorMsg = error?.message || 'Password update failed';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={visible}
      title={
        <div className="flex items-center gap-2">
      
          <span className="text-xl font-semibold">Password Reset Required</span>
        </div>
      }
      footer={null}
      closable={false}
      maskClosable={false}
      width={480}
    >
      {done ? (
        <div className="text-center py-8">
          <CheckCircleOutlined className="text-6xl text-green-500 mb-4" />
          <p className="text-lg font-medium">Password updated successfully!</p>
          <p className="text-gray-500 mt-2">Redirecting...</p>
        </div>
      ) : (
        <>
          <Alert
            message="Your account requires a password update before you can continue."
            description="Please set a strong new password to secure your account."
            type="warning"
            showIcon
            className="mb-4"
          />

          <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
            autoComplete="off"
          >
            <Form.Item
              label="Current Password"
              name="oldPassword"
              rules={[{ required: true, message: 'Please enter your current password' }]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter current password"
                size="large"
              />
            </Form.Item>

            <Form.Item
              label="New Password"
              name="newPassword"
              rules={[
                { required: true, message: 'Please enter a new password' },
                {
                  validator: (_, value) => {
                    if (!value) return Promise.resolve();
                    if (!isStrongPassword(value)) {
                      return Promise.reject('Password does not meet strength requirements');
                    }
                    return Promise.resolve();
                  }
                }
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Enter new password"
                size="large"
                onChange={handlePasswordChange}
              />
            </Form.Item>

            {passwordStrength && (
              <div className="mb-4">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm text-gray-600">Password strength:</span>
                  <span 
                    className="text-sm font-medium"
                    style={{ color: passwordStrength.color }}
                  >
                    {passwordStrength.label}
                  </span>
                </div>
                <Progress
                  percent={passwordStrength.percentage}
                  strokeColor={passwordStrength.color}
                  showInfo={false}
                  size="small"
                />
                <div className="mt-2 space-y-1">
                  {PASSWORD_RULES.map((rule) => {
                    const passed = passwordStrength && 
                      form.getFieldValue('newPassword') && 
                      rule.test(form.getFieldValue('newPassword'));
                    return (
                      <div 
                        key={rule.id} 
                        className={`text-xs flex items-center gap-2 ${
                          passed ? 'text-green-600' : 'text-gray-400'
                        }`}
                      >
                        <CheckCircleOutlined />
                        <span>{rule.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            <Form.Item
              label="Confirm New Password"
              name="confirmPassword"
              dependencies={['newPassword']}
              rules={[
                { required: true, message: 'Please confirm your new password' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('newPassword') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject('Passwords do not match');
                  }
                })
              ]}
            >
              <Input.Password
                prefix={<LockOutlined />}
                placeholder="Confirm new password"
                size="large"
              />
            </Form.Item>

            <div className="flex gap-3">
              <Button
                onClick={onCancel}
                size="large"
                className="flex-1"
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="primary"
                htmlType="submit"
                loading={loading}
                size="large"
                className="flex-1 bg-green-600 hover:bg-green-700"
                icon={<ArrowRightOutlined />}
              >
                Update Password
              </Button>
            </div>
          </Form>
        </>
      )}
    </Modal>
  );
};

// ─────────────────────────────────────────────
// Main Login Component
// ─────────────────────────────────────────────
const UserLogin = () => {
  const [form] = Form.useForm();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, error } = useSelector((state) => state.user);
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(null);
  const [forcePasswordChange, setForcePasswordChange] = useState(false);
  const [pendingUser, setPendingUser] = useState(null);
  const [redirecting, setRedirecting] = useState(false);

  // Clear error on unmount
  useEffect(() => {
    return () => {
      dispatch(clearError());
    };
  }, [dispatch]);

  // Clear errors when form values change
  useEffect(() => {
    if (loginError) {
      setLoginError(null);
    }
  }, [contact, password]);

  const normalizePhone = (value = '') => value.replace(/\D/g, '');

  const handleContactChange = (e) => {
    const value = e.target.value;
    const formatted = normalizePhone(value);
    setContact(formatted);
    form.setFieldsValue({ contact: formatted });
  };

  const routeUserByPosition = (userData) => {
    const position = userData?.position;

    switch (position) {
      case 'Supervisor':
        navigate('/admin/dashboard');
        break;
      case 'Webcontentmanager':
        navigate('/content/dashboard');
        break;
      case 'Fulfillment':
        navigate('/fulfillment/dashboard');
        break;
      case 'Developer':
        navigate('/dev/dashboard');
        break;
      case 'Social':
        navigate('/digi/orders');
        break;
      default:
        navigate('/');
    }
  };

  const onFinish = async () => {
    setLoginError(null);
    
    const normalizedContact = normalizePhone(contact);
    
    if (!normalizedContact) {
      setLoginError('Contact number is required');
      return;
    }
    
    if (normalizedContact.length !== 10) {
      setLoginError('Contact number must be exactly 10 digits');
      return;
    }

    try {
      const result = await dispatch(loginUser({ 
        contact: normalizedContact, 
        password 
      })).unwrap();

      // Check if login requires password change
      if (result.requiresPasswordChange || result.loginStatus === false) {
        setPendingUser(result);
        setForcePasswordChange(true);
        return;
      }

      // Login successful and no password change required
      if (!result?.contactNumber && !result?.contact) {
        setLoginError('Login succeeded but account data is missing. Please try again.');
        return;
      }

      // Everything is good, proceed with login
      dispatch(setUser(result));
      message.success('Login successful!');
      
      // Route user based on position
      routeUserByPosition(result);
      
    } catch (error) {
      const errorMessage = error?.message || 'Login failed';
      const isAccountNotFound = error?.isAccountNotFound === true;

      if (isAccountNotFound) {
        // Show redirect message and navigate to signup
        setRedirecting(true);
        setLoginError('No account found with this number. Redirecting to registration...');
        
        setTimeout(() => {
          navigate('/admin/process', { 
            state: { prefilledContact: normalizedContact } 
          });
        }, 2000);
        return;
      }

      setLoginError(errorMessage);
      
      // Clear password field on error
      form.setFieldsValue({ password: '' });
      setPassword('');
    }
  };

  const handlePasswordChangeSuccess = (updatedUser) => {
    setForcePasswordChange(false);
    setPendingUser(null);
    message.success('Password updated! You are now logged in.');
    
    // Route user based on position
    routeUserByPosition(updatedUser);
  };

  const handlePasswordChangeCancel = () => {
    setForcePasswordChange(false);
    setPendingUser(null);
    setLoginError('Password change cancelled. Please login again.');
    
    // Clear form
    form.resetFields();
    setContact('');
    setPassword('');
  };

  const onFinishFailed = (errorInfo) => {
    message.error('Please fill in all required fields!');
    console.error('Form validation failed:', errorInfo);
  };

  return (
    <>
      {/* Force Password Change Modal */}
      {forcePasswordChange && pendingUser && (
        <ForceChangePasswordModal
          visible={forcePasswordChange}
          user={pendingUser}
          onSuccess={handlePasswordChangeSuccess}
          onCancel={handlePasswordChangeCancel}
        />
      )}

      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 px-4 py-8">
        <div className="max-w-md w-full bg-white shadow-2xl rounded-2xl overflow-hidden">
          {/* Header Section */}
          <div className="bg-gradient-to-r from-green-200 to-green-300 px-8 py-6">
            <div className="text-center">
              <img src={logo} alt="Franko Trading Logo" className="mx-auto h-16 w-24 mb-3" />
              <h2 className="text-2xl font-bold text-white mb-1">Welcome Back</h2>
              <p className="text-green-100 text-sm">Sign in to your account</p>
            </div>
          </div>

          {/* Form Section */}
          <div className="px-8 py-6">
            {/* Error/Redirect Alert */}
            {loginError && (
              <Alert
                message={redirecting ? "Account Not Found" : "Login Failed"}
                description={loginError}
                type={redirecting ? "warning" : "error"}
                closable={!redirecting}
                onClose={() => setLoginError(null)}
                className="mb-4"
                showIcon
                icon={redirecting ? <ExclamationCircleOutlined /> : undefined}
              />
            )}

            {redirecting && (
              <div className="mb-4 flex items-center justify-center">
                <LoadingOutlined className="text-2xl text-orange-500" spin />
                <span className="ml-2 text-gray-600">Redirecting to registration...</span>
              </div>
            )}

            <Form
              form={form}
              layout="vertical"
              onFinish={onFinish}
              onFinishFailed={onFinishFailed}
              className="space-y-4"
              disabled={redirecting}
            >
              {/* Contact Number Field */}
              <Form.Item
                label={<span className="text-gray-700 font-medium">Contact Number</span>}
                name="contact"
                rules={[
                  { required: true, message: 'Please input your contact number!' },
                  { 
                    pattern: /^[0-9]{10}$/, 
                    message: 'Please enter a valid 10-digit contact number' 
                  }
                ]}
              >
                <Input
                  value={contact}
                  onChange={handleContactChange}
                  placeholder="Enter your contact number"
                  prefix={<UserOutlined className="text-gray-400" />}
                  size="large"
                  className="rounded-lg"
                  maxLength={10}
                />
              </Form.Item>

              {/* Password Field */}
              <Form.Item
                label={<span className="text-gray-700 font-medium">Password</span>}
                name="password"
                rules={[
                  { required: true, message: 'Please input your password!' },
                  { min: 4, message: 'Password must be at least 4 characters' }
                ]}
              >
                <Input.Password
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  prefix={<LockOutlined className="text-gray-400" />}
                  size="large"
                  className="rounded-lg"
                />
              </Form.Item>

              {/* Submit Button */}
              <Form.Item className="mb-0">
                <Button
                  type="primary"
                  htmlType="submit"
                  loading={loading}
                  disabled={loading || redirecting}
                  className="w-full bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 border-none h-12 rounded-lg font-semibold text-base shadow-md hover:shadow-lg transition-all duration-300"
                  size="large"
                >
                  {loading ? 'Signing in...' : 'Sign In'}
                </Button>
              </Form.Item>
            </Form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">or</span>
              </div>
            </div>

            {/* Sign Up Link */}
            <div className="text-center">
              <p className="text-gray-600 text-sm">
                Don't have an account?{' '}
                <Link 
                  to="/admin/process" 
                  className="text-green-600 hover:text-green-700 font-semibold transition-colors"
                >
                  Sign Up
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

// HOC handles all access code logic
export default withAccessCode(UserLogin);