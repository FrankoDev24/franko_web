// src/pages/Cart.jsx
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateCartItem, deleteCartItem, getCartById } from '../Redux/Slice/cartSlice';
import { Checkbox, Dialog, DialogHeader, DialogBody, DialogFooter } from '@material-tailwind/react';
import AuthModal from "../Component/AuthModal";
import { 
  TrashIcon, 
  MinusIcon, 
  PlusIcon, 
  ShoppingBagIcon, 
  ArrowLeftIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';

// ==================== UTILITY FUNCTIONS ====================

const formatCurrency = (amount, decimals = 2) => {
  const num = parseFloat(amount) || 0;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const formatGHS = (amount) => `GH₵${formatCurrency(amount, 2)}`;

const getItemLineTotal = (item) => {
  const price = parseFloat(item.price) || 0;
  const quantity = parseInt(item.quantity, 10) || 1;
  return price * quantity;
};

// ==================== MAIN COMPONENT ====================

const Cart = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);

  const { cart, loading, error, cartId } = useSelector((state) => state.cart);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  const [deleteModal, setDeleteModal] = useState({
    open: false,
    productId: null,
    productName: '',
  });

  const [networkError, setNetworkError] = useState({
    show: false,
    message: '',
  });

  // ==================== EFFECTS ====================

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  useEffect(() => {
    const storedId = cartId || localStorage.getItem('cartId');
    if (storedId) {
      dispatch(getCartById(storedId));
    }
  }, [dispatch, cartId]);

  useEffect(() => {
    if (cart && cart.length >= 0) {
      try {
        localStorage.setItem('cart', JSON.stringify(cart));
      } catch (err) {
        console.error('Failed to sync cart to localStorage:', err);
      }
    }
  }, [cart]);

  useEffect(() => {
    setSelectedItems([]);
    setSelectAll(false);
  }, [cart]);

  // ==================== SELECTION HANDLERS ====================

  const toggleSelectAll = () => {
    const allSelected = !selectAll;
    setSelectAll(allSelected);
    setSelectedItems(allSelected ? cart.map((item) => item.productId) : []);
  };

  const toggleItemSelection = (productId) => {
    setSelectedItems((prev) => {
      const newSelection = prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId];
      setSelectAll(newSelection.length === cart.length && cart.length > 0);
      return newSelection;
    });
  };

  // ==================== NAVIGATION HANDLERS ====================

  const handleCheckout = () => {
    const storedCustomer = localStorage.getItem('customer');

    if (!storedCustomer) {
      setAuthModalOpen(true);
      return;
    }

    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'proceed_to_checkout',
      cartValue: calculateSubtotal().toFixed(2),
      cartItems: cart.map((item) => ({
        productId: item.productId,
        name: item.productName,
        price: item.price,
        quantity: item.quantity,
      })),
    });

    localStorage.setItem('selectedCart', JSON.stringify(cart));
    navigate('/checkout');
  };

  const handleContinueShopping = () => {
    navigate('/products');
  };

  // ==================== CART MODIFICATION HANDLERS ====================

  const handleQuantityChange = async (productId, quantity) => {
    if (quantity >= 1) {
      const previousLocalStorage = localStorage.getItem('cart');

      try {
        const optimisticCart = cart.map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity,
                total: parseFloat(item.price) * quantity,
              }
            : item
        );
        localStorage.setItem('cart', JSON.stringify(optimisticCart));

        const updatePayload = {
          CartId: cartId,
          ProductId: String(productId),
          Quantity: quantity,
        };

        await dispatch(updateCartItem(updatePayload)).unwrap();
        await dispatch(getCartById(cartId)).unwrap();
      } catch (err) {
        console.error('Error updating quantity:', err);

        if (previousLocalStorage) {
          localStorage.setItem('cart', previousLocalStorage);
        }

        setNetworkError({
          show: true,
          message: 'Failed to update cart. Please check your connection and try again.',
        });

        try {
          await dispatch(getCartById(cartId)).unwrap();
        } catch (refetchError) {
          console.error('Failed to refetch cart:', refetchError);
        }

        setTimeout(() => setNetworkError({ show: false, message: '' }), 5000);
      }
    }
  };

  const handleRemoveItemClick = (productId, productName) => {
    setDeleteModal({ open: true, productId, productName });
  };

  const handleConfirmRemoveItem = async () => {
    const previousLocalStorage = localStorage.getItem('cart');
    const productIdToDelete = deleteModal.productId;

    try {
      const optimisticCart = cart.filter(
        (item) => item.productId !== productIdToDelete
      );
      localStorage.setItem('cart', JSON.stringify(optimisticCart));

      const deletePayload = {
        CartId: cartId,
        ProductId: String(productIdToDelete),
      };

      await dispatch(deleteCartItem(deletePayload)).unwrap();
      setSelectedItems((prev) => prev.filter((id) => id !== productIdToDelete));
      setDeleteModal({ open: false, productId: null, productName: '' });
      await dispatch(getCartById(cartId)).unwrap();
    } catch (err) {
      console.error('Error removing item:', err);

      if (previousLocalStorage) {
        localStorage.setItem('cart', previousLocalStorage);
      }

      setNetworkError({
        show: true,
        message: 'Failed to remove item. Please check your connection and try again.',
      });

      setDeleteModal({ open: false, productId: null, productName: '' });

      try {
        await dispatch(getCartById(cartId)).unwrap();
      } catch (refetchError) {
        console.error('Failed to refetch cart:', refetchError);
      }

      setTimeout(() => setNetworkError({ show: false, message: '' }), 5000);
    }
  };

  const handleBatchDelete = async () => {
    const previousLocalStorage = localStorage.getItem('cart');
    const itemsToDelete = [...selectedItems];

    try {
      const optimisticCart = cart.filter(
        (item) => !itemsToDelete.includes(item.productId)
      );
      localStorage.setItem('cart', JSON.stringify(optimisticCart));

      const deletePromises = itemsToDelete.map((id) =>
        dispatch(
          deleteCartItem({ CartId: cartId, ProductId: String(id) })
        ).unwrap()
      );

      await Promise.all(deletePromises);
      setSelectedItems([]);
      setSelectAll(false);
      setOpenModal(false);
      await dispatch(getCartById(cartId)).unwrap();
    } catch (err) {
      console.error('Error removing items:', err);

      if (previousLocalStorage) {
        localStorage.setItem('cart', previousLocalStorage);
      }

      setNetworkError({
        show: true,
        message: 'Failed to remove items. Please check your connection and try again.',
      });

      setOpenModal(false);

      try {
        await dispatch(getCartById(cartId)).unwrap();
      } catch (refetchError) {
        console.error('Failed to refetch cart:', refetchError);
      }

      setTimeout(() => setNetworkError({ show: false, message: '' }), 5000);
    }
  };

  // ==================== CALCULATION FUNCTIONS ====================

  const calculateSubtotal = () => {
    return cart.reduce((acc, item) => acc + getItemLineTotal(item), 0);
  };

  const cartTotal = calculateSubtotal();
  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // ==================== IMAGE RENDERING ====================

  const renderImage = (imagePath) => {
    if (!imagePath) {
      return (
        <div className="w-full h-full flex items-center justify-center" style={{ background: 'var(--cart-bg-subtle)' }}>
          <span style={{ color: 'var(--cart-light)', fontSize: '11px' }}>No Image</span>
        </div>
      );
    }
    const backendBaseURL = 'https://ct002.frankotrading.com:444';
    const imageUrl = `${backendBaseURL}/Media/Products_Images/${imagePath.split('\\').pop()}`;
    return (
      <img
        src={imageUrl}
        alt="Product"
        className="w-full h-full object-cover"
        onError={(e) => {
          e.target.style.display = 'none';
          if (e.target.nextSibling) e.target.nextSibling.style.display = 'flex';
        }}
      />
    );
  };

  // ==================== LOADING STATE ====================

  if (loading) {
    return (
      <>
        <style>{cartStyles}</style>
        <div className="cart-root flex items-center justify-center min-h-screen" style={{ background: 'var(--cart-bg-subtle)' }}>
          <div className="text-center">
            <div className="cart-spinner-large mx-auto mb-4"></div>
            <p style={{ color: 'var(--cart-mid)', fontWeight: 600 }}>Loading your cart items...</p>
          </div>
        </div>
      </>
    );
  }

  // ==================== ERROR STATE ====================

  if (error) {
    return (
      <>
        <style>{cartStyles}</style>
        <div className="cart-root flex items-center justify-center min-h-screen" style={{ background: 'var(--cart-bg-subtle)' }}>
          <div className="cart-empty-card">
            <div className="cart-empty-icon-wrap" style={{ background: '#fef2f2' }}>
              <ExclamationTriangleIcon className="w-10 h-10" style={{ color: 'var(--cart-red)' }} />
            </div>
            <h3 className="cart-empty-title">Oops! Something went wrong</h3>
            <p className="cart-empty-text">We couldn't load your cart. Please try again.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="cart-btn cart-btn-primary"
              style={{ marginTop: '24px' }}
            >
              Try Again
            </button>
          </div>
        </div>
      </>
    );
  }

  // ==================== MAIN RENDER ====================

  return (
    <>
      <style>{cartStyles}</style>
      <div className="cart-root min-h-screen" style={{ background: 'var(--cart-bg-subtle)' }}>
        {/* Network Error Notification */}
        {networkError.show && (
          <div className="cart-notification cart-notification-error">
            <ExclamationTriangleIcon className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--cart-red)' }} />
            <p className="cart-notification-text">{networkError.message}</p>
            <button
              onClick={() => setNetworkError({ show: false, message: '' })}
              className="cart-notification-close"
            >
              <XMarkIcon className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Header */}
        <div className="cart-header">
          <div className="cart-header-inner">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(-1)}
                className="cart-back-btn"
              >
                <ArrowLeftIcon className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <div className="cart-header-icon">
                  <ShoppingBagIcon className="w-5 h-5" style={{ color: 'var(--cart-green)' }} />
                </div>
                <h1 className="cart-header-title">Shopping Cart</h1>
              </div>
            </div>
            {cart.length > 0 && (
              <div className="cart-header-badge">
                {totalCartItems} Item{totalCartItems !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 py-6">
          {/* EMPTY CART STATE */}
          {cart.length === 0 ? (
            <div className="flex items-center justify-center min-h-[60vh]">
              <div className="cart-empty-card">
                <div className="cart-empty-icon-wrap">
                  <ShoppingBagIcon className="w-12 h-12" style={{ color: 'var(--cart-border)' }} />
                </div>
                <h3 className="cart-empty-title">Your cart is empty</h3>
                <p className="cart-empty-text">
                  Looks like you haven't added anything to your cart yet.
                  Start shopping to fill it up!
                </p>
                <div className="space-y-3" style={{ marginTop: '32px' }}>
                  <button
                    onClick={handleContinueShopping}
                    className="cart-btn cart-btn-primary w-full"
                  >
                    Continue Shopping
                  </button>
                  <button
                    onClick={() => navigate('/')}
                    className="cart-btn cart-btn-outline w-full"
                  >
                    Back to Home
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* Cart Controls */}
              <div className="cart-controls">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selectAll}
                    onChange={toggleSelectAll}
                    label={
                      <span className="cart-select-label">
                        Select All ({cart.length} items)
                      </span>
                    }
                    ripple={false}
                    className="hover:before:opacity-10"
                    color="green"
                  />
                </div>
                {selectedItems.length > 0 && (
                  <button
                    onClick={() => setOpenModal(true)}
                    className="cart-delete-selected-btn"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete Selected ({selectedItems.length})
                  </button>
                )}
              </div>

              <div className="flex flex-col lg:flex-row gap-6">
                {/* CART ITEMS SECTION */}
                <div className="flex-1">
                  <div className="cart-items-container">
                    {cart.map((item, index) => {
                      const lineTotal = getItemLineTotal(item);
                      return (
                        <div key={item.productId}>
                          <div className="cart-item">
                            <div className="cart-item-inner">
                              {/* Checkbox and Product Info */}
                              <div className="cart-item-left">
                                <Checkbox
                                  checked={selectedItems.includes(item.productId)}
                                  onChange={() => toggleItemSelection(item.productId)}
                                  ripple={false}
                                  className="hover:before:opacity-10"
                                  color="green"
                                />
                                <div className="cart-item-image">
                                  {renderImage(item.imagePath)}
                                </div>
                                <div className="cart-item-info">
                                  <h4 className="cart-item-name">
                                    {item.productName}
                                  </h4>
                                  <p className="cart-item-price">
                                    {formatGHS(item.price)}
                                  </p>
                                </div>
                              </div>

                              {/* Quantity and Actions */}
                              <div className="cart-item-right">
                                {/* Quantity Controls */}
                                <div className="cart-qty-control">
                                  <button
                                    className="cart-qty-btn"
                                    onClick={() =>
                                      handleQuantityChange(item.productId, item.quantity - 1)
                                    }
                                    disabled={item.quantity <= 1}
                                  >
                                    <MinusIcon className="w-4 h-4" />
                                  </button>
                                  <span className="cart-qty-value">
                                    {item.quantity}
                                  </span>
                                  <button
                                    className="cart-qty-btn"
                                    onClick={() =>
                                      handleQuantityChange(item.productId, item.quantity + 1)
                                    }
                                  >
                                    <PlusIcon className="w-4 h-4" />
                                  </button>
                                </div>

                                {/* Line Total */}
                                <div className="cart-item-total">
                                  {formatGHS(lineTotal)}
                                </div>

                                {/* Remove Button */}
                                <button
                                  className="cart-remove-btn"
                                  onClick={() =>
                                    handleRemoveItemClick(item.productId, item.productName)
                                  }
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                          {index < cart.length - 1 && <div className="cart-divider" />}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* ORDER SUMMARY - DESKTOP */}
                <div className="hidden lg:block w-96">
                  <div className="cart-summary">
                    <div className="cart-summary-header">
                      <div className="cart-summary-icon">
                        <ShoppingBagIcon className="w-4 h-4" style={{ color: 'var(--cart-green)' }} />
                      </div>
                      <h2 className="cart-summary-title">Order Summary</h2>
                    </div>

                    <div className="cart-summary-body">
                      <div className="cart-summary-row">
                        <span className="cart-summary-label">Subtotal ({totalCartItems} items):</span>
                        <span className="cart-summary-value">{formatGHS(cartTotal)}</span>
                      </div>
                      <div className="cart-divider" style={{ margin: '16px 0' }} />
                      <div className="cart-summary-row">
                        <span className="cart-summary-total-label">Total:</span>
                        <span className="cart-summary-total-value">{formatGHS(cartTotal)}</span>
                      </div>
                    </div>

                    <p className="cart-summary-note">
                      * Taxes, discounts & shipping calculated at checkout
                    </p>

                    <div className="cart-summary-actions">
                      <button
                        onClick={handleCheckout}
                        className="cart-btn cart-btn-primary w-full"
                      >
                        Proceed to Checkout
                      </button>
                      <button
                        onClick={handleContinueShopping}
                        className="cart-btn cart-btn-outline w-full"
                      >
                        Continue Shopping
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* MOBILE ORDER SUMMARY - FIXED BOTTOM */}
        {cart.length > 0 && (
          <div className="cart-mobile-summary">
            <div className="cart-mobile-summary-inner">
              <div className="cart-mobile-summary-row">
                <span className="cart-mobile-summary-label">Cart Total:</span>
                <span className="cart-mobile-summary-value">{formatGHS(cartTotal)}</span>
              </div>
              <button
                onClick={handleCheckout}
                className="cart-btn cart-btn-primary w-full"
              >
                Proceed to Checkout
              </button>
            </div>
          </div>
        )}

        {/* BATCH DELETE CONFIRMATION MODAL */}
        <Dialog open={openModal} handler={setOpenModal} className="cart-dialog">
          <DialogHeader className="cart-dialog-header">
            <div className="flex items-center gap-2">
              <TrashIcon className="w-5 h-5" style={{ color: 'var(--cart-red)' }} />
              <span>Confirm Deletion</span>
            </div>
          </DialogHeader>
          <DialogBody className="cart-dialog-body">
            Are you sure you want to remove {selectedItems.length} item
            {selectedItems.length !== 1 ? 's' : ''} from your cart? This action cannot be undone.
          </DialogBody>
          <DialogFooter className="cart-dialog-footer">
            <button
              onClick={() => setOpenModal(false)}
              className="cart-btn cart-btn-outline"
            >
              Cancel
            </button>
            <button 
              onClick={handleBatchDelete} 
              className="cart-btn cart-btn-danger"
            >
              Remove Items
            </button>
          </DialogFooter>
        </Dialog>

        {/* INDIVIDUAL DELETE CONFIRMATION MODAL */}
        <Dialog
          open={deleteModal.open}
          handler={() => setDeleteModal({ open: false, productId: null, productName: '' })}
          className="cart-dialog"
        >
          <DialogHeader className="cart-dialog-header">
            <div className="flex items-center gap-2">
              <TrashIcon className="w-5 h-5" style={{ color: 'var(--cart-red)' }} />
              <span>Remove Item</span>
            </div>
          </DialogHeader>
          <DialogBody className="cart-dialog-body">
            Are you sure you want to remove "
            <strong style={{ color: 'var(--cart-dark)' }}>{deleteModal.productName}</strong>" from your cart? This action cannot be undone.
          </DialogBody>
          <DialogFooter className="cart-dialog-footer">
            <button
              onClick={() => setDeleteModal({ open: false, productId: null, productName: '' })}
              className="cart-btn cart-btn-outline"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRemoveItem}
              className="cart-btn cart-btn-danger"
            >
              Remove Item
            </button>
          </DialogFooter>
        </Dialog>

        {/* AUTH MODAL */}
        <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
      </div>
    </>
  );
};

// ==================== STYLES ====================

const cartStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700;800;900&display=swap');

  :root {
    --cart-font: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    --cart-green: #14532d;
    --cart-green-mid: #166534;
    --cart-green-light: #dcfce7;
    --cart-green-lighter: #f0fdf4;
    --cart-green-accent: #22c55e;
    --cart-dark: #1a1a1a;
    --cart-mid: #555;
    --cart-light: #888;
    --cart-border: #e0e0e0;
    --cart-bg-subtle: #f7f7f7;
    --cart-red: #dc2626;
    --cart-radius: 4px;
  }

  .cart-root, .cart-root * {
    font-family: var(--cart-font);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    box-sizing: border-box;
  }

  /* ==================== HEADER ==================== */

  .cart-header {
    background: #fff;
    border-bottom: 1px solid var(--cart-border);
    position: sticky;
    top: 0;
    z-index: 40;
  }

  .cart-header-inner {
    max-width: 1280px;
    margin: 0 auto;
    padding: 12px 16px;
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .cart-back-btn {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--cart-bg-subtle);
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    color: var(--cart-mid);
  }

  .cart-back-btn:hover {
    background: var(--cart-green-light);
    color: var(--cart-green);
  }

  .cart-header-icon {
    width: 36px;
    height: 36px;
    background: var(--cart-green-light);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cart-header-title {
    font-size: 20px;
    font-weight: 800;
    color: var(--cart-dark);
    letter-spacing: -0.02em;
    margin: 0;
  }

  @media (min-width: 768px) {
    .cart-header-title { font-size: 24px; }
  }

  .cart-header-badge {
    background: var(--cart-green-light);
    color: var(--cart-green);
    padding: 4px 12px;
    border-radius: 100px;
    font-size: 13px;
    font-weight: 700;
  }

  /* ==================== NOTIFICATIONS ==================== */

  .cart-notification {
    position: fixed;
    top: 16px;
    right: 16px;
    z-index: 50;
    max-width: 400px;
    padding: 12px 16px;
    border-radius: var(--cart-radius);
    border-left: 4px solid;
    display: flex;
    align-items: center;
    gap: 10px;
    animation: cart-slide-in 0.3s ease-out;
  }

  .cart-notification-error {
    background: #fef2f2;
    border-left-color: var(--cart-red);
  }

  .cart-notification-text {
    font-size: 13px;
    font-weight: 500;
    color: #991b1b;
    flex: 1;
    margin: 0;
  }

  .cart-notification-close {
    background: transparent;
    border: none;
    cursor: pointer;
    padding: 4px;
    color: var(--cart-red);
    transition: opacity 0.2s;
  }

  .cart-notification-close:hover {
    opacity: 0.7;
  }

  @keyframes cart-slide-in {
    from { transform: translateX(100%); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  /* ==================== EMPTY STATE ==================== */

  .cart-empty-card {
    background: #fff;
    padding: 48px 32px;
    border-radius: var(--cart-radius);
    border: 1px solid var(--cart-border);
    max-width: 400px;
    text-align: center;
  }

  .cart-empty-icon-wrap {
    width: 96px;
    height: 96px;
    background: var(--cart-bg-subtle);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 24px;
  }

  .cart-empty-title {
    font-size: 22px;
    font-weight: 800;
    color: var(--cart-dark);
    margin: 0 0 8px;
    letter-spacing: -0.02em;
  }

  .cart-empty-text {
    font-size: 14px;
    color: var(--cart-light);
    line-height: 1.6;
    margin: 0;
  }

  /* ==================== CONTROLS ==================== */

  .cart-controls {
    background: #fff;
    border: 1px solid var(--cart-border);
    border-radius: var(--cart-radius);
    padding: 12px 16px;
    margin-bottom: 16px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
  }

  .cart-select-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--cart-mid);
  }

  .cart-delete-selected-btn {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    border-radius: var(--cart-radius);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    background: #fef2f2;
    color: var(--cart-red);
    border: 1px solid #fecaca;
  }

  .cart-delete-selected-btn:hover {
    background: #fecaca;
  }

  /* ==================== CART ITEMS ==================== */

  .cart-items-container {
    background: #fff;
    border: 1px solid var(--cart-border);
    border-radius: var(--cart-radius);
    overflow: hidden;
  }

  .cart-item {
    padding: 16px;
    transition: background 0.2s ease;
  }

  .cart-item:hover {
    background: var(--cart-green-lighter);
  }

  .cart-item-inner {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  @media (min-width: 640px) {
    .cart-item-inner {
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
    }
  }

  .cart-item-left {
    display: flex;
    align-items: center;
    gap: 12px;
    flex: 1;
    min-width: 0;
  }

  .cart-item-image {
    width: 72px;
    height: 72px;
    background: var(--cart-bg-subtle);
    border-radius: var(--cart-radius);
    overflow: hidden;
    flex-shrink: 0;
  }

  .cart-item-info {
    flex: 1;
    min-width: 0;
  }

  .cart-item-name {
    font-size: 15px;
    font-weight: 600;
    color: var(--cart-dark);
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    margin: 0 0 4px;
  }

  .cart-item-price {
    font-size: 15px;
    font-weight: 900;
    color: var(--cart-red);
    margin: 0;
  }

  .cart-item-right {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
  }

  @media (min-width: 640px) {
    .cart-item-right {
      justify-content: flex-end;
      gap: 24px;
    }
  }

  .cart-item-total {
    font-size: 15px;
    font-weight: 800;
    color: var(--cart-dark);
    min-width: 80px;
    text-align: right;
  }

  .cart-remove-btn {
    width: 36px;
    height: 36px;
    background: #fef2f2;
    border: none;
    border-radius: var(--cart-radius);
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    color: var(--cart-red);
  }

  .cart-remove-btn:hover {
    background: #fecaca;
  }

  .cart-divider {
    height: 1px;
    background: var(--cart-border);
  }

  /* ==================== QUANTITY CONTROLS ==================== */

  .cart-qty-control {
    display: flex;
    align-items: center;
    background: var(--cart-bg-subtle);
    border: 1px solid var(--cart-border);
    border-radius: var(--cart-radius);
  }

  .cart-qty-btn {
    width: 36px;
    height: 36px;
    background: transparent;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.15s ease;
    color: var(--cart-mid);
  }

  .cart-qty-btn:hover:not(:disabled) {
    background: var(--cart-green-light);
    color: var(--cart-green);
  }

  .cart-qty-btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .cart-qty-value {
    width: 40px;
    text-align: center;
    font-size: 14px;
    font-weight: 700;
    color: var(--cart-dark);
  }

  /* ==================== ORDER SUMMARY ==================== */

  .cart-summary {
    background: #fff;
    border: 1px solid var(--cart-border);
    border-radius: var(--cart-radius);
    padding: 24px;
    position: sticky;
    top: 80px;
  }

  .cart-summary-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 24px;
  }

  .cart-summary-icon {
    width: 28px;
    height: 28px;
    background: var(--cart-green-light);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .cart-summary-title {
    font-size: 18px;
    font-weight: 800;
    color: var(--cart-dark);
    margin: 0;
    letter-spacing: -0.02em;
  }

  .cart-summary-body {
    margin-bottom: 16px;
  }

  .cart-summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .cart-summary-label {
    font-size: 14px;
    color: var(--cart-mid);
  }

  .cart-summary-value {
    font-size: 14px;
    font-weight: 600;
    color: var(--cart-dark);
  }

  .cart-summary-total-label {
    font-size: 16px;
    font-weight: 700;
    color: var(--cart-dark);
  }

  .cart-summary-total-value {
    font-size: 20px;
    font-weight: 900;
    color: var(--cart-red);
  }

  .cart-summary-note {
    font-size: 11px;
    color: var(--cart-light);
    text-align: center;
    margin: 0 0 20px;
  }

  .cart-summary-actions {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  /* ==================== MOBILE SUMMARY ==================== */

  .cart-mobile-summary {
    display: block;
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #fff;
    border-top: 1px solid var(--cart-border);
    box-shadow: 0 -4px 20px rgba(0,0,0,0.08);
    z-index: 50;
  }

  @media (min-width: 1024px) {
    .cart-mobile-summary { display: none; }
  }

  .cart-mobile-summary-inner {
    max-width: 100%;
    padding: 16px;
  }

  .cart-mobile-summary-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  .cart-mobile-summary-label {
    font-size: 14px;
    font-weight: 600;
    color: var(--cart-mid);
  }

  .cart-mobile-summary-value {
    font-size: 18px;
    font-weight: 900;
    color: var(--cart-red);
  }

  /* ==================== BUTTONS ==================== */

  .cart-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px 24px;
    border-radius: var(--cart-radius);
    font-size: 14px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
    border: 2px solid transparent;
  }

  .cart-btn-primary {
    background: var(--cart-green);
    color: #fff;
    border-color: var(--cart-green);
  }

  .cart-btn-primary:hover {
    background: var(--cart-green-mid);
    border-color: var(--cart-green-mid);
    box-shadow: 0 4px 16px rgba(20, 83, 45, 0.2);
  }

  .cart-btn-outline {
    background: #fff;
    color: var(--cart-mid);
    border-color: var(--cart-border);
  }

  .cart-btn-outline:hover {
    background: var(--cart-bg-subtle);
    border-color: var(--cart-green-accent);
  }

  .cart-btn-danger {
    background: var(--cart-red);
    color: #fff;
    border-color: var(--cart-red);
  }

  .cart-btn-danger:hover {
    background: #b91c1c;
    border-color: #b91c1c;
  }

  /* ==================== DIALOG ==================== */

  .cart-dialog {
    border-radius: var(--cart-radius) !important;
    font-family: var(--cart-font) !important;
  }

  .cart-dialog-header {
    font-size: 18px;
    font-weight: 800;
    color: var(--cart-dark);
    padding: 20px 24px;
    border-bottom: 1px solid var(--cart-border);
  }

  .cart-dialog-body {
    font-size: 14px;
    color: var(--cart-mid);
    line-height: 1.6;
    padding: 20px 24px;
  }

  .cart-dialog-footer {
    padding: 16px 24px;
    border-top: 1px solid var(--cart-border);
    display: flex;
    justify-content: flex-end;
    gap: 10px;
  }

  /* ==================== SPINNER ==================== */

  .cart-spinner-large {
    width: 40px;
    height: 40px;
    border: 3px solid var(--cart-green-light);
    border-top-color: var(--cart-green);
    border-radius: 50%;
    animation: cart-spin 0.8s linear infinite;
  }

  @keyframes cart-spin {
    to { transform: rotate(360deg); }
  }
`;

export default Cart;