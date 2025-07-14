import React, { useState } from 'react';
import { Layout, Menu, Button, Typography } from 'antd';
import {
  DashboardOutlined,
  ShoppingOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
} from '@ant-design/icons';
import { useNavigate, useLocation } from 'react-router-dom';

const { Sider, Content } = Layout;
const { Title } = Typography;

// Red color palette for enhanced UI
const RED_PRIMARY = "#DD1C1A";      // Deep red
const RED_SECONDARY = "#B91C1C";    // Darker red
const RED_LIGHT = "#FEF2F2";        // Light red background
const RED_ACCENT = "#EF4444";       // Bright red accent

const AgentHome = ({ children }) => {
  const [collapsed, setCollapsed] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const toggleCollapse = () => setCollapsed(!collapsed);

  // Function to determine the active menu item based on the current route
  const getSelectedKey = () => {
    const path = location.pathname;
    if (path.includes('/orders')) {
      return '2';  // Orders
    }
    return '1';  // Dashboard
  };

  return (
    <Layout style={{ 
      minHeight: '100vh', 
      backgroundColor: '#f8fafc',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      {/* Enhanced Sidebar */}
      <Sider
        width={220}
        collapsible
        collapsed={collapsed}
        onCollapse={toggleCollapse}
        style={{
          background: `linear-gradient(135deg, ${RED_PRIMARY} 0%, ${RED_SECONDARY} 100%)`,
          boxShadow: '6px 0 20px rgba(220, 38, 38, 0.15)',
          borderRadius: '0 8px 8px 0',
          overflow: 'hidden',
        }}
      >
        {/* Enhanced Sidebar Header */}
        <div
          style={{
            height: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
            padding: '0 20px',
            background: `linear-gradient(135deg, ${RED_SECONDARY} 0%, ${RED_PRIMARY} 100%)`,
            color: 'white',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          }}
        >
          {!collapsed && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                backgroundColor: '#ffffff',
                opacity: 0.9
              }} />
              <Title level={4} style={{ 
                margin: 0, 
                color: 'white', 
                fontWeight: 600,
                letterSpacing: '0.5px'
              }}>
                Agent Panel
              </Title>
            </div>
          )}
          <Button
            type="text"
            onClick={toggleCollapse}
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            style={{
              color: 'white',
              fontSize: 16,
              width: 40,
              height: 40,
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s ease',
              border: '1px solid rgba(255,255,255,0.2)',
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
              e.target.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.transform = 'scale(1)';
            }}
          />
        </div>

        {/* Enhanced Sidebar Menu */}
        <Menu
          mode="inline"
          selectedKeys={[getSelectedKey()]}
          style={{
            height: '100%',
            borderRight: 0,
            backgroundColor: 'transparent',
            color: 'white',
            padding: '16px 8px',
          }}
          theme="dark"
        >
          <Menu.Item
            key="1"
            icon={<DashboardOutlined style={{ 
              color: 'white', 
              fontSize: '18px',
              transition: 'all 0.2s ease'
            }} />}
            onClick={() => navigate('/agent/dashboard')}
            style={{
              margin: '8px 0',
              color: 'white',
              borderRadius: '12px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '15px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
              border: getSelectedKey() === '1' ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
              backgroundColor: getSelectedKey() === '1' ? 'rgba(255,255,255,0.1)' : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (getSelectedKey() !== '1') {
                e.target.style.backgroundColor = 'rgba(255,255,255,0.05)';
                e.target.style.transform = 'translateX(4px)';
              }
            }}
            onMouseLeave={(e) => {
              if (getSelectedKey() !== '1') {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.transform = 'translateX(0)';
              }
            }}
          >
            Dashboard
          </Menu.Item>
          <Menu.Item
            key="2"
            icon={<ShoppingOutlined style={{ 
              color: 'white', 
              fontSize: '18px',
              transition: 'all 0.2s ease'
            }} />}
            onClick={() => navigate('/agent/orders')}
            style={{
              margin: '8px 0',
              color: 'white',
              borderRadius: '12px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              fontSize: '15px',
              fontWeight: 500,
              transition: 'all 0.2s ease',
              border: getSelectedKey() === '2' ? '1px solid rgba(255,255,255,0.3)' : '1px solid transparent',
              backgroundColor: getSelectedKey() === '2' ? 'rgba(255,255,255,0.1)' : 'transparent',
            }}
            onMouseEnter={(e) => {
              if (getSelectedKey() !== '2') {
                e.target.style.backgroundColor = 'rgba(255,255,255,0.05)';
                e.target.style.transform = 'translateX(4px)';
              }
            }}
            onMouseLeave={(e) => {
              if (getSelectedKey() !== '2') {
                e.target.style.backgroundColor = 'transparent';
                e.target.style.transform = 'translateX(0)';
              }
            }}
          >
            Orders
          </Menu.Item>
        </Menu>
      </Sider>

      {/* Enhanced Content Area */}
      <Layout>
        <Content
          style={{
            padding: '24px 32px',
            margin: 0,
            backgroundColor: '#ffffff',
            borderRadius: '12px 0 0 12px',
            boxShadow: '0 4px 24px rgba(0,0,0,0.06)',
            border: `1px solid ${RED_LIGHT}`,
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          {/* Subtle background pattern */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: `linear-gradient(90deg, ${RED_PRIMARY} 0%, ${RED_ACCENT} 50%, ${RED_PRIMARY} 100%)`,
          }} />
          
          {/* Content wrapper with enhanced styling */}
          <div style={{
            minHeight: 'calc(100vh - 120px)',
            background: 'linear-gradient(135deg, #ffffff 0%, #fefefe 100%)',
            borderRadius: '8px',
            padding: '8px',
            position: 'relative',
          }}>
            {children}
          </div>
        </Content>
      </Layout>
    </Layout>
  );
};

export default AgentHome;