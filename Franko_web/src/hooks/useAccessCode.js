// hooks/useAccessCode.js
import { useState, useEffect, useCallback } from 'react';
import { checkAccessCodeValidity, clearAccessCode } from '../components/AccessCodeModal';

const useAccessCode = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [isChecking, setIsChecking] = useState(true);
  const [validationError, setValidationError] = useState(null);

  useEffect(() => {
    // ✅ Async function to check access code validity on mount
    const validateAccess = async () => {
      setIsChecking(true);
      setValidationError(null);
      
      try {
        const isValid = await checkAccessCodeValidity();
        
        if (isValid) {
          setHasAccess(true);
          setShowAccessModal(false);
        } else {
          setHasAccess(false);
          setShowAccessModal(true);
        }
      } catch (error) {
        console.error('Access validation error:', error);
        setValidationError('Failed to validate access. Please try again.');
        setHasAccess(false);
        setShowAccessModal(true);
      } finally {
        setIsChecking(false);
      }
    };

    validateAccess();
  }, []);

  const handleAccessSuccess = useCallback(() => {
    setShowAccessModal(false);
    setHasAccess(true);
    setValidationError(null);
  }, []);

  const revokeAccess = useCallback(() => {
    clearAccessCode();
    setHasAccess(false);
    setShowAccessModal(true);
  }, []);

  const retryValidation = useCallback(async () => {
    setIsChecking(true);
    setValidationError(null);
    
    try {
      const isValid = await checkAccessCodeValidity();
      
      if (isValid) {
        setHasAccess(true);
        setShowAccessModal(false);
      } else {
        setHasAccess(false);
        setShowAccessModal(true);
      }
    } catch (error) {
      console.error('Access validation retry error:', error);
      setValidationError('Failed to validate access. Please try again.');
      setHasAccess(false);
      setShowAccessModal(true);
    } finally {
      setIsChecking(false);
    }
  }, []);

  return {
    hasAccess,
    showAccessModal,
    isChecking,
    validationError,
    handleAccessSuccess,
    revokeAccess,
    retryValidation,
    setShowAccessModal,
  };
};

export default useAccessCode;