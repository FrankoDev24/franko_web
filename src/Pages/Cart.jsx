import React, { useEffect, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {updateCartItem,deleteCartItem,getCartById} from '../Redux/Slice/cartSlice';
import {Button,Checkbox,Dialog,DialogHeader,DialogBody,DialogFooter} from '@material-tailwind/react';
import AuthModal from "../Component/AuthModal";
import {TrashIcon,MinusIcon,PlusIcon} from '@heroicons/react/24/outline';
import carty from "../assets/cart.gif"
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

  // 👇 Move this inside the component function
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
      return <img src="path/to/placeholder/image.png" alt="Placeholder" className="w-full h-full object-cover" />;
    }
    const backendBaseURL = "https://smfteapi.salesmate.app";
    const imageUrl = `${backendBaseURL}/Media/Products_Images/${imagePath.split("\\").pop()}`;
    return <img src={imageUrl} alt="Product" className="w-full h-full object-cover" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <img src={carty} alt="Franko Trading" className="mx-auto" />
      </div>
    </div>
    
    );
  }

  if (error) {
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  }

  return (
    <div className=" mx-auto px-4 py-8">
  <div className="flex items-center mb-6 w-full">
  <h2 className="text-md md:text-xl font-bold text-gray-700">🛒 Shopping Cart</h2>
  <div className="flex-grow border-t border-gray-300 mx-4"></div> {/* Horizontal Divider */}

  <span className="text-gray-600 text-sm whitespace-nowrap">{totalCartItems} Item(s)</span>
</div>



      {cart.length === 0 ? (
        <p className="text-center text-gray-500">Your cart is empty.</p>
      ) : (
        <>
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Checkbox
                checked={selectAll}
                onChange={toggleSelectAll}
                label="Select All"
                ripple={false}
              />
              {selectedItems.length > 0 && (
                <span className="text-sm text-gray-500">
                  {selectedItems.length} selected
                </span>
              )}
            </div>
            {selectedItems.length > 0 && (
              <Button
                variant="outlined"
                color="red"
                size="sm"
                onClick={() => setOpenModal(true)}
              >
                Remove Selected
              </Button>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-2">
            {/* Cart Items */}
            <div className="flex-1 space-y-4">
  {cart.map((item) => (
    <div key={item.productId}>
      {/* --- Cart Item Content --- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-2 md:p-4 ">
        <div className="flex items-center gap-4 w-full sm:w-2/3">
          <Checkbox
            checked={selectedItems.includes(item.productId)}
            onChange={() => toggleItemSelection(item.productId)}
            ripple={false}
          />
          <div className="w-16 h-16">{renderImage(item.imagePath)}</div>
          <div>
            <h4 className="font-semibold text-gray-800 line-clamp-2 text-xs md:text-sm">
              {item.productName}
            </h4>
            <p className="text-sm text-gray-500">₵{item.price}.00</p>
          </div>
        </div>

        <div className="flex items-center gap-6 md:gap-6 md:lex-wrap flex-nowrap">
          <div className="flex items-center border rounded-lg  bg-gray-50 shadow-sm">
            <Button
              size="sm"
              variant="text"
              className="min-w-0 px-1"
              onClick={() =>
                handleQuantityChange(item.productId, item.quantity - 1)
              }
            >
              <MinusIcon className="h-2 w-2 text-gray-700" />
            </Button>
            <span className="w-8 text-center text-gray-800 font-medium">
              {item.quantity}
            </span>
            <Button
              size="sm"
              variant="text"
              className="min-w-0 px-1"
              onClick={() =>
                handleQuantityChange(item.productId, item.quantity + 1)
              }
            >
              <PlusIcon className="h-4 w-4 text-gray-700" />
            </Button>
          </div>

          <div className="text-gray-800 font-semibold text-sm">
            ₵{(item.price * item.quantity).toFixed(2)}
          </div>

          <Button
            size="sm"
            variant="text"
            color="red"
            className="ml-auto sm:ml-0"
            onClick={() => handleRemoveItem(item.productId)}
          >
            <TrashIcon className="h-5 w-5" />
          </Button>
        </div>
      
      </div>

      {/* Divider under each item except last */}
   <Divider className='mt-1'/>
    </div>
  ))}
</div>


            {/* Order Summary */}
{/* Order Summary */}
<div className="w-full lg:w-1/3 bg-white rounded-t-xl shadow-[0_-2px_10px_rgba(0,0,0,0.05)] border-t border-gray-200 fixed bottom-0 left-0 z-50 p-4 lg:static lg:rounded-xl lg:shadow-lg lg:border lg:p-6">
  <h2 className="text-lg font-semibold text-gray-800 mb-4 border-b pb-2">
    🛒 Cart Summary
  </h2>

  <div className="flex justify-between items-center mb-2 text-sm text-gray-600">
    <span>
      {selectedItems.length > 0 ? 'Selected Items Total:' : 'All Items Total:'}
    </span>
    <span className="font-medium text-gray-800">
      ₵{selectedTotal.toFixed(2)}
    </span>
  </div>

  <div className="flex justify-between items-center mb-4 text-base font-medium text-gray-800">
    <span>Cart Total:</span>
    <span className="text-lg font-bold text-green-700">
      ₵{(selectedItems.length > 0 ? selectedTotal : fullTotal).toFixed(2)}
    </span>
  </div>

  <p className="text-xs text-center text-gray-500 mb-4">
    * Taxes, discounts & shipping will be calculated at checkout.
  </p>

  <button
    onClick={handleCheckout}
    className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-2 px-4 rounded-md shadow hover:from-green-600 hover:to-green-700 transition duration-200 ease-in-out"
  >
    Proceed to Checkout
  </button>

  {/* 🔐 Auth Modal */}
  <AuthModal open={authModalOpen} onClose={() => setAuthModalOpen(false)} />
</div>


       </div>

        </>
      )}

      {/* Confirm Delete Modal */}
      <Dialog open={openModal} handler={setOpenModal}>
        <DialogHeader>Confirm Deletion</DialogHeader>
        <DialogBody>
          Are you sure you want to delete the selected items from your cart?
        </DialogBody>
        <DialogFooter>
          <Button variant="text" onClick={() => setOpenModal(false)}>
            Cancel
          </Button>
          <Button color="red" onClick={handleBatchDelete}>
            Confirm
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  )
};


export default CartPage;
