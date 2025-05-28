import React, { useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchSalesOrderById, fetchOrderDeliveryAddress } from '../../../Redux/Slice/orderSlice';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  Box,
  Avatar,
  Chip,
  Divider,
  IconButton,
  Paper,
  Stack,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Person as PersonIcon,
  Phone as PhoneIcon,
  Home as HomeIcon,
  Edit as EditIcon,
  Receipt as ReceiptIcon,
  AccessTime as AccessTimeIcon,
  Close as CloseIcon,
  Print as PrintIcon,
  Download as DownloadIcon,
  ShoppingCart as ShoppingCartIcon,
  LocalShipping as LocalShippingIcon,
} from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import PrintableInvoice from './PrintableInvoice';
import { saveAs } from 'file-saver';
import * as XLSX from 'xlsx';

const formatPrice = (amount) => {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
};

// Custom styled components
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    borderRadius: 20,
    maxWidth: 900,
    width: '90vw',
    maxHeight: '90vh',
    background: `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.1)} 0%, ${alpha(theme.palette.secondary.light, 0.05)} 100%)`,
    backdropFilter: 'blur(10px)',
    border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
color: 'rgba(255, 255, 255, 1)',

  padding: theme.spacing(3),
  borderRadius: '20px 20px 0 0',
  position: 'relative',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Ccircle cx="7" cy="7" r="3"/%3E%3Ccircle cx="27" cy="7" r="3"/%3E%3Ccircle cx="47" cy="7" r="3"/%3E%3Ccircle cx="7" cy="27" r="3"/%3E%3Ccircle cx="27" cy="27" r="3"/%3E%3Ccircle cx="47" cy="27" r="3"/%3E%3Ccircle cx="7" cy="47" r="3"/%3E%3Ccircle cx="27" cy="47" r="3"/%3E%3Ccircle cx="47" cy="47" r="3"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
  },
}));

const InfoCard = styled(Card)(({ theme, variant }) => {
  const colors = {
    customer: {
      bg: `linear-gradient(135deg, ${alpha(theme.palette.success.light, 0.1)} 0%, ${alpha(theme.palette.success.main, 0.05)} 100%)`,
      border: theme.palette.success.main,
      icon: theme.palette.success.main,
    },
    delivery: {
      bg: `linear-gradient(135deg, ${alpha(theme.palette.warning.light, 0.1)} 0%, ${alpha(theme.palette.warning.main, 0.05)} 100%)`,
      border: theme.palette.warning.main,
      icon: theme.palette.warning.main,
    },
    order: {
      bg: `linear-gradient(135deg, ${alpha(theme.palette.info.light, 0.1)} 0%, ${alpha(theme.palette.info.main, 0.05)} 100%)`,
      border: theme.palette.info.main,
      icon: theme.palette.info.main,
    },
  };

  const color = colors[variant] || colors.customer;

  return {
    background: color.bg,
    border: `2px solid ${alpha(color.border, 0.3)}`,
    borderRadius: 16,
    marginBottom: theme.spacing(3),
    position: 'relative',
    overflow: 'visible',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: `0 12px 40px ${alpha(color.border, 0.15)}`,
      borderColor: color.border,
    },
    '&::before': {
      content: '""',
      position: 'absolute',
      top: -1,
      left: -1,
      right: -1,
      bottom: -1,
      background: `linear-gradient(135deg, ${color.border}, ${alpha(color.border, 0.5)})`,
      borderRadius: 16,
      zIndex: -1,
      opacity: 0,
      transition: 'opacity 0.3s ease',
    },
    '&:hover::before': {
      opacity: 0.1,
    },
  };
});

const ProductCard = styled(Card)(({ theme }) => ({
  background: `linear-gradient(135deg, ${alpha(theme.palette.background.paper, 0.8)} 0%, ${alpha(theme.palette.background.paper, 0.6)} 100%)`,
  backdropFilter: 'blur(10px)',
  border: `1px solid ${alpha(theme.palette.primary.main, 0.1)}`,
  borderRadius: 16,
  marginBottom: theme.spacing(2),
  transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
  '&:hover': {
    transform: 'translateY(-2px)',
    boxShadow: `0 8px 32px ${alpha(theme.palette.primary.main, 0.1)}`,
    border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
  },
}));

const StyledButton = styled(Button)(({ theme, variant: buttonVariant }) => {
  const variants = {
    print: {
      background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`,
      '&:hover': {
        background: `linear-gradient(135deg, ${theme.palette.success.dark} 0%, ${theme.palette.success.main} 100%)`,
        transform: 'translateY(-2px)',
        boxShadow: `0 8px 25px ${alpha(theme.palette.success.main, 0.4)}`,
      },
    },
    export: {
      background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`,
      '&:hover': {
        background: `linear-gradient(135deg, ${theme.palette.info.dark} 0%, ${theme.palette.info.main} 100%)`,
        transform: 'translateY(-2px)',
        boxShadow: `0 8px 25px ${alpha(theme.palette.info.main, 0.4)}`,
      },
    },
    close: {
      background: `linear-gradient(135deg, ${theme.palette.grey[400]} 0%, ${theme.palette.grey[600]} 100%)`,
      '&:hover': {
        background: `linear-gradient(135deg, ${theme.palette.grey[600]} 0%, ${theme.palette.grey[400]} 100%)`,
        transform: 'translateY(-2px)',
        boxShadow: `0 8px 25px ${alpha(theme.palette.grey[500], 0.4)}`,
      },
    },
  };

  return {
    borderRadius: 12,
    padding: theme.spacing(1.5, 3),
    fontWeight: 600,
    textTransform: 'none',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    ...(variants[buttonVariant] || variants.close),
  };
});

const OrderDetailsModal = ({ open, orderId, onClose }) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const { salesOrder, loading, error, deliveryAddress } = useSelector((state) => state.orders);

  const printRef = useRef();
  const downloadRef = useRef(null);

  useEffect(() => {
    if (open && orderId) {
      dispatch(fetchSalesOrderById(orderId));
      dispatch(fetchOrderDeliveryAddress(orderId));
    }
  }, [dispatch, orderId, open]);

  const handlePrint = () => {
    const printContent = printRef.current;
    const newWindow = window.open('', '_blank');
    newWindow.document.write(printContent.innerHTML);
    newWindow.document.close();
    newWindow.print();
    onClose();
  };

  const exportToExcel = () => {
    if (!salesOrder || salesOrder.length === 0) {
      console.error("No order details available for export.");
      return;
    }

    const invoiceData = [
      ["Invoice Details"],
      ["Order No", orderId?.slice(-7) || "N/A"],
      ["Order Date", new Date().toLocaleDateString('en-GB')],
      [],
      ["S.NO", "Product Name", "Quantity", "Unit Price (₵)", "Total Price (₵)"],
      ...salesOrder.map((order, index) => [
        index + 1,
        order.productName,
        order.quantity,
        order.price,
        order.total,
      ]),
    ];

    const ws = XLSX.utils.aoa_to_sheet(invoiceData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Invoice");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });

    saveAs(data, `Invoice_${orderId?.slice(-7) || "Unknown"}.xlsx`);
  };

  if (loading) return <CircularProgress size={60} sx={{ display: 'none' }} />;
  if (error) return <div style={{ display: 'none' }}>Error loading order: {error.message || 'An error occurred'}</div>;
  if (!open) return null;
  if (!salesOrder || salesOrder.length === 0) return <div>No order details found.</div>;

  const backendBaseURL = 'https://smfteapi.salesmate.app/';
  const totalAmount = salesOrder.reduce((acc, order) => acc + order.total, 0);
  const address = deliveryAddress?.[0] || {};

  return (
    <StyledDialog 
    open={open} 
    onClose={onClose} 
    maxWidth={false}
  
   
    PaperProps={{
      style: {
        backgroundColor: 'white'
      }
    }}
  >
    
      <StyledDialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
          <Box display="flex" flexDirection="column" alignItems="center" sx={{ flex: 1 }}>
            <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 1 }}>
              <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }}>
                <ReceiptIcon />
              </Avatar>
              <Typography variant="h5" component="h2" fontWeight="bold">
                Order Details
              </Typography>
            </Stack>
            <Stack direction="row" alignItems="center" spacing={1}>
              <AccessTimeIcon sx={{ fontSize: 20, opacity: 0.9 }} />
              <Typography variant="body1" sx={{ opacity: 0.95 }}>
                {new Date(salesOrder[0]?.orderDate).toLocaleString()}
              </Typography>
            </Stack>
          </Box>
          <IconButton
            onClick={onClose}
            sx={{
            color: 'rgba(255, 255, 255, 1)',

              bgcolor: 'rgba(255,255,255,0.1)',
              '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
            }}
          >
            <CloseIcon />
          </IconButton>
        </Stack>
      </StyledDialogTitle>

      <DialogContent sx={{ p: 3, maxHeight: '70vh', overflowY: 'auto' }}>
        <Box ref={downloadRef}>
          {/* Customer Information */}
          <InfoCard variant="customer" style={{marginTop:"10px"}}>
            <CardContent sx={{ p: 2, }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.success.main }}>
                  <PersonIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="bold" color="success.dark">
                  Customer Information
                </Typography>
              </Stack>
              <Grid container spacing={3}>
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <PersonIcon color="success" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight="bold">Name:</Typography>
                  </Stack>
                  <Typography variant="body1" sx={{ pl: 3 }}>{salesOrder[0]?.fullName}</Typography>
                </Grid>
                <Grid item xs={12} sm={6}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <PhoneIcon color="success" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight="bold">Contact:</Typography>
                  </Stack>
                  <Typography variant="body1" sx={{ pl: 3 }}>{salesOrder[0]?.contactNumber}</Typography>
                </Grid>
                <Grid item xs={12}>
                  <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                    <HomeIcon color="success" fontSize="small" />
                    <Typography variant="subtitle2" fontWeight="bold">Address:</Typography>
                  </Stack>
                  <Typography variant="body1" sx={{ pl: 3 }}>{salesOrder[0]?.address}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </InfoCard>

          {/* Delivery Address */}
          <InfoCard variant="delivery">
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 2 }}>
                <Avatar sx={{ bgcolor: theme.palette.warning.main }}>
                  <LocalShippingIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="bold" color="warning.dark">
                  Delivery Address
                </Typography>
              </Stack>
              {address.recipientName ? (
                <Grid container spacing={3}>
                  <Grid item xs={12} sm={6}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <PersonIcon color="warning" fontSize="small" />
                      <Typography variant="subtitle2" fontWeight="bold">Recipient Name:</Typography>
                    </Stack>
                    <Typography variant="body1" sx={{ pl: 3 }}>{address.recipientName}</Typography>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <PhoneIcon color="warning" fontSize="small" />
                      <Typography variant="subtitle2" fontWeight="bold">Contact:</Typography>
                    </Stack>
                    <Typography variant="body1" sx={{ pl: 3 }}>{address.recipientContactNumber}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <HomeIcon color="warning" fontSize="small" />
                      <Typography variant="subtitle2" fontWeight="bold">Address:</Typography>
                    </Stack>
                    <Typography variant="body1" sx={{ pl: 3 }}>{address.address}</Typography>
                  </Grid>
                  <Grid item xs={12}>
                    <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1 }}>
                      <EditIcon color="warning" fontSize="small" />
                      <Typography variant="subtitle2" fontWeight="bold">Note:</Typography>
                    </Stack>
                    <Typography variant="body1" sx={{ pl: 3 }}>{address.orderNote}</Typography>
                  </Grid>
                </Grid>
              ) : (
                <Typography variant="body1" color="text.secondary">
                  No delivery address available.
                </Typography>
              )}
            </CardContent>
          </InfoCard>

          {/* Order Details */}
          <InfoCard variant="order">
            <CardContent sx={{ p: 3 }}>
              <Stack direction="row" alignItems="center" spacing={2} sx={{ mb: 3 }}>
                <Avatar sx={{ bgcolor: theme.palette.info.main }}>
                  <ShoppingCartIcon />
                </Avatar>
                <Typography variant="h6" fontWeight="bold" color="info.dark">
                  Order Details
                </Typography>
                <Chip 
                  label={`${salesOrder.length} items`} 
                  color="info" 
                  size="small"
                  sx={{ ml: 'auto' }}
                />
              </Stack>
              
              <Stack spacing={2}>
                {salesOrder.map((order, index) => {
                  const imagePath = order?.imagePath;
                  const imageUrl = imagePath
                    ? `${backendBaseURL}Media/Products_Images/${imagePath.split('\\').pop()}`
                    : null;

                  return (
                    <ProductCard key={index}>
                      <CardContent sx={{ p: 2 }}>
                        <Grid container spacing={2} alignItems="center">
                          <Grid item xs={12} sm={3}>
                            {imageUrl ? (
                              <Box
                                component="img"
                                src={imageUrl}
                                alt="Product"
                                sx={{
                                  width: '100%',
                                  height: 100,
                                  objectFit: 'cover',
                                  borderRadius: 2,
                                  border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                                }}
                                onError={(e) => {
                                  e.target.style.display = 'none';
                                  e.target.nextSibling.style.display = 'flex';
                                }}
                              />
                            ) : null}
                            <Paper
                              sx={{
                                width: '100%',
                                height: 100,
                                display: imageUrl ? 'none' : 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                bgcolor: alpha(theme.palette.error.main, 0.1),
                                color: 'error.main',
                                borderRadius: 2,
                              }}
                            >
                              <Typography variant="caption">No Image</Typography>
                            </Paper>
                          </Grid>
                          <Grid item xs={12} sm={9}>
                            <Stack spacing={1}>
                              <Typography variant="h6" fontWeight="bold" color="success">
                                {order.productName}
                              </Typography>
                              <Grid container spacing={2}>
                                <Grid item xs={6} sm={3}>
                                  <Typography variant="caption" color="text.secondary">Qty</Typography>
                                  <Typography variant="body1" fontWeight="bold">{order.quantity}</Typography>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                  <Typography variant="caption" color="text.secondary">Tag</Typography>
                                  <Typography variant="body1" fontWeight="bold">{order.tag}</Typography>
                                </Grid>
                                <Grid item xs={6} sm={3}>
                                  <Typography variant="caption" color="text.secondary">Colour</Typography>
                                  <Typography variant="body1" fontWeight="bold">{order.productColor}</Typography>
                                </Grid>
                                <Grid item xs={6} sm={4}>
                                  <Typography variant="caption" color="text.secondary">Unit Price</Typography>
                                  <Typography variant="body1" fontWeight="bold">₵{formatPrice(order.price)}.00</Typography>
                                </Grid>
                                <Grid item xs={12} sm={5}>
                                  <Typography variant="caption" color="text.secondary">Total Price</Typography>
                                  <Typography variant="body1" fontWeight="bold" color="success.main">
                                    ₵{formatPrice(order.total)}.00
                                  </Typography>
                                </Grid>
                              </Grid>
                            </Stack>
                          </Grid>
                        </Grid>
                      </CardContent>
                    </ProductCard>
                  );
                })}
              </Stack>
            </CardContent>
          </InfoCard>

          {/* Total Amount */}
          <Divider sx={{ my: 3 }} />
          <Paper
            elevation={0}
            sx={{
              p: 3,
              background: `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)} 0%, ${alpha(theme.palette.secondary.main, 0.05)} 100%)`,
              border: `2px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              borderRadius: 4,
              textAlign: 'center',
            }}
          >
            <Typography variant="h6" fontWeight="bold" color="primary">
              Total Amount: ₵{formatPrice(totalAmount)}.00
            </Typography>
          </Paper>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 0 }}>
        <Stack direction="row" spacing={2} justifyContent="flex-end" width="100%">
          <StyledButton
            variant="contained"
            startIcon={<PrintIcon />}
            onClick={handlePrint}
            buttonVariant="print"
          >
            Print Invoice
          </StyledButton>
          <StyledButton
            variant="contained"
            startIcon={<DownloadIcon />}
            onClick={exportToExcel}
            buttonVariant="export"
          >
            Export Excel
          </StyledButton>
          <StyledButton
            variant="contained"
            onClick={onClose}
            buttonVariant="close"
          >
            Close
          </StyledButton>
        </Stack>
      </DialogActions>

      {/* Hidden Printable Invoice */}
      <div ref={printRef} style={{ display: 'none' }}>
        <PrintableInvoice
          orderId={orderId}
          salesOrder={salesOrder}
          deliveryAddress={deliveryAddress}
        />
      </div>
    </StyledDialog>
  );
};

export default OrderDetailsModal;