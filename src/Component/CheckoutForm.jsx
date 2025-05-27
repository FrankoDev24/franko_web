import React, { useState, useEffect } from "react";
import {Input,
  Select,
  Typography,Modal,
  Form,
} from "antd";
import {EnvironmentOutlined,
  PhoneOutlined,
  UserOutlined,
  FileTextOutlined,
  AimOutlined,
  PushpinOutlined,
  SaveOutlined,
} from "@ant-design/icons";

const { TextArea } = Input;
const { Option } = Select;


const CheckoutForm = ({
  customerName,
  setCustomerName,
  customerNumber,
  setCustomerNumber,
  setDeliveryInfo,
  deliveryInfo,
  orderNote,
  setOrderNote,
  locations,
}) => {
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedTown, setSelectedTown] = useState(null);
  const [deliveryFee, setDeliveryFee] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!isModalOpen) {
      const savedInfo = localStorage.getItem("deliveryInfo");
      if (savedInfo) {
        const parsedInfo = JSON.parse(savedInfo);
        if (parsedInfo?.address && parsedInfo?.fee !== undefined) {
          setDeliveryInfo(parsedInfo);
          setDeliveryFee(Number(parsedInfo.fee));
        }
      }
    }
  }, [isModalOpen, setDeliveryInfo]);

  const handleRegionChange = (region) => {
    setSelectedRegion(region);
    setSelectedTown(null);
    setDeliveryFee(null);
  };

  const handleTownChange = (townName) => {
    const regionData = locations.find((loc) => loc.region === selectedRegion);
    const townData = regionData?.towns.find((town) => town.name === townName);
    if (townData) {
      setSelectedTown(townName);
      setDeliveryFee(townData.delivery_fee);
    }
  };

  const handleSaveLocation = () => {
    if (selectedRegion && selectedTown && deliveryFee !== null) {
      const fullAddress = `${selectedTown} (${selectedRegion})`;
      const updatedDeliveryInfo = {
        address: fullAddress,
        fee: deliveryFee,
      };
      setDeliveryInfo(updatedDeliveryInfo);
      setDeliveryFee(deliveryFee);
      localStorage.setItem("deliveryInfo", JSON.stringify(updatedDeliveryInfo));
      window.dispatchEvent(new Event("storage"));
      setIsModalOpen(false);
    }
  };

  return (
    <Form layout="vertical" className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
   
   <input
    type="text"
    className="w-full border p-2 mb-2"
    value={customerName}
    onChange={(e) => setCustomerName(e.target.value)}
    placeholder="Full Name"
  />
  <input
    type="text"
    className="w-full border p-2 mb-2"
    value={customerNumber}
    onChange={(e) => setCustomerNumber(e.target.value)}
    placeholder="Phone Number"
  />


      <Form.Item label="Delivery Address">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-gray-50 p-4 rounded-md border border-gray-200">
          <div className="flex-1 text-sm text-gray-700">
            {deliveryInfo?.address ? (
              <>
                <p className="flex items-center gap-2 mb-1">
                  <EnvironmentOutlined className="text-green-500" />
                  {deliveryInfo.address}
                </p>
                <p className="text-green-600 text-xs">
                  Delivery Fee:{" "}
                  <strong>{deliveryInfo.fee === 0 ? "N/A" : `₵${deliveryInfo.fee}`}</strong>
                </p>
              </>
            ) : (
              "No address selected"
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
          >
            <AimOutlined /> Select Location
          </button>
        </div>
      </Form.Item>

      <Modal
        title={
          <span className="flex items-center gap-2 text-lg">
            <PushpinOutlined /> Select Delivery Location
          </span>
        }
        open={isModalOpen}
        onCancel={() => setIsModalOpen(false)}
        footer={null}
      >
        <Form layout="vertical">
          <Form.Item label="Select Region">
            <Select
              value={selectedRegion}
              onChange={handleRegionChange}
              placeholder="Choose region"
              size="large"
            >
              {locations.map((location) => (
                <Option key={location.region} value={location.region}>
                  {location.region}
                </Option>
              ))}
            </Select>
          </Form.Item>

          {selectedRegion && (
            <Form.Item label="Select Town">
              <Select
                value={selectedTown}
                onChange={handleTownChange}
                placeholder="Choose town"
                size="large"
              >
                {locations
                  .find((loc) => loc.region === selectedRegion)
                  ?.towns.map((town) => (
                    <Option key={town.name} value={town.name}>
                      {town.name} ({town.delivery_fee === 0 ? "N/A" : `₵${town.delivery_fee}`})
                    </Option>
                  ))}
              </Select>
            </Form.Item>
          )}

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveLocation}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
            >
              <SaveOutlined /> Save
            </button>
          </div>
        </Form>
      </Modal>

      <Form.Item label="Order Note">
        <div className="relative">
          <FileTextOutlined className="absolute top-3 left-3 text-gray-400" />
          <TextArea
            rows={3}
            value={orderNote}
            onChange={(e) => setOrderNote(e.target.value)}
            placeholder="Add any notes about your order"
            className="pl-8"
          />
        </div>
      </Form.Item>
    </Form>
  );
};

export default CheckoutForm;
