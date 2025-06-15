import  { useEffect, useState } from "react";
import { Card, Button, Typography, message, Modal, Spin, Badge, Divider } from "antd";
import { 
  LogOut, 
  Trash2, 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  BadgeInfo, 
  Package, 
  Heart,
  Gift,
  Star,
  Camera
} from "lucide-react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { updateAccountStatus } from "../Redux/Slice/customerSlice";


const { Title, Text } = Typography;

const Account = () => {
  const [customer, setCustomer] = useState(null);
  const [activeTab, setActiveTab] = useState('profile');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [wishlist, setWishlist] = useState([]);

  useEffect(() => {
    const storedCustomer = localStorage.getItem("customer");
    if (storedCustomer) {
      setCustomer(JSON.parse(storedCustomer));
    }
  }, []);
  useEffect(() => {
  const storedWishlist = JSON.parse(localStorage.getItem("wishlist")) || [];
  setWishlist(storedWishlist);
}, []);


  const handleLogout = () => {
    localStorage.removeItem("customer");
    message.success("Logged out successfully.");
    navigate("/");
  };

  const handleDeleteAccount = () => {
    Modal.confirm({
      title: "Confirm Account Deletion",
      content: (
        <div className="py-4">
          <p className="text-gray-600 mb-2">Are you sure you want to delete your account?</p>
          <p className="text-red-500 text-sm font-medium">⚠️ This action cannot be undone and will:</p>
          <ul className="text-sm text-gray-500 mt-2 ml-4">
            <li>• Remove all your personal data</li>
            <li>• Cancel active orders</li>
            <li>• Delete your purchase history</li>
          </ul>
        </div>
      ),
      okText: "Yes, Delete My Account",
      okType: "danger",
      cancelText: "Keep My Account",
      width: 480,
      onOk: async () => {
        try {
          await dispatch(updateAccountStatus()).unwrap();
          message.success("Account deleted successfully.");
          navigate("/");
        } catch (error) {
          message.error(error || "Failed to delete account.");
        }
      },
    });
  };

  if (!customer) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
        <div className="text-center">
 
          <Text className="text-gray-500">Loading your profile...</Text>
        </div>
      </div>
    );
  }

  const {
    firstName,
    lastName,
    email,
    contactNumber,
    address,
    customerAccountNumber,
    isGuest,
  } = customer;

  const tabs = [
    { key: 'profile', label: 'Profile', icon: <User className="w-4 h-4" /> },
   
    { key: 'wishlist', label: 'Wishlist', icon: <Heart className="w-4 h-4" /> },
   
  ];

  const quickStats = [
    { label: 'Total Orders', value: '12', icon: <Package className="w-5 h-5" />, color: 'bg-green-500' },
   { label: 'wishlist', value: ` ${wishlist.length}`, icon: <Heart className="w-4 h-4" /> , color: 'bg-red-500'},

    { label: 'Reward Points', value: '2,450', icon: <Gift className="w-5 h-5" />, color: 'bg-green-500' },
    { label: 'Verified Member', value: '2025', icon: <Star className="w-5 h-5" />, color: 'bg-red-500' }
  ];
  
  const backendBaseURL = "https://smfteapi.salesmate.app";


  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-green-50 to-indigo-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="mb-8">
          <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
            <div className="flex flex-col md:flex-row items-center gap-6 ">
              {/* Avatar */}
              <div className="relative">
                <div className="w-16 h-16 md:w-24 md:h-24 rounded-full bg-red-400 flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                  {firstName?.charAt(0)}{lastName?.charAt(0)}
                </div>
                <button className="absolute -bottom-1 -right-1 w-8 h-8 bg-white rounded-full shadow-lg border-2 border-gray-100 flex items-center justify-center hover:bg-gray-50 transition-colors">
                  <Camera className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              {/* User Info */}
              <div className="flex-1 text-center md:text-left">
                <div className="md:flexitems-center gap-3 justify-center md:justify-start mb-2">
                  <div  className=" text-xl md:text-2xl !mb-0 text-gray-800">
                    {firstName} {lastName}
                  </div>
                  <Badge 
                    className="px-2 py-1"
                    color={isGuest ? "orange" : "green"}
                    text={isGuest ? "Guest Account" : "Verified Member"}
                  />
                </div>
                <div className="flex items-center gap-2 text-gray-600 justify-center md:justify-start mb-4">
              
                  <Text>Account #{customerAccountNumber}</Text>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {quickStats.map((stat, index) => (
                    <div key={index} className="text-center p-3 bg-gray-50 rounded-lg">
                      <div className={`w-8 h-8 ${stat.color} rounded-full flex items-center justify-center text-white mx-auto mb-2`}>
                        {stat.icon}
                      </div>
                      <div className="text-lg font-semibold text-gray-800">{stat.value}</div>
                      <div className="text-xs text-gray-500">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

             
            </div>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="mb-6">
          <div className="flex space-x-1 bg-white rounded-lg p-1 shadow-sm border">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all ${
                  activeTab === tab.key
                    ? 'bg-green-600 text-white shadow-md'
                    : 'text-gray-600 hover:text-green-600 hover:bg-blue-50'
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {activeTab === 'profile' && (
              <Card className="border-0 shadow-lg">
                <div className="p-6">
                  <Title level={4} className="mb-6 flex items-center gap-2">
                    <User className="w-5 h-5 text-green-600" />
                    Personal Information
                  </Title>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <Mail className="w-4 h-4 text-green-600" />
                            <Text strong className="text-gray-700">Email Address</Text>
                          </div>
                          <Text className="text-gray-900">{email}</Text>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <Phone className="w-4 h-4 text-green-600" />
                            <Text strong className="text-gray-700">Phone Number</Text>
                          </div>
                          <Text className="text-gray-900">{contactNumber}</Text>
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <MapPin className="w-4 h-4 text-red-600" />
                            <Text strong className="text-gray-700">Address</Text>
                          </div>
                          <Text className="text-gray-900">{address}</Text>
                        </div>

                        <div className="p-4 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3 mb-2">
                            <BadgeInfo className="w-4 h-4 text-red-600" />
                            <Text strong className="text-gray-700">Account Type</Text>
                          </div>
                          <Text className="text-gray-900">{isGuest ? "Guest Account" : "Registered Member"}</Text>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            )}
{activeTab === "wishlist" && (
  <Card>
    <Title level={4}>Wishlist Preview</Title>

    {wishlist.length === 0 ? (
      <Text type="secondary">Your wishlist is empty.</Text>
    ) : (
      <>
        {wishlist.slice(0, 3).map((item, index) => {
          const imagePath = item.productImage || "";
          const imageUrl = `${backendBaseURL}/Media/Products_Images/${imagePath.split("\\").pop()}`;

          return (
            <div
              key={index}
              className="flex items-center justify-between bg-gray-50 border rounded-lg p-4 mb-3"
            >
              <div className="flex items-center gap-4">
                <img
                  src={imageUrl}
                  alt={item.productName}
                  className="w-16 h-16 object-contain border rounded"
                  onError={(e) => {
                    e.target.src = "/images/placeholder.png";
                  }}
                />
                <div>
                  <div className="text-sm">{item.productName}</div>
                  <div className="text-sm text-gray-400">
                   {item.brandName || "N/A"} • {item.categoryName || "N/A"}
                  </div>
                  <div className="text-sm font-medium text-red-500 mt-1">
                    GH₵ {item.price?.toLocaleString() || "0.00"}
                  </div>
                </div>
              </div>

              <Button
                size="small"
                onClick={() => navigate(`/product/${item.productID}`)}
                className="bg-red-500 text-white hover:bg-green-700"
       
              >
                View Product
              </Button>
            </div>
          );
        })}

        {wishlist.length > 3 && (
          <Button
            type="primary"
            className="mt-1 bg-green-500 hover:bg-green-600 text-white"
            icon={<Heart className="w-4 h-4" />}
            block 
            onClick={() => message.info("Wishlist page coming soon")}
          >
            View All Wishlist
          </Button>
        )}
      </>
    )}
  </Card>
)}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card className="border-0 shadow-lg">
              <div className="p-6">
                <Title level={5} className="mb-4">Quick Actions</Title>
                <div className="space-y-3">
                  
                  <Button 
                    block 
                    icon={<Package className="w-4 h-4" />}
                    className="text-left justify-start border-gray-200 hover:border-green-400"
                  >
                    Order History
                  </Button>
                    <Button
                    block
                    icon={<LogOut className="w-4 h-4" />}
                    className="border-orange-300 text-orange-600 hover:bg-orange-50 hover:border-orange-400"
                    onClick={handleLogout}
                  >
                    Sign Out
                  </Button>
                  <Button
                    block
                    danger
                    icon={<Trash2 className="w-4 h-4" />}
                    onClick={handleDeleteAccount}
                  >
                    Delete Account
                  </Button>
                  
                </div>
              </div>
            </Card>

            {/* Help & Support */}
            <Card className="border-0 shadow-lg bg-red-500 text-white">
              <div className="p-2">
                <Title level={5} className="!text-white mb-2">Need Help? </Title>
                <Text className="text-green-100 mb-4">
                  Our support team is here to assist you 24/7
                </Text>
                <Button 
                  className="bg-white text-green-600 border-0 font-medium"
                  block
                >
                  Contact Support
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Account;