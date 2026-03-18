import React, { useState, useEffect } from "react";
import {
  Mail,
  Phone,
  MapPin,
  Clock,
  Send,
  User,
  MessageSquare,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import {
  FaFacebookF,
  FaXTwitter,
  FaTiktok,
  FaWhatsapp,
  FaInstagram,
} from "react-icons/fa6";

export default function ContactUsPage() {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const [focusedField, setFocusedField] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      setSubmitted(false);
      setFormData({ name: "", email: "", subject: "", message: "" });
    }, 3000);
  };

  const handleWhatsAppClick = () => {
    const phoneNumber = "233503607980";
    const message = "Hello! I'd like to get in touch with you.";
    window.open(
      `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`,
      "_blank"
    );
  };

  const contactDetails = [
    {
      icon: Phone,
      label: "Phone",
      value: "+233 302 225 651",
      href: "tel:+233302225651",
      color: "#166534",
      bg: "#f0fdf4",
    },
    {
      icon: Mail,
      label: "Email",
      value: "it@frankotrading.com",
      href: "mailto:it@frankotrading.com",
      color: "#166534",
      bg: "#f0fdf4",
    },
    {
      icon: MapPin,
      label: "Address",
      value: "Kingsway, Accra – Opposite GCB (Former UT Bank Building)",
      color: "#166534",
      bg: "#f0fdf4",
    },
    {
      icon: Clock,
      label: "Business Hours",
      value: "Mon – Sat: 8:00 AM – 6:00 PM | Holidays: 8:00 AM – 5:00 PM",
      color: "#166534",
      bg: "#f0fdf4",
    },
  ];

  const socials = [
    {
      href: "https://www.facebook.com/frankotradingenterprise",
      icon: FaFacebookF,
      label: "Facebook",
      bg: "#1877f2",
      hover: "#1565c0",
    },
    {
      href: "https://instagram.com/frankotrading_fte",
      icon: FaInstagram,
      label: "Instagram",
      bg: "linear-gradient(135deg, #833ab4, #fd1d1d, #fcb045)",
      hover: "linear-gradient(135deg, #6a2d91, #d41414, #d4963b)",
    },
    {
      href: "https://x.com/frankotrading1",
      icon: FaXTwitter,
      label: "X",
      bg: "#000",
      hover: "#333",
    },
    {
      href: "https://www.tiktok.com/@frankotrading",
      icon: FaTiktok,
      label: "TikTok",
      bg: "#000",
      hover: "#333",
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700;800;900&display=swap');

        .cu-root, .cu-root * {
          font-family: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif !important;
          -webkit-font-smoothing: antialiased;
          box-sizing: border-box;
        }

        .cu-root {
          min-height: 100vh;
          background: #f8faf9;
        }

        /* ========== HERO ========== */
        .cu-hero {
          position: relative;
          background: linear-gradient(135deg, #166534 0%, #15803d 50%, #16a34a 100%);
          overflow: hidden;
        }

        .cu-hero-overlay {
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.04'%3E%3Cpath d='m36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm-22 22v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E") repeat;
        }

        .cu-hero-inner {
          position: relative;
          max-width: 1100px;
          margin: 0 auto;
          padding: 32px 16px;
          text-align: center;
        }
        @media (min-width: 768px) {
          .cu-hero-inner { padding: 52px 40px; }
        }

        .cu-hero-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: rgba(255,255,255,0.15);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255,255,255,0.2);
          padding: 5px 14px;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 600;
          color: #fff;
          margin-bottom: 14px;
          letter-spacing: 0.03em;
        }

        .cu-hero-title {
          font-size: 28px;
          font-weight: 800;
          color: #fff;
          margin: 0 0 8px;
          letter-spacing: -0.02em;
          line-height: 1.15;
        }
        @media (min-width: 768px) {
          .cu-hero-title { font-size: 42px; margin-bottom: 12px; }
        }

        .cu-hero-desc {
          font-size: 15px;
          font-weight: 400;
          color: rgba(255,255,255,0.85);
          max-width: 500px;
          margin: 0 auto;
          line-height: 1.55;
        }
        @media (min-width: 768px) {
          .cu-hero-desc { font-size: 17px; }
        }

        .cu-hero-circle-1 {
          position: absolute;
          top: -40px;
          right: -40px;
          width: 120px;
          height: 120px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
        }
        .cu-hero-circle-2 {
          position: absolute;
          bottom: -30px;
          left: -30px;
          width: 90px;
          height: 90px;
          border-radius: 50%;
          background: rgba(255,255,255,0.06);
        }

        /* ========== BREADCRUMB ========== */
        .cu-breadcrumb {
          max-width: 1100px;
          margin: 0 auto;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          gap: 4px;
          font-size: 12px;
          font-weight: 500;
          color: #9ca3af;
        }
        @media (min-width: 768px) {
          .cu-breadcrumb { padding: 14px 40px; }
        }
        .cu-breadcrumb a {
          color: #166534;
          text-decoration: none;
          transition: color 0.15s;
        }
        .cu-breadcrumb a:hover { color: #14532d; }

        /* ========== MAIN GRID ========== */
        .cu-main {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 16px 40px;
        }
        @media (min-width: 768px) {
          .cu-main { padding: 0 40px 56px; }
        }

        .cu-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 900px) {
          .cu-grid { grid-template-columns: 1fr 1fr; gap: 24px; }
        }

        /* ========== CARDS ========== */
        .cu-card {
          background: #fff;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          transition: box-shadow 0.2s, transform 0.2s;
        }
        .cu-card:hover {
          box-shadow: 0 8px 30px rgba(0,0,0,0.06);
          transform: translateY(-1px);
        }

        .cu-card-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px 20px 0;
        }

        .cu-card-icon {
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 10px;
          flex-shrink: 0;
        }

        .cu-card-title {
          font-size: 17px;
          font-weight: 700;
          color: #111827;
          margin: 0;
          letter-spacing: -0.01em;
        }

        .cu-card-body {
          padding: 16px 20px 20px;
        }

        /* ========== CONTACT DETAILS ========== */
        .cu-detail-list {
          display: flex;
          flex-direction: column;
          gap: 14px;
        }

        .cu-detail-item {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 10px 12px;
          border-radius: 8px;
          background: #f8faf9;
          border: 1px solid #f0f0f0;
          transition: all 0.15s;
        }
        .cu-detail-item:hover {
          background: #f0fdf4;
          border-color: #bbf7d0;
        }

        .cu-detail-icon {
          width: 36px;
          height: 36px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 8px;
          flex-shrink: 0;
        }

        .cu-detail-label {
          font-size: 11px;
          font-weight: 700;
          color: #6b7280;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          margin: 0 0 2px;
        }

        .cu-detail-value {
          font-size: 13.5px;
          font-weight: 500;
          color: #374151;
          line-height: 1.45;
          margin: 0;
        }

        .cu-detail-value a {
          color: #166534;
          text-decoration: none;
          font-weight: 600;
          transition: color 0.15s;
        }
        .cu-detail-value a:hover {
          color: #14532d;
          text-decoration: underline;
        }

        /* ========== WHATSAPP ========== */
        .cu-wa-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          width: 100%;
          padding: 12px 20px;
          background: #166534;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.01em;
        }
        .cu-wa-btn:hover {
          background: #14532d;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(22,101,52,0.3);
        }

        .cu-wa-hint {
          font-size: 12px;
          color: #9ca3af;
          text-align: center;
          margin: 8px 0 0;
          font-weight: 400;
        }

        /* ========== SOCIALS ========== */
        .cu-socials-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 10px;
        }

        .cu-social-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 11px 14px;
          border-radius: 8px;
          color: #fff;
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          transition: all 0.2s;
          border: none;
          cursor: pointer;
        }
        .cu-social-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 14px rgba(0,0,0,0.15);
          color: #fff;
        }

        /* ========== FORM ========== */
        .cu-form-row {
          display: grid;
          grid-template-columns: 1fr;
          gap: 14px;
          margin-bottom: 14px;
        }
        @media (min-width: 500px) {
          .cu-form-row-2 { grid-template-columns: 1fr 1fr; }
        }

        .cu-field {
          position: relative;
        }

        .cu-field-icon {
          position: absolute;
          left: 12px;
          top: 50%;
          transform: translateY(-50%);
          width: 16px;
          height: 16px;
          color: #9ca3af;
          transition: color 0.2s;
          pointer-events: none;
          z-index: 1;
        }
        .cu-field-icon-ta {
          top: 14px;
          transform: none;
        }

        .cu-field.focused .cu-field-icon {
          color: #166534;
        }

        .cu-input {
          width: 100%;
          padding: 11px 14px 11px 38px;
          border: 1.5px solid #e5e7eb;
          border-radius: 8px;
          font-size: 13.5px;
          font-weight: 500;
          color: #1f2937;
          background: #fff;
          outline: none;
          transition: all 0.2s;
          font-family: inherit !important;
        }
        .cu-input::placeholder {
          color: #b0b7c3;
          font-weight: 400;
        }
        .cu-input:focus {
          border-color: #166534;
          box-shadow: 0 0 0 3px rgba(22,101,52,0.08);
        }

        .cu-textarea {
          resize: none;
          min-height: 130px;
        }

        .cu-submit-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          width: 100%;
          padding: 12px 24px;
          background: #166534;
          color: #fff;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s;
          letter-spacing: 0.01em;
          margin-top: 4px;
        }
        .cu-submit-btn:hover {
          background: #14532d;
          transform: translateY(-1px);
          box-shadow: 0 4px 14px rgba(22,101,52,0.3);
        }

        .cu-success-msg {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          padding: 12px;
          background: #f0fdf4;
          border: 1px solid #bbf7d0;
          border-radius: 8px;
          color: #166534;
          font-size: 13px;
          font-weight: 600;
          margin-top: 12px;
        }

        /* ========== MAP ========== */
        .cu-map-section {
          max-width: 1100px;
          margin: 0 auto;
          padding: 0 16px 40px;
        }
        @media (min-width: 768px) {
          .cu-map-section { padding: 0 40px 56px; }
        }

        .cu-map-card {
          background: #fff;
          border-radius: 12px;
          border: 1px solid #e5e7eb;
          overflow: hidden;
          transition: box-shadow 0.2s;
        }
        .cu-map-card:hover {
          box-shadow: 0 8px 30px rgba(0,0,0,0.06);
        }

        .cu-map-header {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 18px 20px;
          border-bottom: 1px solid #f3f4f6;
        }

        .cu-map-iframe {
          width: 100%;
          height: 300px;
          border: none;
          display: block;
        }
        @media (min-width: 768px) {
          .cu-map-iframe { height: 380px; }
        }

        /* ========== GREEN ACCENT LINE ========== */
        .cu-accent-top {
          height: 3px;
          background: linear-gradient(90deg, #166534, #22c55e, #166534);
        }
      `}</style>

      <div className="cu-root">
        {/* Hero */}
        <div className="cu-hero">
          <div className="cu-hero-overlay" />
          <div className="cu-hero-inner">
            <div className="cu-hero-badge">
              <Mail style={{ width: 12, height: 12 }} />
              We're here to help
            </div>
            <h1 className="cu-hero-title">Get In Touch</h1>
            <p className="cu-hero-desc">
              Have a question, feedback, or need support? Reach out and we'll
              respond as soon as possible.
            </p>
          </div>
          <div className="cu-hero-circle-1" />
          <div className="cu-hero-circle-2" />
        </div>

        {/* Breadcrumb */}
        <div className="cu-breadcrumb">
          <a href="/">Home</a>
          <ChevronRight style={{ width: 12, height: 12, color: "#d1d5db" }} />
          <span>Contact Us</span>
        </div>

        {/* Main Grid */}
        <div className="cu-main">
          <div className="cu-grid">
            {/* LEFT COLUMN */}
            <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
              {/* Contact Details Card */}
              <div className="cu-card">
                <div className="cu-accent-top" />
                <div className="cu-card-header">
                  <div
                    className="cu-card-icon"
                    style={{ background: "#f0fdf4" }}
                  >
                    <Phone style={{ width: 18, height: 18, color: "#166534" }} />
                  </div>
                  <h2 className="cu-card-title">Contact Information</h2>
                </div>
                <div className="cu-card-body">
                  <div className="cu-detail-list">
                    {contactDetails.map((item, i) => {
                      const Icon = item.icon;
                      return (
                        <div className="cu-detail-item" key={i}>
                          <div
                            className="cu-detail-icon"
                            style={{ background: item.bg }}
                          >
                            <Icon
                              style={{
                                width: 16,
                                height: 16,
                                color: item.color,
                              }}
                            />
                          </div>
                          <div>
                            <p className="cu-detail-label">{item.label}</p>
                            <p className="cu-detail-value">
                              {item.href ? (
                                <a href={item.href}>{item.value}</a>
                              ) : (
                                item.value
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* WhatsApp Card */}
              <div className="cu-card">
                <div
                  className="cu-accent-top"
                  style={{
                    background:
                      "linear-gradient(90deg, #166534, #22c55e, #166534)",
                  }}
                />
                <div className="cu-card-header">
                  <div
                    className="cu-card-icon"
                    style={{ background: "#f0fdf4" }}
                  >
                    <FaWhatsapp
                      style={{ fontSize: 18, color: "#166534" }}
                    />
                  </div>
                  <h2 className="cu-card-title">Quick Chat</h2>
                </div>
                <div className="cu-card-body">
                  <button onClick={handleWhatsAppClick} className="cu-wa-btn">
                    <FaWhatsapp style={{ fontSize: 18 }} />
                    Chat with us on WhatsApp
                    <ArrowRight style={{ width: 16, height: 16 }} />
                  </button>
                  <p className="cu-wa-hint">
                    Typically replies within a few minutes
                  </p>
                </div>
              </div>

              {/* Social Media Card */}
              <div className="cu-card">
                <div
                  className="cu-accent-top"
                  style={{
                    background:
                      "linear-gradient(90deg, #166534, #22c55e, #166534)",
                  }}
                />
                <div className="cu-card-header">
                  <div
                    className="cu-card-icon"
                    style={{ background: "#f0fdf4" }}
                  >
                    <MessageSquare
                      style={{ width: 18, height: 18, color: "#166534" }}
                    />
                  </div>
                  <h2 className="cu-card-title">Follow Us</h2>
                </div>
                <div className="cu-card-body">
                  <div className="cu-socials-grid">
                    {socials.map((s) => {
                      const Icon = s.icon;
                      const isGradient = s.bg.includes("gradient");
                      return (
                        <a
                          key={s.label}
                          href={s.href}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="cu-social-btn"
                          style={{
                            background: s.bg,
                          }}
                          onMouseEnter={(e) => {
                            if (isGradient)
                              e.currentTarget.style.background = s.hover;
                            else e.currentTarget.style.background = s.hover;
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = s.bg;
                          }}
                        >
                          <Icon style={{ fontSize: 16 }} />
                          {s.label}
                        </a>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* RIGHT COLUMN - Contact Form */}
            <div className="cu-card" style={{ alignSelf: "start" }}>
              <div className="cu-accent-top" />
              <div className="cu-card-header">
                <div
                  className="cu-card-icon"
                  style={{ background: "#f0fdf4" }}
                >
                  <Send style={{ width: 18, height: 18, color: "#166534" }} />
                </div>
                <h2 className="cu-card-title">Send us a Message</h2>
              </div>
              <div className="cu-card-body">
                <form onSubmit={handleSubmit}>
                  <div className="cu-form-row cu-form-row-2">
                    <div
                      className={`cu-field ${
                        focusedField === "name" ? "focused" : ""
                      }`}
                    >
                      <User className="cu-field-icon" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField("name")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Your Name"
                        className="cu-input"
                        required
                      />
                    </div>
                    <div
                      className={`cu-field ${
                        focusedField === "email" ? "focused" : ""
                      }`}
                    >
                      <Mail className="cu-field-icon" />
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField("email")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Your Email"
                        className="cu-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="cu-form-row">
                    <div
                      className={`cu-field ${
                        focusedField === "subject" ? "focused" : ""
                      }`}
                    >
                      <MessageSquare className="cu-field-icon" />
                      <input
                        type="text"
                        name="subject"
                        value={formData.subject}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField("subject")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Subject"
                        className="cu-input"
                        required
                      />
                    </div>
                  </div>

                  <div className="cu-form-row">
                    <div
                      className={`cu-field ${
                        focusedField === "message" ? "focused" : ""
                      }`}
                    >
                      <MessageSquare className="cu-field-icon cu-field-icon-ta" />
                      <textarea
                        name="message"
                        value={formData.message}
                        onChange={handleInputChange}
                        onFocus={() => setFocusedField("message")}
                        onBlur={() => setFocusedField(null)}
                        placeholder="Write your message here..."
                        className="cu-input cu-textarea"
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="cu-submit-btn">
                    <Send style={{ width: 16, height: 16 }} />
                    Send Message
                  </button>

                  {submitted && (
                    <div className="cu-success-msg">
                      ✓ Thank you! Your message has been sent successfully.
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="cu-map-section">
          <div className="cu-map-card">
            <div className="cu-accent-top" />
            <div className="cu-map-header">
              <div className="cu-card-icon" style={{ background: "#f0fdf4" }}>
                <MapPin style={{ width: 18, height: 18, color: "#166534" }} />
              </div>
              <h2 className="cu-card-title">Find Us Here</h2>
            </div>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3970.7967832195693!2d-0.21468088525708!3d5.554453895049607!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xfdf91005d5d68d5%3A0x1ff3320f1a7fa06e!2sFranko%20Online!5e0!3m2!1sen!2sgh!4v1655892345678!5m2!1sen!2sgh"
              className="cu-map-iframe"
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Franko Trading Location"
            />
          </div>
        </div>
      </div>
    </>
  );
}