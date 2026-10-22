// src/Component/UpdateCartModal.jsx
import { useEffect, useState } from "react";
import { Modal, Button, InputNumber, Spin, Alert } from "antd";
import { useDispatch, useSelector } from "react-redux";
import { updateCartItem, selectCartId } from "../Redux/Slice/cartSlice";

/**
 * Edit one cart line's quantity. The slice applies the new quantity to the
 * store itself on success, so parents only use `onUpdate` as a notification
 * hook — no parent-side refetch (and no cart collapse) is needed anymore.
 */
const UpdateCartModal = ({ visible, open, onClose, productId, currentQuantity, onUpdate }) => {
  const dispatch = useDispatch();
  const cartId = useSelector(selectCartId);
  const loading = useSelector((state) => state.cart.loading);
  const error = useSelector((state) => state.cart.error);
  const [quantity, setQuantity] = useState(currentQuantity || 1);
  const [localError, setLocalError] = useState("");
  const isOpen = open ?? visible ?? false;

  useEffect(() => {
    if (isOpen) {
      setQuantity(currentQuantity || 1);
      setLocalError("");
    }
  }, [isOpen, currentQuantity]);

  const handleUpdate = async () => {
    if (!cartId) {
      setLocalError("Cart ID not found. Please reopen your cart and try again.");
      return;
    }
    if (!productId) {
      setLocalError("Product not found.");
      return;
    }
    if (!quantity || quantity <= 0) {
      setLocalError("Please enter a valid quantity.");
      return;
    }

    const result = await dispatch(
      updateCartItem({ CartId: cartId, ProductId: String(productId), Quantity: quantity })
    );

    if (updateCartItem.fulfilled.match(result)) {
      onUpdate?.(quantity);
      onClose?.();
    } else {
      setLocalError(
        typeof result.payload === "string"
          ? result.payload
          : result.payload?.message || "Failed to update cart item."
      );
    }
  };

  return (
    <Modal
      title="Update Cart Item"
      open={isOpen}
      onCancel={onClose}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="update" type="primary" onClick={handleUpdate} disabled={loading}>
          Update
        </Button>,
      ]}
    >
      {loading ? (
        <div className="flex justify-center items-center">
          <Spin size="large" />
        </div>
      ) : (
        <>
          {(localError || error) && (
            <Alert
              message="Error"
              description={localError || (typeof error === "string" ? error : error?.message)}
              type="error"
              showIcon
              className="mb-4"
            />
          )}
          <div>
            <p>Current Quantity: {currentQuantity}</p>
            <InputNumber
              min={1}
              value={quantity}
              onChange={(value) => setQuantity(value)}
              className="w-full"
            />
          </div>
        </>
      )}
    </Modal>
  );
};

export default UpdateCartModal;
