import React, { useState } from 'react';
import { Layout, Menu, Button, Typography, Modal, Avatar, Dropdown, Badge, Tooltip } from 'antd';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCartOutlined, 
  AppstoreAddOutlined, 
  ClusterOutlined, 
  HomeOutlined, 
  MenuFoldOutlined,
  FileImageOutlined, 
  MenuUnfoldOutlined, 
  DashboardOutlined,
  UserOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined,
  SearchOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const ContentHome = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Get user data from localStorage
  const user = (localStorage.getItem('user'));
  const fullName = user?.fullName || 'Guest';
  const userRole = user?.role || 'Admin';

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleMenuClick = (e) => {
    if (e.key === 'home') {
      navigate('/content/dashboard');
    }
    // Handle other menu items similarly...
  };

  const handleLogout = () => {
    setShowModal(true);
  };

  const confirmLogout = () => {
    setShowModal(false);
    navigate('/admin/login');
  };

  const cancelLogout = () => {
    setShowModal(false);
  };

  // User dropdown menu
  const userMenu = (
    <Menu>
      <Menu.Item key="profile" icon={<UserOutlined />}>
        Profile Settings
      </Menu.Item>
      <Menu.Item key="preferences" icon={<SettingOutlined />}>
        Preferences
      </Menu.Item>
      <Menu.Divider />
      <Menu.Item key="logout" icon={<LogoutOutlined />} onClick={handleLogout}>
        Logout
      </Menu.Item>
    </Menu>
  );

  // Menu items configuration
  const menuItems = [
    {
      key: '/content/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      path: '/content/dashboard'
    },
    {
      key: '/content/products',
      icon: <ShoppingCartOutlined />,
      label: 'Products',
      path: '/content/products'
    },
    {
      key: '/content/brands',
      icon: <AppstoreAddOutlined />,
      label: 'Brands',
      path: '/content/brands'
    },
    {
      key: '/content/category',
      icon: <ClusterOutlined />,
      label: 'Category',
      path: '/content/category'
    },
    {
      key: '/content/showroom',
      icon: <HomeOutlined />,
      label: 'Showroom',
      path: '/content/showroom'
    },
    {
      key: '/content/branch-products',
      icon: <ClusterOutlined />,
      label: 'Branch Products',
      path: '/content/branch-products'
    },
    {
      key: '/content/banner',
      icon: <FileImageOutlined />,
      label: 'Banners',
      path: '/content/banner'
    }
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Enhanced Sidebar */}
      <Sider
        collapsible
        collapsed={collapsed}
        onCollapse={toggleSidebar}
        breakpoint="lg"
        trigger={null}
        width={260}
        style={{
          position: 'fixed',
          height: '100vh',
          background: 'linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)',
          boxShadow: '2px 0 8px rgba(0,0,0,0.15)',
          zIndex: 1000,
        }}
      >
        {/* Logo Section */}
        <div style={{ 
          padding: '20px 16px', 
          textAlign: 'center',
          borderBottom: '1px solid rgba(255,255,255,0.15)',
          background: 'rgba(255,255,255,0.15)'
        }}>
          <div style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 12px',
            fontSize: '18px',
            fontWeight: 'bold',
            color: 'white'
          }}>
            {collapsed ? 'CM' : '🔴'}
          </div>
          {!collapsed && (
            <div>
              <Title level={5} style={{ color: 'white', margin: 0, fontSize: '16px' }}>
                Content Manager
              </Title>
             
            </div>
          )}
        </div>

        {/* Enhanced Menu */}
        <Menu
          mode="inline"
          onClick={handleMenuClick}
          selectedKeys={[location.pathname]}
          style={{ 
            marginTop: 16, 
            background: 'transparent',
            border: 'none'
          }}
        >
          {menuItems.map(item => (
            <Menu.Item
              key={item.key}
              icon={item.icon}
              style={{
                margin: '4px 12px',
                borderRadius: '8px',
                background: location.pathname === item.key ? 'rgba(255,255,255,0.25)' : 'transparent',
                color: 'white',
                border: 'none',
                transition: 'all 0.3s ease',
                height: '44px',
                lineHeight: '44px'
              }}
            >
              <Link to={item.path} style={{ color: 'inherit', textDecoration: 'none' }}>
                {item.label}
              </Link>
            </Menu.Item>
          ))}
        </Menu>

        {/* User info at bottom (when expanded) */}
        {!collapsed && (
          <div style={{
            position: 'absolute',
            bottom: '20px',
            left: '16px',
            right: '16px',
            padding: '12px',
            background: 'rgba(255,255,255,0.15)',
            borderRadius: '8px',
            textAlign: 'center'
          }}>
            <Avatar size={32} icon={<UserOutlined />} style={{ marginBottom: '8px', backgroundColor: '#dc2626' }} />
            <div style={{ color: 'white', fontSize: '12px' }}>
              <div style={{ fontWeight: 'bold' }}>{fullName}</div>
              <div style={{ opacity: 0.8 }}>{userRole}</div>
            </div>
          </div>
        )}
      </Sider>

      {/* Main Layout */}
      <Layout style={{ 
        marginLeft: collapsed ? 80 : 260, 
        transition: 'margin 0.3s ease'
      }}>
        {/* Enhanced Header */}
        <Header
          style={{
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'white',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            position: 'sticky',
            top: 0,
            zIndex: 999,
            height: '64px'
          }}
        >
          {/* Left side */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleSidebar}
              style={{ 
                marginRight: 16,
                fontSize: '16px',
                width: '40px',
                height: '40px',
                borderRadius: '6px'
              }}
            />
            <div>
              <Title level={4} style={{ margin: 0, color: '#dc2626' }}>
                Content Management
              </Title>
             
            </div>
          </div>

          {/* Right side */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Search */}
            <Tooltip title="Search">
              <Button
                type="text"
                icon={<SearchOutlined />}
                style={{
                  fontSize: '16px',
                  width: '40px',
                  height: '40px',
                  borderRadius: '6px'
                }}
              />
            </Tooltip>

            {/* Notifications */}
          

            {/* User Profile Dropdown */}
            <Dropdown overlay={userMenu} trigger={['click']} placement="bottomRight">
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '8px',
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '8px',
                transition: 'background 0.2s',
                ':hover': { background: '#f3f4f6' }
              }}>
                <Avatar size={32} icon={<UserOutlined />} style={{ backgroundColor: '#dc2626' }} />
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '14px', fontWeight: '500', color: '#dc2626' }}>
                    {fullName}
                  </div>
                 
                </div>
              </div>
            </Dropdown>
          </div>
        </Header>

        {/* Enhanced Content */}
        <Content
          style={{
            padding: '2px',
            minHeight: 'calc(100vh - 64px)',

          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              minHeight: '100%',
              boxShadow: '0 1px 3px rgba(220, 38, 38, 0.1), 0 1px 2px rgba(220, 38, 38, 0.06)',
            }}
          >
            {children}
          </div>
        </Content>
      </Layout>

      {/* Enhanced Logout Modal */}
      <Modal
        title={
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <LogoutOutlined style={{ color: '#ef4444' }} />
            <span>Confirm Logout</span>
          </div>
        }
        visible={showModal}
        onOk={confirmLogout}
        onCancel={cancelLogout}
        okText="Yes, Logout"
        cancelText="Cancel"
        okButtonProps={{ danger: true, style: { backgroundColor: '#dc2626', borderColor: '#dc2626' } }}
        centered
      >
        <p style={{ margin: '16px 0' }}>
          Are you sure you want to logout? You will need to sign in again to access the dashboard.
        </p>
      </Modal>
    </Layout>
  );
};

export default ContentHome;