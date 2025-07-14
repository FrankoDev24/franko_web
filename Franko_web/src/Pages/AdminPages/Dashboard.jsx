import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Card, Row, Col, Spin, Typography, Table, Avatar, Progress, DatePicker, Tag, Button, Statistic } from 'antd';
import { 
  LineChart,Line, XAxis, YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  BarChart,
  Bar, 
  PieChart, 
  Pie, 
  Cell,
  ComposedChart,
  Area} from 'recharts';
import { fetchOrdersByDate } from '../../Redux/Slice/orderSlice';
import { fetchAllProducts } from '../../Redux/Slice/productSlice';
import { fetchBrands } from '../../Redux/Slice/brandSlice';
import { fetchCustomers } from '../../Redux/Slice/customerSlice';
import moment from 'moment';
import { 
  ShoppingCartOutlined, 
  RiseOutlined,
DollarCircleOutlined,
  CrownOutlined,
  CalendarOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  ExclamationCircleOutlined,
  SyncOutlined,
  ReloadOutlined,
  FireOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SwapOutlined,
  UserOutlined,
  EyeOutlined
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
    'Shipped': '#8B5CF6',
    'Unknown': '#6B7280'
  };

  const CYCLE_ICONS = {
    'Completed': <CheckCircleOutlined style={{ color: '#10B981' }} />,
    'Pending': <ClockCircleOutlined style={{ color: '#F59E0B' }} />,
    'Processing': <SyncOutlined spin style={{ color: '#3B82F6' }} />,
    'Cancelled': <ExclamationCircleOutlined style={{ color: '#EF4444' }} />,
    'Delivered': <CheckCircleOutlined style={{ color: '#06B6D4' }} />,
    'Shipped': <RiseOutlined style={{ color: '#8B5CF6' }} />
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
        month: selectedMonth.format('MMMM YYYY'),
        orderCycles: getOrderCycleBreakdown(currentMonthOrders)
      },
      comparison: {
        ...comparisonMonthStats,
        month: selectedComparisonMonth.format('MMMM YYYY'),
        orderCycles: getOrderCycleBreakdown(comparisonMonthOrders)
      },
      growth: {
        orders: calculateGrowthPercentage(currentMonthStats.totalOrders, comparisonMonthStats.totalOrders),
        revenue: calculateGrowthPercentage(currentMonthStats.totalRevenue, comparisonMonthStats.totalRevenue),
        customers: calculateGrowthPercentage(currentMonthStats.uniqueCustomers, comparisonMonthStats.uniqueCustomers),
        avgOrderValue: calculateGrowthPercentage(currentMonthStats.avgOrderValue, comparisonMonthStats.avgOrderValue)
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
          id: customerId,
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

  const GrowthIndicator = ({ value, suffix = '%' }) => {
    const growth = parseFloat(value);
    const isPositive = growth >= 0;
    
    return (
      <div className={`flex items-center ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
        {isPositive ? <ArrowUpOutlined className="mr-1" /> : <ArrowDownOutlined className="mr-1" />}
        <span className="font-medium">{Math.abs(growth)}{suffix}</span>
      </div>
    );
  };

  const topCustomersColumns = [
    {
      title: 'Rank',
      dataIndex: 'rank',
      key: 'rank',
      width: 70,
      render: (rank) => (
        <div className="flex items-center justify-center">
          {rank <= 3 ? (
            <CrownOutlined 
              style={{ 
                color: rank === 1 ? '#FFD700' : rank === 2 ? '#C0C0C0' : '#CD7F32', 
                fontSize: '20px' 
              }} 
            />
          ) : (
            <span className="font-bold text-gray-500 text-lg">#{rank}</span>
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
          <Avatar 
            size={40}
            style={{ 
              backgroundColor: record.rank <= 3 ? '#FFD700' : '#3B82F6',
              fontSize: '16px',
              fontWeight: 'bold'
            }}
          >
            {record.avatar}
          </Avatar>
          <div>
            <div className="font-medium text-gray-900 text-base">{name}</div>
            <div className="text-sm text-gray-500 flex items-center">
              <UserOutlined className="mr-1" />
              {record.phone}
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Orders',
      dataIndex: 'totalOrders',
      key: 'totalOrders',
      align: 'center',
      render: (orders) => (
        <div className="text-center">
          <div className="font-bold text-xl text-blue-600">{orders}</div>
          <div className="text-xs text-gray-500">orders</div>
        </div>
      ),
    },
    {
      title: 'Total Spent',
      dataIndex: 'totalSpent',
      key: 'totalSpent',
      align: 'center',
      render: (spent) => (
        <div className="text-center">
          <div className="font-bold text-xl text-green-600">₵{spent.toFixed(2)}</div>
          <div className="text-xs text-gray-500">total</div>
        </div>
      ),
    },
    {
      title: 'Avg Order',
      dataIndex: 'avgOrderValue',
      key: 'avgOrderValue',
      align: 'center',
      render: (avg) => (
        <div className="text-center">
          <div className="font-bold text-lg text-purple-600">₵{avg.toFixed(2)}</div>
          <div className="text-xs text-gray-500">average</div>
        </div>
      ),
    },
    {
      title: 'Success Rate',
      dataIndex: 'completionRate',
      key: 'completionRate',
      align: 'center',
      render: (rate) => (
        <div className="text-center">
          <Progress 
            percent={parseFloat(rate)} 
            size="small" 
            strokeColor={parseFloat(rate) >= 80 ? '#10B981' : parseFloat(rate) >= 60 ? '#F59E0B' : '#EF4444'}
            className="mb-1"
          />
          <div className="text-xs text-gray-500">{rate}%</div>
        </div>
      ),
    },
    {
      title: 'Last Order',
      dataIndex: 'lastOrderFormatted',
      key: 'lastOrder',
      align: 'center',
      render: (date) => (
        <div className="text-center">
          <div className="text-sm text-gray-700">{date}</div>
        </div>
      ),
    },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-4 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-semibold text-gray-800">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} style={{ color: entry.color }} className="text-sm">
              {entry.name}: {entry.name === 'totalRevenue' ? `₵${entry.value.toFixed(2)}` : entry.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const refreshData = () => {
    const startDate = '2020-01-01';
    const endDate = moment().add(1, 'day').format('YYYY-MM-DD');
    dispatch(fetchOrdersByDate({ from: startDate, to: endDate }));
    setLastUpdated(moment());
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Spin size="large" />
        <div className="ml-3 text-lg text-gray-600">Loading analytics...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-500 text-lg p-8">
        <ExclamationCircleOutlined className="text-4xl mb-4" />
        <div>Error loading data. Please try again.</div>
      </div>
    );
  }

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      {/* Enhanced Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <Title level={2} className="text-gray-800 mb-2 flex items-center">
              <EyeOutlined className="mr-3 text-blue-600" />
              Real-Time Analytics Dashboard
            </Title>
            <Text className="text-gray-600 text-lg">
              Live business insights with comprehensive performance metrics
            </Text>
          </div>
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2 bg-gradient-to-r from-green-400 to-green-500 text-white px-4 py-2 rounded-lg shadow-md">
              <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
              <Text className="text-white text-sm font-medium">Live Data</Text>
            </div>
            <div className="text-right">
              <Text className="text-gray-500 text-sm block">Last updated</Text>
              <Text className="text-gray-700 font-medium">{lastUpdated.format('HH:mm:ss')}</Text>
            </div>
            <Button 
              icon={<ReloadOutlined />}
              onClick={refreshData}
              className="border-blue-500 text-blue-500 hover:bg-blue-50"
            >
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Enhanced Real-time Stats Cards */}
      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-white/80 text-sm mb-1">Today's Orders</div>
                <div className="text-3xl font-bold mb-2">{realTimeStats.today?.totalOrders || 0}</div>
                <div className="text-white/80 text-xs flex items-center">
                  <FireOutlined className="mr-1" />
                  {realTimeStats.lastHour || 0} in last hour
                </div>
              </div>
              <div className="text-right">
                <ShoppingCartOutlined className="text-4xl text-white/80 mb-2" />
                <div className="text-white/80 text-xs">₵{(realTimeStats.today?.totalRevenue || 0).toFixed(2)}</div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: 'white' }}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-white/80 text-sm mb-1">This Week</div>
                <div className="text-3xl font-bold mb-2">{realTimeStats.thisWeek?.totalOrders || 0}</div>
                <div className="text-white/80 text-xs">
                  ₵{(realTimeStats.thisWeek?.totalRevenue || 0).toFixed(2)} revenue
                </div>
              </div>
              <div className="text-right">
                <CalendarOutlined className="text-4xl text-white/80 mb-2" />
                <div className="text-white/80 text-xs">{realTimeStats.thisWeek?.uniqueCustomers || 0} customers</div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-white/80 text-sm mb-1">This Month</div>
                <div className="text-3xl font-bold mb-2">{realTimeStats.thisMonth?.totalOrders || 0}</div>
                <div className="text-white/80 text-xs">
                  {realTimeStats.thisMonth?.uniqueCustomers || 0} unique customers
                </div>
              </div>
              <div className="text-right">
                <RiseOutlined className="text-4xl text-white/80 mb-2" />
                <div className="text-white/80 text-xs">₵{(realTimeStats.thisMonth?.totalRevenue || 0).toFixed(2)}</div>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} sm={12} lg={6}>
          <Card className="shadow-lg border-0 hover:shadow-xl transition-shadow duration-300" style={{ background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', color: 'white' }}>
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="text-white/80 text-sm mb-1">Avg Order Value</div>
                <div className="text-3xl font-bold mb-2">₵{(realTimeStats.thisMonth?.avgOrderValue || 0).toFixed(2)}</div>
                <div className="text-white/80 text-xs">This month average</div>
              </div>
              <div className="text-right">
                <DollarCircleOutlined className="text-4xl text-white/80 mb-2" />
                <div className="text-white/80 text-xs">Monthly metric</div>
              </div>
            </div>
          </Card>
        </Col>
      </Row>

      {/* Enhanced Monthly Comparison */}
      <Row gutter={[24, 24]} className="mb-8">
        <Col span={24}>
          <Card className="shadow-lg border-0">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center">
                <SwapOutlined className="text-blue-500 mr-2 text-xl" />
                <Title level={4} className="mb-0">Monthly Comparison Analysis</Title>
              </div>
              <div className="flex space-x-4">
                <div>
                  <Text className="text-sm text-gray-600 block mb-1">Current Month</Text>
                  <MonthPicker
                    value={selectedMonth}
                    onChange={setSelectedMonth}
                    format="MMMM YYYY"
                    className="w-40"
                  />
                </div>
                <div>
                  <Text className="text-sm text-gray-600 block mb-1">Compare With</Text>
                  <MonthPicker
                    value={selectedComparisonMonth}
                    onChange={setSelectedComparisonMonth}
                    format="MMMM YYYY"
                    className="w-40"
                  />
                </div>
              </div>
            </div>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={6}>
                <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {monthlyComparison.current?.totalOrders || 0}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    Orders ({monthlyComparison.current?.month})
                  </div>
                  <GrowthIndicator value={monthlyComparison.growth?.orders} />
                  <div className="text-xs text-gray-500 mt-1">
                    vs {monthlyComparison.comparison?.totalOrders || 0} last period
                  </div>
                </div>
              </Col>
              <Col xs={24} md={6}>
                <div className="text-center p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-xl border border-green-200">
                  <div className="text-3xl font-bold text-green-600 mb-2">
                    ₵{(monthlyComparison.current?.totalRevenue || 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    Revenue ({monthlyComparison.current?.month})
                  </div>
                  <GrowthIndicator value={monthlyComparison.growth?.revenue} />
                  <div className="text-xs text-gray-500 mt-1">
                    vs ₵{(monthlyComparison.comparison?.totalRevenue || 0).toFixed(2)}
                  </div>
                </div>
              </Col>
              <Col xs={24} md={6}>
                <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl border border-purple-200">
                  <div className="text-3xl font-bold text-purple-600 mb-2">
                    {monthlyComparison.current?.uniqueCustomers || 0}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    Customers ({monthlyComparison.current?.month})
                  </div>
                  <GrowthIndicator value={monthlyComparison.growth?.customers} />
                  <div className="text-xs text-gray-500 mt-1">
                    vs {monthlyComparison.comparison?.uniqueCustomers || 0} last period
                  </div>
                </div>
              </Col>
              <Col xs={24} md={6}>
                <div className="text-center p-6 bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                  <div className="text-3xl font-bold text-orange-600 mb-2">
                    ₵{(monthlyComparison.current?.avgOrderValue || 0).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-600 mb-3">
                    Avg Order ({monthlyComparison.current?.month})
                  </div>
                  <GrowthIndicator value={monthlyComparison.growth?.avgOrderValue} />
                  <div className="text-xs text-gray-500 mt-1">
                    vs ₵{(monthlyComparison.comparison?.avgOrderValue || 0).toFixed(2)}
                  </div>
                </div>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>

      {/* Enhanced Weekly Analysis & Order Cycle Stats */}
      <Row gutter={[24, 24]} className="mb-8">
        <Col xs={24} lg={16}>
          <Card 
            title={
              <div className="flex items-center">
                <BarChart className="mr-2 text-blue-500" />
                <span>Weekly Analysis - {selectedMonth.format('MMMM YYYY')}</span>
              </div>
            }
            className="shadow-lg border-0"
          >
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={weeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
           
                <XAxis dataKey="week" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip content={<CustomTooltip />} />
                <Bar yAxisId="left" dataKey="totalOrders" fill="#3B82F6" name="Orders" />
                <Line yAxisId="right" type="monotone" dataKey="totalRevenue" stroke="#10B981" strokeWidth={3} name="Revenue" />
                <Line yAxisId="right" type="monotone" dataKey="avgOrderValue" stroke="#F59E0B" strokeWidth={2} name="Avg Order Value" />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <Card 
            title={
              <div className="flex items-center">
                <PieChart className="mr-2 text-green-500" />
                <span>Order Status Distribution</span>
              </div>
            }
            className="shadow-lg border-0"
          >
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={orderCycleStats}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name} (${percentage}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {orderCycleStats.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            
            <div className="mt-4 space-y-2">
              {orderCycleStats.map((stat, index) => (
                <div key={index} className="flex items-center justify-between p-12 rounded">
                  <div className="flex items-center">
                    {CYCLE_ICONS[stat.status]}
                    <span className="ml-2 text-sm font-medium">{stat.status}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-bold">{stat.count}</span>
                    <span className="text-xs text-gray-500">({stat.percentage}%)</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Enhanced Top Customers */}
      <Row gutter={[24, 24]} className="mb-8">
        <Col span={24}>
          <Card 
            title={
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <CrownOutlined className="mr-2 text-yellow-500" />
                  <span>Top Customers - {selectedMonth.format('MMMM YYYY')}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Tag color="gold" className="flex items-center">
                    <FireOutlined className="mr-1" />
                    VIP Status
                  </Tag>
                  <Text className="text-sm text-gray-500">
                    Showing top 10 customers by order volume
                  </Text>
                </div>
              </div>
            }
            className="shadow-lg border-0"
          >
            <Table
              columns={topCustomersColumns}
              dataSource={topCustomers}
              pagination={false}
              rowKey="id"
              className="custom-table"
              rowClassName={(record) => record.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-yellow-100' : ''}
            />
          </Card>
        </Col>
      </Row>

      {/* Enhanced Monthly Trends */}
      <Row gutter={[24, 24]} className="mb-8">
        <Col span={24}>
          <Card 
            title={
              <div className="flex items-center">
                <LineChart className="mr-2 text-purple-500" />
                <span>Order Trends</span>
              </div>
            }
            className="shadow-lg border-0"
          >
            <ResponsiveContainer width="100%" height={400}>
              <ComposedChart data={weeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="weekRange" />
                <YAxis yAxisId="left" />
                <YAxis yAxisId="right" orientation="right" />
                <Tooltip content={<CustomTooltip />} />
                <Area yAxisId="left" type="monotone" dataKey="totalOrders" stackId="1" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                <Line yAxisId="right" type="monotone" dataKey="totalRevenue" stroke="#82ca9d" strokeWidth={3} />
                <Line yAxisId="right" type="monotone" dataKey="avgOrderValue" stroke="#ffc658" strokeWidth={2} />
              </ComposedChart>
            </ResponsiveContainer>
          </Card>
        </Col>
      </Row>

    

   
    </div>
  );
};

export default Dashboard;