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
      icon: <Shield className="w-7 h-7" />,
      title: 'Integrity',
      desc: 'We believe in doing the right thing, always.',
      color: '#2563eb',
    },
    {
      icon: <Users className="w-7 h-7" />,
      title: 'Accountability',
      desc: 'Constantly pushing boundaries and improving.',
      color: '#16a34a',
    },
    {
      icon: <Heart className="w-7 h-7" />,
      title: 'Customer Satisfaction',
      desc: 'Every decision centers on your satisfaction.',
      color: '#dc2626',
    },
    {
      icon: <Zap className="w-7 h-7" />,
      title: 'Teamwork',
      desc: 'Collaboration that drives progress.',
      color: '#9333ea',
    },
  ];

  const benefits = [
    { icon: <Truck className="w-7 h-7" />, text: 'Fast Delivery', desc: 'Quick delivery across Ghana' },
    { icon: <RotateCcw className="w-7 h-7" />, text: 'Secure Payments', desc: 'Safe and protected transactions' },
    { icon: <CheckCircle className="w-7 h-7" />, text: 'Quality Guaranteed', desc: 'Only authentic products' },
    { icon: <MessageCircle className="w-7 h-7" />, text: 'Customer Support', desc: 'Dedicated support team' },
  ];

  const products = [
    { icon: <Phone className="w-5 h-5" />, name: 'Mobile Phones' },
    { icon: <Laptop className="w-5 h-5" />, name: 'Laptops & Computers' },
    { icon: <Tv className="w-5 h-5" />, name: 'Televisions' },
    { icon: <Headphones className="w-5 h-5" />, name: 'Accessories' },
  ];

  const stats = [
    { number: '20+', label: 'Years of Excellence' },
    { number: '100K+', label: 'Customer Base' },
    { number: '50+', label: 'Brand Partners' },
    { number: '24/7', label: 'Customer Support' },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700;800;900&display=swap');

        :root {
          --ab-font: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          --ab-green: #14532d;
          --ab-green-mid: #166534;
          --ab-green-600: #16a34a;
          --ab-green-700: #15803d;
          --ab-green-800: #166534;
          --ab-dark: #1a1a1a;
          --ab-mid: #555;
          --ab-light: #888;
          --ab-border: #e0e0e0;
          --ab-bg-subtle: #f7f7f7;
          --ab-red: #dc2626;
          --ab-yellow: #facc15;
          --ab-yellow-light: #fde047;
          --ab-radius: 4px;
        }

        .ab-root, .ab-root * {
          font-family: var(--ab-font);
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
          box-sizing: border-box;
        }

        /* ==================== HERO ==================== */

        .ab-hero {
          position: relative;
          min-height: 70vh;
          background: linear-gradient(135deg, var(--ab-green-600), var(--ab-green-700), var(--ab-green-800));
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 80px 24px;
        }

        .ab-hero-bg-circle {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
          animation: ab-pulse 3s ease-in-out infinite;
        }

        @keyframes ab-pulse {
          0%, 100% { opacity: 0.06; transform: scale(1); }
          50% { opacity: 0.12; transform: scale(1.08); }
        }

        .ab-hero-content {
          position: relative;
          text-align: center;
          color: #fff;
          max-width: 800px;
          z-index: 1;
        }

        .ab-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(8px);
          border-radius: 100px;
          padding: 6px 16px;
          margin-bottom: 24px;
          font-size: 13px;
          font-weight: 600;
        }

        .ab-hero-title {
          font-size: 36px;
          font-weight: 900;
          line-height: 1.15;
          margin: 0 0 20px;
          letter-spacing: -0.03em;
        }
        @media (min-width: 768px) {
          .ab-hero-title { font-size: 56px; }
        }

        .ab-hero-title span {
          color: var(--ab-yellow);
        }

        .ab-hero-subtitle {
          font-size: 18px;
          font-weight: 400;
          color: rgba(255, 255, 255, 0.85);
          margin-bottom: 32px;
          line-height: 1.5;
        }
        @media (min-width: 768px) {
          .ab-hero-subtitle { font-size: 22px; }
        }

        .ab-hero-products {
          display: flex;
          flex-wrap: wrap;
          justify-content: center;
          gap: 10px;
          margin-bottom: 32px;
        }

        .ab-hero-product-tag {
          display: flex;
          align-items: center;
          gap: 6px;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(8px);
          border-radius: 100px;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 500;
          color: #fff;
        }

        .ab-hero-product-tag svg { color: var(--ab-yellow); }

        .ab-hero-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
        }
        @media (min-width: 640px) {
          .ab-hero-actions { flex-direction: row; justify-content: center; }
        }

        .ab-btn-primary {
          background: var(--ab-yellow);
          color: var(--ab-dark);
          font-weight: 700;
          font-size: 14px;
          padding: 12px 32px;
          border: none;
          border-radius: var(--ab-radius);
          cursor: pointer;
          transition: all 0.2s;
          font-family: var(--ab-font);
        }
        .ab-btn-primary:hover {
          background: var(--ab-yellow-light);
          transform: translateY(-1px);
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        }

        .ab-btn-outline {
          background: transparent;
          color: #fff;
          font-weight: 600;
          font-size: 14px;
          padding: 11px 32px;
          border: 2px solid rgba(255, 255, 255, 0.6);
          border-radius: var(--ab-radius);
          cursor: pointer;
          transition: all 0.2s;
          font-family: var(--ab-font);
        }
        .ab-btn-outline:hover {
          background: #fff;
          color: var(--ab-green-700);
          border-color: #fff;
        }

        /* ==================== STATS ==================== */

        .ab-stats {
          padding: 48px 24px;
          background: var(--ab-bg-subtle);
          border-bottom: 1px solid var(--ab-border);
        }

        .ab-stats-grid {
          max-width: 960px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 32px;
        }
        @media (min-width: 768px) {
          .ab-stats-grid { grid-template-columns: repeat(4, 1fr); }
        }

        .ab-stat-item { text-align: center; }

        .ab-stat-number {
          font-size: 32px;
          font-weight: 900;
          color: var(--ab-green-600);
          letter-spacing: -0.02em;
          margin-bottom: 4px;
        }
        @media (min-width: 768px) {
          .ab-stat-number { font-size: 40px; }
        }

        .ab-stat-label {
          font-size: 14px;
          font-weight: 600;
          color: var(--ab-mid);
        }

        /* ==================== SECTIONS ==================== */

        .ab-section {
          padding: 64px 24px;
        }
        @media (min-width: 768px) {
          .ab-section { padding: 80px 24px; }
        }

        .ab-section-inner {
          max-width: 1060px;
          margin: 0 auto;
        }

        .ab-section-header {
          text-align: center;
          margin-bottom: 48px;
        }

        .ab-section-title {
          font-size: 28px;
          font-weight: 800;
          color: var(--ab-dark);
          letter-spacing: -0.02em;
          margin: 0 0 12px;
        }
        @media (min-width: 768px) {
          .ab-section-title { font-size: 36px; }
        }

        .ab-section-desc {
          font-size: 16px;
          color: var(--ab-light);
          max-width: 560px;
          margin: 0 auto;
          line-height: 1.6;
        }

        /* ==================== WHO WE ARE ==================== */

        .ab-who-grid {
          display: grid;
          gap: 48px;
          align-items: center;
        }
        @media (min-width: 768px) {
          .ab-who-grid { grid-template-columns: 1fr 1fr; }
        }

        .ab-who-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #dcfce7;
          color: var(--ab-green-700);
          border-radius: 100px;
          padding: 5px 14px;
          font-size: 12px;
          font-weight: 700;
          margin-bottom: 20px;
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .ab-who-title {
          font-size: 28px;
          font-weight: 800;
          color: var(--ab-dark);
          letter-spacing: -0.02em;
          margin: 0 0 20px;
          line-height: 1.2;
        }
        @media (min-width: 768px) {
          .ab-who-title { font-size: 36px; }
        }

        .ab-who-text {
          font-size: 16px;
          color: var(--ab-mid);
          line-height: 1.7;
          margin-bottom: 20px;
        }

        .ab-who-cta {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: var(--ab-green);
          color: #fff;
          font-size: 14px;
          font-weight: 600;
          padding: 10px 24px;
          border: none;
          border-radius: var(--ab-radius);
          cursor: pointer;
          transition: all 0.2s;
          font-family: var(--ab-font);
          margin-top: 8px;
        }
        .ab-who-cta:hover {
          background: var(--ab-green-mid);
          transform: translateY(-1px);
        }

        .ab-who-cards {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .ab-who-card {
          background: #fff;
          border: 1px solid var(--ab-border);
          border-radius: var(--ab-radius);
          padding: 20px;
        }

        .ab-who-card-icon {
          margin-bottom: 10px;
        }

        .ab-who-card-title {
          font-size: 14px;
          font-weight: 700;
          color: var(--ab-dark);
          margin-bottom: 4px;
        }

        .ab-who-card-desc {
          font-size: 12px;
          color: var(--ab-light);
          line-height: 1.4;
        }

        /* ==================== MISSION & VISION ==================== */

        .ab-mv-grid {
          display: grid;
          gap: 24px;
        }
        @media (min-width: 768px) {
          .ab-mv-grid { grid-template-columns: 1fr 1fr; }
        }

        .ab-mv-card {
          background: #fff;
          border: 1px solid var(--ab-border);
          border-radius: var(--ab-radius);
          padding: 32px;
          border-left: 4px solid transparent;
        }

        .ab-mv-card-mission { border-left-color: var(--ab-green-600); }
        .ab-mv-card-vision { border-left-color: var(--ab-red); }

        .ab-mv-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--ab-radius);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 20px;
        }

        .ab-mv-icon-green { background: #dcfce7; color: var(--ab-green-600); }
        .ab-mv-icon-red { background: #fee2e2; color: var(--ab-red); }

        .ab-mv-title {
          font-size: 22px;
          font-weight: 800;
          color: var(--ab-dark);
          margin: 0 0 12px;
          letter-spacing: -0.01em;
        }

        .ab-mv-text {
          font-size: 15px;
          color: var(--ab-mid);
          line-height: 1.7;
          margin: 0;
        }

        /* ==================== VALUES / BENEFITS GRID ==================== */

        .ab-values-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }
        @media (min-width: 1024px) {
          .ab-values-grid { grid-template-columns: repeat(4, 1fr); }
        }

        .ab-value-card {
          background: #fff;
          border: 1px solid var(--ab-border);
          border-radius: var(--ab-radius);
          padding: 28px 20px;
          text-align: center;
          transition: all 0.2s;
        }
        .ab-value-card:hover {
          border-color: var(--ab-green-600);
          box-shadow: 0 4px 16px rgba(20, 83, 45, 0.06);
          transform: translateY(-2px);
        }

        .ab-value-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--ab-radius);
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          color: #fff;
        }

        .ab-value-title {
          font-size: 16px;
          font-weight: 700;
          color: var(--ab-dark);
          margin-bottom: 8px;
        }

        .ab-value-desc {
          font-size: 13px;
          color: var(--ab-light);
          line-height: 1.5;
        }

        .ab-benefit-icon {
          width: 48px;
          height: 48px;
          border-radius: var(--ab-radius);
          background: #dcfce7;
          display: flex;
          align-items: center;
          justify-content: center;
          margin: 0 auto 16px;
          color: var(--ab-green-600);
          transition: background 0.2s;
        }
        .ab-value-card:hover .ab-benefit-icon {
          background: #bbf7d0;
        }

        /* ==================== CTA ==================== */

        .ab-cta {
          position: relative;
          padding: 80px 24px;
          background: linear-gradient(135deg, var(--ab-green-600), var(--ab-green-700), var(--ab-green-800));
          overflow: hidden;
        }

        .ab-cta-inner {
          position: relative;
          max-width: 800px;
          margin: 0 auto;
          text-align: center;
          color: #fff;
          z-index: 1;
        }

        .ab-cta-title {
          font-size: 28px;
          font-weight: 900;
          margin: 0 0 16px;
          line-height: 1.2;
          letter-spacing: -0.02em;
        }
        @media (min-width: 768px) {
          .ab-cta-title { font-size: 42px; }
        }

        .ab-cta-desc {
          font-size: 17px;
          color: rgba(255, 255, 255, 0.85);
          max-width: 600px;
          margin: 0 auto 32px;
          line-height: 1.6;
        }

        .ab-cta-actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          align-items: center;
          margin-bottom: 40px;
        }
        @media (min-width: 640px) {
          .ab-cta-actions { flex-direction: row; justify-content: center; }
        }

        .ab-cta-location {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background: rgba(255, 255, 255, 0.12);
          backdrop-filter: blur(8px);
          border-radius: 100px;
          padding: 10px 20px;
          font-size: 13px;
          font-weight: 600;
        }

        .ab-cta-location svg { color: var(--ab-yellow); flex-shrink: 0; }

        /* ==================== BACKGROUNDS ==================== */

        .ab-bg-white { background: #fff; }
        .ab-bg-subtle { background: var(--ab-bg-subtle); }
        .ab-bg-gradient { background: linear-gradient(135deg, #f0fdf4, #eff6ff); }
      `}</style>

      <div className="ab-root">
        {/* ==================== HERO ==================== */}
        <div className="ab-hero">
          <div className="ab-hero-bg-circle" style={{ width: 200, height: 200, top: 40, left: 40 }} />
          <div className="ab-hero-bg-circle" style={{ width: 120, height: 120, top: 100, right: 80, animationDelay: '0.5s' }} />
          <div className="ab-hero-bg-circle" style={{ width: 160, height: 160, bottom: 60, left: '30%', animationDelay: '1s' }} />

          <div className="ab-hero-content">
            <div className="ab-hero-badge">
              <Star style={{ width: 14, height: 14, color: '#facc15' }} />
              <span>Ghana&apos;s #1 Electronics Store</span>
            </div>

            <h1 className="ab-hero-title">
              Welcome to<br />
              <span>Franko Trading</span>
            </h1>

            <p className="ab-hero-subtitle">
              &ldquo;Phone Papa Fie&rdquo; — Your trusted electronic partner since 2004
            </p>

            <div className="ab-hero-products">
              {products.map((product, idx) => (
                <div key={idx} className="ab-hero-product-tag">
                  {product.icon}
                  <span>{product.name}</span>
                </div>
              ))}
            </div>

            <div className="ab-hero-actions">
              <button onClick={() => navigate('/products')} className="ab-btn-primary">
                Explore Products
              </button>
              <button className="ab-btn-outline">
                Our Story
              </button>
            </div>
          </div>
        </div>

        {/* ==================== STATS ==================== */}
        <div className="ab-stats">
          <div className="ab-stats-grid">
            {stats.map((stat, idx) => (
              <div key={idx} className="ab-stat-item">
                <div className="ab-stat-number">{stat.number}</div>
                <div className="ab-stat-label">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ==================== WHO WE ARE ==================== */}
        <div className="ab-section ab-bg-white">
          <div className="ab-section-inner">
            <div className="ab-who-grid">
              <div>
                <div className="ab-who-badge">
                  <MapPin style={{ width: 12, height: 12 }} />
                  <span>Established 2004 • Adabraka, Accra</span>
                </div>

                <h2 className="ab-who-title">
                  Ghana&apos;s Leading Electronics Destination
                </h2>

                <p className="ab-who-text">
                  Franko Trading Limited is the premier retail and wholesale company specializing in mobile phones, computers, laptops, televisions, and accessories. For over two decades, we&apos;ve been committed to bringing cutting-edge technology to Ghana at unbeatable prices.
                </p>

                <p className="ab-who-text">
                  Located at Adabraka Opposite Roxy Cinema in Accra, we&apos;ve earned the nickname &ldquo;Phone Papa Fie&rdquo; (Home of Quality Phones) by consistently delivering quality and affordability to every Ghanaian family.
                </p>

                <button onClick={() => navigate('/shops')} className="ab-who-cta">
                  Visit Our Store
                  <ArrowRight style={{ width: 16, height: 16 }} />
                </button>
              </div>

              <div>
                <div className="ab-who-cards">
                  <div className="ab-who-card">
                    <div className="ab-who-card-icon">
                      <Phone style={{ width: 28, height: 28, color: '#16a34a' }} />
                    </div>
                    <div className="ab-who-card-title">Mobile Phones</div>
                    <div className="ab-who-card-desc">Latest smartphones</div>
                  </div>
                  <div className="ab-who-card">
                    <div className="ab-who-card-icon">
                      <Laptop style={{ width: 28, height: 28, color: '#2563eb' }} />
                    </div>
                    <div className="ab-who-card-title">Computers</div>
                    <div className="ab-who-card-desc">Laptops & desktops</div>
                  </div>
                  <div className="ab-who-card">
                    <div className="ab-who-card-icon">
                      <Tv style={{ width: 28, height: 28, color: '#9333ea' }} />
                    </div>
                    <div className="ab-who-card-title">Televisions</div>
                    <div className="ab-who-card-desc">Smart TVs & more</div>
                  </div>
                  <div className="ab-who-card">
                    <div className="ab-who-card-icon">
                      <Headphones style={{ width: 28, height: 28, color: '#dc2626' }} />
                    </div>
                    <div className="ab-who-card-title">Accessories</div>
                    <div className="ab-who-card-desc">All your needs</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== MISSION & VISION ==================== */}
        <div className="ab-section ab-bg-subtle">
          <div className="ab-section-inner">
            <div className="ab-mv-grid">
              <div className="ab-mv-card ab-mv-card-mission">
                <div className="ab-mv-icon ab-mv-icon-green">
                  <Award style={{ width: 24, height: 24 }} />
                </div>
                <h3 className="ab-mv-title">Our Mission</h3>
                <p className="ab-mv-text">
                  To be the leader in inspiring Africa and the world with innovative products and designs, revolutionizing the electronics and mobile phone market through excellence and accessibility.
                </p>
              </div>

              <div className="ab-mv-card ab-mv-card-vision">
                <div className="ab-mv-icon ab-mv-icon-red">
                  <Zap style={{ width: 24, height: 24 }} />
                </div>
                <h3 className="ab-mv-title">Our Vision</h3>
                <p className="ab-mv-text">
                  To devote our human and technological resources to create superior household electronics and mobile phone markets through research and innovation in Ghana and the West African Sub-region.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ==================== CORE VALUES ==================== */}
        <div className="ab-section ab-bg-white">
          <div className="ab-section-inner">
            <div className="ab-section-header">
              <h2 className="ab-section-title">Our Core Values</h2>
              <p className="ab-section-desc">
                These principles guide everything we do and define who we are as a company
              </p>
            </div>

            <div className="ab-values-grid">
              {coreValues.map((value, idx) => (
                <div key={idx} className="ab-value-card">
                  <div className="ab-value-icon" style={{ background: value.color }}>
                    {value.icon}
                  </div>
                  <div className="ab-value-title">{value.title}</div>
                  <div className="ab-value-desc">{value.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ==================== WHY CHOOSE US ==================== */}
        <div className="ab-section ab-bg-gradient">
          <div className="ab-section-inner">
            <div className="ab-section-header">
              <h2 className="ab-section-title">Why Choose Franko Trading?</h2>
              <p className="ab-section-desc">
                Experience the difference with our commitment to excellence and customer satisfaction
              </p>
            </div>

            <div className="ab-values-grid">
              {benefits.map((item, idx) => (
                <div key={idx} className="ab-value-card">
                  <div className="ab-benefit-icon">
                    {item.icon}
                  </div>
                  <div className="ab-value-title">{item.text}</div>
                  <div className="ab-value-desc">{item.desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ==================== CTA ==================== */}
        <div className="ab-cta">
          <div className="ab-hero-bg-circle" style={{ width: 120, height: 120, top: 20, left: 20 }} />
          <div className="ab-hero-bg-circle" style={{ width: 100, height: 100, top: 40, right: 40, animationDelay: '0.5s' }} />
          <div className="ab-hero-bg-circle" style={{ width: 80, height: 80, bottom: 40, left: '25%', animationDelay: '1s' }} />

          <div className="ab-cta-inner">
            <h2 className="ab-cta-title">
              Ready to Experience the Best in Electronic Products?
            </h2>
            <p className="ab-cta-desc">
              Discover our latest collection of smartphones, laptops, TVs, and accessories. Quality guaranteed, prices you&apos;ll love.
            </p>

            <div className="ab-cta-actions">
              <button onClick={() => navigate('/products')} className="ab-btn-primary">
                Browse Our Products
              </button>
              <button onClick={() => navigate('/contact')} className="ab-btn-outline">
                Contact Us Today
              </button>
            </div>

            <div className="ab-cta-location">
              <MapPin style={{ width: 16, height: 16 }} />
              <span>Visit us at Accra, Kingsway, Opposite GCB (Former UT Bank Building)</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}