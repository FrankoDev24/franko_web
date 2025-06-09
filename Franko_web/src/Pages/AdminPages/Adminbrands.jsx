import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchBrands,
  addBrand,
  updateBrand,
} from "../../Redux/Slice/brandSlice";
import { fetchCategories } from "../../Redux/Slice/categorySlice";
import {
  Select, Form, Input,Button,Table,Upload,Modal,
  message,
  Row,
  Col,
} from "antd";
import { PlusOutlined, EditOutlined, UploadOutlined } from "@ant-design/icons";
import { debounce } from "lodash";
import { v4 as uuidv4 } from "uuid";

const backendBaseURL = "https://smfteapi.salesmate.app";

const Adminbrands = () => {
  const dispatch = useDispatch();
  const { brands, loading, totalRecords } = useSelector((state) => state.brands);
  const { categories, loading: categoryLoading } = useSelector(
    (state) => state.categories
  );

  const [isModalVisible, setIsModalVisible] = useState(false);
  const [form] = Form.useForm();
  const [currentBrand, setCurrentBrand] = useState(null);
  const [previewLogo, setPreviewLogo] = useState(null);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    dispatch(fetchBrands({ page: currentPage, limit: 10 }));
    dispatch(fetchCategories());
  }, [dispatch, currentPage]);

  useEffect(() => {
    if (currentBrand) {
      console.log("Current Brand: ", currentBrand); // Log to verify the categoryId
      console.log("Categories: ", categories); // Log categories data to ensure it's available
      form.setFieldsValue({
        BrandName: currentBrand.brandName,
        CategoryId: currentBrand.categoryId.toString(), // Ensure it's a string
      });
    }
  }, [currentBrand, categories, form]);
  const showModal = (brand = null) => {
    console.log("Selected Brand: ", brand); // Debugging: log selected brand
    setCurrentBrand(brand);
    if (brand) {
      form.setFieldsValue({
        BrandName: brand.brandName,
        CategoryId: brand.categoryId ? brand.categoryId.toString() : '', // Ensure it's a string
      });
      setPreviewLogo(brand.logoUrl);
    } else {
      form.resetFields();
      setPreviewLogo(null);
    }
    setIsModalVisible(true);
  };
  
  const handleSubmit = async (values) => {
    setSubmitLoading(true);
    try {
      const formData = new FormData();
      formData.append("BrandName", values.BrandName);
      formData.append("CategoryId", values.CategoryId);
  
      if (values.LogoName?.file) {
        formData.append("LogoName", values.LogoName.file);
      } else if (currentBrand?.logoUrl) {
        formData.append("LogoName", currentBrand.logoName);
      }
  
      if (currentBrand) {
        // Update brand
        await dispatch(updateBrand({ id: currentBrand.brandId, formData })).unwrap();
        message.success("Brand updated successfully!");
  
        // Refetch the brands after update
        dispatch(fetchBrands({ page: currentPage, limit: 10 })).then(() => {
          // Ensure we reset currentBrand after the update
          setCurrentBrand(null);
        });
      } else {
        // Add brand
        formData.append("BrandId", uuidv4());
        await dispatch(addBrand(formData)).unwrap();
        message.success("Brand added successfully!");
      }
  
      setIsModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error("Error saving brand:", error);
      message.error(error?.message || "Failed to save brand. Please try again.");
    } finally {
      setSubmitLoading(false);
    }
  };
  

  const handleFileChange = ({ file }) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => setPreviewLogo(e.target.result);
      reader.readAsDataURL(file);
    } else {
      setPreviewLogo(null);
    }
  };

  const handleSearchChange = debounce((e) => {
    setSearchText(e.target.value.toLowerCase());
  }, 300);

  const filteredBrands = useMemo(() => {
    return brands.filter((brand) => {
      const brandNameMatch =
        brand.brandName?.toLowerCase().includes(searchText) || false;
      const categoryMatch = categories.some(
        (category) =>
          category.categoryName?.toLowerCase().includes(searchText) &&
          category.categoryId === brand.categoryId
      );
      return brandNameMatch || categoryMatch;
    });
  }, [brands, categories, searchText]);

  const columns = [
    { title: "Brand Name", dataIndex: "brandName", key: "brandName" },
    {
      title: "Category",
      dataIndex: "categoryId",
      key: "categoryId",
      render: (categoryId) => {
        const category = categories.find((cat) => cat.categoryId === categoryId);
        return category ? category.categoryName : "Unknown";
      },
    },
    {
      title: "Image",
      dataIndex: "logoName",
      key: "logoName",
      render: (imagePath) => {
        const imageUrl = `${backendBaseURL}/Media/Brand_Logo/${imagePath
          .split("\\")
          .pop()}`;
        return (
          <img
            src={imageUrl}
            alt="Brand Logo"
            style={{
              width: 50,
              height: 50,
              objectFit: "cover",
              borderRadius: "5px",
              cursor: "pointer",
            }}
            onClick={() => {
              setPreviewLogo(imageUrl);
              setIsModalVisible(true);
            }}
          />
        );
      },
    },
    {
      title: "Actions",
      key: "actions",
      render: (_, record) => (
        <Button
          icon={<EditOutlined />}
          onClick={() => showModal(record)}
          className="bg-green-600 text-white transition rounded-full"
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <div className="p-4">
      <Row justify="space-between" align="middle" className="mb-4">
        <Col>
          <h1 className="text-lg font-semibold text-red-500">Brands Management</h1>
        </Col>
        <Col>
          <Button
            icon={<PlusOutlined />}
            onClick={() => showModal()}
            className="bg-green-600 text-white transition rounded-full"
          >
            Add Brand
          </Button>
        </Col>
      </Row>

      <Row justify="space-between" className="mb-4">
        <Col span={24} md={10} className="mb-2 md:mb-0">
          <Input
            placeholder="Search by brand or category"
            onChange={handleSearchChange}
            className="w-full rounded-full"
            allowClear
          />
        </Col>
      </Row>

      <Table
        columns={columns}
        bordered
        dataSource={filteredBrands}
        rowKey="brandId"
        loading={loading || categoryLoading}
        pagination={{
          current: currentPage,
          pageSize: 10,
          total: totalRecords,
          onChange: (page) => setCurrentPage(page),
        }}
        style={{ marginTop: 20 }}
      />

<Modal
  title={currentBrand ? "Edit Brand" : "Add Brand"}
  visible={isModalVisible}
  onCancel={() => setIsModalVisible(false)}
  footer={null}
  centered
  bodyStyle={{ padding: 20 }}
  key={currentBrand ? currentBrand.brandId : "add"}  // Add key to force re-render
>
        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <Form.Item
            label="Brand Name"
            name="BrandName"
            rules={[{ required: true, message: "Please enter brand name" }]}
          >
            <Input
              placeholder="Enter brand name"
              className="w-full rounded-full"
            />
          </Form.Item>

          <Form.Item
  label="Category"
  name="CategoryId"
  rules={[{ required: true, message: "Please select a category" }]}
>
  <Select
    placeholder="Select category"
    value={form.getFieldValue("CategoryId")}
    loading={categoryLoading}
    onChange={(value) => {
      console.log("Category changed:", value); // Add this log to see the selected category
    }}
  >
    {categories.map((cat) => (
      <Select.Option key={cat.categoryId} value={cat.categoryId}>
        {cat.categoryName}
      </Select.Option>
    ))}
  </Select>
</Form.Item>

          <Form.Item
            label="Logo"
            name="LogoName"
            valuePropName="file"
          >
            <Upload
              name="logo"
              showUploadList={false}
              beforeUpload={() => false}
              onChange={handleFileChange}
            >
              <Button icon={<UploadOutlined />}>Upload Logo</Button>
            </Upload>
          </Form.Item>

          {previewLogo && (
            <div className="mb-4">
              <img
                src={previewLogo}
                alt="Preview"
                className="w-20 h-20 object-cover"
              />
            </div>
          )}

          <Form.Item>
            <Button
              type="primary"
              htmlType="submit"
              className="bg-green-600 text-white transition rounded-full w-full"
              loading={submitLoading}
            >
              {currentBrand ? "Update Brand" : "Add Brand"}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};


export default Adminbrands;

