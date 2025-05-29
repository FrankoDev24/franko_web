import { useEffect, useState, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchAllProducts } from "../../../Redux/Slice/productSlice";
import { fetchBrands } from "../../../Redux/Slice/brandSlice";
import { fetchShowrooms } from "../../../Redux/Slice/showRoomSlice";
import { Button, Table, message, Input, Modal, Tooltip, Tag, Checkbox } from "antd";
import { EyeOutlined, EditOutlined , PlusOutlined , UploadOutlined } from "@ant-design/icons";
import AddProduct from "./AddProduct";
import UpdateProduct from "./EditProduct";
import UpdateProductImage from "./UpdateProductImage";


const Products = () => {
  const dispatch = useDispatch();
  const { products } = useSelector((state) => state.products);
  const { brands } = useSelector((state) => state.brands);
  const { showrooms } = useSelector((state) => state.showrooms);
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false);
  const [isImageModalVisible, setIsImageModalVisible] = useState(false);
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false);
  const [isDescriptionModalVisible, setIsDescriptionModalVisible] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchText, setSearchText] = useState("");
  const [fullImageUrl, setFullImageUrl] = useState("");
  const [descriptionText, setDescriptionText] = useState("");
  const [filterOutOfStock, setFilterOutOfStock] = useState(false);
  const [isUpdateImageModalVisible, setIsUpdateImageModalVisible] = useState(false);
const [selectedProductIdForImage, setSelectedProductIdForImage] = useState(null);


  const backendBaseURL = import.meta.env.VITE_API_BASE_URL;
  const fetchProductData = useCallback(async () => {
    try {
      await dispatch(fetchAllProducts()).unwrap();
      await dispatch(fetchBrands()).unwrap();
      await dispatch(fetchShowrooms()).unwrap();
    } catch (err) {
      console.error(err);
      message.error("Failed to load data.");
    }
  }, [dispatch]);

  useEffect(() => {
    fetchProductData();
  }, [fetchProductData]);

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setIsAddModalVisible(true);
  };

  const handleUpdateProduct = (product) => {
    setSelectedProduct(product);
    setIsUpdateModalVisible(true);  // Show the Update modal
  };
  const handleUpdateProductImage = (productID) => {
    setSelectedProductIdForImage(productID);
    setIsUpdateImageModalVisible(true);
  };
  

  const handleViewProductDetails = (product) => {
    setSelectedProduct(product);
    setIsDetailModalVisible(true);
  };

  const handleSearch = (e) => {
    setSearchText(e.target.value);
  };

  const handleDescriptionClick = (description) => {
    setDescriptionText(description);
    setIsDescriptionModalVisible(true);
  };
  const filteredProducts = (products || []).filter((product) => {
    const productNameMatch =
      product.productName?.toLowerCase().includes(searchText.toLowerCase()) || false;
    const showroomMatch =
      product.showRoomName?.toLowerCase().includes(searchText.toLowerCase()) || false;
    const brandMatch =
      product.brandName?.toLowerCase().includes(searchText.toLowerCase()) || false;
    const stockFilter = filterOutOfStock ? product.status == 0 : true; // status 0 means out of stock
  
    return (productNameMatch || showroomMatch || brandMatch) && stockFilter;
  })

  const sortedProducts = filteredProducts.sort(
    (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)
  );

  const columns = [
    {
      title: "Image",
      dataIndex: "productImage",
      key: "productImage",
      render: (imagePath) => {
        const imageUrl = `${backendBaseURL}/Media/Products_Images/${imagePath
          .split("\\")
          .pop()}`;

        return (
          <img
            src={imageUrl}
            alt="Product"
            style={{
              width: 50,
              height: 50,
              objectFit: "cover",
              borderRadius: "5px",
              cursor: "pointer",
            }}
            onClick={() => {
              setFullImageUrl(imageUrl);
              setIsImageModalVisible(true);
            }}
          />
        );
      },
    },
    {
      title: "Product Name",
      dataIndex: "productName",
      key: "productName",
    },
    {
      title: "Description",
      dataIndex: "description",
      key: "description",
      render: (text) => {
        const truncatedText = text.length > 30 ? `${text.substring(0, 30)}...` : text;
    
        return (
          <Tooltip title="View description">
            <span onClick={() => handleDescriptionClick(text)}>
              {truncatedText}
            </span>
          </Tooltip>
        );
      },
    },
    
    
    {
      title: "Price",
      dataIndex: "price",
      key: "price",
      render: (text) => `₵${parseFloat(text).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`,
    },
    
    {
      title: "Date Created",
      dataIndex: "dateCreated",
      key: "dateCreated",
      render: (text) => new Date(text).toLocaleDateString(),
      sorter: (a, b) => new Date(a.dateCreated) - new Date(b.dateCreated),
    },
    {
      title: "Brand",
      dataIndex: "brandName",
      key: "brandName",
    },
    {
      title: 'Availability',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        // eslint-disable-next-line eqeqeq
        status == 1 ? 
          <Tag color="green">In Stock</Tag> : 
          <Tag color="red">Out of Stock</Tag>
      ),
    },
    
  
    
    {
      title: "Actions",
      key: "actions",
      render: (text, record) => (
        <div style={{ display: "flex", gap: "8px" }}>
          <Tooltip title="Edit">
            <Button 
              icon={<EditOutlined />} 
              onClick={() => handleUpdateProduct(record)} 
            />
          </Tooltip>
         
          <Tooltip title="Update Image">
            <Button
              icon={<UploadOutlined />}
              onClick={() => handleUpdateProductImage(record.productID)}
            />
          </Tooltip>
          <Tooltip title="View Details">
            <Button
              icon={<EyeOutlined />} 
              onClick={() => handleViewProductDetails(record)}
            />
          </Tooltip>
        </div>
      ),
    }
    
    ];

  return (
    <div>
      <h1 className="text-xl font-bold mb-4 text-red-500">Products Management</h1>
      <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: 16 }}>
  <Input.Search
    placeholder="Search by product, showroom, or brand name"
    onChange={handleSearch}
    style={{ width: "400px" }}
  />
  <Button
    icon={<PlusOutlined />}
    type="primary"
    onClick={handleAddProduct}
    className="bg-green-600 text-white transition rounded-full"
  >
    Add Product
  </Button>
  <Checkbox
    checked={filterOutOfStock}
    onChange={(e) => setFilterOutOfStock(e.target.checked)}
    style={{ marginLeft: "auto" }}
  >
    Show Only Out of Stock
  </Checkbox>
</div>

      <Table
        dataSource={sortedProducts}
        columns={columns}
        rowKey="productID"
        bordered
      />

      {/* Add Product Modal */}
      <AddProduct
        visible={isAddModalVisible}
        onClose={() => {
          setIsAddModalVisible(false);
          fetchProductData();
        }}
        brands={brands}
        showrooms={showrooms}
      />
      
      <UpdateProduct
 visible={isUpdateModalVisible}
 onClose={() => {
   setIsUpdateModalVisible(false);
   fetchProductData();
 }}
  product={selectedProduct || {}}
  brands={brands}
  showrooms={showrooms}
/>
<UpdateProductImage
  visible={isUpdateImageModalVisible}
  onClose={() => {
    setIsUpdateImageModalVisible(false);
    fetchProductData(); // Refresh product data after image update
  }}
  productID={selectedProductIdForImage}
/>


      
      {/* Full Image Modal */}
      <Modal
        visible={isImageModalVisible}
        onCancel={() => setIsImageModalVisible(false)}
        footer={null}
        title="Product Image"
      >
        <img
          src={fullImageUrl}
          alt="Full Product"
          style={{ width: "100%", height: "auto" }}
        />
      </Modal>

      {/* Product Details Modal */}
      <Modal
  visible={isDetailModalVisible}
  onCancel={() => setIsDetailModalVisible(false)}
  footer={null}
  centered
  bodyStyle={{ padding: 0 }}
  width={500}
>
  {selectedProduct && (
    <div style={{ borderRadius: 10, overflow: "hidden", boxShadow: "0 4px 8px rgba(0,0,0,0.2)" }}>
      {/* Product Image */}
      <div style={{ backgroundColor: "#f0f0f0", textAlign: "center" }}>
        <img
          src={`${backendBaseURL}/Media/Products_Images/${selectedProduct.productImage.split("\\").pop()}`}
          alt={selectedProduct.productName}
          style={{ width: "100%", maxHeight: "500px", objectFit: "cover" }}
        />
      </div>

      {/* Product Details */}
      <div style={{ padding: 20 }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 600, marginBottom: 8 }}>
          {selectedProduct.productName}
        </h2>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 15 }}>
          <span style={{ fontSize: "1.2rem", fontWeight: 500, color: "red", marginRight: 10 }}>
            ₵{parseFloat(selectedProduct.price).toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </span>
          {selectedProduct.oldPrice > 0 && (
            <span style={{ fontSize: "1rem", textDecoration: "line-through", color: "#999" }}>
              ₵{parseFloat(selectedProduct.oldPrice).toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          )}
        </div>

        <p style={{ color: "#777", fontSize: "0.9rem", marginBottom: 5 }}>
          <strong>Product ID:</strong> {selectedProduct.productID}
        </p>


        <div style={{ fontSize: "1rem", color: "#555", marginBottom: 10 }}>
          <p><strong>Category:</strong> {selectedProduct.categoryName}</p>
          <p><strong>Brand:</strong> {selectedProduct.brandName}</p>
          <p><strong>Showroom:</strong> {selectedProduct.showRoomName}</p>
          <p><strong>Date Created:</strong> {new Date(selectedProduct.dateCreated).toLocaleDateString()}</p>
        </div>
      </div>
    </div>
  )}
</Modal>



      {/* Full Description Modal */}
      <Modal
        visible={isDescriptionModalVisible}
        onCancel={() => setIsDescriptionModalVisible(false)}
        footer={null}
        title="Product Description"
      >
        <p>{descriptionText}</p>
      </Modal>
    </div>
  );
};

export default Products;