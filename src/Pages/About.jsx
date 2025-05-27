import React from 'react';
import aboutBg from '../assets/franko.png';
import { Typography } from 'antd';

const { Title, Paragraph } = Typography;
export default function AboutUs() {
  const coreValues = [
    { title: 'Integrity', desc: 'We believe in doing the right thing, always.' },
    { title: "Accountability", desc: 'Constantly pushing boundaries and improving.' },
    { title: 'Customer Satisfaction', desc: 'Every decision centers on your satisfaction.' },
    
    { title: 'Teamwork', desc: 'Collaboration that drives progress.' },

  ];

  const benefits = [
    { icon: '🚚', text: 'Fast Delivery' },
    { icon: '🔁', text: 'Easy Returns' },
    { icon: '✅', text: 'Quality Guaranteed' },
    { icon: '💬', text: 'Customer Support' },
  ];

  return (
    <div className="font-sans text-gray-800 bg-gray-50">
      {/* Hero Section */}
      <div style={{ backgroundImage: `url(${aboutBg})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
        <div className="h-[280px] md:h-[600px] flex items-center justify-center text-white bg-gradient-to-r from-black/50 to-black/30">
        <div className="text-center text-xl md:text-5xl font-bold">
    About us
</div>
        </div>
      </div>

      {/* Who We Are */}
      <section className="py-10 px-6 md:px-20 bg-white">
        <div className="max-w-5xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-6">Who We Are</h2>
          <p className="text-lg text-gray-700 mb-4">
          Franko Trading Limited is the leading retail and wholesale company of mobile phones, computers, laptops, televisions, and accessories. Established in 2004, we are committed to bringing the latest technological gadgets to Ghana at affordable prices. 
          <p className="text-lg text-gray-700">
          Our head office is located at Adabraka Opposite Roxy Cinema in Accra.
          Known as "Phone Papa Fie" (Home of Quality Phones), we ensure quality and affordability for every Ghanaian.
          </p>
          </p>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-16 px-6 md:px-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-6">Our Mission</h2>
          <p className="text-lg text-gray-700 leading-relaxed">
          To be the leader in inspiring Africa and the world with innovative products and designs, revolutionizing the electronics and mobile phone market.
          </p>
        </div>
      </section>

      {/* Vision Section */}
      <section className="bg-white py-16 px-6 md:px-20">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-semibold mb-6">Our Vision</h2>
          <p className="text-lg text-gray-700 leading-relaxed">
          To devote our human and technological resources to create superior household electronics and mobile phone markets through research and innovation in Ghana and the West African Sub-region.
          </p>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-gray-50 py-16 px-6 md:px-20">
        <h2 className="text-3xl md:text-4xl font-semibold text-center mb-12">Core Values</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {coreValues.map((value, idx) => (
            <div
              key={idx}
              className="bg-white p-6 rounded-xl shadow hover:shadow-lg transition-transform hover:-translate-y-1 duration-200"
            >
              <h3 className="text-xl font-bold text-green-600 mb-2">{value.title}</h3>
              <p className="text-gray-600">{value.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-white py-16 px-6 md:px-20">
        <h2 className="text-3xl md:text-4xl font-semibold text-center mb-12">Why Choose Us?</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-5xl mx-auto">
          {benefits.map((item, idx) => (
            <div
              key={idx}
              className="p-6 bg-green-100 rounded-lg shadow hover:shadow-md text-center transition transform hover:-translate-y-1 duration-200"
            >
              <div className="text-5xl">{item.icon}</div>
              <p className="mt-4 font-medium text-lg text-green-800">{item.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-green-300 text-white py-16 px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-bold mb-6">Explore Our Bestsellers</h2>
        <button className="bg-white text-green-700 font-semibold px-8 py-3 rounded-full shadow hover:bg-gray-100 transition">
          Browse Products
        </button>
      </section>

    
    </div>
  );
}
