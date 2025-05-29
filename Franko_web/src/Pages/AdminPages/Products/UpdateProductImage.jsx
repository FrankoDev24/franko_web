import React, { useState } from "react";
import { Modal, Upload, Button, Form, notification } from "antd";
import { UploadOutlined } from "@ant-design/icons";
import { useDispatch } from "react-redux";
import { updateProductImage } from "../../../Redux/Slice/productSlice";

const UpdateProductImage = ({ visible, onClose, productID }) => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState(null); // To store the preview URL
  const [loading, setLoading] = useState(false);
  const dispatch = useDispatch();

  const handleFileChange = ({ fileList }) => {
    if (fileList.length > 0) {
      const selectedFile = fileList[0].originFileObj;
      setImageFile(selectedFile);
      setImagePreviewUrl(URL.createObjectURL(selectedFile)); // Generate image preview URL
    } else {
      setImageFile(null);
      setImagePreviewUrl(null); // Reset preview if no file is selected
    }
  };

  const handleSubmit = async () => {
    if (!productID || !imageFile) {
      notification.error({
        message: "Error",
        description: "Please select an image.",
      });
      return;
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("ProductId", productID); // Ensure case matches backend
      formData.append("ImageName", imageFile); // Append the file

      await dispatch(updateProductImage({ productID, imageFile })).unwrap();

      notification.success({
        message: "Success",
        description: "Product image updated successfully.",
      });
      onClose();
    } catch (error) {
      console.error("Error details:", error); // Log full error for debugging
      notification.error({
        message: "Error",
        description: error.message || "Failed to update product image.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Update Product Image"
      visible={visible}
      onCancel={onClose}
      footer={null}
    >
      <Form layout="vertical" onFinish={handleSubmit}>
        <Form.Item label="Product Image">
          <Upload
            beforeUpload={() => false} // Prevent automatic upload
            onChange={handleFileChange}
            maxCount={1}
          >
            <Button icon={<UploadOutlined />}>Select Image</Button>
          </Upload>
          {imagePreviewUrl && (
            <div style={{ marginTop: 10 }}>
              <img
                src={imagePreviewUrl}
                alt="Selected"
                style={{ width: "100%", height: "auto", maxHeight: 150, objectFit: "cover" }}
              />
            </div>
          )}
        </Form.Item>
        <Button className="w-full bg-green-600 hover:bg-green-700 text-white font-medium" htmlType="submit" loading={loading}>
          Update Image
        </Button>
      </Form>
    </Modal>
  );
};

export default UpdateProductImage;
