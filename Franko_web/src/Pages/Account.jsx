import React, { useState, useEffect } from 'react';
import { User, Heart, Package, MapPin, CreditCard, Settings, Shield, Bell, Gift, Star, Edit2, Eye, EyeOff, Calendar, Mail, Phone, Home, Camera, LogOut, Download, Upload, Trash2, Plus, Check, X } from 'lucide-react';

const Account = () => {
    const [user, setUser] = useState(null);
    const [activeTab, setActiveTab] = useState('profile');
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(true);
    const [editForm, setEditForm] = useState({});
  
    useEffect(() => {
      const storedCustomer = localStorage.getItem('customer');
      if (storedCustomer) {
        try {
          const parsedCustomer = JSON.parse(storedCustomer);
          setUser(parsedCustomer);
          setEditForm(parsedCustomer);
        } catch (error) {
          console.error('Failed to parse customer from localStorage:', error);
        }
      }
      setLoading(false);
    }, []);



  const handleInputChange = (field, value) => {
    setEditForm(prev => ({...prev, [field]: value}));
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'text-green-600 bg-green-100';
      case 'processing': return 'text-yellow-600 bg-yellow-100';
      case 'delivered': return 'text-green-600 bg-green-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTierColor = (tier) => {
    switch (tier) {
      case 'gold': return 'text-yellow-600 bg-yellow-100';
      case 'silver': return 'text-gray-600 bg-gray-100';
      case 'platinum': return 'text-purple-600 bg-purple-100';
      default: return 'text-blue-600 bg-blue-100';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading User Information...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No user data found</p>
        </div>
      </div>
    );
  }

  const tabItems = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'orders', label: 'Orders', icon: Package },
    { key: 'wishlist', label: 'Wishlist', icon: Heart },
    
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-xl mb-8 overflow-hidden">
          <div className="bg-gradient-to-r from-green-200 to-red-100 px-8 py-12 text-white relative">
            <div className="flex flex-col md:flex-row items-center gap-6">
              <div className="relative">
                <img
                  src={user.imagePath}
                  alt="Profile"
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                />
                <button className="absolute bottom-0 right-0 bg-white text-blue-600 rounded-full p-2 shadow-lg hover:bg-gray-50 transition-colors">
                  <Camera className="h-4 w-4" />
                </button>
              </div>
              <div className="text-center md:text-left flex-1">
                <h1 className="text-3xl font-bold mb-2">
                  {user.firstName} {user.lastName}
                </h1>
                <p className="text-blue-100 mb-4">Account: {user.customerAccountNumber}</p>
                <div className="flex flex-wrap gap-4 justify-center md:justify-start">
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(user.accountType)}`}>
                    {user.accountType}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${getTierColor(user.membershipTier)}`}>
                    {user.membershipTier} Member
                  </span>
                </div>
              </div>
              <div className="flex gap-2">
               
                <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                  <LogOut className="h-4 w-4" />
                  Logout
                </button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 bg-gray-50">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-800">{user.totalOrders}</div>
              <div className="text-sm text-gray-600">Total Orders</div>
            </div>
            

          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-white rounded-2xl shadow-xl mb-8">
          <div className="flex overflow-x-auto">
            {tabItems.map((tab) => {
              const IconComponent = tab.icon;
              return (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-2 px-6 py-4 whitespace-nowrap transition-colors ${
                    activeTab === tab.key
                      ? 'border-b-2 border-blue-600 text-blue-600 bg-blue-50'
                      : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'profile' && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Personal Information</h2>
                  {isEditing && (
                    <div className="flex gap-2">
                     
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Last Name</label>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editForm.lastName}
                        onChange={(e) => handleInputChange('lastName', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2">
                        <User className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-800">{user.lastName}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                    {isEditing ? (
                      <input
                        type="email"
                        value={editForm.email}
                        onChange={(e) => handleInputChange('email', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-800">{user.email}</span>
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                    {isEditing ? (
                      <input
                        type="tel"
                        value={editForm.contactNumber}
                        onChange={(e) => handleInputChange('contactNumber', e.target.value)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2">
                        <Phone className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-800">{user.contactNumber}</span>
                      </div>
                    )}
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">Address</label>
                    {isEditing ? (
                      <textarea
                        value={editForm.address}
                        onChange={(e) => handleInputChange('address', e.target.value)}
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    ) : (
                      <div className="flex items-center gap-2 p-2">
                        <Home className="h-5 w-5 text-gray-400" />
                        <span className="text-gray-800">{user.address}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'orders' && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Recent Orders</h2>
                  <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                    <Package className="h-4 w-4" />
                    View All Orders
                  </button>
                </div>

                <div className="space-y-4">
                
                </div>
              </div>
            )}

            {activeTab === 'wishlist' && (
              <div className="bg-white rounded-2xl shadow-xl p-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">My Wishlist</h2>
                  <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
                    <Heart className="h-4 w-4" />
                    Clear All
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               
                </div>
              </div>
            )}


          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            

            {/* Account Info */}
          

            {/* Support */}
            <div className="bg-gradient-to-br from-green-500 to-indigo-100 rounded-2xl shadow-xl p-6 text-white">
              <h3 className="text-lg font-semibold mb-4">Need Help?</h3>
              <p className="text-blue-100 mb-4 text-sm">
                Our support team is here to help you with any questions or issues.
              </p>
              <button className="bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg w-full transition-colors">
                Contact Support
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;