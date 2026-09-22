const clearAuthStorage = () => {
  try {
    ["customer", "user", "loginTime", "lastActivityTimestamp"].forEach(
      (key) => localStorage.removeItem(key)
    );
  } catch {
    // Ignore storage errors
  }
};

/**
 * Watches for state transitions where isAuthenticated goes from
 * true → false and immediately clears all auth-related storage.
 */
const autoLogoutMiddleware = (store) => (next) => (action) => {
  const preAuth = store.getState()?.customer?.isAuthenticated;

  const result = next(action);

  const state = store.getState()?.customer || {};
  const postAuth = state.isAuthenticated;

  // 1) Auth transition: true → false
  if (preAuth === true && postAuth === false) {
    clearAuthStorage();
  }

  // 2) Unauthenticated but customer data leaks into state
  if (postAuth === false && state.currentCustomer && !state.loading) {
    store.dispatch({ type: "customer/syncWithStorage" });
  }

  // 3) Unauthenticated but stale key in localStorage
  if (!postAuth && !state.loading && localStorage.getItem("customer")) {
    clearAuthStorage();
  }

  return result;
};
export default autoLogoutMiddleware;