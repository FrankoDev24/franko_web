import { useState, useEffect, useCallback, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Table,
  Card,
  Button,
  Input,
  Space,
  Tag,
  Avatar,
  Modal,
  Row,
  Col,
  Statistic,
  Empty,
  Alert,
  Tooltip,
  message,
  Form,
  InputNumber,
  Select,
  Progress,
  Typography,
  List,
  Spin,
} from "antd";
import {
  SearchOutlined,
  ReloadOutlined,
  ShoppingCartOutlined,
  EyeOutlined,
  DatabaseOutlined,
  SwapOutlined,
  EnvironmentOutlined,
  LinkOutlined,
  CheckCircleTwoTone,
  ExclamationCircleOutlined,
  InfoCircleOutlined,
} from "@ant-design/icons";
import {
  getCTP001Products,
  mergeSingleCTP001WithCTP002,
  placeOrder,
  clearSimilarCandidates,
  removeManualMerge,
  selectCTP001Products,
  selectCTP001Pagination,
  selectCTP001ProductsLoading,
  selectSingleMergeLoading,
  selectPlaceOrderLoading,
  selectMergedProductMap,
  selectCTP001ProductsError,
  selectMergeActionError,
  selectSingleMergeError,
  selectPlaceOrderError,
  clearSpecificError,
  getSimilarity,
  getMergedProducts,
  selectMergedProducts,
  selectMergedProductsLoading,
} from "../../../Redux/Slice/ctp001Slice";
import { fetchAllProducts } from "../../../Redux/Slice/productSlice";

const { Text, Title } = Typography;

/* ════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════ */

const BACKEND_BASE_URL = "https://cms.frankotrading.com";

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  const fileName = String(imagePath).split("\\").pop().split("/").pop();
  if (!fileName) return null;
  return `${BACKEND_BASE_URL}/Media/Products_Images/${fileName}`;
};

const getRowKey = (record, index) =>
  record?.productID || record?.Productid || record?.productId || `sales-mate-row-${index}`;

const formatPrice = (price) =>
  parseFloat(price || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const getProductId = (product) =>
  product?.productID || product?.Productid || product?.productId || product?.id || "";

const getProductName = (product) => product?.productName || product?.ProductName || "";

const getProductPrice = (product) =>
  Number(product?.sellingPrice1 || product?.price || 0);

const getProductBCode = (product) => product?.bCode || product?.BCode || "855";

// Safe message helper to ensure notifications always render
const showSuccess = (text) => {
  message.destroy();
  message.success(text, 3);
};
const showError = (text) => {
  message.destroy();
  message.error(text, 4);
};
const showWarning = (text) => {
  message.destroy();
  message.warning(text, 3);
};

const CTP001ProductsPage = () => {
  const dispatch = useDispatch();

  /* ── Redux selectors ── */
  const products = useSelector(selectCTP001Products);
  const pagination = useSelector(selectCTP001Pagination);
  const mergedProductMap = useSelector(selectMergedProductMap);
  const mergedProducts = useSelector(selectMergedProducts);
  const mergedLoading = useSelector(selectMergedProductsLoading);

  const isFetching = useSelector(selectCTP001ProductsLoading);
  const isSingleMerging = useSelector(selectSingleMergeLoading);
  const isOrdering = useSelector(selectPlaceOrderLoading);

  const fetchError = useSelector(selectCTP001ProductsError);
  const mergeError = useSelector(selectMergeActionError);
  const singleMergeError = useSelector(selectSingleMergeError);
  const orderError = useSelector(selectPlaceOrderError);

  const websiteProducts = useSelector((state) => state.products?.products || []);
  const websiteLoading = useSelector((state) => state.products?.loading);

  /* ── Local state ── */
  const [searchText, setSearchText] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [orderModalVisible, setOrderModalVisible] = useState(false);
  const [mergeModalVisible, setMergeModalVisible] = useState(false);
  const [mergedModalVisible, setMergedModalVisible] = useState(false);
  const [mergeTargetProduct, setMergeTargetProduct] = useState(null);
  const [selectedWebsiteCandidate, setSelectedWebsiteCandidate] = useState(null);
  const [websiteSearchText, setWebsiteSearchText] = useState("");
  const [orderForm] = Form.useForm();

  /* ── Auto Scroll to Top on Mount ── */
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  /* ── Fetch Data on Mount ── */
  useEffect(() => {
    dispatch(
      getCTP001Products({
        pageNumber: 1,
        recordPerPage: 200,
      })
    );
    dispatch(getMergedProducts());
    if (!websiteProducts.length && !websiteLoading) {
      dispatch(fetchAllProducts());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch]);

  /* ── Refresh ── */
  const handleRefresh = useCallback(() => {
    dispatch(
      getCTP001Products({
        pageNumber: pagination.pageNumber,
        recordPerPage: pagination.recordPerPage,
      })
    )
      .unwrap()
      .then(() => showSuccess("Sales Mate products refreshed successfully!"))
      .catch((err) => showError(typeof err === 'string' ? err : err?.message || "Failed to refresh products."));

    dispatch(getMergedProducts()).catch(() => {});
  }, [dispatch, pagination.pageNumber, pagination.recordPerPage]);

  /* ── View Merged Products ── */
  const handleViewMergedProducts = useCallback(() => {
    setMergedModalVisible(true);
    dispatch(getMergedProducts());
  }, [dispatch]);

  /* ── Open Manual Merge Modal ── */
  const handleOpenMergeModal = useCallback(
    (product) => {
      if (!websiteProducts.length && !websiteLoading) {
        dispatch(fetchAllProducts())
          .unwrap()
          .then(() => {
            setMergeTargetProduct(product);
            setSelectedWebsiteCandidate(null);
            setWebsiteSearchText("");
            setMergeModalVisible(true);
          })
          .catch(() => {
            setMergeTargetProduct(product);
            setSelectedWebsiteCandidate(null);
            setWebsiteSearchText("");
            setMergeModalVisible(true);
            showError("Failed to load Website Products. Try refreshing the page.");
          });
      } else {
        setMergeTargetProduct(product);
        setSelectedWebsiteCandidate(null);
        setWebsiteSearchText("");
        setMergeModalVisible(true);
      }
    },
    [dispatch, websiteProducts.length, websiteLoading]
  );

  /* ── Confirm Manual Merge ── */
  const handleConfirmMerge = useCallback(async () => {
    if (!mergeTargetProduct || !selectedWebsiteCandidate) {
      showWarning("Please select a Website Product to link with");
      return;
    }

    const name1 = getProductName(mergeTargetProduct);
    const name2 = getProductName(selectedWebsiteCandidate);
    const sim = getSimilarity(name1, name2);

    // 🚫 HARD BLOCK: Below 25% similarity
    if (sim < 0.25) {
      showError(`Similarity too low (${Math.round(sim * 100)}%). Minimum 25% required to link products.`);
      return;
    }

    // ⚠️ WARNING: 25% - 50% similarity
    if (sim < 0.50) {
      Modal.confirm({
        title: "Low Similarity Warning",
        icon: <ExclamationCircleOutlined />,
        content: `Similarity is only ${Math.round(sim * 100)}%. Do you still want to link these products?`,
        okText: "Link Anyway",
        cancelText: "Cancel",
        onOk: () => performMerge(),
      });
      return;
    }

    // ✅ Standard Merge: ≥ 50%
    performMerge();
  }, [mergeTargetProduct, selectedWebsiteCandidate]);

  const performMerge = useCallback(async () => {
    try {
      const result = await dispatch(
        mergeSingleCTP001WithCTP002({
          ctp001Product: mergeTargetProduct,
          ctp002Product: selectedWebsiteCandidate,
        })
      ).unwrap();

      showSuccess(result?.message || "Products linked successfully!");
      dispatch(getMergedProducts());
      setMergeModalVisible(false);
      setMergeTargetProduct(null);
      setSelectedWebsiteCandidate(null);
      dispatch(clearSimilarCandidates());
    } catch (err) {
      const errorMsg = typeof err === 'string' ? err : err?.message || 'Failed to link products';
      showError(errorMsg);
    }
  }, [dispatch, mergeTargetProduct, selectedWebsiteCandidate]);

  /* ── Unmerge ── */
  const handleUnmerge = useCallback(
    (salesMateId) => {
      dispatch(removeManualMerge(salesMateId));
      showSuccess("Link removed successfully. Product will now use Sales Mate ID.");
      dispatch(getMergedProducts());
    },
    [dispatch]
  );

  /* ── View details ── */
  const handleViewDetails = useCallback((product) => {
    setSelectedProduct(product);
    setDetailModalVisible(true);
  }, []);

  /* ── Open order modal ── */
  const handleOpenOrderModal = useCallback(
    (product, isMergedProduct = false) => {
      const salesMateId = getProductId(product) || product.ctP001ProductId;
      const websiteProductId = mergedProductMap[salesMateId] || product.ctP002ProductId;

      let orderProduct = product;
      if (websiteProductId) {
        const webProd = websiteProducts.find((p) => String(getProductId(p)) === String(websiteProductId));
        if (webProd) orderProduct = webProd;
      }

      setSelectedProduct(orderProduct);

      orderForm.setFieldsValue({
        cartId: "",
        productId: getProductId(orderProduct) || websiteProductId,
        productName: getProductName(orderProduct) || product.ctP002ProductName,
        price: getProductPrice(orderProduct),
        bCode: getProductBCode(orderProduct),
        quantity: 1,
        customerId: "",
        customerName: "",
        contactNumber: "",
        deliveryAddress: "",
        geolocation: "345",
        paymentMode: "Cash on delivery",
        paymentService: "MTN",
        paymentAccountNumber: "",
        customerAccountType: "Agent",
        isMerged: !!websiteProductId || isMergedProduct,
        ctp001ProductId: isMergedProduct ? product.ctP001ProductId : salesMateId,
        ctp002ProductId: isMergedProduct ? product.ctP002ProductId : websiteProductId || "",
      });

      setDetailModalVisible(false);
      setMergedModalVisible(false);
      setOrderModalVisible(true);
    },
    [orderForm, mergedProductMap, websiteProducts]
  );

  /* ── Place order ── */
  const handlePlaceOrder = useCallback(
    async (values) => {
      try {
        await dispatch(
          placeOrder({
            cartId: values.cartId,
            productId: values.productId,
            price: values.price,
            quantity: values.quantity,
            customerId: values.customerId,
            customerName: values.customerName,
            contactNumber: values.contactNumber,
            deliveryAddress: values.deliveryAddress,
            geolocation: values.geolocation || "345",
            paymentMode: values.paymentMode,
            paymentService: values.paymentService,
            paymentAccountNumber: values.paymentAccountNumber,
            customerAccountType: values.customerAccountType,
            bCode: values.bCode,
          })
        ).unwrap();

        showSuccess("Order placed successfully!");
        setOrderModalVisible(false);
        setSelectedProduct(null);
        orderForm.resetFields();
      } catch (err) {
        const errorMsg = typeof err === 'string' ? err : err?.message || 'Failed to place order';
        showError(errorMsg);
      }
    },
    [dispatch, orderForm]
  );

  /* ── Pagination change ── */
  const handleTableChange = useCallback(
    (pag) => {
      dispatch(
        getCTP001Products({
          pageNumber: pag.current,
          recordPerPage: pag.pageSize,
        })
      );
      // ✅ Auto-scroll to top when changing pages
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [dispatch]
  );

  /* ── Filter (current page only) ── */
  const filteredProducts = useMemo(() => {
    const q = searchText.trim().toLowerCase();
    if (!q) return products || [];

    return (products || []).filter((product) =>
      [
        product?.productName,
        product?.ProductName,
        product?.productID,
        product?.Productid,
        product?.productId,
        product?.description,
        product?.brandName,
        product?.categoryName,
        product?.showRoomName,
        product?.bCode,
      ].some((field) => String(field ?? "").toLowerCase().includes(q))
    );
  }, [products, searchText]);

  /* ── Merge Modal: Display logic for Website Products ── */
  const displayedCandidates = useMemo(() => {
    if (!websiteProducts.length) return [];

    const mapToCandidate = (p) => {
      const name1 = getProductName(mergeTargetProduct);
      const name2 = getProductName(p);
      return {
        product: p,
        productId: getProductId(p),
        productName: name2,
        similarity: getSimilarity(name1, name2),
      };
    };

    const mapped = websiteProducts.map(mapToCandidate);

    if (websiteSearchText) {
      const q = websiteSearchText.toLowerCase();
      return mapped
        .filter(
          (item) =>
            item.productName.toLowerCase().includes(q) ||
            String(item.productId).includes(q)
        )
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 200);
    }

    return mapped.sort((a, b) => b.similarity - a.similarity).slice(0, 200);
  }, [websiteProducts, websiteSearchText, mergeTargetProduct]);

  /* ── Stats ── */
  const stats = useMemo(
    () => ({
      total: pagination.total || (products || []).length,
      displayed: filteredProducts.length,
      inStock: (products || []).filter((p) => p?.status == 1 || p?.Status == 1).length,
      outOfStock: (products || []).filter((p) => p?.status == 0 || p?.Status == 0).length,
      mergedCount: mergedProducts?.length || Object.keys(mergedProductMap || {}).length,
    }),
    [products, filteredProducts, pagination, mergedProducts, mergedProductMap]
  );

  /* ── Table columns ── */
  const columns = useMemo(
    () => [
      {
        title: "Product Details",
        key: "details",
        width: 250,
        render: (_, record) => {
          const id = getProductId(record);
          const isMerged = !!mergedProductMap[id];
          return (
            <div>
              <div style={{ fontWeight: 600, marginBottom: 2 }}>
                {getProductName(record) || "-"}
                {isMerged && <CheckCircleTwoTone twoToneColor="#52c41a" style={{ marginLeft: 6, fontSize: 14 }} />}
              </div>
              <div style={{ fontSize: 12, color: "#888", marginBottom: 4 }}>
                ID: {id || "-"}
                {isMerged && <Tag color="success" style={{ marginLeft: 6, fontSize: 10 }}>Linked → {mergedProductMap[id]}</Tag>}
              </div>
              {record?.brandName && <Tag color="blue" style={{ fontSize: 11, marginRight: 4 }}>{record.brandName}</Tag>}
              {record?.categoryName && <Tag color="orange" style={{ fontSize: 11 }}>{record.categoryName}</Tag>}
            </div>
          );
        },
      },
      {
        title: "Price",
        key: "sellingPrice1",
        width: 130,
        render: (_, record) => {
          const price = record?.sellingPrice1 || record?.price || 0;
          const oldPrice = record?.oldPrice;
          return (
            <div>
              <div style={{ fontWeight: 600, color: "#ff4d4f", fontSize: 15 }}>₵{formatPrice(price)}</div>
              {oldPrice > 0 && <div style={{ fontSize: 12, color: "#999", textDecoration: "line-through" }}>₵{formatPrice(oldPrice)}</div>}
            </div>
          );
        },
      },
      {
        title: "Link Status",
        key: "mergeStatus",
        width: 130,
        render: (_, record) => {
          const id = getProductId(record);
          const websiteId = mergedProductMap[id];
          if (websiteId) {
            return (
              <Tag color="success" icon={<LinkOutlined />} style={{ cursor: "pointer" }} onClick={() => handleUnmerge(id)}>Linked</Tag>
            );
          }
          return <Tag color="default">Not Linked</Tag>;
        },
      },
      {
        title: "Actions",
        key: "actions",
        width: 180,
        fixed: "right",
        render: (_, record) => {
          const id = getProductId(record);
          const isMerged = !!mergedProductMap[id];
          return (
            <Space size="small">
              <Tooltip title="View Details">
                <Button type="text" icon={<EyeOutlined />} onClick={() => handleViewDetails(record)} />
              </Tooltip>
              <Tooltip title={isMerged ? "Re-link" : "Link to Website Product"}>
                <Button type="text" icon={<SwapOutlined />} style={{ color: "#722ed1" }} onClick={() => handleOpenMergeModal(record)} />
              </Tooltip>
              <Tooltip title={!isMerged ? "Link to a Website Product first to enable ordering" : "Place Order"}>
                <Button 
                  type="text" 
                  icon={<ShoppingCartOutlined />} 
                  disabled={!isMerged}
                  style={{ color: isMerged ? "#52c41a" : "#d9d9d9", cursor: isMerged ? "pointer" : "not-allowed" }} 
                  onClick={() => handleOpenOrderModal(record)} 
                />
              </Tooltip>
            </Space>
          );
        },
      },
    ],
    [handleViewDetails, handleOpenOrderModal, handleOpenMergeModal, mergedProductMap, handleUnmerge]
  );

  /* ── Detail modal content ── */
  const detailContent = useMemo(() => {
    if (!selectedProduct) return null;

    const imageUrl = getImageUrl(selectedProduct?.productImage || selectedProduct?.image);
    const price = selectedProduct?.sellingPrice1 || selectedProduct?.price || 0;
    const active = selectedProduct?.status === 1 || selectedProduct?.status === "1" || selectedProduct?.status === true;
    const id = getProductId(selectedProduct);
    const websiteId = mergedProductMap[id];

    return (
      <div>
        {imageUrl && (
          <div style={{ textAlign: "center", marginBottom: 20 }}>
            <img src={imageUrl} alt={getProductName(selectedProduct)} style={{ width: "100%", maxHeight: 250, objectFit: "cover", borderRadius: 8 }} />
          </div>
        )}
        <h2 style={{ fontSize: 22, fontWeight: 600, marginBottom: 16, color: "#262626" }}>{getProductName(selectedProduct) || "Product"}</h2>
        <Row gutter={[16, 12]}>
          <Col span={12}><strong>Sales Mate ID: </strong><span style={{ fontFamily: "monospace" }}>{id || "-"}</span></Col>
          <Col span={12}><strong>B-Code: </strong><Tag color="purple" style={{ fontFamily: "monospace" }}>{selectedProduct?.bCode || "Not Set"}</Tag></Col>
          {websiteId && (
            <Col span={24}>
              <Alert type="success" showIcon icon={<LinkOutlined />} message={`Linked to Website Product ID: ${websiteId}`} description="Orders will use the linked Website Product ID." />
            </Col>
          )}
        </Row>
        <div style={{ marginTop: 16 }}>
          <div style={{ fontSize: 28, fontWeight: 700, color: "#ff4d4f" }}>₵{formatPrice(price)}</div>
          {selectedProduct?.oldPrice > 0 && <div style={{ fontSize: 16, textDecoration: "line-through", color: "#999" }}>₵{formatPrice(selectedProduct.oldPrice)}</div>}
        </div>
        {selectedProduct?.description && (
          <div style={{ marginTop: 16 }}>
            <strong>Description:</strong>
            <p style={{ marginTop: 8, lineHeight: 1.6, color: "#666" }}>{selectedProduct.description}</p>
          </div>
        )}
      </div>
    );
  }, [selectedProduct, mergedProductMap]);

  return (
    <div style={{ minHeight: "100vh", padding: "24px", backgroundColor: "#fff" }}>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 700, color: "#262626", margin: 0, marginBottom: 4 }}>Sales Mate Products</h1>
        <p style={{ color: "#8c8c8c", margin: 0 }}>
          Manage your Sales Mate inventory, link to Website Products, and process orders. 
          <Text type="secondary" style={{ marginLeft: 8 }}>(Products must be linked before ordering)</Text>
        </p>
      </div>

      {fetchError && <Alert message={fetchError} type="error" showIcon closable style={{ marginBottom: 16 }} onClose={() => dispatch(clearSpecificError("ctp001Products"))} />}
      {mergeError && <Alert message={mergeError} type="warning" showIcon closable style={{ marginBottom: 16 }} onClose={() => dispatch(clearSpecificError("mergeAction"))} />}

      <Row gutter={[16, 16]} style={{ marginBottom: 20 }}>
        <Col xs={12} sm={6}><Card size="small" hoverable><Statistic title="Total Products" value={stats.total} prefix={<DatabaseOutlined style={{ color: "#1890ff" }} />} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small" hoverable><Statistic title="Displayed" value={stats.displayed} prefix={<SearchOutlined style={{ color: "#722ed1" }} />} /></Card></Col>
        <Col xs={12} sm={6}><Card size="small" hoverable><Statistic title="Linked Products" value={stats.mergedCount} valueStyle={{ color: "#52c41a" }} prefix={<LinkOutlined style={{ color: "#52c41a" }} />} /></Card></Col>
      </Row>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={[16, 12]} align="middle" justify="space-between">
          <Col xs={24} md={10}>
            <Input placeholder="Search current page..." prefix={<SearchOutlined />} value={searchText} onChange={(e) => setSearchText(e.target.value)} allowClear />
          </Col>
          <Col>
            <Space>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={isFetching}>Refresh</Button>
              <Button icon={<LinkOutlined />} onClick={handleViewMergedProducts} loading={mergedLoading}>View Linked Products</Button>
            </Space>
          </Col>
        </Row>
      </Card>

      <Card>
        <Table
          dataSource={filteredProducts}
          columns={columns}
          rowKey={getRowKey}
          loading={isFetching}
          scroll={{ x: 1200 }}
          locale={{ 
            emptyText: isFetching ? <div style={{ textAlign: 'center', padding: '20px' }}><Spin size="large" /></div> : <Empty description="No Sales Mate products found" /> 
          }}
          pagination={{
            current: pagination.pageNumber,
            pageSize: pagination.recordPerPage || 200,
            total: pagination.total,
            showSizeChanger: true,
            showQuickJumper: true,
            pageSizeOptions: ["10", "50", "100", "200"],
            showTotal: (total, range) => `${range[0]}–${range[1]} of ${total} products`,
          }}
          onChange={handleTableChange}
          size="small"
          bordered
        />
      </Card>

      {/* Detail Modal */}
      <Modal
        open={detailModalVisible}
        onCancel={() => { setDetailModalVisible(false); setSelectedProduct(null); }}
        footer={
          <Space>
            <Button 
              type="primary" 
              icon={<ShoppingCartOutlined />} 
              disabled={!mergedProductMap[getProductId(selectedProduct)]} 
              onClick={() => handleOpenOrderModal(selectedProduct)} 
              style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }}
            >
              Place Order
            </Button>
            <Button onClick={() => { setDetailModalVisible(false); setSelectedProduct(null); }}>Close</Button>
          </Space>
        }
        width={700}
        centered
        title="Product Details"
        destroyOnClose
      >
        {detailContent}
      </Modal>

      {/* Merged Products Modal */}
      <Modal
        open={mergedModalVisible}
        onCancel={() => setMergedModalVisible(false)}
        footer={null}
        width={900}
        centered
        title={<Space><LinkOutlined style={{ color: "#52c41a" }} /><span>Linked Products</span></Space>}
        destroyOnClose
      >
        <Table
          dataSource={mergedProducts}
          loading={mergedLoading}
          rowKey={(r, i) => `${r.ctP001ProductId}-${r.ctP002ProductId}-${i}`}
          locale={{ emptyText: mergedLoading ? <Spin /> : <Empty description="No linked products found" /> }}
          columns={[
            { title: "Sales Mate Product", dataIndex: "ctP001ProductName", key: "ctP001ProductName", render: (t) => <Text strong>{t || "-"}</Text> },
            { title: "Sales Mate ID", dataIndex: "ctP001ProductId", key: "ctP001ProductId", render: (t) => <Tag color="blue">{t}</Tag> },
            { title: "Website Product", dataIndex: "ctP002ProductName", key: "ctP002ProductName", render: (t) => <Text strong>{t || "-"}</Text> },
            { title: "Website Product ID", dataIndex: "ctP002ProductId", key: "ctP002ProductId", render: (t) => <Tag color="purple">{t}</Tag> },
          ]}
          size="small"
          bordered
        />
      </Modal>

      {/* Manual Merge Modal */}
      <Modal
        open={mergeModalVisible}
        onCancel={() => { setMergeModalVisible(false); setMergeTargetProduct(null); setSelectedWebsiteCandidate(null); dispatch(clearSimilarCandidates()); }}
        title={<Space><SwapOutlined style={{ color: "#722ed1" }} /><span>Link Sales Mate to Website Product</span></Space>}
        width={800}
        centered
        destroyOnClose
        footer={
          <Space style={{ width: "100%", justifyContent: "flex-end" }}>
            <Button onClick={() => { setMergeModalVisible(false); setMergeTargetProduct(null); setSelectedWebsiteCandidate(null); dispatch(clearSimilarCandidates()); }}>Cancel</Button>
            <Button type="primary" icon={<LinkOutlined />} onClick={handleConfirmMerge} loading={isSingleMerging} disabled={!selectedWebsiteCandidate} style={{ backgroundColor: "green", borderColor: "green", color: "#fff" }}>Confirm Link</Button>
          </Space>
        }
      >
        {singleMergeError && <Alert message="Link Error" description={singleMergeError} type="error" showIcon style={{ marginBottom: 16 }} />}
        {mergeTargetProduct && (
          <Card size="small" style={{ marginBottom: 16, backgroundColor: "#fafafa" }}>
            <Row gutter={16} align="middle">
              <Col><Avatar src={getImageUrl(mergeTargetProduct.productImage || mergeTargetProduct.image)} size={60} shape="square" /></Col>
              <Col flex="auto">
                <Title level={5} style={{ margin: 0 }}>{getProductName(mergeTargetProduct)}</Title>
                <Text type="secondary">Sales Mate ID: {getProductId(mergeTargetProduct)}</Text><br />
                <Text type="secondary">Price: ₵{formatPrice(getProductPrice(mergeTargetProduct))}</Text>
              </Col>
            </Row>
          </Card>
        )}
        <div style={{ marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Text strong>Available Website Products:</Text>
          <Input placeholder="Search Website Product name or ID..." size="small" prefix={<SearchOutlined />} value={websiteSearchText} onChange={(e) => setWebsiteSearchText(e.target.value)} style={{ width: 250 }} allowClear />
        </div>
        <List loading={websiteLoading} bordered style={{ maxHeight: 350, overflow: "auto" }} locale={{ emptyText: <Empty description={websiteProducts.length ? "No Website Products match your search." : "Loading Website Products..."} /> }} dataSource={displayedCandidates} renderItem={(item) => {
          const selected = selectedWebsiteCandidate && getProductId(selectedWebsiteCandidate) === item.productId;
          return (
            <List.Item onClick={() => setSelectedWebsiteCandidate(item.product)} style={{ cursor: "pointer", backgroundColor: selected ? "#f6ffed" : "transparent", borderLeft: selected ? "3px solid #52c41a" : "3px solid transparent", padding: "10px 12px" }}>
              <Row gutter={12} align="middle" style={{ width: "100%" }}>
                <Col><Avatar src={getImageUrl(item.product?.productImage || item.product?.image)} size={45} shape="square" /></Col>
                <Col flex="auto">
                  <div style={{ fontWeight: 600 }}>{item.productName}</div>
                  <Text type="secondary" style={{ fontSize: 12 }}>Website ID: {item.productId}</Text><br />
                  <Text type="secondary">Price: ₵{formatPrice(getProductPrice(item.product))}</Text>
                </Col>
                <Col style={{ width: 140 }}><Progress percent={Math.round(item.similarity * 100)} size="small" status={item.similarity === 1 ? "success" : "active"} format={(p) => `${p}%`} /></Col>
                <Col>{selected && <CheckCircleTwoTone twoToneColor="#52c41a" style={{ fontSize: 18 }} />}</Col>
              </Row>
            </List.Item>
          );
        }} />
        {selectedWebsiteCandidate && (
          <Alert style={{ marginTop: 16 }} type="info" showIcon icon={<LinkOutlined />} message="Selected Website Product for linking" description={<span><strong>{getProductName(selectedWebsiteCandidate)}</strong> (ID: {getProductId(selectedWebsiteCandidate)}) — Similarity: {Math.round(getSimilarity(getProductName(mergeTargetProduct), getProductName(selectedWebsiteCandidate)) * 100)}%</span>} />
        )}
      </Modal>

      {/* Order Modal */}
      <Modal
        open={orderModalVisible}
        onCancel={() => { setOrderModalVisible(false); setSelectedProduct(null); orderForm.resetFields(); }}
        footer={null}
        width={700}
        centered
        title={<Space><ShoppingCartOutlined style={{ color: "#52c41a" }} /><span>Place Order</span></Space>}
        destroyOnClose
      >
        {orderError && <Alert message={orderError} type="error" showIcon style={{ marginBottom: 16 }} />}
        <Form form={orderForm} layout="vertical" onFinish={handlePlaceOrder}>
          <Form.Item shouldUpdate noStyle>
            {({ getFieldValue }) => getFieldValue("isMerged") ? (
              <Alert type="success" showIcon icon={<LinkOutlined />} message="Order will use linked Website Product" description={`Sales Mate ID: ${getFieldValue("ctp001ProductId")} → Website ID: ${getFieldValue("ctp002ProductId")}`} style={{ marginBottom: 16 }} />
            ) : (
              <Alert type="warning" showIcon icon={<InfoCircleOutlined />} message="Product not linked to Website" description="Order will use the Sales Mate product ID. Linking is recommended for accurate inventory tracking." style={{ marginBottom: 16 }} />
            )}
          </Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="cartId" label="Cart ID"><Input placeholder="Enter cart ID (optional)" /></Form.Item></Col>
            <Col span={12}><Form.Item name="productId" label="Product ID (Website if linked)"><Input disabled /></Form.Item></Col>
          </Row>
          <Form.Item label="Product Name"><Input value={getProductName(selectedProduct)} disabled style={{ fontWeight: 600 }} /></Form.Item>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="price" label="Price" rules={[{ required: true, message: "Price is required" }]}><InputNumber min={0} style={{ width: "100%" }} placeholder="Enter price" size="large" /></Form.Item></Col>
            <Col span={12}><Form.Item name="quantity" label="Quantity" rules={[{ required: true, message: "Quantity is required" }, { validator: (_, value) => value && value > 0 ? Promise.resolve() : Promise.reject(new Error("Quantity must be greater than 0")) }]}><InputNumber min={1} max={99999} style={{ width: "100%" }} placeholder="Enter quantity" size="large" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="customerId" label="Customer ID" rules={[{ required: true, message: "Customer ID is required" }]}><Input placeholder="Enter customer ID" /></Form.Item></Col>
            <Col span={12}><Form.Item name="customerName" label="Customer Name" rules={[{ required: true, message: "Customer name is required" }]}><Input placeholder="Enter customer name" /></Form.Item></Col>
          </Row>
          <Form.Item name="contactNumber" label="Contact Number" rules={[{ required: true, message: "Contact number is required" }]}><Input placeholder="Enter contact number" /></Form.Item>
          <Form.Item name="deliveryAddress" label="Delivery Address" rules={[{ required: true, message: "Delivery address is required" }]}><Input.TextArea rows={3} placeholder="Enter full delivery address" /></Form.Item>
          
          <Form.Item name="geolocation" label="Geolocation (Static)">
            <Input disabled prefix={<EnvironmentOutlined style={{ color: "#8c8c8c" }} />} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={12}><Form.Item name="paymentMode" label="Payment Mode" rules={[{ required: true, message: "Payment mode is required" }]}><Select placeholder="Select payment mode" options={[{ label: "Cash", value: "Cash" }, { label: "Mobile Money", value: "Mobile Money" }, { label: "Card", value: "Card" }, { label: "Bank Transfer", value: "Bank Transfer" }]} /></Form.Item></Col>
            <Col span={12}><Form.Item name="paymentService" label="Payment Service" rules={[{ required: true, message: "Payment service is required" }]}><Input placeholder="e.g. MTN, Vodafone, AirtelTigo, Visa" /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="paymentAccountNumber" label="Payment Account Number"><Input placeholder="Enter payment account number (optional)" /></Form.Item></Col>
            <Col span={12}><Form.Item name="customerAccountType" label="Customer Account Type" rules={[{ required: true, message: "Customer account type is required" }]}><Select placeholder="Select account type" options={[{ label: "Agent", value: "Agent" }]} /></Form.Item></Col>
          </Row>
          <Form.Item name="bCode" label="B-Code"><Input disabled style={{ fontFamily: "monospace" }} /></Form.Item>
          <Form.Item name="isMerged" hidden><Input /></Form.Item>
          <Form.Item name="ctp001ProductId" hidden><Input /></Form.Item>
          <Form.Item name="ctp002ProductId" hidden><Input /></Form.Item>
          <Form.Item style={{ marginBottom: 0, marginTop: 8 }}>
            <Space style={{ width: "100%", justifyContent: "flex-end" }}>
              <Button onClick={() => { setOrderModalVisible(false); setSelectedProduct(null); orderForm.resetFields(); }}>Cancel</Button>
              <Button type="primary" htmlType="submit" loading={isOrdering} icon={<ShoppingCartOutlined />} style={{ backgroundColor: "#52c41a", borderColor: "#52c41a" }} size="large">Place Order</Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default CTP001ProductsPage;