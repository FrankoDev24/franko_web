// src/pages/Cart.jsx
import { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { updateCartItem, deleteCartItem, getCartById } from '../Redux/Slice/cartSlice';
import { Button, Checkbox, Dialog, DialogHeader, DialogBody, DialogFooter } from '@material-tailwind/react';
import AuthModal from "../Component/AuthModal";
import { TrashIcon, MinusIcon, PlusIcon, ShoppingBagIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { Divider } from 'antd';

// ==================== UTILITY FUNCTIONS ====================

const formatCurrency = (amount, decimals = 2) => {
  const num = parseFloat(amount) || 0;
  return num.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
};

const formatGHS = (amount) => `₵${formatCurrency(amount, 2)}`;

/**
 * ✅ FIX: Always compute line total from price × quantity.
 * Never trust item.total which may be stale or incorrectly pre-computed.
 */
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

  // Sync cart to localStorage whenever it changes from the database
  useEffect(() => {
    if (cart && cart.length >= 0) {
      try {
        localStorage.setItem('cart', JSON.stringify(cart));
      } catch (err) {
        console.error('Failed to sync cart to localStorage:', err);
      }
    }
  }, [cart]);

  // Reset selection when cart changes
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
      // ✅ Use correctly computed total
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
        // Optimistic update in localStorage
        const optimisticCart = cart.map((item) =>
          item.productId === productId
            ? {
                ...item,
                quantity,
                // ✅ Recompute total immediately on optimistic update
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

  /**
   * ✅ FIX: Subtotal always recomputes from price × quantity per item.
   */
  const calculateSubtotal = () => {
    return cart.reduce((acc, item) => acc + getItemLineTotal(item), 0);
  };

  const cartTotal = calculateSubtotal();
  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);

  // ==================== IMAGE RENDERING ====================

  const renderImage = (imagePath) => {
    if (!imagePath) {
      return (
        <div className="w-full h-full bg-gray-200 rounded-lg flex items-center justify-center">
          <span className="text-gray-400 text-xs">No Image</span>
        </div>
      );
    }
    const backendBaseURL = 'https://ct002.frankotrading.com:444';
    const imageUrl = `${backendBaseURL}/Media/Products_Images/${imagePath.split('\\').pop()}`;
    return (
      <img
        src={imageUrl}
        alt="Product"
        className="w-full h-full object-cover rounded-lg"
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
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-gray-600 mt-4 font-medium">Loading your cart items...</p>
        </div>
      </div>
    );
  }

  // ==================== ERROR STATE ====================

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center bg-white p-8 rounded-xl shadow-lg max-w-md">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <TrashIcon className="w-8 h-8 text-red-500" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">Oops! Something went wrong</h3>
          <p className="text-gray-600 mb-6">We couldn't load your cart. Please try again.</p>
          <Button onClick={() => window.location.reload()} className="bg-green-500 hover:bg-green-600">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  // ==================== MAIN RENDER ====================

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Network Error Notification */}
      {networkError.show && (
        <div className="fixed top-4 right-4 z-50 max-w-md animate-slide-in">
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg shadow-lg">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-red-800">{networkError.message}</p>
              </div>
              <button
                onClick={() => setNetworkError({ show: false, message: '' })}
                className="ml-3 flex-shrink-0"
              >
                <svg className="h-5 w-5 text-red-500 hover:text-red-700" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ArrowLeftIcon className="w-5 h-5 text-gray-600" />
              </button>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <ShoppingBagIcon className="w-5 h-5 text-green-600" />
                </div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-800">Shopping Cart</h1>
              </div>
            </div>
            {cart.length > 0 && (
              <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                {totalCartItems} Item{totalCartItems !== 1 ? 's' : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mx-auto px-4 py-6">
        {/* EMPTY CART STATE */}
        {cart.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center bg-white p-8 md:p-12 rounded-2xl shadow-lg max-w-md">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <ShoppingBagIcon className="w-12 h-12 text-gray-400" />
              </div>
              <h3 className="text-2xl font-bold text-gray-800 mb-3">Your cart is empty</h3>
              <p className="text-gray-600 mb-8 leading-relaxed">
                Looks like you haven't added anything to your cart yet.
                Start shopping to fill it up!
              </p>
              <div className="space-y-3">
                <button
                  onClick={handleContinueShopping}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-6 rounded-xl shadow-md transition duration-200 ease-in-out transform hover:scale-105"
                >
                  Continue Shopping
                </button>
                <button
                  onClick={() => navigate('/')}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition duration-200"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        ) : (
          <>
            {/* Cart Controls */}
            <div className="bg-white rounded-xl shadow-sm p-2 mb-2">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Checkbox
                    checked={selectAll}
                    onChange={toggleSelectAll}
                    label={
                      <span className="font-medium text-gray-700">
                        Select All ({cart.length} items)
                      </span>
                    }
                    ripple={false}
                    className="hover:before:opacity-10"
                  />
                </div>
                {selectedItems.length > 0 && (
                  <Button
                    variant="outlined"
                    color="red"
                    size="sm"
                    onClick={() => setOpenModal(true)}
                    className="flex items-center gap-2 hover:bg-red-50"
                  >
                    <TrashIcon className="w-4 h-4" />
                    Delete Selected ({selectedItems.length})
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-4">
              {/* CART ITEMS SECTION */}
              <div className="flex-1">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  {cart.map((item, index) => {
                    // ✅ FIX: Always compute line total from price × quantity
                    const lineTotal = getItemLineTotal(item);
                    return (
                      <div key={item.productId}>
                        <div className="p-4 md:p-6 hover:bg-gray-50 transition-colors">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                            {/* Checkbox and Product Info */}
                            <div className="flex items-center gap-4 flex-1">
                              <Checkbox
                                checked={selectedItems.includes(item.productId)}
                                onChange={() => toggleItemSelection(item.productId)}
                                ripple={false}
                                className="hover:before:opacity-10"
                              />
                              <div className="w-20 h-20 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                                {renderImage(item.imagePath)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-semibold text-gray-600 text-xs md:text-sm line-clamp-2 mb-1">
                                  {item.productName}
                                </h4>
                                <p className="text-red-500 text-xs md:text-sm font-bold">
                                  {formatGHS(item.price)}
                                </p>
                              </div>
                            </div>

                            {/* Quantity and Actions */}
                            <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-6">
                              {/* Quantity Controls */}
                              <div className="flex items-center bg-gray-50 rounded-lg border">
                                <Button
                                  size="sm"
                                  variant="text"
                                  className="min-w-0 px-2 py-1 hover:bg-gray-100"
                                  onClick={() =>
                                    handleQuantityChange(item.productId, item.quantity - 1)
                                  }
                                  disabled={item.quantity <= 1}
                                >
                                  <MinusIcon className="h-4 w-4 text-gray-600" />
                                </Button>
                                <span className="w-12 text-center text-gray-800 font-semibold py-1">
                                  {item.quantity}
                                </span>
                                <Button
                                  size="sm"
                                  variant="text"
                                  className="min-w-0 px-2 py-1 hover:bg-gray-100"
                                  onClick={() =>
                                    handleQuantityChange(item.productId, item.quantity + 1)
                                  }
                                >
                                  <PlusIcon className="h-4 w-4 text-gray-600" />
                                </Button>
                              </div>

                              {/* ✅ FIX: Display correctly calculated line total */}
                              <div className="text-right min-w-fit">
                                <div className="text-gray-700 font-bold text-sm">
                                  {formatGHS(lineTotal)}
                                </div>
                              </div>

                              {/* Remove Button */}
                              <Button
                                size="sm"
                                variant="text"
                                color="red"
                                className="min-w-0 p-2 hover:bg-red-50"
                                onClick={() =>
                                  handleRemoveItemClick(item.productId, item.productName)
                                }
                              >
                                <TrashIcon className="h-5 w-5" />
                              </Button>
                            </div>
                          </div>
                        </div>
                        {index < cart.length - 1 && <Divider className="m-0" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ORDER SUMMARY - DESKTOP */}
              <div className="hidden lg:block w-96">
                <div className="bg-white rounded-xl shadow-sm p-6 sticky top-24">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                      <ShoppingBagIcon className="w-4 h-4 text-green-600" />
                    </div>
                    <h2 className="text-lg font-bold text-gray-800">Order Summary</h2>
                  </div>

                  <div className="space-y-3 mb-6">
                    <div className="flex justify-between items-center text-gray-600">
                      <span>Subtotal ({totalCartItems} items):</span>
                      {/* ✅ FIX: Uses recalculated cartTotal */}
                      <span className="font-medium">{formatGHS(cartTotal)}</span>
                    </div>
                    <Divider className="my-3" />
                    <div className="flex justify-between items-center text-lg font-bold text-gray-800">
                      <span>Total:</span>
                      <span className="text-red-600">{formatGHS(cartTotal)}</span>
                    </div>
                  </div>

                  <p className="text-xs text-center text-gray-500 mb-6">
                    * Taxes, discounts & shipping calculated at checkout
                  </p>

                  <div className="space-y-3">
                    <button
                      onClick={handleCheckout}
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition duration-200 ease-in-out transform hover:scale-105"
                    >
                      Proceed to Checkout
                    </button>
                    <button
                      onClick={handleContinueShopping}
                      className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-4 rounded-xl transition duration-200"
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
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          <div className="mx-auto px-4 py-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-600 font-medium">Cart Total:</span>
              <span className="text-lg font-bold text-red-600">
                {formatGHS(cartTotal)}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-gradient-to-r from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition duration-200"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}

      {/* BATCH DELETE CONFIRMATION MODAL */}
      <Dialog open={openModal} handler={setOpenModal} className="bg-white rounded-2xl">
        <DialogHeader className="text-gray-800">
          <div className="flex items-center gap-2">
            <TrashIcon className="w-6 h-6 text-red-500" />
            Confirm Deletion
          </div>
        </DialogHeader>
        <DialogBody className="text-gray-600">
          Are you sure you want to remove {selectedItems.length} item
          {selectedItems.length !== 1 ? 's' : ''} from your cart? This action cannot be undone.
        </DialogBody>
        <DialogFooter className="space-x-2">
          <Button
            variant="text"
            onClick={() => setOpenModal(false)}
            className="text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button color="red" onClick={handleBatchDelete} className="bg-red-500 hover:bg-red-600">
            Remove Items
          </Button>
        </DialogFooter>
      </Dialog>

      {/* INDIVIDUAL DELETE CONFIRMATION MODAL */}
      <Dialog
        open={deleteModal.open}
        handler={() => setDeleteModal({ open: false, productId: null, productName: '' })}
        className="bg-white rounded-2xl"
      >
        <DialogHeader className="text-gray-800">
          <div className="flex items-center gap-2">
            <TrashIcon className="w-6 h-6 text-red-500" />
            Remove Item
          </div>
        </DialogHeader>
        <DialogBody className="text-gray-600">
          Are you sure you want to remove "
          <strong>{deleteModal.productName}</strong>" from your cart? This action cannot be undone.
        </DialogBody>
        <DialogFooter className="space-x-2">
          <Button
            variant="text"
            onClick={() => setDeleteModal({ open: false, productId: null, productName: '' })}
            className="text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button
            color="red"
            onClick={handleConfirmRemoveItem}
            className="bg-red-500 hover:bg-red-600"
          >
            Remove Item
          </Button>
        </DialogFooter>
      </Dialog>

      {/* AUTH MODAL */}
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  );
};

export default Cart;