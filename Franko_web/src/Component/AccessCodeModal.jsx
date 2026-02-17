// Component/AccessCodeModal.jsx
import React, { useState } from 'react';
import { Modal, Input, Button, message } from 'antd';
import { LockOutlined, SafetyOutlined } from '@ant-design/icons';
import axios from 'axios';

// Get Lambda URL from environment
const LAMBDA_BASE_URL = import.meta.env.VITE_LAMBDA_BASE_URL;

// LocalStorage keys
const ACCESS_CODE_KEY = 'admin_access_code';
const ACCESS_CODE_EXPIRY_KEY = 'admin_access_code_expiry';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// ============ Utility Functions ============

export const checkAccessCodeValidity = () => {
  const storedCode = localStorage.getItem(ACCESS_CODE_KEY);
  const expiryTime = localStorage.getItem(ACCESS_CODE_EXPIRY_KEY);
  
  if (!storedCode || !expiryTime) {
    return false;
  }
  
  const now = Date.now();
  if (now > Number(expiryTime)) {
    // Clear expired access code
    clearAccessCode();
    return false;
  }
  
  // Check if the stored value is 'verified'
  return storedCode === 'verified';
};

export const storeAccessCode = () => {
  const expiryTime = Date.now() + SEVEN_DAYS_MS;
  // Store 'verified' instead of the actual code for security
  localStorage.setItem(ACCESS_CODE_KEY, 'verified');
  localStorage.setItem(ACCESS_CODE_EXPIRY_KEY, String(expiryTime));
};

export const clearAccessCode = () => {
  localStorage.removeItem(ACCESS_CODE_KEY);
  localStorage.removeItem(ACCESS_CODE_EXPIRY_KEY);
};

export const getAccessCodeExpiryInfo = () => {
  const expiryTime = localStorage.getItem(ACCESS_CODE_EXPIRY_KEY);
  if (!expiryTime) return null;
  
  const remaining = Number(expiryTime) - Date.now();
  if (remaining <= 0) return null;
  
  const days = Math.floor(remaining / (24 * 60 * 60 * 1000));
  const hours = Math.floor((remaining % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000));
  
  return { days, hours, expiryDate: new Date(Number(expiryTime)) };
};

// ============ API Call to Lambda ============

const verifyAccessCodeWithBackend = async (accessCode) => {
  try {
    // Use axios directly (not axiosInstance) to avoid the Identifier header
    // The Lambda skips header check for /Auth/Verify-Access-Code endpoint
    const response = await axios.post(
      `${LAMBDA_BASE_URL}/?endpoint=/Auth/Verify-Access-Code`,
      { accessCode },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      }
    );
    
    return {
      success: response.data?.success || false,
      message: response.data?.message || 'Verification failed',
      attemptsRemaining: response.data?.attemptsRemaining,
    };
  } catch (error) {
    const status = error.response?.status;
    const errorData = error.response?.data;
    
    // Handle rate limiting (429)
    if (status === 429) {
      return {
        success: false,
        message: 'Too many attempts. Please try again in 15 minutes.',
        isRateLimited: true,
      };
    }
    
    // Handle unauthorized (401) - invalid access code
    if (status === 401) {
      return {
        success: false,
        message: errorData?.message || 'Invalid access code',
        attemptsRemaining: errorData?.attemptsRemaining,
      };
    }
    
    // Handle other errors
    return {
      success: false,
      message: errorData?.message || 'Network error. Please try again.',
      attemptsRemaining: errorData?.attemptsRemaining,
    };
  }
};

// ============ Modal Component ============

const AccessCodeModal = ({ visible, onSuccess, onCancel }) => {
  const [accessCode, setAccessCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);

  const handleSubmit = async () => {
    if (!accessCode.trim()) {
      message.warning('Please enter an access code');
      return;
    }

    if (isLocked || attempts >= 5) {
      message.error('Access locked. Please try again later.');
      return;
    }

    setLoading(true);
    
    try {
      const result = await verifyAccessCodeWithBackend(accessCode.trim());
      
      if (result.success) {
        // Store verification status in localStorage
        storeAccessCode();
        message.success('Access granted! You can now proceed.');
        setAccessCode('');
        setAttempts(0);
        onSuccess();
      } else {
        // Handle rate limiting
        if (result.isRateLimited) {
          setIsLocked(true);
          message.error(result.message);
        } else {
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          
          if (newAttempts >= 5) {
            message.error('Too many failed attempts. Please contact administrator.');
          } else {
            const remaining = result.attemptsRemaining ?? (5 - newAttempts);
            message.error(`Invalid access code. ${remaining} attempts remaining.`);
          }
        }
        setAccessCode('');
      }
    } catch (error) {

      message.error('Failed to verify access code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !loading && !isLocked && attempts < 5) {
      handleSubmit();
    }
  };

  const isDisabled = attempts >= 5 || loading || isLocked;

  return (
    <Modal
      title={null}
      open={visible}
      closable={false}
      maskClosable={false}
      footer={null}
      centered
      width={400}
    >
      <div className="py-6 px-2">
        {/* Icon and Title */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
            <SafetyOutlined className="text-3xl text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-800">Access Code Required</h2>
          <p className="text-gray-500 text-sm mt-2">
            This area is restricted. Please enter your access code to continue.
          </p>
        </div>

        {/* Access Code Input */}
        <div className="space-y-4">
          <Input.Password
            placeholder="Enter access code"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value)}
            onKeyPress={handleKeyPress}
            size="large"
            prefix={<LockOutlined className="text-gray-400" />}
            disabled={isDisabled}
            className="rounded-lg"
            autoFocus
          />
          
          {attempts > 0 && attempts < 5 && !isLocked && (
            <p className="text-red-500 text-sm text-center">
              {5 - attempts} attempts remaining
            </p>
          )}

          {(attempts >= 5 || isLocked) && (
            <p className="text-red-500 text-sm text-center">
              {isLocked 
                ? 'Rate limit exceeded. Please try again in 15 minutes.'
                : 'Access locked. Please contact administrator.'}
            </p>
          )}

          <Button
            type="primary"
            onClick={handleSubmit}
            loading={loading}
            disabled={isDisabled}
            className="w-full bg-green-700 hover:bg-green-800 h-10 rounded-lg"
            size="large"
          >
            {loading ? 'Verifying...' : 'Verify Access Code'}
          </Button>

          {onCancel && (
            <Button
              onClick={onCancel}
              className="w-full h-10 rounded-lg"
              size="large"
            >
              Cancel
            </Button>
          )}
        </div>

       
      </div>
    </Modal>
  );
};

export default AccessCodeModal;