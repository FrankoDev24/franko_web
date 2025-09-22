import React, { useEffect } from 'react';
import { Phone, Laptop, Tv, Headphones, MapPin, Users, Award, Heart, Zap, Shield, Truck, RotateCcw, CheckCircle, MessageCircle, ArrowRight, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function AboutUs() {
  const navigate = useNavigate();
   useEffect(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

  const coreValues = [
    { 
      icon: <Shield className="w-8 h-8" />,
      title: 'Integrity', 
      desc: 'We believe in doing the right thing, always.',
      color: 'from-blue-500 to-blue-600'
    },
    { 
      icon: <Users className="w-8 h-8" />,
      title: "Accountability", 
      desc: 'Constantly pushing boundaries and improving.',
      color: 'from-green-500 to-green-600'
    },

    { 
      icon: <Heart className="w-8 h-8" />,
      title: 'Customer Satisfaction', 
      desc: 'Every decision centers on your satisfaction.',
      color: 'from-red-500 to-red-600'
    },
    { 
      icon: <Zap className="w-8 h-8" />,
      title: 'Teamwork', 
      desc: 'Collaboration that drives progress.',
      color: 'from-purple-500 to-purple-600'
    },
  ];

  const benefits = [
    { icon: <Truck className="w-8 h-8" />, text: 'Fast Delivery', desc: 'Quick delivery across Ghana' },
{ 
  icon: <RotateCcw className="w-8 h-8" />, 
  text: 'Secure Payments', 
  desc: 'Safe and protected transactions ' 
}
,
    { icon: <CheckCircle className="w-8 h-8" />, text: 'Quality Guaranteed', desc: 'Only authentic products' },
    { icon: <MessageCircle className="w-8 h-8" />, text: 'Customer Support', desc: 'Dedicated support Team' },
  ];

  const products = [
    { icon: <Phone className="w-6 h-6" />, name: 'Mobile Phones' },
    { icon: <Laptop className="w-6 h-6" />, name: 'Laptops & Computers' },
    { icon: <Tv className="w-6 h-6" />, name: 'Televisions' },
    { icon: <Headphones className="w-6 h-6" />, name: 'Accessories' },
  ];

  const stats = [
    { number: '20+', label: 'Years of Excellence' },
    { number: '100K+', label: 'Customers Base' },
    { number: '50+', label: 'Brand Partners' },
    { number: '24/7', label: 'Customer Support' },
  ];

  return (
    <div className="font-sans text-gray-800 bg-white">
      {/* Enhanced Hero Section */}
      <div className="relative min-h-[70vh] bg-gradient-to-br from-green-600 via-green-700 to-green-800 overflow-hidden">
        {/* Animated Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-20 w-32 h-32 bg-white rounded-full animate-pulse"></div>
          <div className="absolute top-40 right-32 w-20 h-20 bg-white rounded-full animate-pulse delay-300"></div>
          <div className="absolute bottom-32 left-1/3 w-24 h-24 bg-white rounded-full animate-pulse delay-700"></div>
        </div>
        
        <div className="relative h-full flex items-center justify-center px-6 py-20">
          <div className="text-center text-white max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2 mb-6">
              <Star className="w-4 h-4 text-yellow-300" />
              <span className="text-sm font-medium">Ghana's #1 Electronics Store</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Welcome to<br />
              <span className="text-yellow-300">Franko Trading</span>
            </h1>
            
            <p className="text-xl md:text-2xl mb-8 text-green-100 font-light">
              "Phone Papa Fie" - Your trusted electronic partner since 2004
            </p>
            
            <div className="flex flex-wrap justify-center gap-4 mb-8">
              {products.map((product, idx) => (
                <div key={idx} className="flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                  <div className="text-yellow-300">{product.icon}</div>
                  <span className="text-sm font-medium">{product.name}</span>
                </div>
              ))}
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button onClick={() => navigate('/products')}
className="bg-yellow-400 hover:bg-yellow-300 text-gray-900 font-semibold px-8 py-4 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg">
                Explore Products
              </button>
              <button className="border-2 border-white text-white hover:bg-white hover:text-green-700 font-semibold px-8 py-4 rounded-full transition-all duration-300">
                Our Story
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <section className="py-16 px-6 bg-gray-50">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, idx) => (
              <div key={idx} className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-green-600 mb-2">{stat.number}</div>
                <div className="text-gray-600 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Who We Are Section */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 rounded-full px-4 py-2 mb-6">
                <MapPin className="w-4 h-4" />
                <span className="text-sm font-medium">Established 2004 • Adabraka, Accra</span>
              </div>
              
              <h2 className="text-3xl md:text-4xl font-bold mb-6 text-gray-900">
                Ghana's Leading Electronics Destination
              </h2>
              
              <p className="text-lg text-gray-700 mb-6 leading-relaxed">
                Franko Trading Limited is the premier retail and wholesale company specializing in mobile phones, computers, laptops, televisions, and accessories. For over two decades, we've been committed to bringing cutting-edge technology to Ghana at unbeatable prices.
              </p>
              
              <p className="text-lg text-gray-700 mb-8 leading-relaxed">
                Located at Adabraka Opposite Roxy Cinema in Accra, we've earned the nickname "Phone Papa Fie" (Home of Quality Phones) by consistently delivering quality and affordability to every Ghanaian family.
              </p>
              
              <button   onClick={() => navigate('/shops')}
 className="inline-flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold px-6 py-3 rounded-full transition-all duration-300">
                Visit Our Store
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="relative">
              <div className="bg-gradient-to-br from-green-100 to-green-200 rounded-3xl p-8 shadow-xl">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white rounded-2xl p-6 shadow-md">
                    <Phone className="w-8 h-8 text-green-600 mb-3" />
                    <h4 className="font-semibold text-gray-900">Mobile Phones</h4>
                    <p className="text-sm text-gray-600">Latest smartphones</p>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-md">
                    <Laptop className="w-8 h-8 text-blue-600 mb-3" />
                    <h4 className="font-semibold text-gray-900">Computers</h4>
                    <p className="text-sm text-gray-600">Laptops & desktops</p>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-md">
                    <Tv className="w-8 h-8 text-purple-600 mb-3" />
                    <h4 className="font-semibold text-gray-900">Televisions</h4>
                    <p className="text-sm text-gray-600">Smart TVs & more</p>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-md">
                    <Headphones className="w-8 h-8 text-red-600 mb-3" />
                    <h4 className="font-semibold text-gray-900">Accessories</h4>
                    <p className="text-sm text-gray-600">All your accessories needs</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-20 px-6 bg-gradient-to-r from-gray-50 to-white">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12">
            {/* Mission */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border-l-4 border-green-500">
              <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mb-6">
                <Award className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Our Mission</h3>
              <p className="text-gray-700 leading-relaxed">
                To be the leader in inspiring Africa and the world with innovative products and designs, revolutionizing the electronics and mobile phone market through excellence and accessibility.
              </p>
            </div>

            {/* Vision */}
            <div className="bg-white rounded-3xl p-8 shadow-xl border-l-4 border-red-500">
              <div className="w-16 h-16 bg-red-100 rounded-2xl flex items-center justify-center mb-6">
                <Zap className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-2xl font-bold mb-4 text-gray-900">Our Vision</h3>
              <p className="text-gray-700 leading-relaxed">
                To devote our human and technological resources to create superior household electronics and mobile phone markets through research and innovation in Ghana and the West African Sub-region.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Enhanced Core Values */}
      <section className="py-20 px-6 bg-white">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Our Core Values</h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            These principles guide everything we do and define who we are as a company
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {coreValues.map((value, idx) => (
              <div
                key={idx}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2 border border-gray-100"
              >
                <div className={`w-16 h-16 bg-gradient-to-r ${value.color} rounded-2xl flex items-center justify-center mx-auto mb-6 text-white group-hover:scale-110 transition-transform duration-300`}>
                  {value.icon}
                </div>
                <h3 className="text-xl font-bold mb-3 text-gray-900">{value.title}</h3>
                <p className="text-gray-600 leading-relaxed">{value.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced Why Choose Us */}
      <section className="py-20 px-6 bg-gradient-to-br from-green-50 to-blue-50">
        <div className="max-w-6xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-gray-900">Why Choose Franko Trading?</h2>
          <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
            Experience the difference with our commitment to excellence and customer satisfaction
          </p>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {benefits.map((item, idx) => (
              <div
                key={idx}
                className="group bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6 text-green-600 group-hover:bg-green-200 transition-colors duration-300">
                  {item.icon}
                </div>
                <h3 className="text-xl font-bold mb-2 text-gray-900">{item.text}</h3>
                <p className="text-gray-600">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Enhanced CTA Section */}
      <section className="relative py-20 px-6 bg-gradient-to-r from-green-600 via-green-700 to-green-800 overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 w-20 h-20 bg-white rounded-full animate-bounce"></div>
          <div className="absolute top-20 right-20 w-16 h-16 bg-white rounded-full animate-bounce delay-300"></div>
          <div className="absolute bottom-20 left-1/4 w-12 h-12 bg-white rounded-full animate-bounce delay-700"></div>
        </div>
        
        <div className="relative max-w-4xl mx-auto text-center text-white">
          <h2 className="text-3xl md:text-5xl font-bold mb-6 leading-tight">
            Ready to Experience the Best in Electronic Products?
          </h2>
          <p className="text-xl mb-8 text-green-100 max-w-2xl mx-auto">
            Discover our latest collection of smartphones, laptops, TVs, and accessories. Quality guaranteed, prices you'll love.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button   onClick={() => navigate('/products')} className="bg-yellow-300 text-gray-700 font-bold px-10 py-4 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg">
              Browse Our Products
            </button>
            <button  onClick={() => navigate('/contact')} className="border-2 border-white text-white hover:bg-white hover:text-green-700 font-semibold px-10 py-4 rounded-full transition-all duration-300">
              Contact Us Today
            </button>
          </div>
          
          <div className="mt-12 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm rounded-full px-6 py-3">
            <MapPin className="w-5 h-5 text-yellow-300" />
            <span className="font-medium">Visit us at Accra, Kingsway, Opposite GCB (Former UT Bank Building)</span>
          </div>
        </div>
      </section>
    </div>
  );
}