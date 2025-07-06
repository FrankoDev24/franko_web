import { useState, useEffect } from "react";
import { Form, Input, Select, Modal} from "antd";
import { EnvironmentOutlined, PhoneOutlined,UserOutlined, AimOutlined,PushpinOutlined, SaveOutlined,} from "@ant-design/icons";
const { TextArea } = Input;
const { Option } = Select;

const CheckoutForm = ({
  customerName,
  setCustomerName,
  customerNumber,
  setCustomerNumber,
  deliveryInfo,
  setDeliveryInfo,
  orderNote,
  setOrderNote,
  locations,
  customerAccountType, // ✅ New prop
}) => {
  const [region, setRegion] = useState(null);
  const [town, setTown] = useState(null);
  const [fee, setFee] = useState(null);
  const [manualAddress, setManualAddress] = useState(""); // ✅ Manual address input
  const [agentManualAddress, setAgentManualAddress] = useState(""); // ✅ New field for agent manual address
  const [isManualMode, setIsManualMode] = useState(false); // ✅ Toggle manual entry
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    if (!modalVisible) {
      const saved = localStorage.getItem("deliveryInfo");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed?.address && parsed?.fee !== undefined) {
          setDeliveryInfo(parsed);
          setFee(Number(parsed.fee));
        }
      }
    }
  }, [modalVisible, setDeliveryInfo]);

  // ✅ Update delivery info when agent manual address changes
  useEffect(() => {
    if (customerAccountType === "agent" && agentManualAddress) {
      const info = { address: agentManualAddress, fee: 0 };
      setDeliveryInfo(info);
    }
  }, [agentManualAddress, customerAccountType, setDeliveryInfo]);

  const handleRegionChange = (value) => {
    setRegion(value);
    setTown(null);
    setFee(null);
  };

  const handleTownChange = (value) => {
    const currentRegion = locations.find((r) => r.region === region);
    const townData = currentRegion?.towns.find((t) => t.name === value);
    if (townData) {
      setTown(value);
      setFee(townData.delivery_fee);
    }
  };

  const handleSave = () => {
    let address = "";
    let finalFee = 0;

    if (isManualMode) {
      if (!manualAddress) return;
      address = manualAddress;
    } else {
      if (!region || !town || fee === null) return;
      address = `${town} (${region})`;
      finalFee = fee;
    }

    const info = { address, fee: finalFee };
    setDeliveryInfo(info);
    localStorage.setItem("deliveryInfo", JSON.stringify(info));
    window.dispatchEvent(new Event("storage"));
    setModalVisible(false);
    setManualAddress("");
    setIsManualMode(false);
  };

  return (
    <Form layout="vertical" className="p-2 rounded-2xl max-w-2xl mx-auto space-y-6">

      {/* Full Name */}
      <Form.Item label="Recipient Name" required>
        <Input
          prefix={<UserOutlined className="text-gray-400" />}
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Enter your full name"
          allowClear
        />
      </Form.Item>

      {/* Phone Number */}
      <Form.Item label="Recipient contact" required>
        <Input
          prefix={<PhoneOutlined className="text-gray-400" />}
          value={customerNumber}
          onChange={(e) => setCustomerNumber(e.target.value)}
          placeholder="Enter your phone number"
          allowClear
        />
      </Form.Item>

      {/* Agent Manual Address Field - Only visible for agents */}
      {customerAccountType === "agent" && (
        <Form.Item label="Delivery Address (Manual Entry)">
          <TextArea
            rows={3}
            value={agentManualAddress}
            onChange={(e) => setAgentManualAddress(e.target.value)}
            placeholder="Enter the complete delivery address manually"
            prefix={<EnvironmentOutlined className="text-gray-400" />}
          />
          <div className="text-xs text-gray-500 mt-1">
            As an agent, you can enter the delivery address directly. This will override any location selection below.
          </div>
        </Form.Item>
      )}

      {/* Delivery Address - Hidden for agents if manual address is entered */}
      {!(customerAccountType === "agent" && agentManualAddress) && (
        <Form.Item label={<span className=" text-sm text-gray-700">Delivery Address</span>}>
          <div className="flex flex-col lg:flex-row lg:items-center md:justify-between gap-4 bg-white p-5 rounded-xl border border-gray-200 shadow-sm transition-shadow hover:shadow-md">
            <div className="flex-1 text-sm text-gray-800">
              {deliveryInfo?.address ? (
                <>
                  <p className="flex items-center gap-2 mb-2 text-gray-700">
                    <EnvironmentOutlined className="text-green-500 text-lg" />
                    <span className="font-medium">{deliveryInfo.address}</span>
                  </p>
                  <p className="text-green-600 text-sm">
                    Delivery Fee:&nbsp;
                    <strong className="text-green-700">{deliveryInfo.fee === 0 ? "N/A" : `₵${deliveryInfo.fee}`}</strong>
                  </p>
                </>
              ) : (
                <p className="text-gray-500 italic">No address selected</p>
              )}
            </div>

            <div className="flex flex-col gap-2 md:items-end">
              <button
                type="button"
                onClick={() => {
                  setIsManualMode(false);
                  setModalVisible(true);
                }}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-2 py-1.5 rounded-lg shadow-md transition transform hover:scale-105 flex items-center gap-2"
              >
                <AimOutlined className="text-md" />
                <span className="font-medium">Select Location</span>
              </button>

              {customerAccountType === "agent" && (
                <button
                  type="button"
                  onClick={() => {
                    setIsManualMode(true);
                    setModalVisible(true);
                  }}
                  className="bg-yellow-500 hover:bg-yellow-600 text-white px-2 py-1.5 rounded-lg shadow-md transition transform hover:scale-105 flex items-center gap-2"
                >
                  <AimOutlined />
                  <span className="font-medium">Enter Address Manually</span>
                </button>
              )}
            </div>
          </div>
        </Form.Item>
      )}

      {/* Order Note */}
      <Form.Item label="Order Note (Optional)">
        <TextArea
          rows={4}
          value={orderNote}
          onChange={(e) => setOrderNote(e.target.value)}
          placeholder="Add any notes about your order"
        />
      </Form.Item>

      {/* Modal */}
      <Modal
        title={<span className="flex items-center gap-2 text-lg"><PushpinOutlined /> {isManualMode ? "Enter Manual Address" : "Select Delivery Location"}</span>}
        open={modalVisible}
        onCancel={() => setModalVisible(false)}
        footer={null}
      >
        <Form layout="vertical" className="space-y-4">
          {isManualMode ? (
            <Form.Item label="Enter Address">
              <TextArea
                rows={3}
                placeholder="Type full delivery address here"
                value={manualAddress}
                onChange={(e) => setManualAddress(e.target.value)}
              />
            </Form.Item>
          ) : (
            <>
              {/* Region */}
              <Form.Item label="Select Region">
                <Select
                  placeholder="Choose region"
                  value={region}
                  onChange={handleRegionChange}
                  size="large"
                >
                  {locations.map((loc) => (
                    <Option key={loc.region} value={loc.region}>
                      {loc.region}
                    </Option>
                  ))}
                </Select>
              </Form.Item>

              {/* Town */}
              {region && (
                <Form.Item label="Select Town">
                  <Select
                    placeholder="Choose town"
                    value={town}
                    onChange={handleTownChange}
                    size="large"
                  >
                    {locations
                      .find((loc) => loc.region === region)
                      ?.towns.map((t) => (
                        <Option key={t.name} value={t.name}>
                          {t.name} ({t.delivery_fee === 0 ? "N/A" : `₵${t.delivery_fee}`})
                        </Option>
                      ))}
                  </Select>
                </Form.Item>
              )}
            </>
          )}

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleSave}
              className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md flex items-center gap-2"
            >
              <SaveOutlined /> Save
            </button>
          </div>
        </Form>
      </Modal>
    </Form>
  );
};

export default CheckoutForm;