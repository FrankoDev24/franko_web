import { useEffect, useState } from "react";
import { Modal, Button, InputNumber, Spin, Alert } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { updateCartItem } from "../Redux/Slice/cartSlice";

const UpdateCartModal = ({ visible, onClose, productId, currentQuantity, onUpdate }) => {
  const dispatch = useDispatch();
  const loading = useSelector((state) => state.cart.loading);
  const error = useSelector((state) => state.cart.error);
  const [quantity, setQuantity] = useState(currentQuantity);

  // Reset quantity when modal is opened
  useEffect(() => {
    setQuantity(currentQuantity);
  }, [visible, currentQuantity]);

  const handleUpdate = async () => {
    const cartId = localStorage.getItem("cartId");

    // Validate the cartId and quantity before dispatching
    if (!cartId) {
      alert("Cart ID not found.");
      return;
    }

    if (quantity <= 0) {
      alert("Please enter a valid quantity."); // Validation alert
      return;
    }

    // Dispatch the update action and wait for it to complete
    await dispatch(updateCartItem({ cartId, productId, quantity }));

    // Call the onUpdate function to refresh the cart items after a successful update
    onUpdate(); // This will refresh the cart items in the parent component

    // Close the modal
    onClose();
  };

  return (
    <Modal
      title="Update Cart Item"
      visible={visible}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="update" type="primary" onClick={handleUpdate} disabled={loading}>
          Update
        </Button>
      ]}
    >
      {loading ? (
        <div className="flex justify-center items-center">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {error && (
            <Alert
              message="Error"
              description={error}
              type="error"
              showIcon
              className="mb-4"
            />
          )}
          <div>
            <p>Current Quantity: {currentQuantity}</p>
            <InputNumber
              min={1} // Prevents zero or negative numbers
              value={quantity}
              onChange={(value) => setQuantity(value)} // Ensure this updates state correctly
              className="w-full"
            />
          </div>
        </>
      )}
    </Modal>
  );
};

export default UpdateCartModal;
