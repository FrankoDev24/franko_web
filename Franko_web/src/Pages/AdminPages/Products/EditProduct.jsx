import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { updateProduct } from "../../../Redux/Slice/productSlice";
import { Modal, Form, Input, Select, Button, message, Row, Col } from "antd";
import PropTypes from "prop-types";

const { Option } = Select;

const generate8DigitCode = () => {
  return Math.floor(10000000 + Math.random() * 90000000).toString();
};

const UpdateProduct = ({ visible, onClose, product, brands, showrooms }) => {
  const dispatch = useDispatch();
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (product && Object.keys(product).length > 0) {
      form.setFieldsValue({
        Productid: product.productID,
        ProductName: product.productName,
        price: product.price,
        oldPrice: product.oldPrice,
        Description: product.description,
        BrandId: product.brandId,
        ShowRoomId: product.showRoomId,
        status: product.status,
        tag: product.tag || "",
        productColor: product.productColor || "",
        productId2: product.productId2 || "",
        productId3: product.productId3 || "",
      });
    }
  }, [product, form]);

  const onFinish = async (values) => {
    const payload = {
      Productid: values.Productid,
      productName: values.ProductName,
      description: values.Description,
      price: values.price,
      oldPrice: values.oldPrice,
      brandId: values.BrandId,
      showRoomId: values.ShowRoomId,
      status: values.status === "1" ? "1" : "0",
      tag: values.tag,
      productColor: values.productColor,
      productId2: values.productId2 || generate8DigitCode(),
      productId3: values.productId3 || generate8DigitCode(),
    };

    if (!payload.Productid) {
      message.error("Product ID is missing!");
      return;
    }

    try {
      setLoading(true);
      await dispatch(updateProduct(payload)).unwrap();
      message.success("Product updated successfully!");
      onClose();
      form.resetFields();
    } catch (err) {
      console.error("Error updating product:", err);
      message.error("Failed to update product.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="Update Product"
      visible={visible}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={onFinish}
        initialValues={{ Productid: product.productID }}
      >
        <Form.Item name="Productid" style={{ display: "none" }}>
          <Input type="hidden" />
        </Form.Item>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Product Name"
              name="ProductName"
              rules={[
                { required: true, message: "Please input the product name!" },
              ]}
            >
              <Input placeholder="Enter product name" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Price"
              name="price"
              rules={[{ required: true, message: "Please input the price!" }]}
            >
              <Input type="number" placeholder="Enter product price" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item label="Old Price" name="oldPrice">
              <Input type="number" placeholder="Enter old price (optional)" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Brand"
              name="BrandId"
              rules={[{ required: true, message: "Please select a brand!" }]}
            >
              <Select placeholder="Select a brand">
                {brands.map((brand) => (
                  <Option key={brand.brandId} value={brand.brandId}>
                    {brand.brandName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Description"
              name="Description"
              rules={[
                { required: true, message: "Please input the description!" },
              ]}
            >
              <Input.TextArea
                placeholder="Enter product description"
                rows={3}
              />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={24}>
            <Form.Item
              label="Showroom"
              name="ShowRoomId"
              rules={[{ required: true, message: "Please select a showroom!" }]}
            >
              <Select placeholder="Select a showroom">
                {showrooms.map((showroom) => (
                  <Option key={showroom.showRoomID} value={showroom.showRoomID}>
                    {showroom.showRoomName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Tag"
              name="tag"
              rules={[{ required: true, message: "Please input a tag!" }]}
            >
              <Input placeholder="Enter tag (e.g., Featured, New)" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="Color"
              name="productColor"
              rules={[{ required: true, message: "Please input a color!" }]}
            >
              <Input placeholder="Enter product color" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="EAN"
              name="productId2"
            >
              <Input placeholder="Enter EAN (auto-generated if empty)" />
            </Form.Item>
          </Col>

          <Col span={12}>
            <Form.Item
              label="MPN"
              name="productId3"
            >
              <Input placeholder="Enter MPN (auto-generated if empty)" />
            </Form.Item>
          </Col>
        </Row>

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              label="Status"
              name="status"
              rules={[{ required: true, message: "Please select a status!" }]}
            >
              <Select placeholder="Select status">
                <Option value="1">In Stock</Option>
                <Option value="0">Out of Stock</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item>
        <Button
  htmlType="submit"
  className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold"
  loading={loading}
>
  Update Product
</Button>

        </Form.Item>
      </Form>
    </Modal>
  );
};

UpdateProduct.propTypes = {
  visible: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  product: PropTypes.object.isRequired,
  brands: PropTypes.array.isRequired,
  showrooms: PropTypes.array.isRequired,
};

export default UpdateProduct;
