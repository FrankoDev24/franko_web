import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSalesOrderById, fetchOrderDeliveryAddress } from '../Redux/Slice/orderSlice';
import { 
  Modal, 
  Spin, 
  Typography, 
  Image, 
  Divider, 
  Card, 
  Button, 
  Row, 
  Col, 
  Space,
  Badge,
  Avatar,
  Statistic
} from 'antd';
import { 
  UserOutlined, 
  PhoneOutlined, 
  HomeOutlined, 
  EditOutlined, 
  DownloadOutlined,
  ShoppingOutlined,
  CalendarOutlined,
  DollarOutlined
} from '@ant-design/icons';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

const { Title, Text } = Typography;

const OrderModal = ({ orderId, orderCode, isModalVisible, onClose }) => {
  const dispatch = useDispatch();
  const { salesOrder, loading, error, deliveryAddress } = useSelector((state) => state.orders);

  useEffect(() => {
    if (orderId && isModalVisible) {
      dispatch(fetchSalesOrderById(orderId));
      dispatch(fetchOrderDeliveryAddress(orderId));
    }
  }, [dispatch, orderId, isModalVisible]);

  const formatPrice = (amount) => parseFloat(amount || 0).toFixed(2);
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const downloadInvoice = () => {
    if (!salesOrder || salesOrder.length === 0) return;
    
    const order = salesOrder[0];
    const address = deliveryAddress?.[0] || {};
    const doc = new jsPDF();
    
    // Company Header
    doc.setFontSize(20);
    doc.setTextColor(76, 175, 80);
    doc.text('Franko Trading Ltd.', 20, 30);
    
    doc.setFontSize(10);
    doc.setTextColor(51, 51, 51);
    doc.text('123 Adabraka Street, Accra, Ghana', 20, 40);
    doc.text('Contact: +233 123 456 789 | Email: online@frankotrading.com', 20, 47);
    
    // Invoice Title
    doc.setFontSize(24);
    doc.setTextColor(76, 175, 80);
    doc.text('INVOICE', 20, 65);
    
    // Order Information
    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51);
    doc.text(`Order Code: ${order?.orderCode || orderCode}`, 20, 80);
    doc.text(`Order Date: ${formatDate(order?.orderDate)}`, 20, 90);
    doc.text(`Invoice Date: ${formatDate(new Date())}`, 20, 100);
    
    // Customer Information
    doc.setFontSize(14);
    doc.setTextColor(76, 175, 80);
    doc.text('Bill To:', 20, 120);
    
    doc.setFontSize(12);
    doc.setTextColor(51, 51, 51);
    doc.text(`Name: ${address?.recipientName || 'N/A'}`, 20, 135);
    doc.text(`Contact: ${address?.recipientContactNumber || 'N/A'}`, 20, 145);
    doc.text(`Address: ${address?.address || 'N/A'}`, 20, 155);
    if (address?.orderNote) {
      doc.text(`Note: ${address.orderNote}`, 20, 165);
    }
    
    // Products Table
    const tableData = salesOrder.map((item, index) => [
      index + 1,
      item.productName || 'N/A',
      item.quantity || 0,
      `₵${formatPrice(item.price)}`,
      `₵${formatPrice(item.price * item.quantity)}`
    ]);
    
    const totalAmount = salesOrder.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    doc.autoTable({
      head: [['SN', 'Product Name', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      startY: 180,
      theme: 'grid',
      headStyles: { 
        fillColor: [76, 175, 80],
        textColor: [255, 255, 255],
        fontStyle: 'bold'
      },
      bodyStyles: { textColor: [51, 51, 51] },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      margin: { left: 20, right: 20 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20 },
        1: { cellWidth: 80 },
        2: { halign: 'center', cellWidth: 25 },
        3: { halign: 'right', cellWidth: 35 },
        4: { halign: 'right', cellWidth: 35 }
      }
    });
    
    // Total Amount
    const finalY = doc.lastAutoTable.finalY + 20;
    doc.setFontSize(16);
    doc.setTextColor(76, 175, 80);
    doc.text(`Total Amount: ₵${formatPrice(totalAmount)}`, 20, finalY);
    
    // Footer
    doc.setFontSize(10);
    doc.setTextColor(128, 128, 128);
    doc.text('Thank you for your business!', 20, finalY + 20);
    doc.text('This is a computer-generated invoice.', 20, finalY + 30);
    
    // Save the PDF
    doc.save(`Invoice_${order?.orderCode || orderCode}.pdf`);
  };

  const backendBaseURL = 'https://smfteapi.salesmate.app';
  const totalAmount = salesOrder.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalItems = salesOrder.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <Modal
      title={
        <div className="flex items-center space-x-2">
          <ShoppingOutlined className="text-blue-500" />
          <span>Order Details</span>
          <Badge count={orderCode} style={{ backgroundColor: '#52c41a' }} />
        </div>
      }
      open={isModalVisible}
      onCancel={onClose}
      width={600}
      centered
      footer={
        salesOrder.length > 0 ? (
          <div className="flex justify-between items-center w-full">
            <Space direction="vertical" size={0}>
              <Text type="secondary" className="text-xs">Total Amount</Text>
              <Text strong className="text-xl text-green-600">₵{formatPrice(totalAmount)}</Text>
            </Space>
            <Button
              type="primary"
              icon={<DownloadOutlined />}
              onClick={downloadInvoice}
              className="bg-green-600 hover:bg-green-700 border-green-600"
              size="large"
            >
              Download Invoice
            </Button>
          </div>
        ) : null
      }
    >
      {loading ? (
        <div className="flex justify-center items-center py-16">
          <Space direction="vertical" align="center">
            <Spin size="large" />
            <Text type="secondary">Loading order details...</Text>
          </Space>
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <div className="mb-4">
            <Avatar size={64} icon={<ShoppingOutlined />} className="bg-red-100 text-red-500" />
          </div>
          <Text type="danger" className="text-lg">
            Error loading order: {error?.message || error || 'An error occurred'}
          </Text>
        </div>
      ) : salesOrder.length === 0 ? (
        <div className="text-center py-16">
          <div className="mb-4">
            <Avatar size={64} icon={<ShoppingOutlined />} className="bg-gray-100 text-gray-400" />
          </div>
          <Text type="secondary" className="text-lg">No order details found.</Text>
        </div>
      ) : (
        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {/* Order Summary Cards */}
          <Row gutter={[16, 16]} className="mb-6">
            <Col span={8}>
              <Card className="text-center border-blue-200 hover:shadow-md transition-shadow">
                <Statistic
                  title="Order Date"
                  value={formatDate(salesOrder[0]?.orderDate)}
                  prefix={<CalendarOutlined className="text-blue-500" />}
                  valueStyle={{ fontSize: '14px', color: '#1890ff' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card className="text-center border-green-200 hover:shadow-md transition-shadow">
                <Statistic
                  title="Total Items"
                  value={totalItems}
                  prefix={<ShoppingOutlined className="text-green-500" />}
                  valueStyle={{ fontSize: '18px', color: '#52c41a' }}
                />
              </Card>
            </Col>
            <Col span={8}>
              <Card className="text-center border-orange-200 hover:shadow-md transition-shadow">
                <Statistic
                  title="Amount"
                  value={formatPrice(totalAmount)}
                  prefix={<DollarOutlined className="text-orange-500" />}
                  valueStyle={{ fontSize: '16px', color: '#fa8c16' }}
                />
              </Card>
            </Col>
          </Row>

          {/* Delivery Address Card */}
          <Card 
            className="mb-6 border-l-4 border-l-blue-500 hover:shadow-lg transition-shadow"
            title={
              <div className="flex items-center space-x-2">
                <HomeOutlined className="text-blue-500" />
                <span className="text-gray-700">Delivery Information</span>
              </div>
            }
          >
            <Row gutter={[16, 12]}>
              <Col span={12}>
                <div className="flex items-center space-x-2">
                  <UserOutlined className="text-gray-400" />
                  <div>
                    <Text type="secondary" className="text-xs block">Recipient</Text>
                    <Text strong>{deliveryAddress?.[0]?.recipientName || 'N/A'}</Text>
                  </div>
                </div>
              </Col>
              <Col span={12}>
                <div className="flex items-center space-x-2">
                  <PhoneOutlined className="text-gray-400" />
                  <div>
                    <Text type="secondary" className="text-xs block">Contact</Text>
                    <Text strong>{deliveryAddress?.[0]?.recipientContactNumber || 'N/A'}</Text>
                  </div>
                </div>
              </Col>
              <Col span={24}>
                <div className="flex items-start space-x-2">
                  <HomeOutlined className="text-gray-400 mt-1" />
                  <div className="flex-1">
                    <Text type="secondary" className="text-xs block">Address</Text>
                    <Text>{deliveryAddress?.[0]?.address || 'N/A'}</Text>
                  </div>
                </div>
              </Col>
              {deliveryAddress?.[0]?.orderNote && (
                <Col span={24}>
                  <div className="flex items-start space-x-2">
                    <EditOutlined className="text-gray-400 mt-1" />
                    <div className="flex-1">
                      <Text type="secondary" className="text-xs block">Special Notes</Text>
                      <Text italic className="text-gray-600">{deliveryAddress[0].orderNote}</Text>
                    </div>
                  </div>
                </Col>
              )}
            </Row>
          </Card>

          {/* Products Section */}
          <Card 
            title={
              <div className="flex items-center space-x-2">
                <ShoppingOutlined className="text-green-500" />
                <span className="text-gray-700">Order Items</span>
                <Badge count={salesOrder.length} style={{ backgroundColor: '#52c41a' }} />
              </div>
            }
            className="border-l-4 border-l-green-500"
          >
            <div className="space-y-4">
              {salesOrder.map((item, index) => {
                const imagePath = item?.imagePath;
                const imageUrl = imagePath
                  ? `${backendBaseURL}/Media/Products_Images/${imagePath.split('\\').pop()}`
                  : null;

                return (
                  <div key={index} className="flex items-center space-x-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                    <div className="flex-shrink-0">
                      {imageUrl ? (
                        <Image
                          src={imageUrl}
                          alt="Product"
                          className="w-20 h-20 object-cover rounded-lg shadow-sm"
                          preview={false}
                        />
                      ) : (
                        <div className="w-20 h-20 bg-gray-200 rounded-lg flex items-center justify-center">
                          <ShoppingOutlined className="text-gray-400 text-xl" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="mb-2">
                        <Text strong className="text-lg text-gray-800">{item?.productName || 'N/A'}</Text>
                      </div>
                      <Row gutter={[16, 8]}>
                        <Col span={8}>
                          <Text type="secondary" className="text-xs block">Quantity</Text>
                          <Text strong className="text-blue-600">{item?.quantity || 0}</Text>
                        </Col>
                        <Col span={8}>
                          <Text type="secondary" className="text-xs block">Unit Price</Text>
                          <Text strong className="text-green-600">₵{formatPrice(item?.price || 0)}</Text>
                        </Col>
                        <Col span={8}>
                          <Text type="secondary" className="text-xs block">Subtotal</Text>
                          <Text strong className="text-orange-600">₵{formatPrice((item?.price || 0) * (item?.quantity || 0))}</Text>
                        </Col>
                      </Row>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>
      )}
    </Modal>
  );
};

export default OrderModal;