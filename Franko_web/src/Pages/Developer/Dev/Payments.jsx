import React, { useEffect, useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Download,
  RefreshCw,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Calendar,
  Eye,
  SortAsc,
  SortDesc,
  AlertCircle,
  CheckCircle,
  Clock,
  Phone,
  CreditCard,
  Smartphone,
  DollarSign,
  Hash,
  User,
  Info
} from 'lucide-react';
import { getAllHubtelCallbackRecords } from "../../../Redux/Slice/paymentSlice";
import dayjs from 'dayjs';
import * as XLSX from 'xlsx';

const statusConfig = {
  Success: { color: 'bg-green-100 text-green-800', icon: CheckCircle },
  Failed: { color: 'bg-red-100 text-red-800', icon: AlertCircle },
  Pending: { color: 'bg-yellow-100 text-yellow-800', icon: Clock },
};

const paymentTypeConfig = {
  mobilemoney: { color: 'bg-orange-100 text-orange-800', icon: Smartphone },
  creditcard: { color: 'bg-blue-100 text-blue-800', icon: CreditCard },
  mastercard: { color: 'bg-purple-100 text-purple-800', icon: CreditCard },
  string: { color: 'bg-gray-100 text-gray-800', icon: CreditCard },
};

const Payments = () => {
  const dispatch = useDispatch();
  const { callbackData, loading, error } = useSelector((state) => state.payment);

  // State management
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDetails, setSelectedDetails] = useState(null);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentTypeFilter, setPaymentTypeFilter] = useState('all');
  const [amountRange, setAmountRange] = useState({ min: '', max: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'date', direction: 'desc' });
  const [showFilters, setShowFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(10);

  useEffect(() => {
    dispatch(getAllHubtelCallbackRecords());
  }, [dispatch]);

  // Generate data with fake dates
  const generatedData = useMemo(() => {
    if (!Array.isArray(callbackData)) return [];
    
    return callbackData.map((item, index) => {
      const fakeDate = dayjs().subtract(index, 'day');
      return {
        key: index,
        date: fakeDate,
        dateStr: fakeDate.format('YYYY-MM-DD'),
        responseCode: item.responseCode,
        checkoutId: item.checkoutId,
        salesInvoiceId: item.salesInvoiceId,
        clientReference: item.clientReference,
        transactionStatus: item.status,
        amount: parseFloat(item.amount) || 0,
        customerPhoneNumber: item.customerPhoneNumber,
        paymentType: item.paymentType,
        mobileMoneyNumber: item.mobileMoneyNumber,
        channel: item.channel,
        rawPaymentDetails: {
          description: item.description,
          ...item,
        },
      };
    });
  }, [callbackData]);

  // Enhanced filtering logic
  const filteredData = useMemo(() => {
    return generatedData.filter((record) => {
      const query = searchQuery.toLowerCase();
      const matchesQuery =
        !query ||
        record.clientReference?.toLowerCase().includes(query) ||
        record.customerPhoneNumber?.includes(query) ||
        record.transactionStatus?.toLowerCase().includes(query) ||
        record.paymentType?.toLowerCase().includes(query) ||
        record.checkoutId?.toLowerCase().includes(query) ||
        record.salesInvoiceId?.toLowerCase().includes(query);

      const matchesDateRange =
        (!dateRange.start || record.date.isAfter(dayjs(dateRange.start).subtract(1, 'day'))) &&
        (!dateRange.end || record.date.isBefore(dayjs(dateRange.end).add(1, 'day')));

      const matchesStatus = statusFilter === 'all' || record.transactionStatus === statusFilter;
      
      const matchesPaymentType = paymentTypeFilter === 'all' || 
        record.paymentType?.toLowerCase() === paymentTypeFilter;

      const matchesAmountRange =
        (!amountRange.min || record.amount >= parseFloat(amountRange.min)) &&
        (!amountRange.max || record.amount <= parseFloat(amountRange.max));

      return matchesQuery && matchesDateRange && matchesStatus && matchesPaymentType && matchesAmountRange;
    });
  }, [generatedData, searchQuery, dateRange, statusFilter, paymentTypeFilter, amountRange]);

  // Sorting logic
  const sortedData = useMemo(() => {
    const sorted = [...filteredData].sort((a, b) => {
      const { key, direction } = sortConfig;
      let aValue = a[key];
      let bValue = b[key];

      if (key === 'date') {
        aValue = a.date.unix();
        bValue = b.date.unix();
      } else if (key === 'amount') {
        aValue = parseFloat(aValue) || 0;
        bValue = parseFloat(bValue) || 0;
      } else if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (direction === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return sorted;
  }, [filteredData, sortConfig]);

  // Pagination
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return sortedData.slice(startIndex, startIndex + pageSize);
  }, [sortedData, currentPage, pageSize]);

  const totalPages = Math.ceil(sortedData.length / pageSize);

  // Handlers
  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleExportToExcel = () => {
    const rowsToExport = sortedData.map(({ rawPaymentDetails, date, ...rest }) => ({
      ...rest,
      date: date.format('YYYY-MM-DD'),
      rawPaymentDetails: JSON.stringify(rawPaymentDetails),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rowsToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Hubtel Records');
    XLSX.writeFile(workbook, 'hubtel_callbacks.xlsx');
  };

  const clearFilters = () => {
    setSearchQuery('');
    setDateRange({ start: '', end: '' });
    setStatusFilter('all');
    setPaymentTypeFilter('all');
    setAmountRange({ min: '', max: '' });
    setCurrentPage(1);
  };

  const getUniqueValues = (key) => {
    const values = generatedData.map(item => item[key]).filter(Boolean);
    return [...new Set(values)];
  };

  const StatusTag = ({ status }) => {
    const config = statusConfig[status] || statusConfig.Failed;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {status}
      </span>
    );
  };

  const PaymentTypeTag = ({ type }) => {
    const config = paymentTypeConfig[type?.toLowerCase()] || paymentTypeConfig.string;
    const Icon = config.icon;
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${config.color}`}>
        <Icon className="w-3 h-3 mr-1" />
        {type}
      </span>
    );
  };

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <SortAsc className="w-4 h-4 opacity-0 group-hover:opacity-50" />;
    return sortConfig.direction === 'asc' ? 
      <SortAsc className="w-4 h-4 text-blue-500" /> : 
      <SortDesc className="w-4 h-4 text-blue-500" />;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading payment records...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 m-4">
        <div className="flex items-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <span className="text-red-800 font-medium">Error loading payment records</span>
        </div>
        <p className="text-red-700 mt-2">{error}</p>
      </div>
    );
  }

  return (
    <div className="p-2 min-h-screen">
      {/* Header */}
      <div className=" p-2 mb-2">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <h1 className="text-2xl font-bold text-gray-900">Payment Records Dashboard</h1>
          
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
              {showFilters ? <ChevronUp className="w-4 h-4 ml-2" /> : <ChevronDown className="w-4 h-4 ml-2" />}
            </button>
            
            <button
              onClick={() => dispatch(getAllHubtelCallbackRecords())}
              className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            
            <button
              onClick={handleExportToExcel}
              className="flex items-center px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="w-4 h-4 mr-2" />
              Export to Excel
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-blue-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Records</p>
                <p className="text-2xl font-bold text-blue-900">{sortedData.length}</p>
              </div>
              <Hash className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          
          <div className="bg-green-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Successful</p>
                <p className="text-2xl font-bold text-green-900">
                  {sortedData.filter(r => r.transactionStatus === 'Success').length}
                </p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          
          <div className="bg-red-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Failed</p>
                <p className="text-2xl font-bold text-red-900">
                  {sortedData.filter(r => r.transactionStatus === 'Failed').length}
                </p>
              </div>
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total Amount</p>
                <p className="text-2xl font-bold text-purple-900">
                  GHS {sortedData.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Filters</h2>
            <button
              onClick={clearFilters}
              className="flex items-center px-3 py-1 text-sm text-gray-600 hover:text-gray-800 transition-colors"
            >
              <X className="w-4 h-4 mr-1" />
              Clear All
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search records..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Date Range */}
            <div className="flex gap-2">
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Statuses</option>
              {getUniqueValues('transactionStatus').map(status => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>

            {/* Payment Type Filter */}
            <select
              value={paymentTypeFilter}
              onChange={(e) => setPaymentTypeFilter(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Payment Types</option>
              {getUniqueValues('paymentType').map(type => (
                <option key={type} value={type.toLowerCase()}>{type}</option>
              ))}
            </select>

            {/* Amount Range */}
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min amount"
                value={amountRange.min}
                onChange={(e) => setAmountRange(prev => ({ ...prev, min: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <input
                type="number"
                placeholder="Max amount"
                value={amountRange.max}
                onChange={(e) => setAmountRange(prev => ({ ...prev, max: e.target.value }))}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('dateStr')}
                    className="flex items-center group hover:text-gray-700"
                  >
                    <Calendar className="w-4 h-4 mr-1" />
                    Date
                    <SortIcon column="dateStr" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('clientReference')}
                    className="flex items-center group hover:text-gray-700"
                  >
                    <User className="w-4 h-4 mr-1" />
                    Client Ref
                    <SortIcon column="clientReference" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Hash className="w-4 h-4 mr-1" />
                    Checkout ID
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('transactionStatus')}
                    className="flex items-center group hover:text-gray-700"
                  >
                    <CheckCircle className="w-4 h-4 mr-1" />
                    Status
                    <SortIcon column="transactionStatus" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <button
                    onClick={() => handleSort('amount')}
                    className="flex items-center group hover:text-gray-700"
                  >
                    <DollarSign className="w-4 h-4 mr-1" />
                    Amount (GHS)
                    <SortIcon column="amount" />
                  </button>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Phone className="w-4 h-4 mr-1" />
                    Phone
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <CreditCard className="w-4 h-4 mr-1" />
                    Payment Type
                  </div>
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    <Info className="w-4 h-4 mr-1" />
                    Details
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedData.map((record) => (
                <tr key={record.key} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.dateStr}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.clientReference}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.checkoutId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <StatusTag status={record.transactionStatus} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.amount.toFixed(2)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {record.customerPhoneNumber}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <PaymentTypeTag type={record.paymentType} />
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => setSelectedDetails(record.rawPaymentDetails)}
                      className="flex items-center px-3 py-1 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-6 py-3 flex items-center justify-between border-t border-gray-200">
            <div className="flex-1 flex justify-between items-center">
              <p className="text-sm text-gray-700">
                Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, sortedData.length)} of {sortedData.length} results
              </p>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`px-3 py-1 text-sm rounded ${
                      page === currentPage
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">Raw Payment Details</h2>
              <button
                onClick={() => setSelectedDetails(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-6 overflow-auto max-h-[70vh]">
              <pre className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg overflow-x-auto">
                {JSON.stringify(selectedDetails, null, 2)}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;