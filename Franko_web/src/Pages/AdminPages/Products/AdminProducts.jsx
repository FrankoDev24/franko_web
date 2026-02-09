import { useEffect, useState, useCallback, useMemo } from "react"
import { useDispatch, useSelector } from "react-redux"
import { fetchAllProducts } from "../../../Redux/Slice/productSlice"
import { fetchBrands } from "../../../Redux/Slice/brandSlice"
import { fetchShowrooms } from "../../../Redux/Slice/showRoomSlice"
import { fetchBranchProducts } from "../../../Redux/Slice/branchProductSlice"
import {
  Button,
  Table,
  message,
  Input,
  Modal,
  Tooltip,
  Tag,
  Card,
  Space,
  Select,
  Row,
  Col,
  Statistic,
  Avatar,
  Badge,
} from "antd"
import {
  EyeOutlined,
  EditOutlined,
  PlusOutlined,
  UploadOutlined,
  ReloadOutlined,
  DownloadOutlined,
  SearchOutlined,
  ShopOutlined,
  TagsOutlined,
  CheckCircleOutlined,
  LinkOutlined,
  WarningOutlined,
} from "@ant-design/icons"
import * as XLSX from "xlsx"
import AddProduct from "./AddProduct"
import UpdateProduct from "./EditProduct"
import UpdateProductImage from "./UpdateProductImage"

const { Option } = Select

const AdminProducts = () => {
  const dispatch = useDispatch()

  const { products, loading: productsLoading } = useSelector((state) => state.products)
  const { brands, loading: brandsLoading } = useSelector((state) => state.brands)
  const { showrooms, loading: showroomsLoading } = useSelector((state) => state.showrooms)

  // Branch products slice (contains productCode)
  const {
    data: branchProducts = [],
    loading: branchLoading,
    error: branchError,
  } = useSelector((state) => state.branchProducts || {})

  // Modal states
  const [isAddModalVisible, setIsAddModalVisible] = useState(false)
  const [isUpdateModalVisible, setIsUpdateModalVisible] = useState(false)
  const [isImageModalVisible, setIsImageModalVisible] = useState(false)
  const [isDetailModalVisible, setIsDetailModalVisible] = useState(false)
  const [isDescriptionModalVisible, setIsDescriptionModalVisible] = useState(false)
  const [isUpdateImageModalVisible, setIsUpdateImageModalVisible] = useState(false)

  // Data states
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [selectedProductIdForImage, setSelectedProductIdForImage] = useState(null)
  const [fullImageUrl, setFullImageUrl] = useState("")
  const [descriptionText, setDescriptionText] = useState("")

  // Filter states
  const [searchText, setSearchText] = useState("")
  const [filterBrand, setFilterBrand] = useState("")
  const [filterShowroom, setFilterShowroom] = useState("")
  const [filterStock, setFilterStock] = useState("all")

  // Loading state for manual refresh
  const [refreshLoading, setRefreshLoading] = useState(false)
  const [dataLoaded, setDataLoaded] = useState(false)

  const backendBaseURL = "https://fte002n1.salesmate.app/"

  const isLoading =
    productsLoading ||
    brandsLoading ||
    showroomsLoading ||
    branchLoading ||
    refreshLoading

  // Normalize names for matching (case-insensitive, trim, collapse whitespace)
  const normalizeName = useCallback((s) => {
    return String(s ?? "")
      .trim()
      .replace(/\s+/g, " ")
      .toLowerCase()
  }, [])

  // Fetch data only once on mount
  const fetchInitialData = useCallback(() => {
    if (!products?.length) dispatch(fetchAllProducts())
    if (!brands?.length) dispatch(fetchBrands())
    if (!showrooms?.length) dispatch(fetchShowrooms())
    if (!branchProducts?.length) dispatch(fetchBranchProducts())
    setDataLoaded(true)
  }, [
    dispatch,
    products?.length,
    brands?.length,
    showrooms?.length,
    branchProducts?.length,
  ])

  useEffect(() => {
    if (!dataLoaded) fetchInitialData()
  }, [fetchInitialData, dataLoaded])

  // Debug: Log products when they change
  useEffect(() => {
    if (products?.length > 0) {
 
      // Log first product to see structure
   
      // Check how many have ProductId2
      const withId2 = products.filter(p => p.ProductId2 || p.productId2 || p.productCode)

    }
  }, [products])

  // Manual refresh
  const handleRefresh = useCallback(async () => {
    setRefreshLoading(true)
    try {
      await Promise.all([
        dispatch(fetchAllProducts()).unwrap(),
        dispatch(fetchBrands()).unwrap(),
        dispatch(fetchShowrooms()).unwrap(),
        dispatch(fetchBranchProducts()).unwrap(),
      ])
      message.success("Data refreshed successfully!")
    } catch (err) {

      message.error("Failed to refresh data.")
    } finally {
      setRefreshLoading(false)
    }
  }, [dispatch])

  // Build index: productCode -> branch product details
  const branchProductsByCode = useMemo(() => {
    const map = new Map()
    const list = Array.isArray(branchProducts) ? branchProducts : []

    for (const bp of list) {
      if (bp?.productCode) {
        // Store by productCode for lookup
        map.set(String(bp.productCode).trim(), bp)
      }
    }
    return map
  }, [branchProducts])

  // Build index: productName -> productCode (from branchProducts)
  const branchCodeByProductName = useMemo(() => {
    const map = new Map()
    const list = Array.isArray(branchProducts) ? branchProducts : []

    for (const bp of list) {
      const key = normalizeName(bp?.productName)
      if (!key) continue
      map.set(key, bp?.productCode ?? null)
    }
    return map
  }, [branchProducts, normalizeName])

  // Enrich main products with branch product code and manual ProductId2
  const productsWithBranchCode = useMemo(() => {
    const list = Array.isArray(products) ? products : []
    
    return list.map((p) => {
      // Check ALL possible field names for ProductId2
      const manualProductId2 = 
        p.ProductId2 || 
        p.productId2 || 
        p.productCode || 
        p.ProductCode ||
        p.product_Id2 ||
        p.product_Code ||
        null
      
      // Priority 2: Try to match by product name
      const key = normalizeName(p?.productName)
      const branchCodeByName = key ? branchCodeByProductName.get(key) : null
      
      // Final product code (manual takes priority over name match)
      const finalProductCode = manualProductId2 || branchCodeByName || null
      
      // Look up branch product details using the final code
      let branchProductDetails = null
      let codeSource = null // Track where the code came from
      
      if (finalProductCode) {
        branchProductDetails = branchProductsByCode.get(String(finalProductCode).trim())
        
        if (manualProductId2) {
          codeSource = 'manual' // Manually entered
        } else if (branchCodeByName) {
          codeSource = 'matched' // Matched by name
        }
      }

      return {
        ...p,
        // Store original manually entered code
        manualProductId2: manualProductId2,
        // Store code found by name matching
        branchProductCode: branchCodeByName,
        // Final display code (manual or matched)
        productId2Display: finalProductCode,
        // Branch product details if found
        branchProductDetails: branchProductDetails,
        // Track the source of the code
        codeSource: codeSource,
        // Check if code exists in branch products
        isValidBranchCode: !!branchProductDetails,
      }
    })
  }, [products, branchCodeByProductName, branchProductsByCode, normalizeName])

  // Filter + stats
  const { filteredProducts, productStats } = useMemo(() => {
    const list = Array.isArray(productsWithBranchCode)
      ? productsWithBranchCode
      : []

    const q = searchText.trim().toLowerCase()

    const filtered = list.filter((product) => {
      const searchMatch =
        !q ||
        [
          product.productName,
          product.showRoomName,
          product.brandName,
          product.description,
          product.productId2Display,
          product.manualProductId2,
          product.branchProductCode,
        ].some((field) =>
          String(field ?? "").toLowerCase().includes(q)
        )

      const brandMatch = !filterBrand || product.brandName === filterBrand
      const showroomMatch =
        !filterShowroom || product.showRoomName === filterShowroom

      let stockMatch = true
      if (filterStock === "in_stock") stockMatch = product.status == 1
      if (filterStock === "out_of_stock") stockMatch = product.status == 0

      return searchMatch && brandMatch && showroomMatch && stockMatch
    })

    const sorted = [...filtered].sort(
      (a, b) => new Date(b.dateCreated) - new Date(a.dateCreated)
    )

    const stats = {
      total: list.length,
      filtered: filtered.length,
      inStock: list.filter((p) => p.status == 1).length,
      outOfStock: list.filter((p) => p.status == 0).length,
      totalValue: list.reduce(
        (sum, p) => sum + parseFloat(p.price || 0),
        0
      ),
      withBranchCode: list.filter((p) => !!p.productId2Display).length,
      withManualCode: list.filter((p) => !!p.manualProductId2).length,
      withMatchedCode: list.filter((p) => p.codeSource === 'matched').length,
      withValidCode: list.filter((p) => p.isValidBranchCode).length,
    }

    return { filteredProducts: sorted, productStats: stats }
  }, [
    productsWithBranchCode,
    searchText,
    filterBrand,
    filterShowroom,
    filterStock,
  ])

  // Enhanced modal close helper with forced refresh
  const handleModalClose = useCallback(
    async (modalSetter, shouldRefresh = false) => {
      modalSetter(false)
      if (shouldRefresh) {
      
        try {
          await dispatch(fetchAllProducts()).unwrap()
        
        } catch (error) {
       
        }
      }
    },
    [dispatch]
  )

  const handleAddProduct = () => {
    setSelectedProduct(null)
    setIsAddModalVisible(true)
  }

  const handleUpdateProduct = (product) => {

    setSelectedProduct(product)
    setIsUpdateModalVisible(true)
  }

  const handleUpdateProductImage = (productID) => {
    setSelectedProductIdForImage(productID)
    setIsUpdateImageModalVisible(true)
  }

  const handleViewProductDetails = (product) => {
    setSelectedProduct(product)
    setIsDetailModalVisible(true)
  }

  const handleDescriptionClick = (description) => {
    setDescriptionText(description)
    setIsDescriptionModalVisible(true)
  }

  // Export
  const exportToExcel = () => {
    try {
      const exportData = filteredProducts.map((product, index) => ({
        "S/N": index + 1,
        "Product Name": product.productName || "",
        "Product Code (ProductId2)": product.productId2Display ?? "",
        "Code Source": product.codeSource === 'manual' ? "Manual Entry" : product.codeSource === 'matched' ? "Name Match" : "",
        "Valid Branch Code": product.isValidBranchCode ? "Yes" : "No",
        "Branch Stock": product.branchProductDetails?.quantity || product.branchProductDetails?.stockQuantity || "-",
        Description: product.description || "",
        "Price (₵)": parseFloat(product.price || 0).toFixed(2),
        "Old Price (₵)": product.oldPrice
          ? parseFloat(product.oldPrice).toFixed(2)
          : "",
        Brand: product.brandName || "",
        Category: product.categoryName || "",
        Showroom: product.showRoomName || "",
        Availability: product.status == 1 ? "In Stock" : "Out of Stock",
        "Date Created": product.dateCreated
          ? new Date(product.dateCreated).toLocaleDateString()
          : "",
      }))

      const wb = XLSX.utils.book_new()
      const ws = XLSX.utils.json_to_sheet(exportData)

      ws["!cols"] = [
        { wch: 5 },
        { wch: 30 },
        { wch: 22 },
        { wch: 12 },
        { wch: 15 },
        { wch: 12 },
        { wch: 40 },
        { wch: 12 },
        { wch: 12 },
        { wch: 15 },
        { wch: 15 },
        { wch: 20 },
        { wch: 14 },
        { wch: 15 },
      ]

      XLSX.utils.book_append_sheet(wb, ws, "Products")

      const currentDate = new Date().toISOString().split("T")[0]
      const filename = `products_export_${currentDate}.xlsx`

      XLSX.writeFile(wb, filename)
      message.success(`Products exported successfully as ${filename}`)
    } catch (error) {
  
      message.error("Failed to export products to Excel")
    }
  }

  // Table columns
  const columns = useMemo(
    () => [
      {
        title: "Image",
        dataIndex: "productImage",
        key: "productImage",
        width: 50,
        fixed: "left",
        render: (imagePath) => {
          const imageUrl = `${backendBaseURL}/Media/Products_Images/${imagePath
            ?.split("\\")
            .pop()}`
          return (
            <Avatar
              src={imageUrl}
              size={50}
              shape="square"
              style={{ cursor: "pointer", border: "1px solid #f0f0f0" }}
              onClick={() => {
                setFullImageUrl(imageUrl)
                setIsImageModalVisible(true)
              }}
            />
          )
        },
      },

      {
        title: "Product Details",
        key: "productDetails",
        width: 180,
        dataIndex: "productName",
        render: (_, record) => {
          const hasCode = !!record.productId2Display
          const isManual = record.codeSource === 'manual'
          const isMatched = record.codeSource === 'matched'
          const isValid = record.isValidBranchCode

          return (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 4, fontSize: "14px" }}>
                {record.productName}
              </div>

              <div style={{ fontSize: "12px", color: "#666", marginBottom: 2 }}>
                ID: {record.productID}
              </div>

              {/* Enhanced Product Code Display */}
              <div style={{ fontSize: "12px", marginBottom: 2 }}>
                <Space size="small" align="center">
                  <span style={{ color: '#666' }}>Product Code:</span>
                  {hasCode ? (
                    <Tooltip 
                      title={
                        <div>
                          <div>Code: {record.productId2Display}</div>
                         
                        </div>
                      }
                    >
                      <Tag 
                        color={"green"}
                        style={{ 
                          fontFamily: "monospace", 
                          cursor: "pointer",
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          fontSize: '11px'
                        }}
                      >
                        {record.productId2Display}
                    
                        {isValid && <CheckCircleOutlined style={{ fontSize: '11px' }} />}
                        {!isValid && hasCode && <WarningOutlined style={{ fontSize: '11px' }} />}
                      </Tag>
                    </Tooltip>
                  ) : (
                    <Tag color="default" style={{ fontSize: '11px' }}>Not Set</Tag>
                  )}
                </Space>
              </div>

            


              <div style={{ fontSize: "12px", color: "#999" }}>
                {record.dateCreated
                  ? new Date(record.dateCreated).toLocaleDateString()
                  : "-"}
              </div>
            </div>
          )
        },
      },

      {
        title: "Price",
        dataIndex: "price",
        key: "price",
        width: 100,
        render: (price, record) => (
          <div>
            <div style={{ fontWeight: 600, color: "#ff4d4f" }}>
              ₵
              {parseFloat(price || 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </div>
            {record.oldPrice > 0 && (
              <div
                style={{
                  fontSize: "12px",
                  textDecoration: "line-through",
                  color: "#999",
                }}
              >
                ₵
                {parseFloat(record.oldPrice).toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                })}
              </div>
            )}
          </div>
        ),
      },

      {
        title: "Brand & Category",
        key: "brandCategory",
        width: 130,
        render: (_, record) => (
          <div>
            <Tag color="red" style={{ marginBottom: 4 }}>
              {record.brandName}
            </Tag>
            <br />
            <Tag color="orange">{record.categoryName}</Tag>
          </div>
        ),
      },

      {
        title: "Showroom",
        dataIndex: "showRoomName",
        key: "showRoomName",
        width: 130,
        render: (_, record) => (
          <Tag
            color={
              record.showRoomName === "Products out of stock" ? "red" : "green"
            }
            style={{ marginBottom: 4 }}
          >
            {record.showRoomName}
          </Tag>
        ),
      },

      {
        title: "Status",
        dataIndex: "status",
        key: "status",
        width: 100,
        render: (status) => (
          <Tag color={status == 1 ? "success" : "error"}>
            {status == 1 ? "In Stock" : "Out of Stock"}
          </Tag>
        ),
      },

      {
        title: "Actions",
        key: "actions",
        width: 103,
        fixed: "right",
        render: (_, record) => (
          <Space size="small">
            <Tooltip title="Edit Product">
              <Button
                type="text"
                icon={<EditOutlined />}
                onClick={() => handleUpdateProduct(record)}
              />
            </Tooltip>
            <Tooltip title="Update Image">
              <Button
                type="text"
                icon={<UploadOutlined />}
                onClick={() => handleUpdateProductImage(record.productID)}
              />
            </Tooltip>
            <Tooltip title="View Details">
              <Button
                type="text"
                icon={<EyeOutlined />}
                onClick={() => handleViewProductDetails(record)}
              />
            </Tooltip>
          </Space>
        ),
      },
    ],
    [backendBaseURL]
  )

  return (
    <div
      style={{ minHeight: "100vh" }}
      className="min-h-screen overflow-y-auto px-4 py-6 bg-white"
    >
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "20px",
            fontWeight: 700,
            color: "#262626",
            margin: 0,
            marginBottom: "3px",
          }}
        >
          Products Management
        </h1>
        <p style={{ color: "#8c8c8c", margin: 0 }}>
          Manage your product inventory, pricing, and availability
        </p>
        
      </div>

      {/* Statistics Cards */}
      <Row gutter={16} style={{ marginBottom: "20px" }}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Products"
              value={productStats.total}
              prefix={<TagsOutlined style={{ color: "#1890ff" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="In Stock"
              value={productStats.inStock}
              valueStyle={{ color: "#3f8600" }}
              prefix={<ShopOutlined style={{ color: "#3f8600" }} />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Out of Stock"
              value={productStats.outOfStock}
              valueStyle={{ color: "#cf1322" }}
              prefix={<ShopOutlined style={{ color: "#cf1322" }} />}
            />
          </Card>
        </Col>
      
      </Row>

      {/* Filters and Controls */}
      <Card style={{ marginBottom: "24px" }}>
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={12} md={8}>
            <Input.Search
              placeholder="Search products, brands, showrooms, product code..."
              prefix={<SearchOutlined />}
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              style={{ width: "100%" }}
              allowClear
            />
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Filter by Brand"
              style={{ width: "100%" }}
              value={filterBrand}
              onChange={setFilterBrand}
              allowClear
            >
              {brands?.map((brand) => (
                <Option key={brand.brandID} value={brand.brandName}>
                  {brand.brandName}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Filter by Showroom"
              style={{ width: "100%" }}
              value={filterShowroom}
              onChange={setFilterShowroom}
              allowClear
            >
              {showrooms?.map((showroom) => (
                <Option key={showroom.showRoomID} value={showroom.showRoomName}>
                  {showroom.showRoomName}
                </Option>
              ))}
            </Select>
          </Col>

          <Col xs={24} sm={12} md={4}>
            <Select
              placeholder="Stock Status"
              style={{ width: "100%" }}
              value={filterStock}
              onChange={setFilterStock}
            >
              <Option value="all">All Products</Option>
              <Option value="in_stock">In Stock Only</Option>
              <Option value="out_of_stock">Out of Stock Only</Option>
            </Select>
          </Col>

          <Col xs={24} md={4}>
            <Space>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={handleAddProduct}
                style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
              >
                Add Product
              </Button>
            </Space>
          </Col>
        </Row>

        <Row gutter={16} style={{ marginTop: "16px" }}>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={handleRefresh}
                loading={refreshLoading}
              >
                Refresh
              </Button>

              <Button
                icon={<DownloadOutlined />}
                onClick={exportToExcel}
                disabled={filteredProducts.length === 0}
                type="dashed"
              >
                Export Excel
              </Button>
            </Space>
          </Col>

          <Col style={{ marginLeft: "auto" }}>
            <span style={{ color: "#8c8c8c" }}>
              Showing {productStats.filtered} of {productStats.total} products 
             
            </span>
          </Col>
        </Row>
      </Card>

      {/* Products Table */}
      <Card>
        <Table
          dataSource={filteredProducts}
          columns={columns}
          rowKey="productID"
          loading={isLoading}
          scroll={{ x: 1400 }}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total, range) =>
              `${range[0]}-${range[1]} of ${total} products`,
            pageSizeOptions: ["10", "15", "25", "50"],
          }}
          size="small"
        />
      </Card>

      {/* Modals */}
      <AddProduct
        visible={isAddModalVisible}
        onClose={() => handleModalClose(setIsAddModalVisible, true)}
        brands={brands}
        showrooms={showrooms}
      />

      <UpdateProduct
        visible={isUpdateModalVisible}
        onClose={() => handleModalClose(setIsUpdateModalVisible, true)}
        product={selectedProduct || {}}
        brands={brands}
        showrooms={showrooms}
      />

      <UpdateProductImage
        visible={isUpdateImageModalVisible}
        onClose={() => handleModalClose(setIsUpdateImageModalVisible, true)}
        productID={selectedProductIdForImage}
      />

      {/* Full Image Modal */}
      <Modal
        open={isImageModalVisible}
        onCancel={() => setIsImageModalVisible(false)}
        footer={null}
        title="Product Image"
        width={600}
        centered
      >
        <img
          src={fullImageUrl}
          alt="Full Product"
          style={{ width: "100%", height: "auto", borderRadius: "8px" }}
        />
      </Modal>

      {/* Product Details Modal */}
      <Modal
        open={isDetailModalVisible}
        onCancel={() => setIsDetailModalVisible(false)}
        footer={null}
        centered
        width={700}
        title="Product Details"
      >
        {selectedProduct && (
          <div>
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <img
                src={`${backendBaseURL}/Media/Products_Images/${selectedProduct.productImage
                  ?.split("\\")
                  .pop()}`}
                alt={selectedProduct.productName}
                style={{
                  width: "100%",
                  maxHeight: "300px",
                  objectFit: "cover",
                  borderRadius: "8px",
                }}
              />
            </div>

            {(() => {
              // Get the product code (manual or matched)
              const code = selectedProduct.productId2Display || "-"
              const isManual = selectedProduct.codeSource === 'manual'
              const isValid = selectedProduct.isValidBranchCode
              const branchDetails = selectedProduct.branchProductDetails

              return (
                <div>
                  <h2
                    style={{
                      fontSize: "24px",
                      fontWeight: 600,
                      marginBottom: "16px",
                    }}
                  >
                    {selectedProduct.productName}
                  </h2>

                  {/* Branch Product Link Info */}
                  {branchDetails && (
                    <Card 
                      size="small" 
                      style={{ 
                        marginBottom: 16, 
                        backgroundColor: '#f6ffed', 
                        border: '1px solid #b7eb8f' 
                      }}
                    >
                      <Row gutter={[16, 8]}>
                        <Col span={24}>
                          <strong>🔗 Linked Branch Product</strong>
                        </Col>
                        <Col span={12}>
                          <strong>Branch Name:</strong> {branchDetails.productName || '-'}
                        </Col>
                        <Col span={12}>
                          <strong>Branch Stock:</strong>{' '}
                          <Tag color={branchDetails.quantity > 0 || branchDetails.stockQuantity > 0 ? 'green' : 'red'}>
                            {branchDetails.quantity || branchDetails.stockQuantity || 0}
                          </Tag>
                        </Col>
                        {branchDetails.price && (
                          <Col span={12}>
                            <strong>Branch Price:</strong> ₵{parseFloat(branchDetails.price).toFixed(2)}
                          </Col>
                        )}
                      </Row>
                    </Card>
                  )}

                  {/* Warning if manual code not found */}
                  {isManual && !isValid && code !== "-" && (
                    <Card 
                      size="small" 
                      style={{ 
                        marginBottom: 16, 
                        backgroundColor: '#fff7e6', 
                        border: '1px solid #ffd591' 
                      }}
                    >
                      <Space>
                        <WarningOutlined style={{ color: '#fa8c16' }} />
                        <span>Manual product code "{code}" not found in branch products</span>
                      </Space>
                    </Card>
                  )}

                  <Row gutter={[16, 12]}>
                    <Col span={12}>
                      <strong>Product ID:</strong> {selectedProduct.productID}
                    </Col>

                    <Col span={12}>
                      <strong>Product Code:</strong>{" "}
                      <Tag 
                        color={isValid ? "green" : code !== "-" ? "blue" : "default"} 
                        style={{ fontFamily: "monospace" }}
                      >
                        {code}
                        {isManual && (
                          <Badge 
                            count="Manual" 
                            style={{ 
                              backgroundColor: '#1890ff', 
                              fontSize: '10px',
                              marginLeft: '8px'
                            }} 
                          />
                        )}
                      </Tag>
                    </Col>

                    <Col span={12}>
                      <strong>Category:</strong> {selectedProduct.categoryName}
                    </Col>
                    <Col span={12}>
                      <strong>Brand:</strong> {selectedProduct.brandName}
                    </Col>
                    <Col span={12}>
                      <strong>Showroom:</strong> {selectedProduct.showRoomName}
                    </Col>
                    <Col span={12}>
                      <strong>Date Created:</strong>{" "}
                      {selectedProduct.dateCreated
                        ? new Date(selectedProduct.dateCreated).toLocaleDateString()
                        : "-"}
                    </Col>
                    <Col span={12}>
                      <strong>Status:</strong>
                      <Tag
                        color={selectedProduct.status == 1 ? "success" : "error"}
                        style={{ marginLeft: 8 }}
                      >
                        {selectedProduct.status == 1 ? "In Stock" : "Out of Stock"}
                      </Tag>
                    </Col>
                  </Row>

                  <div style={{ marginTop: "16px" }}>
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginBottom: "16px",
                      }}
                    >
                      <span
                        style={{
                          fontSize: "20px",
                          fontWeight: 600,
                          color: "#ff4d4f",
                          marginRight: 16,
                        }}
                      >
                        ₵
                        {parseFloat(selectedProduct.price || 0).toLocaleString(
                          "en-US",
                          { minimumFractionDigits: 2 }
                        )}
                      </span>

                      {selectedProduct.oldPrice > 0 && (
                        <span
                          style={{
                            fontSize: "16px",
                            textDecoration: "line-through",
                            color: "#999",
                          }}
                        >
                          ₵
                          {parseFloat(selectedProduct.oldPrice).toLocaleString(
                            "en-US",
                            { minimumFractionDigits: 2 }
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <strong>Description:</strong>
                    <p
                      style={{
                        marginTop: "8px",
                        lineHeight: "1.6",
                        color: "#666",
                        cursor: "pointer",
                      }}
                      onClick={() => handleDescriptionClick(selectedProduct.description)}
                    >
                      {selectedProduct.description}
                    </p>
                  </div>
                </div>
              )
            })()}
          </div>
        )}
      </Modal>

      {/* Full Description Modal */}
      <Modal
        open={isDescriptionModalVisible}
        onCancel={() => setIsDescriptionModalVisible(false)}
        footer={null}
        title="Product Description"
        width={700}
      >
        <div style={{ maxHeight: "400px", overflowY: "auto" }}>
          <p style={{ whiteSpace: "pre-wrap", lineHeight: "1.6" }}>
            {descriptionText}
          </p>
        </div>
      </Modal>
    </div>
  )
}

export default AdminProducts