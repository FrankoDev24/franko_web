import { useState, useEffect } from "react";
import { Form, Input, Select, Modal, InputNumber, Checkbox} from "antd";
import { EnvironmentOutlined, PhoneOutlined, UserOutlined, AimOutlined, PushpinOutlined, SaveOutlined, DollarOutlined, SearchOutlined } from "@ant-design/icons";
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
  customerAccountType,
  isDifferentRecipient,   // ✅ NEW: from Checkout — is the recipient different from account holder?
  readOnlyRecipient,      // ✅ NEW: true = name/number fields are locked (same recipient)
}) => {
  const [region, setRegion] = useState(null);
  const [town, setTown] = useState(null);
  const [fee, setFee] = useState(null);
  const [manualAddress, setManualAddress] = useState("");
  const [agentManualAddress, setAgentManualAddress] = useState("");
  const [agentDeliveryFee, setAgentDeliveryFee] = useState(0);
  const [isManualMode, setIsManualMode] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [locationNotFound, setLocationNotFound] = useState(false);

  const isDeliveryFree = (deliveryFee) => deliveryFee === "Free delivery";

  const formatDeliveryFee = (deliveryFee) => {
    if (deliveryFee === "Free delivery") return "Free delivery";
    if (deliveryFee === 0) return "N/A";
    return typeof deliveryFee === "number" ? `₵${deliveryFee}` : deliveryFee;
  };

  const getNumericFee = (deliveryFee) => {
    if (deliveryFee === "Free delivery") return 0;
    return typeof deliveryFee === "number" ? deliveryFee : 0;
  };

  useEffect(() => {
    if (!modalVisible) {
      // ✅ Encrypted localStorage auto-parses JSON — returns object directly, never a raw string
      const saved = localStorage.getItem("deliveryInfo");
      if (saved && typeof saved === "object" && saved.address && saved.fee !== undefined) {
        setDeliveryInfo(saved);
        setFee(saved.fee);
      }
    }
  }, [modalVisible, setDeliveryInfo]);

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

  const getFilteredLocations = () => {
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
    let feeDisplay = "";

    if (isManualMode || locationNotFound) {
      const addressToUse = locationNotFound ? manualAddress :
                          customerAccountType === "agent" ? agentManualAddress : manualAddress;
      if (!addressToUse) return;
      address = addressToUse;
      finalFee = (customerAccountType === "agent" && !locationNotFound) ? agentDeliveryFee : 0;
      if (customerAccountType === "agent" && !locationNotFound) {
        feeDisplay = finalFee === 0 ? "N/A" : `₵${finalFee}`;
      } else {
        feeDisplay = "N/A";
      }
    } else {
      if (!region || !town || fee === null) return;
      address = `${town} (${region})`;
      finalFee = getNumericFee(fee);
      if (fee === "Free delivery") {
        feeDisplay = "Free delivery";
      } else if (fee === 0) {
        feeDisplay = "N/A";
      } else {
        feeDisplay = `₵${finalFee}`;
      }
    }

    const info = {
      address,
      fee: finalFee,
      isManual: isManualMode || locationNotFound,
      feeDisplay,
    };

    setDeliveryInfo(info);
    // ✅ Encrypted localStorage handles serialisation automatically
    localStorage.setItem("deliveryInfo", info);
    window.dispatchEvent(new Event("storage"));

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

      {/* ── Recipient Name ── */}
      <Form.Item
        label="Recipient Name" 
        required
      >
        <Input
          prefix={<UserOutlined className="text-gray-400" />}
          value={customerName}
          onChange={(e) => setCustomerName(e.target.value)}
          placeholder="Enter recipient name"
        />
      </Form.Item>

      {/* ── Recipient Contact ── */}
      <Form.Item
        label="Recipient Contact" 
        required
      >
        <Input
          prefix={<PhoneOutlined className="text-gray-400" />}
          value={customerNumber}
          onChange={(e) => setCustomerNumber(e.target.value)}
          placeholder="Enter phone number"
        />
      </Form.Item>

      {/* ── Agent Delivery Address ── */}
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
              <span className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
                Set to 0 for N/A
              </span>
            </div>
          </div>
        </Form.Item>
      )}

      {/* ── Customer Delivery Address ── */}
      {customerAccountType !== "agent" && (
        <Form.Item
          label={
            <span className="flex items-center gap-1 text-sm font-semibold text-gray-700">
              Delivery Address
              <span className="text-red-500 ml-0.5">*</span>
            </span>
          }
          required
        >
          <button
            type="button"
            onClick={() => {
              setIsManualMode(false);
              setLocationNotFound(false);
              setModalVisible(true);
            }}
            className={`
              w-full text-left transition-all duration-200 rounded-2xl border-2 overflow-hidden
              focus:outline-none focus:ring-2 focus:ring-green-400 focus:ring-offset-1
              ${deliveryInfo?.address
                ? "border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 hover:border-green-500 hover:shadow-md"
                : "border-dashed border-gray-300 bg-gray-50 hover:border-green-400 hover:bg-green-50"
              }
            `}
          >
            {deliveryInfo?.address ? (
              /* ── Address selected state ── */
              <div className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Pin icon badge */}
                    <div className="flex-shrink-0 w-9 h-9 rounded-xl bg-green-500 flex items-center justify-center shadow-sm mt-0.5">
                      <EnvironmentOutlined className="text-white text-base" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-green-600 uppercase tracking-wider mb-0.5">
                        Delivering to
                      </p>
                      <p className="text-sm font-bold text-gray-800 leading-snug truncate">
                        {deliveryInfo.address}
                      </p>
                      {/* Fee pill */}
                      <span className={`
                        inline-flex items-center gap-1 mt-2 px-2.5 py-0.5 rounded-full text-xs font-semibold
                        ${deliveryInfo.feeDisplay === "Free delivery" || deliveryInfo.fee === 0
                          ? "bg-green-100 text-green-700"
                          : "bg-blue-100 text-blue-700"
                        }
                      `}>
                        🚚&nbsp;
                        {deliveryInfo.feeDisplay
                          ? deliveryInfo.feeDisplay === "Free delivery" ? "Free Delivery" : `Delivery: ${deliveryInfo.feeDisplay}`
                          : deliveryInfo.fee === 0 ? "Delivery: N/A" : `Delivery: ₵${deliveryInfo.fee}`
                        }
                      </span>
                    </div>
                  </div>
                  {/* Change chevron */}
                  <div className="flex-shrink-0 flex items-center gap-1 text-green-600 bg-white border border-green-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold shadow-sm hover:bg-green-50 transition-colors">
                    <AimOutlined className="text-sm" />
                    Change
                  </div>
                </div>
              </div>
            ) : (
              /* ── Empty / prompt state ── */
              <div className="p-5 flex flex-col items-center justify-center gap-2 text-center">
                <div className="w-12 h-12 rounded-2xl bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center mb-1">
                  <EnvironmentOutlined className="text-gray-400 text-xl" />
                </div>
                <p className="text-sm font-semibold text-gray-700">Select delivery address</p>
                <p className="text-xs text-gray-400 leading-relaxed max-w-[200px]">
                  Tap to choose your region &amp; town for accurate delivery fee
                </p>
                <div className="mt-1 inline-flex items-center gap-1.5 bg-green-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-sm">
                  <AimOutlined />
                  Choose Location
                </div>
              </div>
            )}
          </button>

          {/* Required hint when empty */}
          {!deliveryInfo?.address && (
            <p className="text-xs text-red-400 mt-1.5 flex items-center gap-1">
              <span className="text-red-400">⚠</span> Required — please select a delivery location
            </p>
          )}
        </Form.Item>
      )}

      {/* ── Order Note ── */}
      <Form.Item label="Order Note (Optional)">
        <TextArea
          rows={4}
          value={orderNote}
          onChange={(e) => setOrderNote(e.target.value)}
          placeholder="Add any notes about your order"
        />
      </Form.Item>

      {/* ── Location Modal ── */}
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
                            <span className={`text-sm font-medium px-2 py-1 rounded ${
                              town.delivery_fee === "Free delivery"
                                ? "text-green-600 bg-green-100"
                                : town.delivery_fee === 0
                                ? "text-gray-600 bg-gray-100"
                                : "text-blue-600 bg-blue-100"
                            }`}>
                              {formatDeliveryFee(town.delivery_fee)}
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
                  <Form.Item label="Select Region">
                    <Select
                      placeholder="Choose region"
                      value={region}
                      onChange={handleRegionChange}
                      size="large"
                      showSearch
                      filterOption={(input, option) =>
                        (option?.children || option?.label || "").toString().toLowerCase().includes(input.toLowerCase())
                      }
                    >
                      {locations && Array.isArray(locations) && locations.map((loc) => (
                        <Option key={loc.region} value={loc.region}>{loc.region}</Option>
                      ))}
                    </Select>
                  </Form.Item>

                  {region && (
                    <Form.Item label="Select Town">
                      <Select
                        placeholder="Choose town"
                        value={town}
                        onChange={handleTownChange}
                        size="large"
                        showSearch
                        filterOption={(input, option) =>
                          (option?.children || option?.label || "").toString().toLowerCase().includes(input.toLowerCase())
                        }
                      >
                        {locations
                          ?.find((loc) => loc.region === region)
                          ?.towns?.map((t) => (
                            <Option key={t.name} value={t.name}>
                              <div className="flex justify-between items-center">
                                <span>{t.name}</span>
                                <span className={`font-medium ${
                                  t.delivery_fee === "Free delivery"
                                    ? "text-green-600"
                                    : t.delivery_fee === 0
                                    ? "text-gray-600"
                                    : "text-blue-600"
                                }`}>
                                  {formatDeliveryFee(t.delivery_fee)}
                                </span>
                              </div>
                            </Option>
                          )) || []}
                      </Select>
                    </Form.Item>
                  )}
                </>
              )}

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
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                <p className="text-sm text-gray-800">
                  <strong>Note:</strong> For manual addresses, delivery fee will be marked as N/A.
                  Our delivery team will contact you to confirm pricing and location.
                </p>
              </div>
              <div className="border-t pt-4">
                <Checkbox
                  checked={!locationNotFound}
                  onChange={(e) => {
                    setLocationNotFound(!e.target.checked);
                    if (e.target.checked) setManualAddress("");
                  }}
                  className="text-sm"
                >
                  Back to location search
                </Checkbox>
              </div>
            </>
          )}

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