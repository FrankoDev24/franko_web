import { useState } from 'react';
import { Layout, Menu, Button, Typography, Modal, Avatar, Dropdown, Space } from 'antd';
import { Link, useNavigate } from 'react-router-dom';
import { 
  HomeOutlined, 
  MenuFoldOutlined, 
  MenuUnfoldOutlined, 
  UserOutlined,
  ShoppingCartOutlined,
  LogoutOutlined,
  SettingOutlined,
  BellOutlined
} from '@ant-design/icons';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const FulfilmentHome = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const navigate = useNavigate();

  // Get user data from localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  const fullName = user?.fullName || 'Guest';

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const handleMenuClick = (e) => {
    if (e.key === 'home') {
      navigate('/fulfillment/dashboard');
    }
    // Handle other menu items similarly...
  };

  const showLogoutModal = () => {
    setIsLogoutModalVisible(true);
  };

  const handleLogout = () => {
    // Clear localStorage and redirect to login
    localStorage.removeItem('user');
    navigate('/admin/login');
  };

  const handleCancelLogout = () => {
    setIsLogoutModalVisible(false);
  };

  // User dropdown menu
  const userMenu = {
    items: [
      {
        key: 'profile',
        icon: <UserOutlined />,
        label: 'Profile',
        onClick: () => navigate('/admin/profile'),
      },
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: 'Settings',
      },
      {
        type: 'divider',
      },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Logout',
        onClick: showLogoutModal,
        danger: true,
      },
    ],
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      {/* Sidebar */}
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
          background: 'linear-gradient(135deg, #DC2626 0%, #B91C1C 50%, #991B1B 100%)',
          boxShadow: '2px 0 8px rgba(0, 0, 0, 0.1)',
          zIndex: 1000,
        }}
      >
        <div className="logo text-center" style={{ padding: '20px 16px' }}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.1)',
            borderRadius: '12px',
            padding: '12px',
            backdropFilter: 'blur(10px)',
            marginBottom: '8px'
          }}>
            <Title level={collapsed ? 3 : 4} style={{ 
              color: 'white', 
              margin: 0,
              fontWeight: 'bold',
              textShadow: '0 2px 4px rgba(0, 0, 0, 0.3)'
            }}>
              {collapsed ? 'FM' : 'Fulfillment Manager'}
            </Title>
          </div>
          {!collapsed && (
            <Text style={{ 
              color: 'rgba(255, 255, 255, 0.8)', 
              fontSize: '12px',
              textShadow: '0 1px 2px rgba(0, 0, 0, 0.3)'
            }}>
              Management System
            </Text>
          )}
        </div>

        <Menu
          mode="inline"
          onClick={handleMenuClick}
          style={{ 
            marginTop: 10, 
            background: 'transparent', 
            border: 'none',
            color: 'white'
          }}
          theme="dark"
        >
          <Menu.Item 
            key="dashboard" 
            icon={<HomeOutlined style={{ fontSize: '16px' }} />}
            style={{
              margin: '4px 12px',
              borderRadius: '8px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.3s ease',
            }}
          >
            <Link to="/fulfillment/dashboard" style={{ color: 'white', textDecoration: 'none' }}>
              Dashboard
            </Link>
          </Menu.Item>
          <Menu.Item 
            key="orders" 
            icon={<ShoppingCartOutlined style={{ fontSize: '16px' }} />}
            style={{
              margin: '4px 12px',
              borderRadius: '8px',
              height: '44px',
              display: 'flex',
              alignItems: 'center',
              transition: 'all 0.3s ease',
            }}
          >
            <Link to="/fulfillment/orders" style={{ color: 'white', textDecoration: 'none' }}>
              Orders
            </Link>
          </Menu.Item>
        </Menu>
      </Sider>

      {/* Main Layout */}
      <Layout style={{ 
        marginLeft: collapsed ? 80 : 260, 
        transition: 'margin 0.3s ease',
        background: '#f8fafc'
      }}>
        {/* Header */}
        <Header
          style={{
            padding: '0 24px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)',
            borderBottom: '1px solid #e2e8f0',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
            height: '70px',
            position: 'sticky',
            top: 0,
            zIndex: 999,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              onClick={toggleSidebar}
              style={{ 
                marginRight: 16,
                color: '#64748b',
                fontSize: '16px',
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
              }}
            />
            <div>
              <Title level={4} style={{ 
                margin: 0, 
                color: '#1e293b',
                fontWeight: '600'
              }}>
                Fulfillment Manager
              </Title>
             
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Notification Bell */}
            <Button
              type="text"
              icon={<BellOutlined />}
              style={{
                color: '#64748b',
                fontSize: '16px',
                width: '40px',
                height: '40px',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            />

            {/* User Profile Dropdown */}
            <Dropdown menu={userMenu} trigger={['click']} placement="bottomRight">
              <Space style={{ 
                cursor: 'pointer',
                padding: '8px 12px',
                borderRadius: '8px',
                transition: 'all 0.3s ease',
                border: '1px solid #e2e8f0',
                background: 'white'
              }}>
                <Avatar 
                  style={{ 
                    backgroundColor: '#DC2626',
                    color: 'white',
                    fontWeight: 'bold'
                  }}
                  size="small"
                >
                  {fullName.charAt(0).toUpperCase()}
                </Avatar>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                  <Text style={{ 
                    color: '#1e293b', 
                    fontSize: '14px',
                    fontWeight: '500',
                    lineHeight: '1.2'
                  }}>
                    {fullName}
                  </Text>
                  <Text style={{ 
                    color: '#64748b', 
                    fontSize: '12px',
                    lineHeight: '1.2'
                  }}>
                    Administrator
                  </Text>
                </div>
              </Space>
            </Dropdown>
          </div>
        </Header>

        {/* Content */}
        <Content
          style={{
            padding: '12px',
            minHeight: 'calc(100vh - 70px)',
            background: '#f8fafc',
          }}
        >
          <div
            style={{
              background: 'white',
              borderRadius: '12px',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
              minHeight: 'calc(100vh - 140px)',
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
            <LogoutOutlined style={{ color: '#DC2626' }} />
            <span>Confirm Logout</span>
          </div>
        }
        open={isLogoutModalVisible}
        onOk={handleLogout}
        onCancel={handleCancelLogout}
        okText="Yes, Logout"
        cancelText="Cancel"
        okButtonProps={{
          style: {
            background: '#DC2626',
            borderColor: '#DC2626',
          }
        }}
        cancelButtonProps={{
          style: {
            borderColor: '#d1d5db',
          }
        }}
        centered
      >
        <div style={{ padding: '20px 0' }}>
          <Text style={{ fontSize: '16px', color: '#374151' }}>
            Are you sure you want to log out of your account?
          </Text>
        </div>
      </Modal>

      {/* Custom Styles */}
      <style jsx global>{`
        .ant-menu-item:hover {
          background: rgba(255, 255, 255, 0.1) !important;
          color: white !important;
        }
        
        .ant-menu-item-selected {
          background: rgba(255, 255, 255, 0.2) !important;
          color: white !important;
        }
        
        .ant-menu-item-selected::after {
          border-right: 3px solid white !important;
        }
        
        .ant-dropdown-menu {
          border-radius: 8px !important;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1) !important;
        }
        
        .ant-btn:hover {
          background: rgba(0, 0, 0, 0.04) !important;
        }
        
        .ant-layout-sider-trigger {
          background: rgba(255, 255, 255, 0.1) !important;
          border-top: 1px solid rgba(255, 255, 255, 0.1) !important;
        }
        
        .ant-layout-sider-trigger:hover {
          background: rgba(255, 255, 255, 0.2) !important;
        }
      `}</style>
    </Layout>
  );
};

export default FulfilmentHome;