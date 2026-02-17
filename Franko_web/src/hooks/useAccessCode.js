// hooks/useAccessCode.js
import { useState, useEffect, useCallback } from 'react';
import { checkAccessCodeValidity, clearAccessCode } from '../components/AccessCodeModal';

const useAccessCode = () => {
  const [hasAccess, setHasAccess] = useState(false);
  const [showAccessModal, setShowAccessModal] = useState(false);
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Check access code validity on mount
    const isValid = checkAccessCodeValidity();
    
    if (isValid) {
      setHasAccess(true);
      setShowAccessModal(false);
    } else {
      setHasAccess(false);
      setShowAccessModal(true);
    }
    
    setIsChecking(false);
  }, []);

  const handleAccessSuccess = useCallback(() => {
    setShowAccessModal(false);
    setHasAccess(true);
  }, []);

  const revokeAccess = useCallback(() => {
    clearAccessCode();
    setHasAccess(false);
    setShowAccessModal(true);
  }, []);

  return {
    hasAccess,
    showAccessModal,
    isChecking,
    handleAccessSuccess,
    revokeAccess,
    setShowAccessModal,
  };
};

export default useAccessCode;