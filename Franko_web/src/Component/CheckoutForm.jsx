import { useState, useEffect } from "react";
import { Form, Input, Select, Modal, InputNumber, Checkbox} from "antd";
import { EnvironmentOutlined, PhoneOutlined,UserOutlined, AimOutlined,PushpinOutlined, SaveOutlined, DollarOutlined, SearchOutlined} from "@ant-design/icons";
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
  const [agentDeliveryFee, setAgentDeliveryFee] = useState(0); // ✅ New field for agent delivery fee
  const [isManualMode, setIsManualMode] = useState(false); // ✅ Toggle manual entry
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState(""); // ✅ Search functionality
  const [locationNotFound, setLocationNotFound] = useState(false); // ✅ Toggle for location not found

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

  // ✅ Don't load customer name from localStorage for guest users
  useEffect(() => {
    if (customerAccountType !== "guest") {
      const savedName = localStorage.getItem("customerName");
      if (savedName && !customerName) {
        setCustomerName(savedName);
      }
    }
  }, [customerAccountType, customerName, setCustomerName]);

  // ✅ Update delivery info when agent manual address or fee changes
  useEffect(() => {
    if (customerAccountType === "agent" && agentManualAddress) {
      const info = { address: agentManualAddress, fee: agentDeliveryFee };
      setDeliveryInfo(info);
    }
  }, [agentManualAddress, agentDeliveryFee, customerAccountType, setDeliveryInfo]);

  const handleRegionChange = (value) => {
    setRegion(value);
    setTown(null);
    setFee(null);
  };

  const handleTownChange = (value) => {
    const currentRegion = locations?.find((r) => r.region === region);
    const townData = currentRegion?.towns?.find((t) => t.name === value);
    if (townData) {
      setTown(value);
      setFee(townData.delivery_fee);
    }
  };

  // ✅ Filter locations based on search text - FIXED: Added null checking
  const getFilteredLocations = () => {
    // Add null/undefined check for locations
    if (!locations || !Array.isArray(locations)) return [];
    if (!searchText) return locations;
    
    return locations.map(region => ({
      ...region,
      towns: region.towns?.filter(town => 
        town.name?.toLowerCase().includes(searchText.toLowerCase()) ||
        region.region?.toLowerCase().includes(searchText.toLowerCase())
      ) || []
    })).filter(region => region.towns.length > 0);
  };

  // ✅ Handle direct town selection from search
  const handleTownSelect = (townName, regionName) => {
    if (!locations || !Array.isArray(locations)) return;
    
    const selectedRegion = locations.find(r => r.region === regionName);
    const selectedTown = selectedRegion?.towns?.find(t => t.name === townName);
    
    if (selectedTown) {
      setRegion(regionName);
      setTown(townName);
      setFee(selectedTown.delivery_fee);
      setSearchText("");
    }
  };

  const handleSave = () => {
    let address = "";
    let finalFee = 0;

    if (isManualMode || locationNotFound) {
      const addressToUse = locationNotFound ? manualAddress : 
                          customerAccountType === "agent" ? agentManualAddress : manualAddress;
      
      if (!addressToUse) return;
      
      address = addressToUse;
      // For manual addresses, fee is N/A (0) unless it's an agent setting their own fee
      finalFee = (customerAccountType === "agent" && !locationNotFound) ? agentDeliveryFee : 0;
    } else {
      if (!region || !town || fee === null) return;
      address = `${town} (${region})`;
      finalFee = fee;
    }

    const info = { 
      address, 
      fee: finalFee,
      isManual: isManualMode || locationNotFound 
    };
    
    setDeliveryInfo(info);
    localStorage.setItem("deliveryInfo", JSON.stringify(info));
    window.dispatchEvent(new Event("storage"));
    
    // Reset modal state
    setModalVisible(false);
    setManualAddress("");
    setAgentDeliveryFee(0);
    setIsManualMode(false);
    setLocationNotFound(false);
    setSearchText("");
    setRegion(null);
    setTown(null);
    setFee(null);
  };

  const resetModal = () => {
    setModalVisible(false);
    setIsManualMode(false);
    setLocationNotFound(false);
    setSearchText("");
    setManualAddress("");
    setAgentDeliveryFee(0);
    setRegion(null);
    setTown(null);
    setFee(null);
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

      {/* Agent Manual Address Input - Only shown for agents */}
      {customerAccountType === "agent" && (
        <Form.Item label={<span className="text-sm text-gray-700">Delivery Address</span>} required>
          <div className="space-y-3">
            <TextArea
              rows={3}
              value={agentManualAddress}
              onChange={(e) => setAgentManualAddress(e.target.value)}
              placeholder="Enter delivery address for your customer"
            />
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Delivery Fee:</span>
              <InputNumber
                prefix={<DollarOutlined className="text-gray-400" />}
                value={agentDeliveryFee}
                onChange={(value) => setAgentDeliveryFee(value || 0)}
                placeholder="0"
                min={0}
                step={0.01}
                className="w-32"
              />
              <span className="text-sm text-gray-500">₵</span>
            </div>
          </div>
        </Form.Item>
      )}

      {customerAccountType !== "agent" && (
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
                    <strong className="text-green-700">
                      {deliveryInfo.fee === 0 ? "N/A" : `₵${deliveryInfo.fee}`}
                    </strong>
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
                  setLocationNotFound(false);
                  setModalVisible(true);
                }}
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white px-2 py-1.5 rounded-lg shadow-md transition transform hover:scale-105 flex items-center gap-2"
              >
                <AimOutlined className="text-md" />
                <span className="font-medium">Select Location</span>
              </button>
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
        title={<span className="flex items-center gap-2 text-lg"><PushpinOutlined /> Select Delivery Location</span>}
        open={modalVisible}
        onCancel={resetModal}
        footer={null}
        width={600}
      >
        <Form layout="vertical" className="space-y-4">
          
          {!locationNotFound && (
            <>
              {/* Search Input */}
              <Form.Item label="Search for your location">
                <Input
                  prefix={<SearchOutlined className="text-gray-400" />}
                  placeholder="Type to search regions and towns..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  size="large"
                  allowClear
                />
              </Form.Item>

              {/* Show search results or region/town selectors */}
              {searchText ? (
                <div className="max-h-60 overflow-y-auto border rounded-lg">
                  <div className="p-2">
                    <h4 className="text-sm font-medium text-gray-600 mb-2">Search Results:</h4>
                    {getFilteredLocations().length > 0 ? (
                      getFilteredLocations().map(region => 
                        region.towns?.map(town => (
                          <div
                            key={`${region.region}-${town.name}`}
                            className="flex justify-between items-center p-2 hover:bg-gray-50 cursor-pointer rounded"
                            onClick={() => handleTownSelect(town.name, region.region)}
                          >
                            <span className="text-sm">
                              <strong>{town.name}</strong> ({region.region})
                            </span>
                            <span className="text-sm text-green-600">
                              {town.delivery_fee === 0 ? "N/A" : `₵${town.delivery_fee}`}
                            </span>
                          </div>
                        )) || []
                      )
                    ) : (
                      <p className="text-sm text-gray-500 p-2">No locations found matching your search.</p>
                    )}
                  </div>
                </div>
              ) : (
                <>
                  {/* Region */}
                  <Form.Item label="Select Region">
                    <Select
                      placeholder="Choose region"
                      value={region}
                      onChange={handleRegionChange}
                      size="large"
                      showSearch
                      filterOption={(input, option) =>
                        (option?.children || option?.label || '').toString().toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {locations && Array.isArray(locations) && locations.map((loc) => (
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
                        showSearch
                        filterOption={(input, option) =>
                          (option?.children || option?.label || '').toString().toLowerCase().includes(input.toLowerCase())
                        }
                      >
                        {locations
                          ?.find((loc) => loc.region === region)
                          ?.towns?.map((t) => (
                            <Option key={t.name} value={t.name}>
                              {t.name} ({t.delivery_fee === 0 ? "N/A" : `₵${t.delivery_fee}`})
                            </Option>
                          )) || []}
                      </Select>
                    </Form.Item>
                  )}
                </>
              )}

              {/* Checkbox for location not found */}
              <div className="border-t pt-4">
                <Checkbox
                  checked={locationNotFound}
                  onChange={(e) => {
                    setLocationNotFound(e.target.checked);
                    if (e.target.checked) {
                      setSearchText("");
                      setRegion(null);
                      setTown(null);
                      setFee(null);
                    }
                  }}
                  className="text-sm"
                >
                  My location is not in the list (Enter manually)
                </Checkbox>
              </div>
            </>
          )}

          {/* Manual Address Input */}
          {locationNotFound && (
            <>
              <Form.Item label="Enter your location manually">
                <TextArea
                  rows={3}
                  placeholder="Type your full delivery address here"
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                />
              </Form.Item>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-sm text-yellow-800">
                  <strong>Note:</strong> Delivery fee for manual addresses is N/A. 
                  Our delivery team will contact you to confirm delivery charges.
                </p>
              </div>

              {/* Back to search option */}
              <div className="border-t pt-4">
                <Checkbox
                  checked={!locationNotFound}
                  onChange={(e) => {
                    setLocationNotFound(!e.target.checked);
                    if (e.target.checked) {
                      setManualAddress("");
                    }
                  }}
                  className="text-sm"
                >
                  Back to location search
                </Checkbox>
              </div>
            </>
          )}

          {/* Save Button */}
          <div className="flex justify-end gap-3 border-t pt-4">
            <button
              type="button"
              onClick={resetModal}
              className="px-4 py-2 text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={
                (!locationNotFound && !region && !town) || 
                (locationNotFound && !manualAddress)
              }
              className="bg-green-500 hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-4 py-2 rounded-md flex items-center gap-2"
            >
              <SaveOutlined /> Save Address
            </button>
          </div>
        </Form>
      </Modal>
    </Form>
  );
};

export default CheckoutForm;