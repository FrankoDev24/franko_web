import { useState } from 'react';
import {Layout,Menu,Avatar, Dropdown,
  Button,
  Modal,
  Typography,
  Drawer,
  Grid,
} from 'antd';
import {UserOutlined, ShopOutlined, ShoppingCartOutlined,AppstoreOutlined, TagsOutlined,TrademarkOutlined, LogoutOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  UsergroupAddOutlined,
  HomeOutlined,
  FileImageOutlined,
} from '@ant-design/icons';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { logoutUser } from '../../Redux/Slice/userSlice';

const { Header, Sider, Content } = Layout;
const { Text } = Typography;
const { useBreakpoint } = Grid;

const AdminLayout = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerVisible, setDrawerVisible] = useState(false);
  const [isLogoutModalVisible, setIsLogoutModalVisible] = useState(false);
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const location = useLocation();
  const screens = useBreakpoint();

  const currentPath = location.pathname;
  const user = JSON.parse(localStorage.getItem('user'));
  const userName = user ? user.fullName : 'Admin';
  const userPosition = user ? user.position : '';

  const isMobile = !screens.md;

  const toggleCollapsed = () => {
    if (isMobile) {
      setDrawerVisible(true);
    } else {
      setCollapsed(!collapsed);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    dispatch(logoutUser());
    setIsLogoutModalVisible(false);
    navigate('/admin/login');
  };

  const showLogoutModal = () => setIsLogoutModalVisible(true);
  const handleCancel = () => setIsLogoutModalVisible(false);

  const closeDrawer = () => setDrawerVisible(false);

  const menuItems = [
    { key: '/admin/dashboard', icon: <ShopOutlined />, label: 'Dashboard', link: '/admin/dashboard' },
    { key: '/admin/orders', icon: <ShoppingCartOutlined />, label: 'Orders', link: '/admin/orders' },
    { key: '/admin/categories', icon: <TagsOutlined />, label: 'Categories', link: '/admin/categories' },
    { key: '/admin/products', icon: <AppstoreOutlined />, label: 'Products', link: '/admin/products' },
    { key: '/admin/brands', icon: <TrademarkOutlined />, label: 'Brands', link: '/admin/brands' },
    { key: '/admin/showroom', icon: <ShopOutlined />, label: 'Showroom', link: '/admin/showroom' },
    { key: '/admin/banner', icon: <FileImageOutlined />, label: 'Banner', link: '/admin/banner' },
    { key: '/admin/users', icon: <UserOutlined />, label: 'Users', link: '/admin/users' },
    { key: '/admin/customers', icon: <UsergroupAddOutlined />, label: 'Customers', link: '/admin/customers' },
    { key: 'logout', icon: <LogoutOutlined />, label: 'Logout', action: showLogoutModal },
  ];

  const userMenu = (
    <Menu>
      <Menu.Item key="1">
        <Link to="/admin/profile">Profile</Link>
      </Menu.Item>
      <Menu.Item key="2">
        <span>{userPosition ? `Position: ${userPosition}` : 'Position: N/A'}</span>
      </Menu.Item>
      <Menu.Item key="3" onClick={showLogoutModal}>
        Logout
      </Menu.Item>
    </Menu>
  );

  const renderSidebarMenu = () => (
    <Menu
      theme="dark"
      mode="inline"
      selectedKeys={[currentPath]}
      onClick={closeDrawer}
      style={{ background: '#2f3542' }}
    >
      {menuItems.map(item => (
        <Menu.Item
          key={item.key}
          icon={item.icon}
          onClick={item.action}
          style={{ fontSize: 15 }}
        >
          {item.link ? <Link to={item.link}>{item.label}</Link> : item.label}
        </Menu.Item>
      ))}
    </Menu>
  );

  return (
    <Layout style={{ minHeight: '100vh', background: '#f5f6fa' }}>
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          width={220}
          style={{
            background: '#2f3542',
            position: 'fixed',
            height: '100vh',
            left: 0,
            top: 0,
          }}
        >
          <div style={{
            height: 64,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontSize: 20,
            fontWeight: 'bold',
            letterSpacing: 1
          }}>
            {collapsed ? 'M' : 'Admin Manager'}
          </div>
          {renderSidebarMenu()}
        </Sider>
      )}

      {isMobile && (
        <Drawer
          title="Admin Panel"
          placement="left"
          onClose={closeDrawer}
          open={drawerVisible}
          bodyStyle={{ padding: 0 }}
        >
          {renderSidebarMenu()}
        </Drawer>
      )}

      <Layout style={{ marginLeft: !isMobile ? (collapsed ? 80 : 220) : 0, transition: 'all 0.3s ease' }}>
        <Header
          style={{
            background: '#fff',
            padding: '0 24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            height: 64,
            boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
            position: 'fixed',
            width: `calc(100% - ${!isMobile ? (collapsed ? 80 : 220) : 0}px)`,
            zIndex: 10,
            transition: 'all 0.3s ease',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button
              type="text"
              onClick={toggleCollapsed}
              icon={collapsed || isMobile ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
              style={{ fontSize: 20, marginRight: 16 }}
            />
        
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Dropdown overlay={userMenu} placement="bottomRight">
              <Avatar size="large" style={{ backgroundColor: '#70a1ff' }} icon={<UserOutlined />} />
            </Dropdown>
            <Text strong>Hello, {userName}</Text>
          </div>
        </Header>

        <Content
          style={{
            marginTop: 50,
            marginBottom: 8,
            padding: 14,
            background: '#fff',
            minHeight: 240,
            borderRadius: 8,
            marginRight: 2,
            marginLeft: 2,
            boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
          }}
        >
          {children}
        </Content>
      </Layout>

      <Modal
        open={isLogoutModalVisible}
        footer={null}
        centered
        closable={false}
        bodyStyle={{ padding: '20px', textAlign: 'center' }}
      >
        <Text style={{ fontSize: 16 }}>Are you sure you want to log out?</Text>
        <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center', gap: 16 }}>
          <Button type="primary" danger onClick={handleLogout} style={{ width: 120 }}>
            Yes, Logout
          </Button>
          <Button onClick={handleCancel} style={{ width: 120 }}>
            Cancel
          </Button>
        </div>
      </Modal>
    </Layout>
  );
};

export default AdminLayout;
