import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSalesOrderById, fetchOrderDeliveryAddress } from '../Redux/Slice/orderSlice';
import { Modal, Spin, Typography, Image, Divider, Card, Button } from 'antd';
import { UserOutlined, PhoneOutlined, HomeOutlined, EditOutlined, DownloadOutlined } from '@ant-design/icons';
import html2pdf from 'html2pdf.js';

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

  const downloadInvoice = () => {
    if (!salesOrder || salesOrder.length === 0) return;
    const order = salesOrder[0];
    const address = deliveryAddress?.[0] || {};

    const element = document.createElement('div');
    element.innerHTML = `
      <div style="text-align: center; padding: 20px;">
        <img src="https://yourdomain.com/path/to/frankoIcon.png" alt="Franko trading ltd" style="width: 80px; height: 50px; margin-bottom: 10px;">
        <div style="font-size: 14px; color: #333;">
          <p><strong>Franko Trading Ltd.</strong></p>
          <p>123 Adabraka Street, Accra, Ghana</p>
          <p>Contact: +233 123 456 789 | Email: online@frankotrading.com</p>
        </div>
        <h2 style="font-size: 24px; margin-top: 10px; color: #4CAF50; font-weight: bold;">Invoice</h2>
      </div>
      <div style="font-size: 12px; padding: 20px;">
        <p><strong>Order Code:</strong> ${order?.orderCode || orderCode}</p>
        <p><strong>Order Date:</strong> ${new Date(order?.orderDate).toLocaleDateString()}</p>
        <p><strong>Recipient:</strong> ${address?.recipientName || 'N/A'}</p>
        <p><strong>Contact:</strong> ${address?.recipientContactNumber || 'N/A'}</p>
        <p><strong>Address:</strong> ${address?.address || 'N/A'}</p>
        <p><strong>Note:</strong> ${address?.orderNote || 'N/A'}</p>
      </div>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #4CAF50; color: white;">
            <th style="padding: 8px; border: 1px solid #ddd;">SN</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Product Name</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Quantity</th>
            <th style="padding: 8px; border: 1px solid #ddd;">Unit Price (₵)</th>
          </tr>
        </thead>
        <tbody>
          ${salesOrder
            .map(
              (item, index) => `
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;">${index + 1}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${item.productName || 'N/A'}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${item.quantity || 0}</td>
              <td style="padding: 8px; border: 1px solid #ddd;">${formatPrice(item.price)}</td>
            </tr>`
            )
            .join('')}
        </tbody>
      </table>
      <div style="text-align: right; font-size: 16px; font-weight: bold; color: #333;">
        Total Amount: ₵${formatPrice(
          salesOrder.reduce((total, item) => total + item.price * item.quantity, 0)
        )}
      </div>
    `;

    html2pdf()
      .from(element)
      .set({
        margin: 20,
        filename: `Invoice_${order?.orderCode || orderCode}.pdf`,
        image: { type: 'jpeg', quality: 1 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
      })
      .save();
  };

  const backendBaseURL = 'https://smfteapi.salesmate.app';
  const totalAmount = salesOrder.reduce((acc, item) => acc + (item.price * item.quantity), 0);

  return (
    <Modal
      title={`Order: ${orderCode || 'Details'}`}
      open={isModalVisible} // <-- FIX: `open` instead of `visible` for Ant Design v5+
      onCancel={onClose}
      width={500}
      centered
      footer={
        salesOrder.length > 0 ? (
          <div className="flex justify-between w-full">
            <div>
              <Text strong className="text-lg">Total Amount: </Text>
              <Text strong className="text-lg text-red-500">₵{formatPrice(totalAmount)}</Text>
            </div>
            <Button
              key="download"
              icon={<DownloadOutlined />}
              onClick={downloadInvoice}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              Download Invoice
            </Button>
          </div>
        ) : null
      }
    >
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Spin tip="Loading order details..." size="large" />
        </div>
      ) : error ? (
        <div className="text-center py-8">
          <Text type="danger">Error loading order: {error?.message || error || 'An error occurred'}</Text>
        </div>
      ) : salesOrder.length === 0 ? (
        <div className="text-center py-8">
          <Text>No order details found.</Text>
        </div>
      ) : (
        <div style={{ maxHeight: '500px', overflowY: 'auto', padding: '16px' }}>
          <div className="mb-4">
            <Text strong>Order Date: </Text>
            <Text>{new Date(salesOrder[0]?.orderDate).toLocaleDateString()}</Text>
          </div>

          <Card className="mb-4 text-gray-800 shadow-md">
            <Title level={5} className="text-sm font-medium">Delivery Address</Title>
            <div className="space-y-2">
              <div><Text strong><UserOutlined /> Recipient:</Text> <Text>{deliveryAddress?.[0]?.recipientName || 'N/A'}</Text></div>
              <div><Text strong><PhoneOutlined /> Contact:</Text> <Text>{deliveryAddress?.[0]?.recipientContactNumber || 'N/A'}</Text></div>
              <div><Text strong><HomeOutlined /> Address:</Text> <Text>{deliveryAddress?.[0]?.address || 'N/A'}</Text></div>
              <div><Text strong><EditOutlined /> Note:</Text> <Text>{deliveryAddress?.[0]?.orderNote || 'N/A'}</Text></div>
            </div>
          </Card>

          <Divider />

          {salesOrder.map((item, index) => {
            const imagePath = item?.imagePath;
            const imageUrl = imagePath
              ? `${backendBaseURL}/Media/Products_Images/${imagePath.split('\\').pop()}`
              : null;

            return (
              <div key={index} className="flex items-center space-x-4 mb-4">
                <div className="flex-shrink-0">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt="Product"
                      className="w-16 max-h-16 object-cover rounded-md"
                      preview={false}
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-md flex items-center justify-center">
                      <Text type="secondary" className="text-xs">No Image</Text>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="mb-1">
                    <Text strong>Product Name:</Text> <Text className="ml-2">{item?.productName || 'N/A'}</Text>
                  </div>
                  <div className="mb-1">
                    <Text strong>Quantity:</Text> <Text className="ml-2">{item?.quantity || 0}</Text>
                  </div>
                  <div>
                    <Text strong>Price:</Text> <Text className="ml-2">₵{formatPrice(item?.price || 0)}</Text>
                  </div>
                </div>
              </div>
            );
          })}
          <Divider />
        </div>
      )}
    </Modal>
  );
};

export default OrderModal;
