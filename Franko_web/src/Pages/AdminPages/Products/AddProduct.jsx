import {
    Modal,
    Form,
    Input,
    Select,
    Button,
    message,
    Upload,
    Progress,
    Row,
    Col,
    Divider,
    Typography,
  } from 'antd';
  import { UploadOutlined } from '@ant-design/icons';
  import PropTypes from 'prop-types';
  import { useDispatch, useSelector } from 'react-redux';
  import { useState, useEffect } from 'react';
  import { v4 as uuidv4 } from 'uuid';
  import { addProduct, fetchProducts } from '../../../Redux/Slice/productSlice';
  import { fetchBrands } from '../../../Redux/Slice/brandSlice';
  import { fetchShowrooms } from '../../../Redux/Slice/showRoomSlice';
  
  const { Option } = Select;
  const { Text, Title } = Typography;
  
  const AddProduct = ({ visible, onClose }) => {
    const dispatch = useDispatch();
    const [form] = Form.useForm();
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [productImageFile, setProductImageFile] = useState(null);
    const [imagePreview, setImagePreview] = useState(null);
    const [charCount, setCharCount] = useState(0);
  
    const brands = useSelector((state) => state.brands.brands);
    const showrooms = useSelector((state) => state.showrooms.showrooms);
  
    useEffect(() => {
      dispatch(fetchBrands());
      dispatch(fetchShowrooms());
    }, [dispatch]);
  
    const generateRandomId = () => Math.floor(10000 + Math.random() * 90000).toString();
  
    const onFinish = async (values) => {
      const formData = new FormData();
  
      formData.append('UserId', 'user-uuid'); // Replace with actual ID
      formData.append('productID', uuidv4());
      formData.append('dateCreated', new Date().toISOString());
  
      const finalValues = {
        ...values,
        oldPrice: values.oldPrice || '0',
        ProductId2: values.ProductId2 || generateRandomId(),
        ProductId3: values.ProductId3 || generateRandomId(),
      };
  
      Object.entries(finalValues).forEach(([key, value]) => {
        formData.append(key, value);
      });
  
      if (!productImageFile) {
        message.error('Please upload a product image.');
        return;
      }
  
      formData.append('productImage', productImageFile);
  
      try {
        setUploading(true);
        await dispatch(addProduct(formData)).unwrap();
        message.success('Product added successfully!');
        await dispatch(fetchProducts());
        form.resetFields();
        setProductImageFile(null);
        setUploadProgress(0);
        setImagePreview(null);
        onClose();
      } catch (err) {
        console.error(err);
        message.error('Failed to add product.');
      } finally {
        setUploading(false);
      }
    };
  
    const handleUploadChange = (info) => {
      if (info.file.status === 'done' || info.file.status === 'success') {
        const { originFileObj } = info.file;
        setProductImageFile(originFileObj);
        setImagePreview(URL.createObjectURL(originFileObj));
        setUploading(false);
        message.success(`${info.file.name} uploaded successfully.`);
      } else if (info.file.status === 'error') {
        setUploading(false);
        message.error(`${info.file.name} upload failed.`);
      }
    };
  
    const uploadProps = {
      beforeUpload: (file) => {
        setProductImageFile(file);
        setImagePreview(URL.createObjectURL(file));
        return false;
      },
      onChange: handleUploadChange,
      showUploadList: false,
      progress: {
        onProgress: ({ percent }) => setUploadProgress(percent),
      },
    };
  
    return (
      <Modal
        title={<Title level={4}>Add New Product</Title>}
        open={visible}
        onCancel={onClose}
        footer={null}
        width={750}
        centered
      >
        <Form form={form} layout="vertical" onFinish={onFinish}>
          <Row gutter={[16, 16]}>
            <Col span={16}>
              <Form.Item
                name="productName"
                label="Product Name"
                rules={[{ required: true, message: 'Please enter the product name.' }]}
              >
                <Input placeholder="e.g., Samsung TV 55 inch" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="price" label="Price (₵)" rules={[{ required: true }]}>
                <Input type="number" prefix="₵" placeholder="0.00" />
              </Form.Item>
            </Col>
            <Col span={4}>
              <Form.Item name="oldPrice" label="Old Price (₵)">
                <Input type="number" prefix="₵" placeholder="0.00 (optional)" />
              </Form.Item>
            </Col>
  
            <Col span={8}>
              <Form.Item name="Quantity" label="Quantity" rules={[{ required: true }]}>
                <Input type="number" placeholder="Enter quantity" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="Color" label="Color" rules={[{ required: true }]}>
                <Input placeholder="e.g., Red, Blue" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="Tag" label="Tag" rules={[{ required: true }]}>
                <Input placeholder="e.g., Trending, New" />
              </Form.Item>
            </Col>
  
            <Col span={8}>
              <Form.Item name="ProductId2" label="EAN">
                <Input placeholder="Optional - auto-generated if empty" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="ProductId3" label="MPN">
                <Input placeholder="Optional - auto-generated if empty" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="status" label="Status" rules={[{ required: true }]}>
                <Select placeholder="Select stock status">
                  <Option value="1">In Stock</Option>
                  <Option value="0">Out of Stock</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>
  
          <Divider />
  
          <Form.Item
            name="description"
            label="Description"
            rules={[{ required: true, message: 'Please input the description!' }]}
          >
            <Input.TextArea
              placeholder="Enter product description (max 1000 characters)"
              autoSize={{ minRows: 3, maxRows: 5 }}
              maxLength={1000}
              onChange={(e) => setCharCount(e.target.value.length)}
            />
          </Form.Item>
          <Text type="secondary" style={{ float: 'right', marginBottom: 10 }}>
            {charCount} / 1000
          </Text>
  
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="brandId" label="Brand" rules={[{ required: true }]}>
                <Select placeholder="Select brand">
                  {brands.map((brand) => (
                    <Option key={brand.brandId} value={brand.brandId}>
                      {brand.brandName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="showRoomId" label="Showroom" rules={[{ required: true }]}>
                <Select placeholder="Select showroom">
                  {showrooms.map((room) => (
                    <Option key={room.showRoomID} value={room.showRoomID}>
                      {room.showRoomName}
                    </Option>
                  ))}
                </Select>
              </Form.Item>
            </Col>
          </Row>
  
          <Form.Item label="Product Image" name="productImage">
            <Upload {...uploadProps} accept="image/*">
              <Button icon={<UploadOutlined />}>Upload Image</Button>
            </Upload>
            {uploading && <Progress percent={uploadProgress} status="active" />}
            {imagePreview && (
              <div style={{ marginTop: 10, border: '1px solid #e5e5e5', padding: 10, borderRadius: 8 }}>
                <img
                  src={imagePreview}
                  alt="Product Preview"
                  style={{
                    width: '100%',
                    maxHeight: 250,
                    objectFit: 'cover',
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                />
              </div>
            )}
          </Form.Item>
  
          <Form.Item>
            <Button
              className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"

              htmlType="submit"
              loading={uploading}
              block
              size="large"
              style={{ marginTop: 20 }}
            >
              Add Product
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    );
  };
  
  AddProduct.propTypes = {
    visible: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
  };
  
  export default AddProduct;
  