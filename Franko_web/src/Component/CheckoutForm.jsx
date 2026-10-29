import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  Tag,
} from 'antd';
import {
  AimOutlined,
  ArrowLeftOutlined,
  CarOutlined,
  CheckCircleOutlined,
  DollarOutlined,
  EditOutlined,
  EnvironmentOutlined,
  LockOutlined,
  PhoneOutlined,
  PushpinOutlined,
  SearchOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { appStorage as localStorage } from '../utils/secureLocalStorageInit';

const { TextArea } = Input;
const { Option } = Select;

const checkoutFormStyles = `
.cf-form-ui {
  width: 100%;
}
.cf-form-ui .ant-form-item {
  margin-bottom: 18px;
}
.cf-form-ui .ant-form-item-label > label {
  color: #243247;
  font-size: 13px;
  font-weight: 750;
}
.cf-form-ui .ant-input-affix-wrapper,
.cf-form-ui .ant-input,
.cf-form-ui .ant-input-number,
.cf-form-ui .ant-select-selector {
  border-color: #dce5e1 !important;
  border-radius: 12px !important;
}
.cf-form-ui .ant-input-affix-wrapper,
.cf-form-ui .ant-input,
.cf-form-ui .ant-input-number {
  min-height: 46px;
}
.cf-form-ui .ant-input-affix-wrapper-focused,
.cf-form-ui .ant-input:focus,
.cf-form-ui .ant-select-focused .ant-select-selector {
  border-color: #16a34a !important;
  box-shadow: 0 0 0 3px rgba(22, 163, 74, .10) !important;
}
.cf-form-ui .cf-locked-field {
  background: #f4f8f5;
}
.cf-form-ui .cf-locked-field input {
  color: #344b3d;
  font-weight: 700;
}
.cf-field-note {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin-top: 8px;
  color: #65736b;
  font-size: 12px;
  line-height: 1.5;
}
.cf-lock-note {
  color: #14532d;
}
.cf-address-card {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 14px;
  padding: 16px;
  border: 1px solid #dce8e0;
  border-radius: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f6fbf7 100%);
  color: #1f2937;
  cursor: pointer;
  text-align: left;
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}
.cf-address-card:hover {
  transform: translateY(-1px);
  border-color: #4ade80;
  box-shadow: 0 10px 24px rgba(20, 83, 45, .10);
}
.cf-address-card-selected {
  border-color: #86efac;
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
}
.cf-address-icon {
  display: grid;
  width: 46px;
  height: 46px;
  flex: 0 0 46px;
  place-items: center;
  border-radius: 15px;
  background: linear-gradient(135deg, #16a34a, #15803d);
  box-shadow: 0 5px 12px rgba(22, 163, 74, .22);
  color: white;
  font-size: 20px;
}
.cf-address-copy {
  min-width: 0;
  flex: 1;
}
.cf-address-eyebrow {
  display: block;
  margin-bottom: 4px;
  color: #15803d;
  font-size: 10px;
  font-weight: 850;
  letter-spacing: .10em;
  text-transform: uppercase;
}
.cf-address-value {
  display: block;
  color: #17251c;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.45;
  overflow-wrap: anywhere;
}
.cf-address-subtitle {
  display: block;
  margin-top: 4px;
  color: #718078;
  font-size: 12px;
  line-height: 1.4;
}
.cf-address-action {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border: 1px solid #d9e9de;
  border-radius: 10px;
  background: white;
  color: #166534;
  font-size: 12px;
  font-weight: 800;
}
.cf-guest-gate {
  display: flex;
  gap: 12px;
  padding: 15px;
  border: 1px solid #dbeafe;
  border-radius: 14px;
  background: linear-gradient(135deg, #f0f9ff, #ffffff);
}
.cf-guest-gate-icon {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  place-items: center;
  border-radius: 12px;
  background: #e0f2fe;
  color: #0369a1;
  font-size: 17px;
}
.cf-guest-gate strong {
  display: block;
  margin: 1px 0 4px;
  color: #164e63;
  font-size: 13px;
}
.cf-guest-gate p {
  margin: 0;
  color: #526875;
  font-size: 12px;
  line-height: 1.5;
}
.cf-agent-fee-row {
  display: flex;
  align-items: center;
  gap: 10px;
}
.cf-agent-fee-row .ant-input-number {
  width: 170px;
}
.cf-location-modal .ant-modal-content {
  overflow: hidden;
  border-radius: 20px;
}
.cf-location-modal .ant-modal-close {
  color: white;
}
.cf-location-modal .ant-modal-close:hover {
  color: #dcfce7;
}
.cf-location-hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 22px 56px 20px 22px;
  background:
    radial-gradient(circle at top right, rgba(187, 247, 208, .25), transparent 38%),
    linear-gradient(135deg, #14532d, #15803d);
  color: white;
}
.cf-location-hero-icon {
  display: grid;
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  place-items: center;
  border: 1px solid rgba(255,255,255,.25);
  border-radius: 16px;
  background: rgba(255,255,255,.13);
  font-size: 22px;
}
.cf-location-kicker {
  margin: 0 0 3px;
  color: #bbf7d0;
  font-size: 10px;
  font-weight: 850;
  letter-spacing: .14em;
}
.cf-location-hero h3 {
  margin: 0;
  color: white;
  font-size: 19px;
  font-weight: 850;
}
.cf-location-hero p {
  margin: 4px 0 0;
  color: rgba(255,255,255,.82);
  font-size: 12px;
  line-height: 1.45;
}
.cf-location-content {
  padding: 20px;
}
.cf-location-step-label {
  display: block;
  margin-bottom: 8px;
  color: #37483d;
  font-size: 12px;
  font-weight: 800;
}
.cf-location-search {
  margin-bottom: 16px;
}
.cf-location-search .ant-input-affix-wrapper {
  min-height: 48px;
  border-radius: 13px;
}
.cf-location-results {
  display: grid;
  max-height: 230px;
  gap: 7px;
  margin: 10px 0 15px;
  overflow: auto;
}
.cf-location-result {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 11px 13px;
  border: 1px solid #e5eee8;
  border-radius: 12px;
  background: #fff;
  cursor: pointer;
  text-align: left;
  transition: background .15s ease, border-color .15s ease;
}
.cf-location-result:hover {
  border-color: #86efac;
  background: #f0fdf4;
}
.cf-location-result-name {
  color: #24352a;
  font-size: 13px;
  font-weight: 750;
}
.cf-location-result-region {
  display: block;
  margin-top: 2px;
  color: #7b8980;
  font-size: 11px;
}
.cf-location-result-fee {
  flex: 0 0 auto;
  color: #166534;
  font-size: 11px;
  font-weight: 800;
}
.cf-location-selects {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 14px;
  margin-top: 12px;
}
.cf-location-selects .ant-select {
  width: 100%;
}
.cf-location-selects .ant-select-selector {
  min-height: 48px !important;
  align-items: center;
  border-radius: 12px !important;
}
.cf-town-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.cf-town-option-fee {
  color: #15803d;
  font-size: 11px;
  font-weight: 750;
}
.cf-selected-location {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-top: 16px;
  padding: 13px;
  border: 1px solid #bbf7d0;
  border-radius: 13px;
  background: #f0fdf4;
}
.cf-selected-location-icon {
  color: #16a34a;
  font-size: 19px;
}
.cf-selected-location-copy {
  min-width: 0;
  flex: 1;
}
.cf-selected-location-copy span {
  display: block;
  color: #548060;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.cf-selected-location-copy strong {
  display: block;
  margin-top: 3px;
  color: #14532d;
  font-size: 13px;
}
.cf-location-note {
  margin-top: 14px;
  padding: 11px 13px;
  border: 1px solid #e4eee7;
  border-radius: 12px;
  background: #f8fbf9;
  color: #64736a;
  font-size: 12px;
  line-height: 1.5;
}
.cf-manual-link {
  margin-top: 10px;
  padding-left: 0;
  color: #15803d;
  font-weight: 750;
}
.cf-location-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid #edf1ee;
}
.cf-location-footer .ant-btn {
  min-height: 42px;
  border-radius: 11px;
  font-weight: 750;
}
.cf-location-footer .cf-save-location {
  border: 0;
  background: linear-gradient(135deg, #15803d, #16a34a);
  box-shadow: 0 5px 12px rgba(22, 163, 74, .18);
}
.cf-location-footer .cf-save-location:hover {
  background: linear-gradient(135deg, #166534, #15803d) !important;
}
@media (max-width: 600px) {
  .cf-address-card {
    align-items: flex-start;
    padding: 13px;
  }
  .cf-address-icon {
    width: 40px;
    height: 40px;
    flex-basis: 40px;
    border-radius: 13px;
  }
  .cf-address-action {
    padding: 7px;
    font-size: 0;
  }
  .cf-address-action .anticon {
    font-size: 14px;
  }
  .cf-location-selects {
    grid-template-columns: 1fr;
  }
  .cf-location-content {
    padding: 16px;
  }
  .cf-location-hero {
    padding: 18px 48px 17px 16px;
  }
  .cf-location-hero h3 {
    font-size: 16px;
  }
}
`;

const isFreeFee = value =>
  String(value ?? '').toLowerCase().includes('free');

const numericFee = value => {
  if (isFreeFee(value)) return 0;
  if (typeof value === 'number') return value;

  const parsed = Number(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
};

const locationFeeLabel = value => {
  if (isFreeFee(value)) return 'Free delivery';

  const amount = numericFee(value);
  return amount > 0
    ? `GH₵ ${amount.toFixed(2)}`
    : 'Fee to be confirmed';
};

const readStoredObject = value => {
  if (typeof value !== 'string') return value;

  try {
    return JSON.parse(value);
  } catch {
    return null;
  }
};

const CheckoutForm = ({
  customerName,
  setCustomerName,
  customerNumber,
  setCustomerNumber,
  phoneLocked = false,
  deliveryInfo,
  setDeliveryInfo,
  orderNote,
  setOrderNote,
  locations,
  customerAccountType,
  isAuthenticated = true,
  customerAccountId,
}) => {
  const isAgent =
    String(customerAccountType || '').toLowerCase() === 'agent';

  const [region, setRegion] = useState('');
  const [town, setTown] = useState('');
  const [fee, setFee] = useState(null);
  const [manualAddress, setManualAddress] = useState('');
  const [manualMode, setManualMode] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');

  const [agentManualAddress, setAgentManualAddress] = useState(
    () => deliveryInfo?.address || ''
  );
  const [agentDeliveryFee, setAgentDeliveryFee] = useState(
    () => Number(deliveryInfo?.fee) || 0
  );

  const locationList = useMemo(
    () => (Array.isArray(locations) ? locations : []),
    [locations]
  );

  const searchResults = useMemo(() => {
    const query = searchText.trim().toLowerCase();
    if (!query) return [];

    return locationList.flatMap(location =>
      (location.towns || [])
        .filter(townData =>
          String(townData.name || '').toLowerCase().includes(query) ||
          String(location.region || '').toLowerCase().includes(query)
        )
        .map(townData => ({
          region: location.region,
          town: townData,
        }))
    );
  }, [locationList, searchText]);

  const selectedRegion = locationList.find(
    location => location.region === region
  );

  const selectedTowns = selectedRegion?.towns || [];

  // Restore only a delivery address saved for this signed-in account.
  // Old or unowned guest addresses are deliberately ignored.
  useEffect(() => {
    if (!isAuthenticated || isAgent || customerAccountId == null) return;

    try {
      const saved = readStoredObject(
        localStorage.getItem('deliveryInfo')
      );

      const owner =
        saved?.customerId ??
        saved?.Customerid ??
        saved?.CustomerId;

      if (
        !saved?.address ||
        owner == null ||
        String(owner) !== String(customerAccountId)
      ) {
        return;
      }

      setDeliveryInfo(previous => {
        if (
          previous?.address === saved.address &&
          Number(previous?.fee) === Number(saved.fee)
        ) {
          return previous;
        }

        return { ...previous, ...saved };
      });
    } catch {
      // Address restoration is best effort.
    }
  }, [
    isAuthenticated,
    isAgent,
    customerAccountId,
    setDeliveryInfo,
  ]);

  // Keep the agent address and fee reflected in the checkout state.
  useEffect(() => {
    if (!isAuthenticated || !isAgent) return;

    const amount = Math.max(0, Number(agentDeliveryFee) || 0);
    const nextInfo = {
      address: agentManualAddress.trim(),
      fee: amount,
      feeDisplay: amount > 0 ? `₵${amount}` : 'N/A',
      isManual: true,
      customerId: customerAccountId,
    };

    setDeliveryInfo(previous => {
      if (
        previous?.address === nextInfo.address &&
        Number(previous?.fee || 0) === nextInfo.fee &&
        previous?.feeDisplay === nextInfo.feeDisplay
      ) {
        return previous;
      }

      return nextInfo;
    });
  }, [
    isAuthenticated,
    isAgent,
    agentManualAddress,
    agentDeliveryFee,
    customerAccountId,
    setDeliveryInfo,
  ]);

  const openLocationPicker = () => {
    if (!isAuthenticated) return;

    setManualMode(false);
    setManualAddress('');
    setSearchText('');
    setRegion('');
    setTown('');
    setFee(null);
    setModalVisible(true);
  };

  const resetModal = () => {
    setModalVisible(false);
    setManualMode(false);
    setManualAddress('');
    setSearchText('');
    setRegion('');
    setTown('');
    setFee(null);
  };

  const handleRegionChange = value => {
    setRegion(value);
    setTown('');
    setFee(null);
    setSearchText('');
  };

  const handleTownChange = value => {
    const selectedTown = selectedTowns.find(
      townData => townData.name === value
    );

    if (!selectedTown) return;

    setTown(value);
    setFee(selectedTown.delivery_fee ?? 0);
  };

  const handleTownSelect = (townName, regionName) => {
    const selectedLocation = locationList.find(
      location => location.region === regionName
    );
    const selectedTown = selectedLocation?.towns?.find(
      townData => townData.name === townName
    );

    if (!selectedTown) return;

    setRegion(regionName);
    setTown(townName);
    setFee(selectedTown.delivery_fee ?? 0);
    setSearchText('');
  };

  const handleSave = () => {
    let address = '';
    let finalFee = 0;
    let feeDisplay = '';
    let isManual = false;

    if (manualMode) {
      address = manualAddress.trim();
      if (!address) return;

      feeDisplay = 'N/A';
      isManual = true;
    } else {
      if (!region || !town || fee === null) return;

      address = `${town} (${region})`;
      finalFee = numericFee(fee);
      feeDisplay = isFreeFee(fee)
        ? 'Free delivery'
        : finalFee === 0
          ? 'N/A'
          : `₵${finalFee}`;
    }

    const info = {
      address,
      fee: finalFee,
      feeDisplay,
      isManual,
      customerId: customerAccountId,
    };

    setDeliveryInfo(info);

    try {
      if (isAuthenticated && customerAccountId != null) {
        localStorage.setItem('deliveryInfo', info);
      }
    } catch {
      // Storage is best effort.
    }

    resetModal();
  };

  const canSave = manualMode
    ? Boolean(manualAddress.trim())
    : Boolean(region && town && fee !== null);

  const savedFeeIsFree =
    isFreeFee(deliveryInfo?.feeDisplay) ||
    isFreeFee(deliveryInfo?.fee);

  const savedFeeLabel = savedFeeIsFree
    ? 'Free delivery'
    : deliveryInfo?.feeDisplay &&
        String(deliveryInfo.feeDisplay).toLowerCase() !== 'n/a'
      ? `Delivery: ${deliveryInfo.feeDisplay}`
      : Number(deliveryInfo?.fee) > 0
        ? `Delivery: GH₵ ${Number(deliveryInfo.fee).toFixed(2)}`
        : 'Delivery fee to be confirmed';

  return (
    <>
      <style>{checkoutFormStyles}</style>

      <Form layout="vertical" className="cf-form-ui" colon={false}>
        <Form.Item label="Recipient name" required>
          <Input
            prefix={<UserOutlined style={{ color: '#8a9790' }} />}
            value={customerName || ''}
            onChange={event => setCustomerName(event.target.value)}
            placeholder="Enter the recipient's name"
            autoComplete="name"
          />
        </Form.Item>

        <Form.Item label="Recipient contact number" required>
          <Input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            prefix={<PhoneOutlined style={{ color: '#8a9790' }} />}
            suffix={
              phoneLocked
                ? <LockOutlined style={{ color: '#15803d' }} />
                : null
            }
            className={phoneLocked ? 'cf-locked-field' : ''}
            value={customerNumber || ''}
            readOnly={phoneLocked}
            onChange={event => {
              if (!phoneLocked) {
                setCustomerNumber(event.target.value);
              }
            }}
            placeholder={
              phoneLocked
                ? 'Registered account number unavailable'
                : 'Enter a contact number'
            }
          />

          {phoneLocked && (
            <div className="cf-field-note cf-lock-note">
              <LockOutlined />
              <span>
                This number is fixed to your registered Mobile Money
                account. The recipient name can still be changed.
              </span>
            </div>
          )}
        </Form.Item>

        <Form.Item label="Delivery address" required>
          {!isAuthenticated ? (
            <div className="cf-guest-gate">
              <div className="cf-guest-gate-icon">
                <LockOutlined />
              </div>
              <div>
                <strong>Sign in to choose a delivery location</strong>
                <p>
                  Delivery addresses are not displayed to guests. Once you
                  sign in, choose a region and town or enter an address
                  manually.
                </p>
              </div>
            </div>
          ) : isAgent ? (
            <div>
              <TextArea
                rows={3}
                value={agentManualAddress}
                onChange={event =>
                  setAgentManualAddress(event.target.value)
                }
                placeholder="Enter the delivery address for your customer"
                maxLength={300}
                showCount
              />

              <div className="cf-field-note">
                <PushpinOutlined />
                <span>
                  Add a clear address, landmark or directions for the
                  delivery team.
                </span>
              </div>

              <div style={{ marginTop: 14 }}>
                <div className="cf-location-step-label">Delivery fee</div>
                <div className="cf-agent-fee-row">
                  <InputNumber
                    min={0}
                    step={0.01}
                    precision={2}
                    value={agentDeliveryFee}
                    onChange={value =>
                      setAgentDeliveryFee(Number(value) || 0)
                    }
                    prefix={<DollarOutlined />}
                    placeholder="0.00"
                  />
                  <span style={{ color: '#66736b', fontSize: 12 }}>
                    Set to 0 if the fee is not yet known.
                  </span>
                </div>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className={`cf-address-card ${
                deliveryInfo?.address ? 'cf-address-card-selected' : ''
              }`}
              onClick={openLocationPicker}
              aria-label={
                deliveryInfo?.address
                  ? 'Change delivery location'
                  : 'Choose delivery location'
              }
            >
              <span className="cf-address-icon">
                <EnvironmentOutlined />
              </span>

              <span className="cf-address-copy">
                <span className="cf-address-eyebrow">
                  {deliveryInfo?.address
                    ? 'Current delivery location'
                    : 'Delivery location required'}
                </span>

                <span className="cf-address-value">
                  {deliveryInfo?.address ||
                    'Choose your region and town'}
                </span>

                <span className="cf-address-subtitle">
                  {deliveryInfo?.address
                    ? savedFeeLabel
                    : 'Search locations or enter your address manually.'}
                </span>
              </span>

              <span className="cf-address-action">
                {deliveryInfo?.address
                  ? <EditOutlined />
                  : <AimOutlined />}
                {deliveryInfo?.address ? 'Change' : 'Choose'}
              </span>
            </button>
          )}
        </Form.Item>

        <Form.Item label="Order note (optional)">
          <TextArea
            rows={3}
            value={orderNote || ''}
            onChange={event => setOrderNote(event.target.value)}
            placeholder="Add delivery instructions or other order notes"
            maxLength={500}
            showCount
          />
        </Form.Item>
      </Form>

      <Modal
        className="cf-location-modal"
        open={modalVisible}
        onCancel={resetModal}
        title={null}
        footer={null}
        width={680}
        centered
        destroyOnClose
        styles={{ body: { padding: 0 } }}
      >
        <div className="cf-location-hero">
          <div className="cf-location-hero-icon">
            <EnvironmentOutlined />
          </div>
          <div>
            <p className="cf-location-kicker">DELIVERY DETAILS</p>
            <h3>Select your delivery location</h3>
            <p>
              Choose a town for an accurate delivery estimate, or enter
              your address manually.
            </p>
          </div>
        </div>

        <div className="cf-location-content">
          {!manualMode ? (
            <>
              <label className="cf-location-step-label">
                Search by town or region
              </label>

              <div className="cf-location-search">
                <Input
                  size="large"
                  prefix={
                    <SearchOutlined style={{ color: '#829087' }} />
                  }
                  placeholder="For example, Madina or Greater Accra"
                  value={searchText}
                  onChange={event => setSearchText(event.target.value)}
                  allowClear
                />
              </div>

              {searchText.trim() ? (
                <div className="cf-location-results">
                  {searchResults.length > 0 ? (
                    searchResults.map(({ region: regionName, town: townData }) => (
                      <button
                        type="button"
                        key={`${regionName}-${townData.name}`}
                        className="cf-location-result"
                        onClick={() =>
                          handleTownSelect(townData.name, regionName)
                        }
                      >
                        <span>
                          <span className="cf-location-result-name">
                            {townData.name}
                          </span>
                          <span className="cf-location-result-region">
                            {regionName}
                          </span>
                        </span>
                        <span className="cf-location-result-fee">
                          {locationFeeLabel(townData.delivery_fee)}
                        </span>
                      </button>
                    ))
                  ) : (
                    <div className="cf-location-note">
                      No matching locations found. Try another spelling or
                      enter your address manually.
                    </div>
                  )}
                </div>
              ) : (
                <div className="cf-location-selects">
                  <div>
                    <label className="cf-location-step-label">
                      1. Select region
                    </label>
                    <Select
                      size="large"
                      showSearch
                      value={region || undefined}
                      placeholder="Choose a region"
                      onChange={handleRegionChange}
                      filterOption={(input, option) =>
                        String(option?.value || '')
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    >
                      {locationList.map(location => (
                        <Option
                          key={location.region}
                          value={location.region}
                        >
                          {location.region}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="cf-location-step-label">
                      2. Select town
                    </label>
                    <Select
                      size="large"
                      showSearch
                      value={town || undefined}
                      placeholder={
                        region ? 'Choose a town' : 'Select a region first'
                      }
                      disabled={!region}
                      onChange={handleTownChange}
                      filterOption={(input, option) =>
                        String(option?.value || '')
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    >
                      {selectedTowns.map(townData => (
                        <Option
                          key={townData.name}
                          value={townData.name}
                          label={townData.name}
                        >
                          <span className="cf-town-option">
                            <span>{townData.name}</span>
                            <span className="cf-town-option-fee">
                              {locationFeeLabel(townData.delivery_fee)}
                            </span>
                          </span>
                        </Option>
                      ))}
                    </Select>
                  </div>
                </div>
              )}

              {!searchText.trim() && town && fee !== null && (
                <div className="cf-selected-location">
                  <EnvironmentOutlined className="cf-selected-location-icon" />
                  <div className="cf-selected-location-copy">
                    <span>Selected location</span>
                    <strong>{town}, {region}</strong>
                  </div>
                  <Tag color={isFreeFee(fee) ? 'green' : 'blue'}>
                    {locationFeeLabel(fee)}
                  </Tag>
                </div>
              )}

              <div className="cf-location-note">
                Delivery fees are estimates based on the selected town.
                For an address entered manually, the delivery team may need
                to confirm the fee.
              </div>

              <Button
                type="link"
                className="cf-manual-link"
                icon={<EditOutlined />}
                onClick={() => {
                  setManualMode(true);
                  setManualAddress('');
                  setSearchText('');
                }}
              >
                My location is not listed
              </Button>
            </>
          ) : (
            <>
              <Button
                type="link"
                className="cf-manual-link"
                icon={<ArrowLeftOutlined />}
                onClick={() => {
                  setManualMode(false);
                  setManualAddress('');
                }}
              >
                Back to location search
              </Button>

              <label className="cf-location-step-label">
                Enter your full delivery address
              </label>

              <TextArea
                rows={4}
                value={manualAddress}
                onChange={event => setManualAddress(event.target.value)}
                placeholder="Enter your area, street, house number and a nearby landmark"
                maxLength={300}
                showCount
                autoFocus
              />

              <div className="cf-location-note">
                The delivery fee for a manually entered address may need to
                be confirmed by the delivery team.
              </div>
            </>
          )}

          <div className="cf-location-footer">
            <Button onClick={resetModal}>Cancel</Button>
            <Button
              type="primary"
              className="cf-save-location"
              icon={<CheckCircleOutlined />}
              disabled={!canSave}
              onClick={handleSave}
            >
              Use this location
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
};

export default CheckoutForm;