import { useState, useEffect } from "react";
import { Table, Input } from "antd";
import { MapPin, Phone, Search, Navigation, Store } from "lucide-react";

const locations = [
  { title: "ADABRAKA", address: "OPPOSITE ROXY BUS STOP ADABRAKA - ACCRA", tel: "0264189099", lat: 5.558, lng: -0.2057 },
  { title: "ACCRA", address: "UTC NEAR DESPITE BUILDING", tel: "0561925889", lat: 5.552, lng: -0.2022 },
  { title: "CIRCLE", address: "NEAR ODO RICE BUILDING", tel: "0302250396", lat: 5.5599, lng: -0.2076 },
  { title: "CIRCLE", address: "OPPOSITE ODO RICE BUILDING", tel: "0261506861", lat: 5.559, lng: -0.207 },
  { title: "CIRCLE", address: "ADJACENT ODO RICE BUILDING", tel: "0509842053", lat: 5.5591, lng: -0.2069 },
  { title: "OSU", address: "OXFORD STREET BEHIND VODAFONE OFFICE", tel: "0302772103", lat: 5.557, lng: -0.182 },
  { title: "TEMA", address: "COMMUNITY 1 STADIUM ROAD OPPOSITE WATER WORKS", tel: "0303214499", lat: 5.678, lng: -0.0166 },
  { title: "MADINA", address: "MADINA OLD ROAD AROUND ABSA BANK, REPUBLIC BANK", tel: "0241184688", lat: 5.683, lng: -0.1654 },
  { title: "HAATSO", address: "HAATSO STATION/BEIGE CAPITAL BUILDING, OPPOSITE MTN", tel: "0243628837", lat: 5.653, lng: -0.213 },
  { title: "LAPAZ", address: "NII BOI JUNCTION OPPOSITE PRUDENTIAL BANK", tel: "0561944202", lat: 5.607, lng: -0.235 },
  { title: "KASOA", address: "OPPOSITE POLYCLINIC", tel: "0264084686", lat: 5.534, lng: -0.4244 },
  { title: "KOFORIDUA", address: "ALL NATION UNIVERSITY TOWERS, PRINCE BOATENG AROUND ABOUT", tel: "0268313323", lat: 6.09, lng: -0.259 },
  { title: "KUMASI", address: "OPPOSITE HOTEL DE KINGSWAY", tel: "0322041018", lat: 6.692, lng: -1.618 },
  { title: "KUMASI", address: "ASEDA HOUSE OPPOSITE CHALLENGE BOOKSHOP", tel: "0322081949", lat: 6.688, lng: -1.622 },
  { title: "KUMASI", address: "ADJACENT MELCOM ADUM", tel: "0322047303", lat: 6.693, lng: -1.619 },
  { title: "KUMASI", address: "NEAR BARCLAYS BANK", tel: "0206310483", lat: 6.691, lng: -1.6225 },
  { title: "KUMASI", address: "NEAR KUFFOUR CLINIC", tel: "0501538602", lat: 6.694, lng: -1.621 },
  { title: "KUMASI", address: "OPPOSITE KEJETIA", tel: "0501525698", lat: 6.69, lng: -1.623 },
  { title: "HO", address: "OPPOSITE AMEGASHI (GOD IS GREAT BUILDING)", tel: "0362025775", lat: 6.612, lng: 0.47 },
  { title: "HO ANNEX", address: "NEAR THE HO MAIN STATION", tel: "0501647165", lat: 6.6125, lng: 0.4695 },
  { title: "SUNYANI", address: "OPPOSITE COCOA BOARD", tel: "0202765836", lat: 7.34, lng: -2.326 },
  { title: "TECHIMAN", address: "TECHIMAN TAXI RANK NEAR REPUBLIC BANK", tel: "0352522426", lat: 7.583, lng: -1.939 },
  { title: "BEREKUM", address: "BEREKUM ROUNDABOUT OPPOSITE SG-SSB BANK", tel: "0209835344", lat: 7.456, lng: -2.586 },
  { title: "CAPE COAST", address: "LONDON BRIDGE OPPOSITE OLD GUINNESS DEPOT", tel: "0264212339", lat: 5.106, lng: -1.246 },
  { title: "TAKORADI", address: "CAPE COAST STATION NEAR SUPER STAR HOTEL", tel: "0249902589", lat: 4.889, lng: -1.755 },
  { title: "TARKWA", address: "TARKWA STATION NEAR THE SHELL FILLING STATION", tel: "0312320144", lat: 5.312, lng: -1.995 },
  { title: "TAMALE", address: "OLD SALAGA STATION NEAR PK", tel: "0265462241", lat: 9.407, lng: -0.853 },
  { title: "HOHOE", address: "JAHLEX STORE NEAR THE TRAFFIC LIGHT", tel: "0558106241", lat: 7.15, lng: 0.473 },
  { title: "WA", address: "ZONGO OPPOSITE MAMA'S KITCHEN", tel: "0261915228", lat: 10.06, lng: -2.501 },
  { title: "WA", address: "WA MAIN STATION", tel: "0507316718", lat: 10.0605, lng: -2.5005 },
  { title: "BOLGA", address: "COMMERCIAL STREET NEAR ACCESS BANK", tel: "0501538603", lat: 10.787, lng: -0.851 },
  { title: "OBUASI", address: "CENTRAL MOSQUE-OPPOSITE ADANSI RURAL BANK", tel: "0263535131", lat: 6.204, lng: -1.666 },
  { title: "SWEDRU", address: "OPPOSITE MELCOM", tel: "0557872937", lat: 5.532, lng: -0.682 },
  { title: "ASHIAMAN", address: "OPPOSITE MAIN LORRY STATION", tel: "0509570736", lat: 5.688, lng: -0.04 },
  { title: "CIRCLE SERVICE CENTER", address: "NEAR ODO RICE", tel: "0501575745", lat: 5.5597, lng: -0.208 },
  { title: "KUMASI SERVICE CENTER", address: "ADUM BEHIND THE OLD MELCOM BUILDING", tel: "0322033821", lat: 6.693, lng: -1.619 },
  { title: "TAMALE SERVICE CENTER", address: "ADJACENT QUALITY FIRST SHOPPING CENTER", tel: "0501505020", lat: 9.411, lng: -0.856 },
  { title: "TOGO", address: "", tel: "+228 92 01 97 45", lat: 6.137, lng: 1.212 },
];

const ShopsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const filteredLocations = locations.filter((location) => {
    const term = searchTerm.toLowerCase();
    return (
      location.title.toLowerCase().includes(term) ||
      location.address.toLowerCase().includes(term) ||
      location.tel.includes(term)
    );
  });

  const columns = [
    {
      title: "Branch",
      dataIndex: "title",
      key: "title",
      render: (text) => <span className="sh-branch-name">{text}</span>,
    },
    {
      title: "Address",
      dataIndex: "address",
      key: "address",
      render: (text, record) => (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${record.lat},${record.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="sh-address-link"
        >
          <MapPin style={{ width: 13, height: 13, flexShrink: 0, marginTop: 2 }} />
          <span>{text || "View on Map"}</span>
        </a>
      ),
    },
    {
      title: "Telephone",
      dataIndex: "tel",
      key: "tel",
      render: (text) => (
        <a href={`tel:${text}`} className="sh-tel-link">
          <Phone style={{ width: 13, height: 13, flexShrink: 0 }} />
          <span>{text}</span>
        </a>
      ),
    },
    {
      title: "",
      key: "action",
      width: 50,
      render: (_, record) => (
        <a
          href={`https://www.google.com/maps/search/?api=1&query=${record.lat},${record.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="sh-directions-btn"
          title="Get Directions"
        >
          <Navigation style={{ width: 14, height: 14 }} />
        </a>
      ),
    },
  ];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Source+Sans+3:wght@300;400;500;600;700;800;900&display=swap');

        :root {
          --sh-font: 'Source Sans 3', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          --sh-green: #14532d;
          --sh-green-mid: #166534;
          --sh-green-accent: #22c55e;
          --sh-green-light: #dcfce7;
          --sh-green-lighter: #f0fdf4;
          --sh-dark: #1a1a1a;
          --sh-mid: #555;
          --sh-light: #888;
          --sh-border: #e0e0e0;
          --sh-bg: #f7f7f7;
          --sh-radius: 4px;
        }

        .sh-root, .sh-root * {
          font-family: var(--sh-font) !important;
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .sh-root { min-height: 100vh; background: #fff; }

        .sh-container {
          max-width: 1100px;
          margin: 0 auto;
          padding: 24px 16px;
        }
        @media (min-width: 768px) {
          .sh-container { padding: 32px 40px; }
        }

        /* ==================== HEADER ==================== */

        .sh-page-header {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 24px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--sh-border);
        }

        .sh-page-header-accent {
          width: 4px; height: 28px; border-radius: 2px;
          background: var(--sh-green); flex-shrink: 0;
        }

        .sh-page-title {
          font-size: 22px; font-weight: 800; color: var(--sh-dark);
          letter-spacing: -0.02em; margin: 0; line-height: 1.2;
        }
        @media (min-width: 768px) { .sh-page-title { font-size: 26px; } }

        .sh-page-count {
          font-size: 13px; font-weight: 500; color: var(--sh-light); margin-top: 2px;
        }

        .sh-page-header-line {
          flex: 1; height: 1px; background: var(--sh-border); display: none;
        }
        @media (min-width: 768px) { .sh-page-header-line { display: block; } }

        /* ==================== SEARCH ==================== */

        .sh-search-wrap {
          margin-bottom: 20px;
          max-width: 480px;
        }

        .sh-search-wrap .ant-input-affix-wrapper {
          border-radius: var(--sh-radius) !important;
          border: 1px solid var(--sh-border) !important;
          padding: 8px 12px !important;
          font-family: var(--sh-font) !important;
          font-size: 14px !important;
          transition: border-color 0.15s !important;
        }

        .sh-search-wrap .ant-input-affix-wrapper:hover,
        .sh-search-wrap .ant-input-affix-wrapper-focused {
          border-color: var(--sh-green-accent) !important;
          box-shadow: 0 0 0 2px rgba(34,197,94,0.1) !important;
        }

        .sh-search-wrap .ant-input {
          font-family: var(--sh-font) !important;
          font-size: 14px !important;
        }

        /* ==================== STATS BAR ==================== */

        .sh-stats-bar {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          flex-wrap: wrap;
        }

        .sh-stats-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 5px 12px;
          background: var(--sh-green-lighter);
          border: 1px solid #bbf7d0;
          border-radius: 100px;
          font-size: 12px;
          font-weight: 700;
          color: var(--sh-green);
        }

        .sh-stats-regions {
          font-size: 13px;
          font-weight: 500;
          color: var(--sh-light);
        }

        /* ==================== TABLE ==================== */

        .sh-table-wrap {
          display: none;
          border: 1px solid var(--sh-border);
          border-radius: var(--sh-radius);
          overflow: hidden;
        }
        @media (min-width: 768px) { .sh-table-wrap { display: block; } }

        .sh-table-wrap .ant-table-thead > tr > th {
          background: var(--sh-bg) !important;
          border-bottom: 1px solid var(--sh-border) !important;
          font-size: 11px !important;
          font-weight: 700 !important;
          text-transform: uppercase !important;
          letter-spacing: 0.04em !important;
          color: var(--sh-light) !important;
          padding: 12px 16px !important;
          font-family: var(--sh-font) !important;
        }

        .sh-table-wrap .ant-table-tbody > tr > td {
          padding: 12px 16px !important;
          border-bottom: 1px solid #f0f0f0 !important;
          font-size: 14px !important;
          font-family: var(--sh-font) !important;
          color: var(--sh-dark) !important;
        }

        .sh-table-wrap .ant-table-tbody > tr:last-child > td {
          border-bottom: none !important;
        }

        .sh-table-wrap .ant-table-tbody > tr:hover > td {
          background: var(--sh-green-lighter) !important;
        }

        .sh-table-wrap .ant-pagination {
          padding: 12px 16px !important;
          font-family: var(--sh-font) !important;
        }

        .sh-table-wrap .ant-pagination-item-active {
          background: var(--sh-green) !important;
          border-color: var(--sh-green) !important;
        }
        .sh-table-wrap .ant-pagination-item-active a {
          color: #fff !important;
        }

        .sh-branch-name {
          font-size: 14px;
          font-weight: 700;
          color: var(--sh-dark);
          letter-spacing: -0.01em;
        }

        .sh-address-link {
          display: inline-flex;
          align-items: flex-start;
          gap: 6px;
          color: var(--sh-mid);
          text-decoration: none;
          font-size: 13px;
          font-weight: 500;
          line-height: 1.4;
          transition: color 0.15s;
        }
        .sh-address-link:hover {
          color: var(--sh-green);
        }

        .sh-tel-link {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          color: var(--sh-mid);
          text-decoration: none;
          font-size: 13px;
          font-weight: 600;
          font-family: 'SF Mono', 'Fira Code', monospace, var(--sh-font);
          transition: color 0.15s;
        }
        .sh-tel-link:hover {
          color: var(--sh-green);
        }

        .sh-directions-btn {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: var(--sh-radius);
          border: 1px solid var(--sh-border);
          color: var(--sh-light);
          background: #fff;
          transition: all 0.15s;
          text-decoration: none;
        }
        .sh-directions-btn:hover {
          background: var(--sh-green-lighter);
          border-color: var(--sh-green-accent);
          color: var(--sh-green);
        }

        /* ==================== MOBILE CARDS ==================== */

        .sh-mobile-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        @media (min-width: 768px) { .sh-mobile-list { display: none; } }

        .sh-mobile-card {
          border: 1px solid var(--sh-border);
          border-radius: var(--sh-radius);
          padding: 14px;
          background: #fff;
          transition: all 0.15s;
        }
        .sh-mobile-card:hover {
          border-color: var(--sh-green-accent);
          box-shadow: 0 2px 8px rgba(20, 83, 45, 0.06);
        }

        .sh-mobile-card-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 10px;
        }

        .sh-mobile-card-title {
          font-size: 15px;
          font-weight: 700;
          color: var(--sh-dark);
          letter-spacing: -0.01em;
        }

        .sh-mobile-card-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 3px 8px;
          background: var(--sh-green-lighter);
          border: 1px solid #bbf7d0;
          border-radius: 100px;
          font-size: 10px;
          font-weight: 700;
          color: var(--sh-green);
          text-transform: uppercase;
          letter-spacing: 0.03em;
        }

        .sh-mobile-card-body {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .sh-mobile-card-row {
          display: flex;
          align-items: flex-start;
          gap: 8px;
        }

        .sh-mobile-card-icon {
          width: 28px;
          height: 28px;
          border-radius: var(--sh-radius);
          background: var(--sh-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          color: var(--sh-light);
        }

        .sh-mobile-card-text {
          font-size: 13px;
          font-weight: 500;
          color: var(--sh-mid);
          line-height: 1.4;
          padding-top: 4px;
        }

        .sh-mobile-card-text a {
          color: var(--sh-mid);
          text-decoration: none;
          transition: color 0.15s;
        }
        .sh-mobile-card-text a:hover {
          color: var(--sh-green);
        }

        .sh-mobile-card-tel {
          font-family: 'SF Mono', 'Fira Code', monospace, var(--sh-font);
          font-weight: 600;
        }

        .sh-mobile-card-actions {
          display: flex;
          gap: 8px;
          margin-top: 12px;
          padding-top: 12px;
          border-top: 1px solid #f0f0f0;
        }

        .sh-mobile-action-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px;
          border-radius: var(--sh-radius);
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.15s;
          font-family: var(--sh-font);
          cursor: pointer;
          border: none;
        }

        .sh-mobile-action-call {
          background: var(--sh-green);
          color: #fff;
        }
        .sh-mobile-action-call:hover {
          background: var(--sh-green-mid);
        }

        .sh-mobile-action-map {
          background: #fff;
          color: var(--sh-mid);
          border: 1px solid var(--sh-border) !important;
        }
        .sh-mobile-action-map:hover {
          border-color: var(--sh-green-accent) !important;
          color: var(--sh-green);
        }

        /* ==================== EMPTY ==================== */

        .sh-empty {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          padding: 60px 24px;
        }

        .sh-empty-icon {
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: var(--sh-bg);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
          border: 1px solid var(--sh-border);
          color: var(--sh-light);
        }

        .sh-empty-title {
          font-size: 18px;
          font-weight: 700;
          color: var(--sh-dark);
          margin-bottom: 6px;
        }

        .sh-empty-desc {
          font-size: 14px;
          color: var(--sh-light);
          max-width: 320px;
          line-height: 1.5;
        }
      `}</style>

      <div className="sh-root">
        <div className="sh-container">
          {/* Page Header */}
          <div className="sh-page-header">
            <div className="sh-page-header-accent" />
            <div>
              <h1 className="sh-page-title">Our Shops</h1>
              <p className="sh-page-count">
                {filteredLocations.length} location{filteredLocations.length !== 1 ? "s" : ""} found
              </p>
            </div>
            <div className="sh-page-header-line" />
          </div>

          {/* Search */}
          <div className="sh-search-wrap">
            <Input
              placeholder="Search by branch, address or telephone..."
              prefix={<Search style={{ width: 16, height: 16, color: "#888" }} />}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </div>

          {/* Stats */}
          <div className="sh-stats-bar">
            <div className="sh-stats-badge">
              <Store style={{ width: 13, height: 13 }} />
              {filteredLocations.length} Branches
            </div>
            <span className="sh-stats-regions">
              Across Ghana & Togo
            </span>
          </div>

          {/* Content */}
          {filteredLocations.length === 0 ? (
            <div className="sh-empty">
              <div className="sh-empty-icon">
                <Search style={{ width: 28, height: 28 }} />
              </div>
              <div className="sh-empty-title">No locations found</div>
              <div className="sh-empty-desc">
                Try adjusting your search term to find a branch near you.
              </div>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="sh-table-wrap">
                <Table
                  dataSource={filteredLocations}
                  columns={columns}
                  rowKey={(_, index) => index}
                  pagination={{ pageSize: 10 }}
                  size="middle"
                />
              </div>

              {/* Mobile Cards */}
              <div className="sh-mobile-list">
                {filteredLocations.map((shop, index) => (
                  <div key={index} className="sh-mobile-card">
                    <div className="sh-mobile-card-header">
                      <div className="sh-mobile-card-title">{shop.title}</div>
                      <div className="sh-mobile-card-badge">
                        <Store style={{ width: 10, height: 10 }} />
                        Branch
                      </div>
                    </div>

                    <div className="sh-mobile-card-body">
                      {shop.address && (
                        <div className="sh-mobile-card-row">
                          <div className="sh-mobile-card-icon">
                            <MapPin style={{ width: 14, height: 14 }} />
                          </div>
                          <div className="sh-mobile-card-text">
                            <a
                              href={`https://www.google.com/maps/search/?api=1&query=${shop.lat},${shop.lng}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              {shop.address}
                            </a>
                          </div>
                        </div>
                      )}

                      <div className="sh-mobile-card-row">
                        <div className="sh-mobile-card-icon">
                          <Phone style={{ width: 14, height: 14 }} />
                        </div>
                        <div className="sh-mobile-card-text sh-mobile-card-tel">
                          <a href={`tel:${shop.tel}`}>{shop.tel}</a>
                        </div>
                      </div>
                    </div>

                    <div className="sh-mobile-card-actions">
                      <a href={`tel:${shop.tel}`} className="sh-mobile-action-btn sh-mobile-action-call">
                        <Phone style={{ width: 13, height: 13 }} />
                        Call Now
                      </a>
                      <a
                        href={`https://www.google.com/maps/search/?api=1&query=${shop.lat},${shop.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="sh-mobile-action-btn sh-mobile-action-map"
                      >
                        <Navigation style={{ width: 13, height: 13 }} />
                        Directions
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ShopsPage;