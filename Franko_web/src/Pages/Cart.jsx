import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {updateCartItem,deleteCartItem,getCartById} from '../Redux/Slice/cartSlice';
import {Button,Checkbox,Dialog,DialogHeader,DialogBody,DialogFooter} from '@material-tailwind/react';
import AuthModal from "../Component/AuthModal";
import {TrashIcon,MinusIcon,PlusIcon,ShoppingBagIcon,ArrowLeftIcon} from '@heroicons/react/24/outline';
import { useNavigate } from 'react-router-dom';
import { Divider } from 'antd';

const CartPage = () => {
const dispatch = useDispatch();
  const navigate = useNavigate();
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const { cart, loading, error, cartId } = useSelector((state) => state.cart);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [openModal, setOpenModal] = useState(false);

  useEffect(() => {
    if (cartId) dispatch(getCartById(cartId));
  }, [dispatch, cartId]);
  
  useEffect(() => {
    const selectedCartData = cart.filter((item) =>
      selectedItems.includes(item.productId)
    );
    localStorage.setItem("selectedCart", JSON.stringify(selectedCartData));
  }, [selectedItems, cart]);

    
  const toggleSelectAll = () => {
    const allSelected = !selectAll;
    setSelectAll(allSelected);
    setSelectedItems(allSelected ? cart.map((item) => item.productId) : []);
  };

  const toggleItemSelection = (productId) => {
    setSelectedItems((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const handleCheckout = () => {
    const storedCustomer = JSON.parse(localStorage.getItem("customer"));
  
    if (!storedCustomer) {
      setAuthModalOpen(true);
      return;
    }
  
    const selectedCartItems = selectedItems.length > 0
      ? cart.filter((item) => selectedItems.includes(item.productId))
      : cart;
  
    localStorage.setItem("selectedCart", JSON.stringify(selectedCartItems));
  
    navigate("/checkout");
  };
  
  const handleContinueShopping = () => {
    navigate("/products");
  };

  const handleQuantityChange = (productId, quantity) => {
    if (quantity >= 1) {
      dispatch(updateCartItem({ cartId, productId, quantity }));
    }
  };

  const handleRemoveItem = (productId) => {
    dispatch(deleteCartItem({ cartId, productId }));
  };

  const handleBatchDelete = () => {
    selectedItems.forEach((id) => {
      dispatch(deleteCartItem({ cartId, productId: id }));
    });
    setSelectedItems([]);
    setSelectAll(false);
    setOpenModal(false);
  };
 
  const selectedCartItems = selectedItems.length > 0
    ? cart.filter((item) => selectedItems.includes(item.productId))
    : cart;

  const selectedTotal = selectedCartItems.reduce(
    (acc, item) => acc + item.price * item.quantity, 0
  );

  const fullTotal = cart.reduce(
    (acc, item) => acc + item.price * item.quantity, 0
  );

  const totalCartItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  
  const renderImage = (imagePath) => {
    if (!imagePath) {
      return <img src="path/to/placeholder/image.png" alt="Placeholder" className="w-full h-full object-cover rounded-lg" />;
    }
    const backendBaseURL = "https://smfteapi.salesmate.app";
    const imageUrl = `${backendBaseURL}/Media/Products_Images/${imagePath.split("\\").pop()}`;
    return <img src={imageUrl} alt="Product" className="w-full h-full object-cover rounded-lg" />;
  };

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
 
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-500 mx-auto"></div>
          <p className="text-gray-600 mt-4 font-medium">Loading your cart...</p>
        </div>
      </div>
    );
  }

  // Error state
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

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className=" px-4 py-4">
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

      <div className=" px-4 py-6">
        {cart.length === 0 ? (
          // Empty Cart State
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
                  onClick={() => navigate("/")}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-3 px-6 rounded-xl transition duration-200"
                >
                  Back to Home
                </button>
              </div>
            </div>
          </div>
        ) : (
          // Cart with items
          <>
            {/* Cart Controls */}
            <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
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
                  {selectedItems.length > 0 && (
                    <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-sm font-medium">
                      {selectedItems.length} selected
                    </div>
                  )}
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
                    Remove Selected
                  </Button>
                )}
              </div>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Cart Items */}
              <div className="flex-1">
                <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                  {cart.map((item, index) => (
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
                              <h4 className="font-semibold text-gray-600 text-sm  line-clamp-2 mb-1">
                                {item.productName}
                              </h4>
                              <p className="text-red-400 font-semibold">₵{item.price}.00</p>
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
                                onClick={() => handleQuantityChange(item.productId, item.quantity - 1)}
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
                                onClick={() => handleQuantityChange(item.productId, item.quantity + 1)}
                              >
                                <PlusIcon className="h-4 w-4 text-gray-600" />
                              </Button>
                            </div>

                            {/* Total Price */}
                            <div className="text-right">
                              <div className="text-gray-700 font-bold text-sm">
                                ₵{(item.price * item.quantity).toFixed(2)}
                              </div>
                            </div>

                            {/* Remove Button */}
                            <Button
                              size="sm"
                              variant="text"
                              color="red"
                              className="min-w-0 p-2 hover:bg-red-50"
                              onClick={() => handleRemoveItem(item.productId)}
                            >
                              <TrashIcon className="h-5 w-5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                      {index < cart.length - 1 && <Divider className="m-0" />}
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary - Desktop */}
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
                      <span>
                        {selectedItems.length > 0 ? 'Selected Items:' : 'All Items:'}
                      </span>
                      <span className="font-medium">
                        ₵{selectedTotal.toFixed(2)}
                      </span>
                    </div>
                    <Divider className="my-3" />
                    <div className="flex justify-between items-center text-lg font-bold text-gray-800">
                      <span>Total:</span>
                      <span className="text-red-600">
                        ₵{(selectedItems.length > 0 ? selectedTotal : fullTotal).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-center text-gray-500 mb-6">
                    * Taxes, discounts & shipping calculated at checkout
                  </p>

                  <div className="space-y-3">
                    <button
                      onClick={handleCheckout}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition duration-200 ease-in-out transform hover:scale-105"
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

      {/* Mobile Order Summary - Fixed Bottom */}
      {cart.length > 0 && (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-gray-600 font-medium">
                {selectedItems.length > 0 ? 'Selected Total:' : 'Cart Total:'}
              </span>
              <span className="text-xl font-bold text-green-600">
                ₵{(selectedItems.length > 0 ? selectedTotal : fullTotal).toFixed(2)}
              </span>
            </div>
            <button
              onClick={handleCheckout}
              className="w-full bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 px-4 rounded-xl shadow-md transition duration-200"
            >
              Proceed to Checkout
            </button>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <Dialog open={openModal} handler={setOpenModal} className="bg-white rounded-2xl">
        <DialogHeader className="text-gray-800">
          <div className="flex items-center gap-2">
            <TrashIcon className="w-6 h-6 text-red-500" />
            Confirm Deletion
          </div>
        </DialogHeader>
        <DialogBody className="text-gray-600">
          Are you sure you want to remove {selectedItems.length} item{selectedItems.length !== 1 ? 's' : ''} from your cart? This action cannot be undone.
        </DialogBody>
        <DialogFooter className="space-x-2">
          <Button 
            variant="text" 
            onClick={() => setOpenModal(false)}
            className="text-gray-600 hover:bg-gray-100"
          >
            Cancel
          </Button>
          <Button 
            color="red" 
            onClick={handleBatchDelete}
            className="bg-red-500 hover:bg-red-600"
          >
            Remove Items
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Auth Modal */}
      <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </div>
  )
};

export default CartPage;