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
  Typography
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { useState, useEffect, useMemo } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { addProduct, fetchProducts } from '../../../Redux/Slice/productSlice';
import { fetchBrands } from '../../../Redux/Slice/brandSlice';
import { fetchShowrooms } from '../../../Redux/Slice/showRoomSlice';
import { fetchCategories } from '../../../Redux/Slice/categorySlice';

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
  
  // Search states for dropdowns
  const [brandSearchValue, setBrandSearchValue] = useState('');
  const [showroomSearchValue, setShowroomSearchValue] = useState('');
  const [categorySearchValue, setCategorySearchValue] = useState('');

  const brands = useSelector((state) => state.brands.brands);
  const showrooms = useSelector((state) => state.showrooms.showrooms);
  const categories = useSelector((state) => state.categories.categories);
  const brandsLoading = useSelector((state) => state.brands.loading);
  const showroomsLoading = useSelector((state) => state.showrooms.loading);
  const categoriesLoading = useSelector((state) => state.categories.loading);

  useEffect(() => {
    dispatch(fetchBrands());
    dispatch(fetchShowrooms());
    dispatch(fetchCategories());
  }, [dispatch]);

  // Memoized filtered options for better performance
  const filteredBrands = useMemo(() => {
    if (!brandSearchValue) return brands;
    return brands.filter(brand =>
      brand.brandName.toLowerCase().includes(brandSearchValue.toLowerCase())
    );
  }, [brands, brandSearchValue]);

  const filteredShowrooms = useMemo(() => {
    if (!showroomSearchValue) return showrooms;
    return showrooms.filter(showroom =>
      showroom.showRoomName.toLowerCase().includes(showroomSearchValue.toLowerCase())
    );
  }, [showrooms, showroomSearchValue]);

  const filteredCategories = useMemo(() => {
    if (!categorySearchValue) return categories;
    return categories.filter(category =>
      category.categoryName.toLowerCase().includes(categorySearchValue.toLowerCase())
    );
  }, [categories, categorySearchValue]);

  const generateRandomId = () => Math.floor(10000 + Math.random() * 90000).toString();

  const onFinish = async (values) => {
    // Build values in the exact casing the API expects
    const apiValues = {
      ProductName: values.productName,
      Price: values.price ? Number(values.price) : 0,
      OldPrice: values.oldPrice ? Number(values.oldPrice) : 0,
      ProductDiscount: values.ProductDiscount ? Number(values.ProductDiscount) : 0,
      Quantity: values.Quantity ? Number(values.Quantity) : 0,
      Color: values.Color,
      Tag: values.Tag,
      Description: values.description,
      BrandId: values.brandId,
      ShowRoomId: values.showRoomId,
      CategoryId: values.categoryId,
      Status: values.status !== undefined ? Number(values.status) : 0, // 1 or 0
      ProductId2: values.ProductId2 || generateRandomId(),
      ProductId3: values.ProductId3 || generateRandomId(),
      ProductID: uuidv4(),
      DateCreated: new Date().toISOString(),
      Userid: 'user-uuid', // TODO: replace with actual logged-in user id
    };

    const formData = new FormData();
    Object.entries(apiValues).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });

    if (!productImageFile) {
      message.error('Please upload a product image.');
      return;
    }
    // Match API field name
    formData.append('ProductImage', productImageFile);

    try {
      setUploading(true);
      await dispatch(addProduct(formData)).unwrap();
      message.success('Product added successfully!');
      await dispatch(fetchProducts());
      handleReset();
      onClose();
    } catch (err) {
      // err is the payload from rejectWithValue
      console.error(err);
      if (typeof err === 'string') {
        message.error(err);
      } else if (err?.title) {
        message.error(err.title);
      } else if (err?.errors) {
        const msgs = Object.values(err.errors).flat();
        message.error(msgs.join(', '));
      } else {
        message.error('Failed to add product.');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleReset = () => {
    form.resetFields();
    setProductImageFile(null);
    setUploadProgress(0);
    setImagePreview(null);
    setCharCount(0);
    setBrandSearchValue('');
    setShowroomSearchValue('');
    setCategorySearchValue('');
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
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('You can only upload image files!');
        return false;
      }
      const isLt5M = file.size / 1024 / 1024 < 5;
      if (!isLt5M) {
        message.error('Image must be smaller than 5MB!');
        return false;
      }
      setProductImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      return false;
    },
    onChange: handleUploadChange,
    showUploadList: false,
    progress: {
      onProgress: ({ percent }) => setUploadProgress(percent ?? 0),
    },
  };

  const handleModalClose = () => {
    handleReset();
    onClose();
  };

  return (
    <Modal
      title={<Title level={4}>Add New Product</Title>}
      open={visible}
      onCancel={handleModalClose}
      footer={null}
      width={750}
      centered
      destroyOnClose
    >
      <Form form={form} layout="vertical" onFinish={onFinish}>
        <Row gutter={[16, 16]}>
          <Col span={16}>
            <Form.Item
              name="productName"
              label="Product Name"
              rules={[
                { required: true, message: 'Please enter the product name.' },
                { min: 3, message: 'Product name must be at least 3 characters.' }
              ]}
            >
              <Input placeholder="e.g., Samsung TV 55 inch" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item 
              name="price" 
              label="Price (₵)" 
              rules={[
                { required: true, message: 'Please enter the price.' },
                { pattern: /^\d+(\.\d{1,2})?$/, message: 'Please enter a valid price.' }
              ]}
            >
              <Input type="number" prefix="₵" placeholder="0.00" min="0" step="0.01" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item 
              name="oldPrice" 
              label="Old Price (₵)"
              rules={[
                { pattern: /^\d+(\.\d{1,2})?$/, message: 'Please enter a valid price.' }
              ]}
            >
              <Input type="number" prefix="₵" placeholder="0.00 (optional)" min="0" step="0.01" />
            </Form.Item>
          </Col>
          <Col span={4}>
            <Form.Item
              name="ProductDiscount"
              label="Discount (₵)"
              rules={[
                { pattern: /^\d+(\.\d{1,2})?$/, message: 'Enter a valid discount amount.' }
              ]}
            >
              <Input type="number" prefix="₵" placeholder="0.00" min="0" step="0.01" />
            </Form.Item>
          </Col>

          <Col span={8}>
            <Form.Item 
              name="Quantity" 
              label="Quantity" 
              rules={[
                { required: true, message: 'Please enter the quantity.' },
                { pattern: /^\d+$/, message: 'Please enter a valid number.' }
              ]}
            >
              <Input type="number" placeholder="Enter quantity" min="0" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item 
              name="Color" 
              label="Color" 
              rules={[{ required: true, message: 'Please enter the color.' }]}
            >
              <Input placeholder="e.g., Red, Blue" />
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item 
              name="Tag" 
              label="Tag" 
              rules={[{ required: true, message: 'Please enter a tag.' }]}
            >
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
            <Form.Item 
              name="status" 
              label="Status" 
              rules={[{ required: true, message: 'Please select the status.' }]}
            >
              <Select placeholder="Select stock status">
                <Option value={1}>In Stock</Option>
                <Option value={0}>Out of Stock</Option>
              </Select>
            </Form.Item>
          </Col>
        </Row>

        <Divider />

        <Form.Item
          name="description"
          label="Description"
          rules={[
            { required: true, message: 'Please input the description!' },
            { min: 10, message: 'Description must be at least 10 characters.' }
          ]}
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
          <Col span={8}>
            <Form.Item 
              name="brandId" 
              label="Brand" 
              rules={[{ required: true, message: 'Please select a brand.' }]}
            >
              <Select
                placeholder="Select or search brand"
                showSearch
                filterOption={false}
                onSearch={setBrandSearchValue}
                loading={brandsLoading}
                notFoundContent={brandsLoading ? 'Loading...' : 'No brands found'}
              >
                {filteredBrands.map((brand) => (
                  <Option key={brand.brandId} value={brand.brandId}>
                    {brand.brandName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item 
              name="showRoomId" 
              label="Showroom" 
              rules={[{ required: true, message: 'Please select a showroom.' }]}
            >
              <Select
                placeholder="Select or search showroom"
                showSearch
                filterOption={false}
                onSearch={setShowroomSearchValue}
                loading={showroomsLoading}
                notFoundContent={showroomsLoading ? 'Loading...' : 'No showrooms found'}
              >
                {filteredShowrooms.map((room) => (
                  <Option key={room.showRoomID} value={room.showRoomID}>
                    {room.showRoomName}
                  </Option>
                ))}
              </Select>
            </Form.Item>
          </Col>
          <Col span={8}>
            <Form.Item 
              name="categoryId" 
              label="Category" 
              rules={[{ required: true, message: 'Please select a category.' }]}
            >
              <Select
                placeholder="Select or search category"
                showSearch
                filterOption={false}
                onSearch={setCategorySearchValue}
                loading={categoriesLoading}
                notFoundContent={categoriesLoading ? 'Loading...' : 'No categories found'}
              >
                {filteredCategories.map((category) => (
                  <Option key={category.categoryId} value={category.categoryId}>
                    {category.categoryName}
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
            <div style={{ 
              marginTop: 10, 
              border: '1px solid #e5e5e5', 
              padding: 10, 
              borderRadius: 8 
            }}>
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
          <Row gutter={16}>
            <Col span={12}>
              <Button
                size="large"
                block
                onClick={handleModalClose}
                disabled={uploading}
              >
                Cancel
              </Button>
            </Col>
            <Col span={12}>
              <Button
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium"
                htmlType="submit"
                loading={uploading}
                block
                size="large"
                type="primary"
              >
                Add Product
              </Button>
            </Col>
          </Row>
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