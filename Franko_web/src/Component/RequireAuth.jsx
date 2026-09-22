import { useSelector } from "react-redux";
import { useState, useEffect, useCallback } from "react";
import AuthModal from "./AuthModal";

const RequireAuth = ({ children }) => {
  const { isAuthenticated, loading } = useSelector((s) => s.customer);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!isAuthenticated && !loading) {
      setShowModal(true);
    } else {
      setShowModal(false);
    }
  }, [isAuthenticated, loading]);

  const handleClose = useCallback(() => {
    setShowModal(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-700" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="relative min-h-[60vh]">
        {/* Blurred blocked content */}
        <div className="pointer-events-none select-none opacity-30 blur-[2px]">
          {children}
        </div>

        {/* Overlay */}
        <div
          className="absolute inset-0 flex items-center justify-center z-40"
          style={{
            background: "rgba(255,255,255,0.7)",
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="text-center px-6 max-w-md">
            <div className="text-5xl mb-4">🔒</div>
            <p className="text-xl font-bold text-gray-800 mb-2">
              Sign in to continue
            </p>
            <p className="text-sm text-gray-500 mb-5">
              You need to sign in to access checkout and complete your order.
            </p>
            <button
              onClick={() => setShowModal(true)}
              className="px-8 py-3 rounded-lg font-semibold text-sm text-white transition-all hover:opacity-90"
              style={{
                background: "var(--nav-green, #14532d)",
                fontFamily: "'Plus Jakarta Sans', sans-serif",
              }}
            >
              Sign In / Register
            </button>
          </div>
        </div>

        <AuthModal open={showModal} onClose={handleClose} />
      </div>
    );
  }

  return <>{children}</>;
};

export default RequireAuth;