import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Checkbox,
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
} from 'antd';
import {
  AimOutlined,
  CheckCircleFilled,
  CheckCircleOutlined,
  DollarOutlined,
  EditOutlined,
  EnvironmentOutlined,
  InfoCircleOutlined,
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
  color: #1f3327;
  font-size: 13px;
  font-weight: 700;
}
.cf-form-ui .ant-input-affix-wrapper,
.cf-form-ui .ant-input,
.cf-form-ui .ant-input-number,
.cf-form-ui .ant-select-selector {
  border-color: #d7e7dd !important;
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
  border-color: #22c55e !important;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, .14) !important;
}
.cf-form-ui .cf-locked-field {
  background: #f3fbf6;
}
.cf-form-ui .cf-locked-field input {
  color: #264d36;
  font-weight: 700;
}
.cf-field-note {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin-top: 8px;
  color: #64756b;
  font-size: 12px;
  line-height: 1.5;
}
.cf-lock-note {
  color: #15803d;
}
.cf-address-card {
  display: flex;
  width: 100%;
  align-items: center;
  gap: 14px;
  padding: 15px 16px;
  border: 1px solid #d2ecd9;
  border-radius: 16px;
  background: linear-gradient(135deg, #ffffff 0%, #f3fbf6 100%);
  color: #1f2937;
  cursor: pointer;
  text-align: left;
  transition: transform .18s ease, box-shadow .18s ease, border-color .18s ease;
}
.cf-address-card:hover {
  transform: translateY(-1px);
  border-color: #4ade80;
  box-shadow: 0 10px 24px rgba(34, 197, 94, .12);
}
.cf-address-card-selected {
  border-color: #86efac;
  background: linear-gradient(135deg, #f0fdf4 0%, #ffffff 100%);
}
.cf-address-icon {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  place-items: center;
  border-radius: 14px;
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  color: #16a34a;
  font-size: 19px;
}
.cf-address-copy {
  min-width: 0;
  flex: 1;
}
.cf-address-eyebrow {
  display: block;
  margin-bottom: 3px;
  color: #16a34a;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .09em;
  text-transform: uppercase;
}
.cf-address-value {
  display: block;
  color: #14281d;
  font-size: 14px;
  font-weight: 800;
  line-height: 1.4;
  overflow-wrap: anywhere;
}
.cf-address-subtitle {
  display: block;
  margin-top: 3px;
  color: #6b7c72;
  font-size: 12px;
  line-height: 1.4;
}
.cf-address-action {
  display: inline-flex;
  flex: 0 0 auto;
  align-items: center;
  gap: 6px;
  padding: 8px 11px;
  border: 1px solid #bbf7d0;
  border-radius: 10px;
  background: #f0fdf4;
  color: #15803d;
  font-size: 12px;
  font-weight: 750;
  transition: background .15s ease;
}
.cf-address-card:hover .cf-address-action {
  background: #dcfce7;
}
.cf-guest-gate {
  display: flex;
  gap: 12px;
  padding: 15px;
  border: 1px solid #d1fae5;
  border-radius: 14px;
  background: #f0fdf4;
}
.cf-guest-gate-icon {
  display: grid;
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  place-items: center;
  border-radius: 12px;
  background: #dcfce7;
  color: #15803d;
  font-size: 17px;
}
.cf-guest-gate strong {
  display: block;
  margin: 1px 0 4px;
  color: #14532d;
  font-size: 13px;
}
.cf-guest-gate p {
  margin: 0;
  color: #4f6b59;
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

/* ── Minimal Light-Green Delivery Modal ── */
.cf-location-modal .ant-modal-content {
  overflow: hidden;
  border-radius: 22px;
  border: 1px solid #dcfce7;
  box-shadow: 0 24px 60px rgba(15, 45, 25, .14);
}
.cf-location-modal .ant-modal-close {
  top: 18px;
  right: 18px;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  background: #ffffff;
  border: 1px solid #dcfce7;
  color: #4b6354;
  transition: background .15s ease, color .15s ease;
}
.cf-location-modal .ant-modal-close:hover {
  background: #dcfce7;
  color: #14532d;
}

.cf-location-hero {
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 20px 56px 18px 22px;
  background: linear-gradient(135deg, #f4fdf7 0%, #e6f9ed 100%);
  border-bottom: 1px solid #dcfce7;
}
.cf-location-hero-icon {
  display: grid;
  width: 44px;
  height: 44px;
  flex: 0 0 44px;
  place-items: center;
  border-radius: 14px;
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  color: #16a34a;
  font-size: 20px;
}
.cf-location-hero h3 {
  margin: 0;
  color: #112a1b;
  font-size: 17px;
  font-weight: 800;
  letter-spacing: -.01em;
}
.cf-location-hero p {
  margin: 2px 0 0;
  color: #5c7666;
  font-size: 12.5px;
  line-height: 1.4;
}

.cf-location-content {
  padding: 18px 22px 20px;
  background: #ffffff;
}

/* Mode switcher */
.cf-mode-switch {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 4px;
  margin-bottom: 18px;
  border-radius: 12px;
  background: #f2faf5;
  border: 1px solid #dcfce7;
}
.cf-mode-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 36px;
  border: 0;
  border-radius: 9px;
  background: transparent;
  color: #5c7666;
  font-size: 12.5px;
  font-weight: 700;
  cursor: pointer;
  transition: all .18s ease;
}
.cf-mode-tab:hover:not(.is-active) {
  color: #166534;
}
.cf-mode-tab.is-active {
  background: #ffffff;
  color: #15803d;
  box-shadow: 0 2px 8px rgba(22, 163, 74, .10);
  border: 1px solid #bbf7d0;
}

.cf-location-step-label {
  display: block;
  margin-bottom: 7px;
  color: #364e3f;
  font-size: 12px;
  font-weight: 750;
}

.cf-location-search {
  margin-bottom: 14px;
}
.cf-location-search .ant-input-affix-wrapper {
  min-height: 44px;
  border-radius: 12px !important;
  border-color: #d7ebe0 !important;
  background: #fafdfb;
}
.cf-location-search .ant-input-affix-wrapper-focused,
.cf-location-search .ant-input-affix-wrapper:hover {
  border-color: #4ade80 !important;
  background: #ffffff;
}
.cf-location-search .ant-input-affix-wrapper-focused {
  box-shadow: 0 0 0 3px rgba(34, 197, 94, .14) !important;
}
.cf-location-search .ant-input {
  background: transparent;
}

.cf-location-results {
  display: grid;
  max-height: 220px;
  gap: 6px;
  margin: 0 0 14px;
  padding-right: 2px;
  overflow-y: auto;
}
.cf-location-results::-webkit-scrollbar {
  width: 5px;
}
.cf-location-results::-webkit-scrollbar-thumb {
  background: #cdebd7;
  border-radius: 99px;
}
.cf-location-result {
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 13px;
  border: 1px solid #e7f3ec;
  border-radius: 12px;
  background: #ffffff;
  cursor: pointer;
  text-align: left;
  transition: background .15s ease, border-color .15s ease, transform .12s ease;
}
.cf-location-result:hover {
  border-color: #86efac;
  background: #f0fdf4;
}
.cf-location-result-name {
  display: block;
  color: #162c1e;
  font-size: 13px;
  font-weight: 750;
}
.cf-location-result-region {
  display: block;
  margin-top: 1px;
  color: #72887a;
  font-size: 11px;
}
.cf-location-result-fee {
  flex: 0 0 auto;
  padding: 4px 9px;
  border-radius: 999px;
  background: #dcfce7;
  color: #15803d;
  font-size: 11px;
  font-weight: 800;
}

.cf-location-selects {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}
.cf-location-selects .ant-select {
  width: 100%;
}
.cf-location-selects .ant-select-selector {
  min-height: 44px !important;
  align-items: center;
  border-radius: 12px !important;
  border-color: #d7ebe0 !important;
  background: #fafdfb !important;
}
.cf-location-selects .ant-select-focused .ant-select-selector,
.cf-location-selects .ant-select:hover .ant-select-selector {
  border-color: #4ade80 !important;
  background: #ffffff !important;
}
.cf-location-selects .ant-select-focused .ant-select-selector {
  box-shadow: 0 0 0 3px rgba(34, 197, 94, .14) !important;
}
.cf-town-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.cf-town-option-fee {
  color: #16a34a;
  font-size: 11px;
  font-weight: 750;
}

.cf-selected-location {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-top: 14px;
  padding: 12px 14px;
  border: 1px solid #bbf7d0;
  border-radius: 13px;
  background: #f0fdf4;
}
.cf-selected-location-icon {
  color: #16a34a;
  font-size: 18px;
}
.cf-selected-location-copy {
  min-width: 0;
  flex: 1;
}
.cf-selected-location-copy span {
  display: block;
  color: #4d7c5c;
  font-size: 10px;
  font-weight: 800;
  letter-spacing: .08em;
  text-transform: uppercase;
}
.cf-selected-location-copy strong {
  display: block;
  margin-top: 2px;
  color: #14532d;
  font-size: 13.5px;
}
.cf-fee-pill {
  padding: 4px 10px;
  border-radius: 999px;
  background: #dcfce7;
  border: 1px solid #bbf7d0;
  color: #15803d;
  font-size: 11.5px;
  font-weight: 800;
  white-space: nowrap;
}

.cf-manual-textarea.ant-input-textarea-affix-wrapper,
.cf-manual-textarea .ant-input {
  border-radius: 12px !important;
  border-color: #d7ebe0 !important;
  background: #fafdfb;
}
.cf-manual-textarea .ant-input:focus {
  border-color: #4ade80 !important;
  background: #ffffff;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, .14) !important;
}

.cf-save-row {
  display: flex;
  align-items: center;
  margin-top: 14px;
  padding: 10px 12px;
  border-radius: 11px;
  background: #f6fbf8;
  border: 1px solid #e2f2e8;
}
.cf-save-row .ant-checkbox-checked .ant-checkbox-inner {
  background-color: #22c55e;
  border-color: #22c55e;
}
.cf-save-row .ant-checkbox-wrapper {
  color: #274432;
  font-size: 12.5px;
  font-weight: 600;
}

.cf-location-hint {
  display: flex;
  align-items: flex-start;
  gap: 7px;
  margin-top: 10px;
  color: #6b7f72;
  font-size: 11.5px;
  line-height: 1.45;
}
.cf-location-hint .anticon {
  margin-top: 2px;
  color: #22c55e;
}

.cf-location-empty {
  padding: 18px 14px;
  border: 1px dashed #cdebd7;
  border-radius: 12px;
  background: #f8fdf9;
  color: #5b7263;
  font-size: 12.5px;
  text-align: center;
}
.cf-location-empty button {
  margin-top: 6px;
  padding: 0;
  border: 0;
  background: none;
  color: #16a34a;
  font-size: 12.5px;
  font-weight: 750;
  cursor: pointer;
  text-decoration: underline;
}

.cf-location-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 16px;
  padding-top: 14px;
  border-top: 1px solid #eaf4ed;
}
.cf-location-footer .ant-btn {
  min-height: 42px;
  padding: 0 18px;
  border-radius: 11px;
  font-size: 13px;
  font-weight: 750;
}
.cf-location-footer .cf-cancel-btn {
  border-color: #d7ebe0;
  color: #466150;
}
.cf-location-footer .cf-cancel-btn:hover {
  border-color: #86efac !important;
  color: #15803d !important;
  background: #f0fdf4 !important;
}
.cf-location-footer .cf-save-location {
  border: 0;
  background: #22c55e;
  color: #ffffff;
  box-shadow: 0 6px 16px rgba(34, 197, 94, .24);
}
.cf-location-footer .cf-save-location:hover:not(:disabled) {
  background: #16a34a !important;
}
.cf-location-footer .cf-save-location:disabled {
  background: #dcfce7;
  color: #86b395;
  box-shadow: none;
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
    border-radius: 12px;
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
    padding: 16px 48px 15px 16px;
  }
  .cf-location-hero h3 {
    font-size: 15.5px;
  }
  .cf-location-footer {
    display: grid;
    grid-template-columns: 1fr 1.4fr;
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
  const [saveAddress, setSaveAddress] = useState(false);

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
        .filter(
          townData =>
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
      const saved = readStoredObject(localStorage.getItem('deliveryInfo'));

      const owner =
        saved?.customerId ?? saved?.Customerid ?? saved?.CustomerId;

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
  }, [isAuthenticated, isAgent, customerAccountId, setDeliveryInfo]);

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
      if (saveAddress && isAuthenticated && customerAccountId != null) {
        localStorage.setItem('deliveryInfo', info);
      } else if (!saveAddress) {
        localStorage.removeItem('deliveryInfo');
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
    isFreeFee(deliveryInfo?.feeDisplay) || isFreeFee(deliveryInfo?.fee);

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
              phoneLocked ? (
                <LockOutlined style={{ color: '#16a34a' }} />
              ) : null
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
                This number is fixed to your registered Mobile Money account.
                The recipient name can still be changed.
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
                  Delivery addresses are not displayed to guests. Once you sign
                  in, choose a region and town or enter an address manually.
                </p>
              </div>
            </div>
          ) : isAgent ? (
            <div>
              <TextArea
                rows={3}
                value={agentManualAddress}
                onChange={event => setAgentManualAddress(event.target.value)}
                placeholder="Enter the delivery address for your customer"
                maxLength={300}
                showCount
              />

              <div className="cf-field-note">
                <PushpinOutlined />
                <span>
                  Add a clear address, landmark or directions for the delivery
                  team.
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
                    onChange={value => setAgentDeliveryFee(Number(value) || 0)}
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
                  {deliveryInfo?.address || 'Choose your region and town'}
                </span>

                <span className="cf-address-subtitle">
                  {deliveryInfo?.address
                    ? savedFeeLabel
                    : 'Search locations or enter your address manually.'}
                </span>
              </span>

              <span className="cf-address-action">
                {deliveryInfo?.address ? <EditOutlined /> : <AimOutlined />}
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
        width={560}
        centered
        destroyOnClose
        styles={{ body: { padding: 0 } }}
      >
        <div className="cf-location-hero">
          <div className="cf-location-hero-icon">
            <EnvironmentOutlined />
          </div>
          <div>
            <h3>Select delivery address</h3>
            <p>Pick your town for instant pricing or type your address manually.</p>
          </div>
        </div>

        <div className="cf-location-content">
          {/* Minimal 2-mode pill switch */}
          <div className="cf-mode-switch" role="tablist" aria-label="Address entry mode">
            <button
              type="button"
              role="tab"
              aria-selected={!manualMode}
              className={`cf-mode-tab ${!manualMode ? 'is-active' : ''}`}
              onClick={() => setManualMode(false)}
            >
              <SearchOutlined />
              <span>Select Town</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={manualMode}
              className={`cf-mode-tab ${manualMode ? 'is-active' : ''}`}
              onClick={() => {
                setManualMode(true);
                setSearchText('');
              }}
            >
              <EditOutlined />
              <span>Enter Manually</span>
            </button>
          </div>

          {!manualMode ? (
            <>
              <div className="cf-location-search">
                <Input
                  size="large"
                  prefix={<SearchOutlined style={{ color: '#22c55e' }} />}
                  placeholder="Search town or region (e.g. Madina, Accra)…"
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
                        onClick={() => handleTownSelect(townData.name, regionName)}
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
                    <div className="cf-location-empty">
                      <div>No matching location found for &ldquo;{searchText}&rdquo;.</div>
                      <button
                        type="button"
                        onClick={() => {
                          setManualMode(true);
                          setManualAddress(searchText);
                          setSearchText('');
                        }}
                      >
                        Enter &ldquo;{searchText}&rdquo; manually instead →
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="cf-location-selects">
                  <div>
                    <label className="cf-location-step-label">Region</label>
                    <Select
                      size="large"
                      showSearch
                      value={region || undefined}
                      placeholder="Select region"
                      onChange={handleRegionChange}
                      filterOption={(input, option) =>
                        String(option?.value || '')
                          .toLowerCase()
                          .includes(input.toLowerCase())
                      }
                    >
                      {locationList.map(location => (
                        <Option key={location.region} value={location.region}>
                          {location.region}
                        </Option>
                      ))}
                    </Select>
                  </div>

                  <div>
                    <label className="cf-location-step-label">Town / Area</label>
                    <Select
                      size="large"
                      showSearch
                      value={town || undefined}
                      placeholder={region ? 'Select town' : 'Choose region first'}
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
                  <CheckCircleFilled className="cf-selected-location-icon" />
                  <div className="cf-selected-location-copy">
                    <span>Selected location</span>
                    <strong>
                      {town}, {region}
                    </strong>
                  </div>
                  <span className="cf-fee-pill">{locationFeeLabel(fee)}</span>
                </div>
              )}
            </>
          ) : (
            <div>
              <label className="cf-location-step-label">
                Full delivery address &amp; landmark
              </label>
              <TextArea
                className="cf-manual-textarea"
                rows={3}
                value={manualAddress}
                onChange={event => setManualAddress(event.target.value)}
                placeholder="e.g. East Legon, Lagos Avenue, House #14 near Shell Station"
                maxLength={300}
                showCount
                autoFocus
              />
            </div>
          )}

          <div className="cf-save-row">
            <Checkbox
              checked={saveAddress}
              onChange={e => setSaveAddress(e.target.checked)}
            >
              Save as default delivery address
            </Checkbox>
          </div>

          <div className="cf-location-hint">
            <InfoCircleOutlined />
            <span>
              {manualMode
                ? 'Our delivery team will confirm the delivery fee for manually entered addresses.'
                : 'Delivery fees are estimated by town. Switch to "Enter Manually" if your location is not listed.'}
            </span>
          </div>

          <div className="cf-location-footer">
            <Button className="cf-cancel-btn" onClick={resetModal}>
              Cancel
            </Button>
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