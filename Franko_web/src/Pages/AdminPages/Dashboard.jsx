import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Row, Col, Spin, Typography, Table, Avatar, Progress, Select, DatePicker, Tag } from 'antd';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 

  Bar, 
  PieChart, 
  Pie, 
  Cell,

  ComposedChart
} from 'recharts';
import { fetchOrdersByDate } from '../../Redux/Slice/orderSlice';
import { fetchAllProducts } from '../../Redux/Slice/productSlice';
import { fetchBrands } from '../../Redux/Slice/brandSlice';
import { fetchCustomers } from '../../Redux/Slice/customerSlice';
import moment from 'moment';
import { 
  ShoppingCartOutlined, 
  RiseOutlined ,
  DollarCircleOutlined,
  CrownOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  ReloadOutlined,
  FireOutlined
} from '@ant-design/icons';

const { Title, Text } = Typography;

const { MonthPicker } = DatePicker;

const Dashboard = () => {
  const dispatch = useDispatch();
  const { products } = useSelector((state) => state.products);
  const { brands } = useSelector((state) => state.brands);
  const { orders = [] } = useSelector((state) => state.orders);
  const { customerList } = useSelector((state) => state.customer);

  const loading = !(products && brands && orders && customerList);
  const error = !loading && (!products || !brands || !orders || !customerList);

  const [selectedMonth, setSelectedMonth] = useState(moment());
  const [selectedComparisonMonth, setSelectedComparisonMonth] = useState(moment().subtract(1, 'month'));
  const [monthlyComparison, setMonthlyComparison] = useState({});
  const [weeklyData, setWeeklyData] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [orderCycleStats, setOrderCycleStats] = useState([]);
  const [realTimeStats, setRealTimeStats] = useState({});
  const [lastUpdated, setLastUpdated] = useState(moment());

  const COLORS = {
    'Completed': '#10B981',
    'Pending': '#F59E0B', 
    'Processing': '#3B82F6',
    'Cancelled': '#EF4444',
    'Delivered': '#06B6D4',
    'Shipped': '#8B5CF6'
  };

  const CYCLE_ICONS = {
    'Completed': <CheckCircleOutlined />,
    'Pending': <ClockCircleOutlined />,
    'Processing': <SyncOutlined spin />,
    'Cancelled': <ExclamationCircleOutlined />,
    'Delivered': <CheckCircleOutlined />,
    'Shipped': <RiseOutlined  />
  };

  // Auto-refresh every 30 seconds for real-time data
  useEffect(() => {
    const interval = setInterval(() => {
      const startDate = '2020-01-01';
      const endDate = moment().add(1, 'day').format('YYYY-MM-DD');
      dispatch(fetchOrdersByDate({ from: startDate, to: endDate }));
      setLastUpdated(moment());
    }, 30000);

    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    const startDate = '2020-01-01';
    const endDate = moment().add(1, 'day').format('YYYY-MM-DD');
    dispatch(fetchOrdersByDate({ from: startDate, to: endDate }));
    dispatch(fetchAllProducts());
    dispatch(fetchBrands());
    dispatch(fetchCustomers());
    setLastUpdated(moment());
  }, [dispatch]);

  useEffect(() => {
    if (orders && orders.length > 0) {
      calculateMonthlyComparison();
      calculateWeeklyData();
      calculateTopCustomers();
      calculateOrderCycleStats();
      calculateRealTimeStats();
    }
  }, [orders, selectedMonth, selectedComparisonMonth]);

  const calculateMonthlyComparison = () => {
    const currentMonthOrders = orders.filter(order =>
      moment(order.orderDate).isSame(selectedMonth, 'month')
    );
    
    const comparisonMonthOrders = orders.filter(order =>
      moment(order.orderDate).isSame(selectedComparisonMonth, 'month')
    );

    const currentMonthStats = analyzeOrders(currentMonthOrders);
    const comparisonMonthStats = analyzeOrders(comparisonMonthOrders);

    setMonthlyComparison({
      current: {
        ...currentMonthStats,
        month: selectedMonth.format('MMMM YYYY')
      },
      comparison: {
        ...comparisonMonthStats,
        month: selectedComparisonMonth.format('MMMM YYYY')
      },
      growth: {
        orders: calculateGrowthPercentage(currentMonthStats.totalOrders, comparisonMonthStats.totalOrders),
        revenue: calculateGrowthPercentage(currentMonthStats.totalRevenue, comparisonMonthStats.totalRevenue),
        customers: calculateGrowthPercentage(currentMonthStats.uniqueCustomers, comparisonMonthStats.uniqueCustomers)
      }
    });
  };

  const calculateWeeklyData = () => {
    const startOfMonth = selectedMonth.clone().startOf('month');
    const endOfMonth = selectedMonth.clone().endOf('month');
    const weeks = [];
    
    let currentWeek = startOfMonth.clone().startOf('week');
    let weekNumber = 1;

    while (currentWeek.isSameOrBefore(endOfMonth, 'day')) {
      const weekEnd = currentWeek.clone().endOf('week');
      const weekOrders = orders.filter(order => {
        const orderDate = moment(order.orderDate);
        return orderDate.isBetween(currentWeek, weekEnd, null, '[]') && 
               orderDate.isSame(selectedMonth, 'month');
      });

      const weekStats = analyzeOrders(weekOrders);
      
      weeks.push({
        week: `Week ${weekNumber}`,
        weekRange: `${currentWeek.format('MMM DD')} - ${weekEnd.format('MMM DD')}`,
        ...weekStats,
        orderCycleBreakdown: getOrderCycleBreakdown(weekOrders)
      });

      currentWeek.add(1, 'week');
      weekNumber++;
    }

    setWeeklyData(weeks);
  };

  const calculateTopCustomers = () => {
    const monthOrders = orders.filter(order =>
      moment(order.orderDate).isSame(selectedMonth, 'month')
    );

    const customerStats = {};
    
    monthOrders.forEach(order => {
      const customerId = order.customerId;
      const customerName = order.fullName || 'Unknown Customer';
      
      if (!customerStats[customerId]) {
        customerStats[customerId] = {
          name: customerName,
          phone: order.contactNumber || 'N/A',
          totalOrders: 0,
          totalSpent: 0,
          lastOrder: null,
          orderCycles: {},
          avgOrderValue: 0
        };
      }
      
      customerStats[customerId].totalOrders += 1;
      customerStats[customerId].totalSpent += order.total || 0;
      
      const orderDate = moment(order.orderDate);
      if (!customerStats[customerId].lastOrder || orderDate.isAfter(customerStats[customerId].lastOrder)) {
        customerStats[customerId].lastOrder = orderDate;
      }

      const cycle = order.orderCycle || 'Unknown';
      customerStats[customerId].orderCycles[cycle] = (customerStats[customerId].orderCycles[cycle] || 0) + 1;
    });

    const topCustomersList = Object.values(customerStats)
      .map(customer => ({
        ...customer,
        avgOrderValue: customer.totalOrders > 0 ? customer.totalSpent / customer.totalOrders : 0,
        lastOrderFormatted: customer.lastOrder ? customer.lastOrder.format('MMM DD, YYYY') : 'N/A',
        avatar: customer.name.charAt(0).toUpperCase(),
        completionRate: ((customer.orderCycles['Completed'] || 0) / customer.totalOrders * 100).toFixed(1)
      }))
      .sort((a, b) => b.totalOrders - a.totalOrders)
      .slice(0, 10)
      .map((customer, index) => ({ ...customer, rank: index + 1 }));

    setTopCustomers(topCustomersList);
  };

  const calculateOrderCycleStats = () => {
    const monthOrders = orders.filter(order =>
      moment(order.orderDate).isSame(selectedMonth, 'month')
    );

    const cycleStats = getOrderCycleBreakdown(monthOrders);
    const totalOrders = monthOrders.length;

    const statsWithPercentage = cycleStats.map(stat => ({
      ...stat,
      percentage: totalOrders > 0 ? ((stat.count / totalOrders) * 100).toFixed(1) : 0,
      color: COLORS[stat.status] || '#6B7280'
    }));

    setOrderCycleStats(statsWithPercentage);
  };

  const calculateRealTimeStats = () => {
    const today = moment();
    const todayOrders = orders.filter(order =>
      moment(order.orderDate).isSame(today, 'day')
    );

    const thisWeek = orders.filter(order =>
      moment(order.orderDate).isSame(today, 'week')
    );

    const thisMonth = orders.filter(order =>
      moment(order.orderDate).isSame(today, 'month')
    );

    setRealTimeStats({
      today: analyzeOrders(todayOrders),
      thisWeek: analyzeOrders(thisWeek),
      thisMonth: analyzeOrders(thisMonth),
      lastHour: orders.filter(order =>
        moment(order.orderDate).isAfter(moment().subtract(1, 'hour'))).length
    });
  };

  const analyzeOrders = (orderList) => {
    const totalOrders = orderList.length;
    const totalRevenue = orderList.reduce((sum, order) => sum + (order.total || 0), 0);
    const uniqueCustomers = new Set(orderList.map(order => order.customerId)).size;
    const avgOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;
    
    return {
      totalOrders,
      totalRevenue,
      uniqueCustomers,
      avgOrderValue
    };
  };

  const getOrderCycleBreakdown = (orderList) => {
    const breakdown = {};
    orderList.forEach(order => {
      const status = order.orderCycle || 'Unknown';
      breakdown[status] = (breakdown[status] || 0) + 1;
    });

    return Object.entries(breakdown).map(([status, count]) => ({
      status,
      count,
      name: status
    }));
  };

  const calculateGrowthPercentage = (current, previous) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return (((current - previous) / previous) * 100).toFixed(1);
  };

  const topCustomersColumns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 60,
      render: (rank) => (
        <div className="flex items-center justify-center">
          {rank <= 3 ? (
            <CrownOutlined 
              style={{ 
                color: rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32', 
                fontSize: '18px' 
              }} 
            />
          ) : (
            <span className="font-bold text-gray-500">#{rank}</span>
          )}
        </div>
      ),
    },
    {
      title: 'Customer',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <div className="flex items-center space-x-3">
          <Avatar style={{ backgroundColor: '#3B82F6' }}>
            {record.avatar}
          </Avatar>
          <div>
            <div className="font-medium text-gray-900">{name}</div>
            <div className="text-sm text-gray-500">{record.phone}</div>
          </div>
        </div>
      ),
    },
    {
      title: 'Orders',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      render: (orders) => (
        <div className="text-center">
          <div className="font-bold text-lg text-blue-600">{orders}</div>
          <div className="text-xs text-gray-500">orders</div>
        </div>
      ),
    },
    {
      title: 'Total Spent',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      render: (spent) => (
        <div className="text-center">
          <div className="font-bold text-lg text-green-600">₵{spent.toFixed(2)}</div>
          <div className="text-xs text-gray-500">total</div>
        </div>
      ),
    },
    {
      title: 'Completion Rate',
      dataIndex: 'completionRate',
      key: 'completionRate',
      render: (rate) => (
        <div className="text-center">
          <Progress 
            percent={parseFloat(rate)} 
            size="small" 
            strokeColor={parseFloat(rate) >= 80 ? '#10B981' : parseFloat(rate) >= 60 ? '#F59E0B' : '#EF4444'}
          />
          <div className="text-xs text-gray-500 mt-1">{rate}%</div>
        </div>
      ),
    },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return <div className="text-center text-red-500 text-lg">Error loading data</div>;
  }

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header with Real-time Indicator */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <Title level={2} className="text-gray-800 mb-2">
              📊 Real-Time Analytics Dashboard
            </Title>
            <Text className="text-gray-600 text-lg">
              Live business insights and performance metrics
            </Text>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-green-100 px-3 py-2 rounded-lg">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <Text className="text-green-700 text-sm font-medium">Live Data</Text>
            </div>
            <Text className="text-gray-500 text-sm">
              Last updated: {lastUpdated.format('HH:mm:ss')}
            </Text>
            <ReloadOutlined 
              className="text-blue-500 cursor-pointer hover:text-blue-700"
              onClick={() => window.location.reload()}
            />
          </div>
        </div>
      </div>

      {/* Real-time Stats Cards */}
      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-lg border-0" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/80 text-sm mb-1">Today's Orders</div>
                <div className="text-3xl font-bold">{realTimeStats.today?.totalOrders || 0}</div>
                <div className="text-white/80 text-xs mt-1">
                  <FireOutlined className="mr-1" />
                  {realTimeStats.lastHour || 0} in last hour
                </div>
              </div>
              <ShoppingCartOutlined className="text-4xl text-white/80" />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-lg border-0" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/80 text-sm mb-1">This Week</div>
                <div className="text-3xl font-bold">{realTimeStats.thisWeek?.totalOrders || 0}</div>
                <div className="text-white/80 text-xs mt-1">
                  ₵{(realTimeStats.thisWeek?.totalRevenue || 0).toFixed(2)} revenue
                </div>
              </div>
              <CalendarOutlined className="text-4xl text-white/80" />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-lg border-0" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/80 text-sm mb-1">This Month</div>
                <div className="text-3xl font-bold">{realTimeStats.thisMonth?.totalOrders || 0}</div>
                <div className="text-white/80 text-xs mt-1">
                  {realTimeStats.thisMonth?.uniqueCustomers || 0} unique customers
                </div>
              </div>
              <RiseOutlined  className="text-4xl text-white/80" />
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-lg border-0" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-white/80 text-sm mb-1">Avg Order Value</div>
                <div className="text-3xl font-bold">₵{(realTimeStats.thisMonth?.avgOrderValue || 0).toFixed(2)}</div>
                <div className="text-white/80 text-xs mt-1">This month average</div>
              </div>
              <DollarCircleOutlined className="text-4xl text-white/80" />
            </div>
          </Card>
        </Col>
      </Row>

      {/* Month Selection and Comparison */}
      <Row gutter={[24, 24]} className="mb-8">
        <Col span={24}>
          <Card className="shadow-lg border-0">
            <div className="flex justify-between items-center mb-6">
              <Title level={4} className="mb-0">Monthly Comparison Analysis</Title>
              <div className="flex space-x-4">
                <div>
                  <Text className="text-sm text-gray-600 block mb-1">Current Month</Text>
                  <MonthPicker
                    value={selectedMonth}
                    onChange={setSelectedMonth}
                    format="MMMM YYYY"
                  />
                </div>
                <div>
                  <Text className="text-sm text-gray-600 block mb-1">Compare With</Text>
                  <MonthPicker
                    value={selectedComparisonMonth}
                    onChange={setSelectedComparisonMonth}
                    format="MMMM YYYY"
                  />
                </div>
              </div>
            </div>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {monthlyComparison.current?.totalOrders || 0}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Orders ({monthlyComparison.current?.month})</div>
                  <div className={`text-sm font-medium ${
                    parseFloat(monthlyComparison.growth?.orders) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {parseFloat(monthlyComparison.growth?.orders) >= 0 ? '↗' : '↘'} {Math.abs(monthlyComparison.growth?.orders || 0)}%
                  </div>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    ₵{(monthlyComparison.current?.totalRevenue || 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Revenue ({monthlyComparison.current?.month})</div>
                  <div className={`text-sm font-medium ${
                    parseFloat(monthlyComparison.growth?.revenue) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {parseFloat(monthlyComparison.growth?.revenue) >= 0 ? '↗' : '↘'} {Math.abs(monthlyComparison.growth?.revenue || 0)}%
                  </div>
                </div>
              </Col>
              <Col xs={24} md={8}>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 mb-2">
                    {monthlyComparison.current?.uniqueCustomers || 0}
                  </div>
                  <div className="text-sm text-gray-600 mb-2">Customers ({monthlyComparison.current?.month})</div>
                  <div className={`text-sm font-medium ${
                    parseFloat(monthlyComparison.growth?.customers) >= 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {parseFloat(monthlyComparison.growth?.customers) >= 0 ? '↗' : '↘'} {Math.abs(monthlyComparison.growth?.customers || 0)}%
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Weekly Analysis & Order Cycle Stats */}
      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} lg={16}>
          <Card title={`Weekly Analysis - ${selectedMonth.format('MMMM YYYY')}`} className="shadow-lg border-0">
            <ResponsiveContainer width="100%" height={350}>
              <ComposedChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="week" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                  }}
                />
                <Bar dataKey="totalOrders" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Line type="monotone" dataKey="totalRevenue" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card title="Order Cycle Distribution" className="shadow-lg border-0">
            <div className="space-y-4">
              {orderCycleStats.map((stat, index) => (
                <div key={stat.status} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="w-4 h-4 rounded-full"
                      style={{ backgroundColor: stat.color }}
                    />
                    <div className="flex items-center space-x-2">
                      {CYCLE_ICONS[stat.status]}
                      <span className="font-medium">{stat.status}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-lg">{stat.count}</div>
                    <div className="text-sm text-gray-500">{stat.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-6">
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={orderCycleStats}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="count"
                  >
                    {orderCycleStats.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Top Customers */}
      <Row gutter={[24, 24]}>
        <Col span={24}>
          <Card 
            title={
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CrownOutlined className="mr-2 text-yellow-500" />
                  <span className="text-lg font-semibold">Top Customers - {selectedMonth.format('MMMM YYYY')}</span>
                  <Tag color="gold" className="ml-2">VIP List</Tag>
                </div>
                <Text className="text-sm text-gray-500">
                  Based on order frequency and completion rate
                </Text>
              </div>
            }
            className="shadow-lg border-0"
          >
            <Table
              dataSource={topCustomers}
              columns={topCustomersColumns}
              pagination={false}
              rowKey="name"
              className="modern-table"
              rowClassName="hover:bg-gray-50"
            />
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default Dashboard;