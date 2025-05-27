import React, { useState } from "react";
import { Table, Input } from "antd";
import { SearchOutlined } from "@ant-design/icons";

const locations = [
    {
      title: "ADABRAKA",
      address: "OPPOSITE ROXY BUS STOP ADABRAKA - ACCRA",
      tel: "0264189099",
      lat: 5.558,
      lng: -0.2057,
    },
    {
      title: "ACCRA",
      address: "UTC NEAR DESPITE BUILDING",
      tel: "0561925889",
      lat: 5.552,
      lng: -0.2022,
    },
    {
      title: "CIRCLE",
      address: "NEAR ODO RICE BUILDING",
      tel: "0302250396",
      lat: 5.5599,
      lng: -0.2076,
    },
    {
      title: "CIRCLE",
      address: "OPPOSITE ODO RICE BUILDING",
      tel: "0261506861",
      lat: 5.559,
      lng: -0.207,
    },
    
    {
      title: "CIRCLE",
      address: "ADJACENT ODO RICE BUILDING",
      tel: "0509842053",
      lat: 5.5591,
      lng: -0.2069,
    },
    {
      title: "OSU",
      address: "OXFORD STREET BEHIND VODAFONE OFFICE",
      tel: "0302772103",
      lat: 5.557,
      lng: -0.182,
    },
    {
      title: "TEMA",
      address: "COMMUNITY 1 STADIUM ROAD OPPOSITE WATER WORKS",
      tel: "0303214499",
      lat: 5.678,
      lng: -0.0166,
    },
    {
      title: "MADINA",
      address: "MADINA OLD ROAD AROUND ABSA BANK, REPUBLIC BANK",
      tel: "0241184688",
      lat: 5.683,
      lng: -0.1654,
    },
    {
      title: "HAATSO",
      address: "HAATSO STATION/BEIGE CAPITAL BUILDING, OPPOSITE MTN",
      tel: "0243628837",
      lat: 5.653,
      lng: -0.213,
    },
    {
      title: "LAPAZ",
      address: "NII BOI JUNCTION OPPOSITE PRUDENTIAL BANK",
      tel: "0561944202",
      lat: 5.607,
      lng: -0.235,
    },
    {
      title: "KASOA",
      address: "OPPOSITE POLYCLINIC",
      tel: "0264084686",
      lat: 5.534,
      lng: -0.4244,
    },
    {
      title: "KOFORIDUA",
      address: "ALL NATION UNIVERSITY TOWERS, PRINCE BOATENG AROUND ABOUT",
      tel: "0268313323",
      lat: 6.09,
      lng: -0.259,
    },
    {
      title: "KUMASI",
      address: "OPPOSITE HOTEL DE KINGSWAY",
      tel: "0322041018",
      lat: 6.692,
      lng: -1.618,
    },
    {
      title: "KUMASI",
      address: "ASEDA HOUSE OPPOSITE CHALLENGE BOOKSHOP",
      tel: "0322081949",
      lat: 6.688,
      lng: -1.622,
    },
    {
      title: "KUMASI",
      address: "ADJACENT MELCOM ADUM",
      tel: "0322047303",
      lat: 6.693,
      lng: -1.619,
    },
    {
      title: "KUMASI",
      address: "NEAR BARCLAYS BANK",
      tel: "0206310483",
      lat: 6.691,
      lng: -1.6225,
    },
    {
      title: "KUMASI",
      address: "NEAR KUFFOUR CLINIC",
      tel: "0501538602",
      lat: 6.694,
      lng: -1.621,
    },
    {
      title: "KUMASI",
      address: "OPPOSITE KEJETIA",
      tel: "0501525698",
      lat: 6.69,
      lng: -1.623,
    },
    {
      title: "HO",
      address: "OPPOSITE AMEGASHI (GOD IS GREAT BUILDING)",
      tel: "0362025775",
      lat: 6.612,
      lng: 0.47,
    },
    {
      title: "HO ANNEX",
      address: "NEAR THE HO MAIN STATION",
      tel: "0501647165",
      lat: 6.6125,
      lng: 0.4695,
    },
    {
      title: "SUNYANI",
      address: "OPPOSITE COCOA BOARD",
      tel: "0202765836",
      lat: 7.34,
      lng: -2.326,
    },
    {
      title: "TECHIMAN",
      address: "TECHIMAN TAXI RANK NEAR REPUBLIC BANK",
      tel: "0352522426",
      lat: 7.583,
      lng: -1.939,
    },
    {
      title: "BEREKUM",
      address: "BEREKUM ROUNDABOUT OPPOSITE SG-SSB BANK",
      tel: "0209835344",
      lat: 7.456,
      lng: -2.586,
    },
    {
      title: "CAPE COAST",
      address: "LONDON BRIDGE OPPOSITE OLD GUINNESS DEPOT",
      tel: "0264212339",
      lat: 5.106,
      lng: -1.246,
    },
    {
      title: "TAKORADI",
      address: "CAPE COAST STATION NEAR SUPER STAR HOTEL",
      tel: "0249902589",
      lat: 4.889,
      lng: -1.755,
    },
    {
      title: "TARKWA",
      address: "TARKWA STATION NEAR THE SHELL FILLING STATION",
      tel: "0312320144",
      lat: 5.312,
      lng: -1.995,
    },
    {
      title: "TAMALE",
      address: "OLD SALAGA STATION NEAR PK",
      tel: "0265462241",
      lat: 9.407,
      lng: -0.853,
    },
    {
      title: "HOHOE",
      address: "JAHLEX STORE NEAR THE TRAFFIC LIGHT",
      tel: "0558106241",
      lat: 7.15,
      lng: 0.473,
    },
    {
      title: "WA",
      address: "ZONGO OPPOSITE MAMA'S KITCHEN",
      tel: "0261915228",
      lat: 10.06,
      lng: -2.501,
    },
    {
      title: "WA",
      address: "WA MAIN STATION",
      tel: "0507316718",
      lat: 10.0605,
      lng: -2.5005,
    },
    {
      title: "BOLGA",
      address: "COMMERCIAL STREET NEAR ACCESS BANK",
      tel: "0501538603",
      lat: 10.787,
      lng: -0.851,
    },
    {
      title: "OBUASI",
      address: "CENTRAL MOSQUE-OPPOSITE ADANSI RURAL BANK",
      tel: "0263535131",
      lat: 6.204,
      lng: -1.666,
    },
    {
      title: "SWEDRU",
      address: "OPPOSITE MELCOM",
      tel: "0557872937",
      lat: 5.532,
      lng: -0.682,
    },
    {
      title: "ASHIAMAN",
      address: "OPPOSITE MAIN LORRY STATION",
      tel: "0509570736",
      lat: 5.688,
      lng: -0.04,
    },
    {
      title: "CIRCLE SERVICE CENTER",
      address: "NEAR ODO RICE",
      tel: "0501575745",
      lat: 5.5597,
      lng: -0.208,
    },
    {
      title: "KUMASI SERVICE CENTER",
      address: "ADUM BEHIND THE OLD MELCOM BUILDING",
      tel: "0322033821",
      lat: 6.693,
      lng: -1.619,
    },
    {
      title: "TAMALE SERVICE CENTER",
      address: "ADJACENT QUALITY FIRST SHOPPING CENTER",
      tel: "0501505020",
      lat: 9.411,
      lng: -0.856,
    },
    {
      title: "TOGO",
      address: "",
      tel: "+228 92 01 97 45",
      lat: 6.137,
      lng: 1.212,
    },
  ];

const columns = [
  {
    title: "Branch",
    dataIndex: "title",
    key: "title",
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
        style={{ textDecoration: "none", color: "inherit" }}
      >
        {text}
      </a>
    ),
  },
  {
    title: "Telephone",
    dataIndex: "tel",
    key: "tel",
    render: (text) => (
      <a href={`tel:${text}`} style={{ textDecoration: "none", color: "inherit" }}>
        {text}
      </a>
    ),
  },
];

const ShopsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredLocations = locations.filter((location) => {
    const term = searchTerm.toLowerCase();
    return (
      location.title.toLowerCase().includes(term) ||
      location.address.toLowerCase().includes(term) ||
      location.tel.includes(term)
    );
  });

  return (
    <div className="p-4">
      <h2 className="text-xl font-semibold mb-4 text-center">Our Shops</h2>

      <div className="mb-4 flex justify-center">
        <Input
          placeholder="Search by name, address or telephone"
          prefix={<SearchOutlined />}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-1/2"
          allowClear
        />
      </div>

      {/* Table for larger screens */}
      <div className="hidden sm:block">
        <Table
          dataSource={filteredLocations}
          columns={columns}
          rowKey={(record, index) => index}
          pagination={{ pageSize: 10 }}
        />
      </div>

      {/* Cards for small screens */}
      <div className="grid grid-cols-1 gap-4 sm:hidden">
        {filteredLocations.map((shop, index) => (
          <div key={index} className="border rounded-md p-4 shadow-sm">
            <h3 className="text-lg font-semibold">{shop.title}</h3>
            <p>
              <strong>Address: </strong>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${shop.lat},${shop.lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline"
              >
                {shop.address || "N/A"}
              </a>
            </p>
            <p>
              <strong>Tel: </strong>
              <a href={`tel:${shop.tel}`} className="text-blue-600 underline">
                {shop.tel}
              </a>
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ShopsPage;
