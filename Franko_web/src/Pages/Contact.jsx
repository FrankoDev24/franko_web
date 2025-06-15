import React, { useState } from 'react';
import { 
  Mail, 
  Phone, 
  MapPin, 
  Clock, 
  Send, 
  User, 
  MessageSquare,
  Facebook,
  Instagram,
  MessageCircle
} from 'lucide-react';

// Custom Twitter/X icon component
const XIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

// Custom TikTok icon component
const TikTokIcon = () => (
  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
  </svg>
);

export default function ContactUsPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Form submitted:', formData);
    alert('Thank you for your message! We\'ll get back to you soon.');
    setFormData({ name: '', email: '', subject: '', message: '' });
  };

  const handleWhatsAppClick = () => {
    const phoneNumber = "233246422338"; // Replace with actual WhatsApp number
    const message = "Hello! I'd like to get in touch with you.";
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-green-600 to-green-500 text-white py-8 px-1 md:py:10 md:px-4 overflow-hidden">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-4xl mx-auto text-center">
          <h1 className="text-2xl md:text-5xl font-bold mb-2 md:mb-4">
            Get In Touch
          </h1>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
            We'd love to hear from you. Send us a message and we'll respond as soon as possible.
          </p>
        </div>
        <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full transform translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full transform -translate-x-12 translate-y-12"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
            {/* Contact Details */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-400 hover:shadow-xl transition-shadow duration-300">
              <div className="flex items-center mb-6">
                <div className="bg-green-100 p-3 rounded-lg mr-4">
                  <Phone className="w-6 h-6 text-green-600" />
                </div>
                <h2 className="text-xl font-bold text-gray-700">Contact Information</h2>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-center group">
                  <div className="bg-red-50 p-3 rounded-lg mr-4 group-hover:bg-red-100 transition-colors duration-200">
                    <Phone className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
  <p className="font-semibold text-gray-800">Phone</p>
  <a href="tel:+233302225651" className="text-gray-600 hover:underline">
    +233302225651
  </a>
</div>

                </div>
                
                <div className="flex items-center group">
                  <div className="bg-green-50 p-3 rounded-lg mr-4 group-hover:bg-green-100 transition-colors duration-200">
                    <Mail className="w-5 h-5 text-green-600" />
                  </div>
                 <div>
  <p className="font-semibold text-gray-800">Email</p>
  <a
    href="mailto:online@frankotrading.com"
    className="text-gray-600 hover:underline"
  >
    online@frankotrading.com
  </a>
</div>

                </div>
                
                <div className="flex items-center group">
                  <div className="bg-red-50 p-3 rounded-lg mr-4 group-hover:bg-red-100 transition-colors duration-200">
                    <MapPin className="w-5 h-5 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Address</p>
                    <p className="text-gray-600">
                      Franko Online, 123 Main Street, Accra, Ghana
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center group">
                  <div className="bg-green-50 p-3 rounded-lg mr-4 group-hover:bg-green-100 transition-colors duration-200">
                    <Clock className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">Business Hours</p>
                    <p className="text-gray-600">Monday - Saturday: 8:00 AM - 6:00 PM<br />Holidays: 8:00 AM - 5:00 PM</p>
                  </div>
                </div>
              </div>
            </div>

            {/* WhatsApp Chat Button */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-400">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Quick Chat</h3>
              <button
                onClick={handleWhatsAppClick}
                className="w-full bg-green-500 hover:bg-green-600 text-white py-3 px-6 rounded-lg font-semibold flex items-center justify-center gap-3 transform hover:-translate-y-0.5 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <MessageCircle className="w-5 h-5" />
                Chat with us on WhatsApp
              </button>
            </div>

            {/* Social Media */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-400">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Connect With Us</h3>
              <div className="grid grid-cols-2 gap-3">
                <a 
                    href="https://www.facebook.com/frankotradingenterprise" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-blue-600 hover:bg-blue-700 p-3 rounded-lg text-white transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Facebook className="w-5 h-5" />
                  <span className="text-sm font-medium">Facebook</span>
                </a>
                
                <a 
                  href="https://instagram.com/frankotrading_fte" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 p-3 rounded-lg text-white transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <Instagram className="w-5 h-5" />
                  <span className="text-sm font-medium">Instagram</span>
                </a>
                
                <a 
                    href="https://x.com/frankotrading1" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-black hover:bg-gray-800 p-3 rounded-lg text-white transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <XIcon />
                  <span className="text-sm font-medium">X (Twitter)</span>
                </a>
                
                <a 
                href="https://www.tiktok.com/@frankotrading" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-black hover:bg-gray-800 p-3 rounded-lg text-white transform hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg"
                >
                  <TikTokIcon />
                  <span className="text-sm font-medium">TikTok</span>
                </a>
              </div>
            </div>
          </div>
          {/* Contact Form */}
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-200 hover:shadow-xl transition-shadow duration-300">
            <div className="flex items-center mb-6">
              <div className="bg-red-100 p-3 rounded-lg mr-4">
                <Send className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-md md:text-xl font-bold text-gray-700">Send us a Message</h2>
            </div>
            
            <div className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="Your Name"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all duration-200"
                    required
                  />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="Your Email"
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all duration-200"
                    required
                  />
                </div>
              </div>
              
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                  placeholder="Subject"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all duration-200"
                  required
                />
              </div>
              
              <div className="relative">
                <MessageSquare className="absolute left-3 top-3 w-5 h-5 text-gray-400" />
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows="5"
                  placeholder="Your Message"
                  className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:border-red-400 focus:outline-none focus:ring-2 focus:ring-red-100 transition-all duration-200 resize-none"
                  required
                ></textarea>
              </div>
              
              <button
                type="submit"
                className="w-full bg-gradient-to-r from-red-400 to-red-400 text-white py-3 px-6 rounded-lg font-semibold hover:from-red-600 hover:to-red-700 transform hover:-translate-y-0.5 transition-all duration-200 shadow-md hover:shadow-lg"
              >
                <Send className="inline-block mr-2 w-5 h-5" />
                Send Message
              </button>
            
            </div>
            
          </div>

          {/* Contact Information */}
        
        </div>

        {/* Google Maps Section */}
        <div className="mt-12">
          <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-400">
            <div className="flex items-center mb-6">
              <div className="bg-green-100 p-3 rounded-lg mr-4">
                <MapPin className="w-6 h-6 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800">Find Us Here</h2>
            </div>
            
            <div className="rounded-lg overflow-hidden shadow-md">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3970.7967832195693!2d-0.21468088525708!3d5.554453895049607!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf91005d5d68d5%3A0x1ff3320f1a7fa06e!2sFranko%20Online!5e0!3m2!1sen!2sgh!4v1655892345678!5m2!1sen!2sgh"
                width="100%"
                height="350"
                style={{ border: 0 }}
                allowFullScreen=""
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                className="w-full h-80 rounded-lg"
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}