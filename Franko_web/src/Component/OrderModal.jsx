import React, { useEffect, useState } from 'react';
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
  Statistic,
  Tag,
  Empty,
  Tooltip
} from 'antd';
import { 
  UserOutlined, 
  PhoneOutlined, 
  HomeOutlined, 
  EditOutlined, 
  DownloadOutlined,
  ShoppingOutlined,
  CalendarOutlined,
  DollarOutlined,
  EyeOutlined,
  ShoppingCartOutlined,
  EnvironmentOutlined,
  FileTextOutlined,
  CloseOutlined
} from '@ant-design/icons';
// Note: jsPDF would need to be installed separately
// For now, we'll create a fallback HTML-based invoice download

const { Title, Text, Paragraph } = Typography;

const OrderModal = ({ orderId, orderCode, isModalVisible, onClose }) => {
  const dispatch = useDispatch();
  const { salesOrder, loading, error, deliveryAddress } = useSelector((state) => state.orders);
  const [imagePreview, setImagePreview] = useState({ visible: false, url: null });

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
    const totalAmount = salesOrder.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Create HTML invoice content
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Invoice - ${order?.orderCode || orderCode}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; }
          .company-name { color: #4CAF50; font-size: 28px; font-weight: bold; margin-bottom: 10px; }
          .company-info { font-size: 14px; color: #666; }
          .invoice-title { font-size: 32px; color: #4CAF50; font-weight: bold; margin: 30px 0; }
          .invoice-info { margin-bottom: 30px; }
          .customer-info { margin-bottom: 30px; }
          .section-title { color: #4CAF50; font-size: 16px; font-weight: bold; margin-bottom: 10px; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { border: 1px solid #ddd; padding: 12px; text-align: left; }
          th { background-color: #4CAF50; color: white; font-weight: bold; }
          tr:nth-child(even) { background-color: #f9f9f9; }
          .text-right { text-align: right; }
          .text-center { text-align: center; }
          .total-row { font-weight: bold; font-size: 18px; color: #4CAF50; }
          .footer { margin-top: 40px; text-align: center; color: #888; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company-name">Franko Trading Ltd.</div>
          <div class="company-info">
            123 Adabraka Street, Accra, Ghana<br>
            Contact: +233 123 456 789 | Email: online@frankotrading.com
          </div>
        </div>
        
        <div class="invoice-title text-center">INVOICE</div>
        
        <div class="invoice-info">
          <strong>Order Code:</strong> ${order?.orderCode || orderCode}<br>
          <strong>Order Date:</strong> ${formatDate(order?.orderDate)}<br>
          <strong>Invoice Date:</strong> ${formatDate(new Date())}
        </div>
        
        <div class="customer-info">
          <div class="section-title">Bill To:</div>
          <strong>Name:</strong> ${address?.recipientName || 'N/A'}<br>
          <strong>Contact:</strong> ${address?.recipientContactNumber || 'N/A'}<br>
          <strong>Address:</strong> ${address?.address || 'N/A'}
          ${address?.orderNote ? `<br><strong>Note:</strong> ${address.orderNote}` : ''}
        </div>
        
        <table>
          <thead>
            <tr>
              <th class="text-center">SN</th>
              <th>Product Name</th>
              <th class="text-center">Qty</th>
              <th class="text-right">Unit Price</th>
              <th class="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            ${salesOrder.map((item, index) => `
              <tr>
                <td class="text-center">${index + 1}</td>
                <td>${item.productName || 'N/A'}</td>
                <td class="text-center">${item.quantity || 0}</td>
                <td class="text-right">₵${formatPrice(item.price)}</td>
                <td class="text-right">₵${formatPrice(item.price * item.quantity)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        
        <div class="total-row text-right">
          Total Amount: ₵${formatPrice(totalAmount)}
        </div>
        
        <div class="footer">
          Thank you for your business!<br>
          This is a computer-generated invoice.
        </div>
      </body>
      </html>
    `;
    
    // Create a new window with the invoice
    const printWindow = window.open('', '_blank');
    printWindow.document.write(invoiceHTML);
    printWindow.document.close();
    
    // Wait for content to load then trigger print
    printWindow.onload = function() {
      printWindow.print();
      // Uncomment the line below if you want to close the window after printing
      // printWindow.close();
    };
  };

  const backendBaseURL = 'https://smfteapi.salesmate.app';
  const totalAmount = salesOrder.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const totalItems = salesOrder.reduce((acc, item) => acc + item.quantity, 0);

  const handleImageError = (e) => {
    e.target.style.display = 'none';
    e.target.nextSibling.style.display = 'flex';
  };

  const renderProductImage = (item) => {
    const imagePath = item?.imagePath;
    const imageUrl = imagePath
      ? `${backendBaseURL}/Media/Products_Images/${imagePath.split('\\').pop()}`
      : null;

    return (
      <div className="relative group">
        <div className="w-24 h-24 rounded-xl overflow-hidden shadow-lg bg-gradient-to-br from-blue-50 to-indigo-100 border-2 border-white">
          {imageUrl ? (
            <>
              <img
                src={imageUrl}
                alt={item?.productName || 'Product'}
                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                onError={handleImageError}
              />
              <div 
                className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200"
                style={{ display: 'none' }}
              >
                <ShoppingCartOutlined className="text-gray-400 text-2xl" />
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-100 to-gray-200">
              <ShoppingCartOutlined className="text-gray-400 text-2xl" />
            </div>
          )}
          
          {/* Hover overlay */}
          {imageUrl && (
            <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-40 transition-all duration-300 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <Button
                type="primary"
                shape="circle"
                size="small"
                icon={<EyeOutlined />}
                className="bg-white text-gray-800 border-none shadow-lg hover:bg-gray-100"
                onClick={() => setImagePreview({ visible: true, url: imageUrl })}
              />
            </div>
          )}
        </div>
        
        {/* Product badge */}
        <div className="absolute -top-2 -right-2">
          <Badge
            count={item?.quantity || 0}
            style={{ 
              backgroundColor: '#52c41a',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
            }}
          />
        </div>
      </div>
    );
  };

  return (
    <>
      <Modal
        title={
          <div className="flex items-center justify-between w-full pr-8">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                <ShoppingOutlined className="text-white text-lg" />
              </div>
              <div>
                <Title level={4} className="mb-0 text-gray-800">Order Details</Title>
                <Text type="secondary" className="text-sm">#{orderCode}</Text>
              </div>
            </div>
            <Tag color="success" className="px-3 py-1 text-sm font-medium">
              Active Order
            </Tag>
          </div>
        }
        open={isModalVisible}
        onCancel={onClose}
        width={800}
        centered
        className="order-modal"
        styles={{
          body: { padding: '24px' },
          header: { 
            borderBottom: '1px solid #f0f0f0',
            paddingBottom: '16px'
          }
        }}
        footer={
          salesOrder.length > 0 ? (
            <div className="flex justify-between items-center w-full p-4 bg-gradient-to-r from-gray-50 to-blue-50 rounded-lg">
              <div className="flex items-center space-x-6">
                <div className="text-center">
                  <Text type="secondary" className="text-xs block">Total Items</Text>
                  <Text strong className="text-xl text-blue-600">{totalItems}</Text>
                </div>
                <Divider type="vertical" className="h-12" />
                <div className="text-center">
                  <Text type="secondary" className="text-xs block">Total Amount</Text>
                  <Text strong className="text-2xl text-green-600">₵{formatPrice(totalAmount)}</Text>
                </div>
              </div>
              <Button
                type="primary"
                icon={<DownloadOutlined />}
                onClick={downloadInvoice}
                className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 border-none shadow-lg"
                size="large"
              >
                Download Invoice
              </Button>
            </div>
          ) : null
        }
      >
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Space direction="vertical" align="center" size="large">
              <Spin size="large" />
              <Text type="secondary" className="text-lg">Loading order details...</Text>
            </Space>
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <div className="mb-6">
              <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <ShoppingOutlined className="text-red-500 text-3xl" />
              </div>
              <Title level={4} type="danger">Unable to load order</Title>
              <Text type="secondary" className="text-lg">
                {error?.message || error || 'An unexpected error occurred'}
              </Text>
            </div>
          </div>
        ) : salesOrder.length === 0 ? (
          <div className="py-20">
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={
                <div>
                  <Text type="secondary" className="text-lg block mb-2">No order details found</Text>
                  <Text type="secondary">Please check the order code and try again</Text>
                </div>
              }
            />
          </div>
        ) : (
          <div style={{ maxHeight: '650px', overflowY: 'auto' }} className="custom-scrollbar">
            {/* Order Summary Cards */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="text-center bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center">
                    <CalendarOutlined className="text-white text-xl" />
                  </div>
                  <div>
                    <Text type="secondary" className="text-xs block">Order Date</Text>
                    <Text strong className="text-sm text-blue-700">
                      {formatDate(salesOrder[0]?.orderDate)}
                    </Text>
                  </div>
                </div>
              </Card>
              
              <Card className="text-center bg-gradient-to-br from-green-50 to-green-100 border-green-200 hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <ShoppingCartOutlined className="text-white text-xl" />
                  </div>
                  <div>
                    <Text type="secondary" className="text-xs block">Total Items</Text>
                    <Text strong className="text-lg text-green-700">{totalItems}</Text>
                  </div>
                </div>
              </Card>
              
              <Card className="text-center bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 hover:shadow-lg transition-all duration-300">
                <div className="flex flex-col items-center space-y-2">
                  <div className="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center">
                    <DollarOutlined className="text-white text-xl" />
                  </div>
                  <div>
                    <Text type="secondary" className="text-xs block">Amount</Text>
                    <Text strong className="text-lg text-orange-700">₵{formatPrice(totalAmount)}</Text>
                  </div>
                </div>
              </Card>
            </div>

            {/* Delivery Address Card */}
            <Card 
              className="mb-6 bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-l-indigo-500 hover:shadow-lg transition-all duration-300"
              title={
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
                    <EnvironmentOutlined className="text-white" />
                  </div>
                  <span className="text-gray-800 font-semibold">Delivery Information</span>
                </div>
              }
            >
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                    <UserOutlined className="text-indigo-500" />
                    <div>
                      <Text type="secondary" className="text-xs block">Recipient Name</Text>
                      <Text strong className="text-gray-800">{deliveryAddress?.[0]?.recipientName || 'N/A'}</Text>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-white rounded-lg shadow-sm">
                    <PhoneOutlined className="text-green-500" />
                    <div>
                      <Text type="secondary" className="text-xs block">Contact Number</Text>
                      <Text strong className="text-gray-800">{deliveryAddress?.[0]?.recipientContactNumber || 'N/A'}</Text>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-start space-x-3 p-3 bg-white rounded-lg shadow-sm">
                    <HomeOutlined className="text-blue-500 mt-1" />
                    <div className="flex-1">
                      <Text type="secondary" className="text-xs block">Delivery Address</Text>
                      <Paragraph className="mb-0 text-gray-800" ellipsis={{ rows: 2, expandable: true }}>
                        {deliveryAddress?.[0]?.address || 'N/A'}
                      </Paragraph>
                    </div>
                  </div>
                  
                  {deliveryAddress?.[0]?.orderNote && (
                    <div className="flex items-start space-x-3 p-3 bg-white rounded-lg shadow-sm">
                      <FileTextOutlined className="text-purple-500 mt-1" />
                      <div className="flex-1">
                        <Text type="secondary" className="text-xs block">Special Notes</Text>
                        <Text italic className="text-gray-600">{deliveryAddress[0].orderNote}</Text>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Products Section */}
            <Card 
              title={
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
                      <ShoppingCartOutlined className="text-white" />
                    </div>
                    <span className="text-gray-800 font-semibold">Order Items</span>
                  </div>
                  <Badge 
                    count={salesOrder.length} 
                    style={{ 
                      backgroundColor: '#52c41a',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
                    }} 
                  />
                </div>
              }
              className="bg-gradient-to-r from-green-50 to-emerald-50 border-l-4 border-l-green-500"
            >
              <div className="space-y-4">
                {salesOrder.map((item, index) => (
                  <div key={index} className="flex items-center space-x-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-300 border border-gray-100">
                    {renderProductImage(item)}
                    
                    <div className="flex-1">
                      <div className="mb-3">
                        <Title level={5} className="mb-1 text-gray-800">
                          {item?.productName || 'Product Name Not Available'}
                        </Title>
                        <Text type="secondary" className="text-sm">
                          Item #{index + 1}
                        </Text>
                      </div>
                      
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-2 bg-blue-50 rounded-lg">
                          <Text type="secondary" className="text-xs block">Quantity</Text>
                          <Text strong className="text-lg text-blue-600">{item?.quantity || 0}</Text>
                        </div>
                        <div className="text-center p-2 bg-green-50 rounded-lg">
                          <Text type="secondary" className="text-xs block">Unit Price</Text>
                          <Text strong className="text-lg text-green-600">₵{formatPrice(item?.price || 0)}</Text>
                        </div>
                        <div className="text-center p-2 bg-orange-50 rounded-lg">
                          <Text type="secondary" className="text-xs block">Subtotal</Text>
                          <Text strong className="text-lg text-orange-600">
                            ₵{formatPrice((item?.price || 0) * (item?.quantity || 0))}
                          </Text>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </Modal>

      {/* Image Preview Modal */}
      <Modal
        open={imagePreview.visible}
        onCancel={() => setImagePreview({ visible: false, url: null })}
        footer={null}
        width={600}
        centered
        className="image-preview-modal"
      >
        <div className="text-center">
          <Image
            src={imagePreview.url}
            alt="Product Preview"
            className="max-w-full max-h-96 object-contain rounded-lg"
            preview={false}
          />
        </div>
      </Modal>

      <style jsx global>{`
        .order-modal .ant-modal-header {
          background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }
        
        .image-preview-modal .ant-modal-body {
          padding: 20px;
        }
      `}</style>
    </>
  );
};

export default OrderModal;