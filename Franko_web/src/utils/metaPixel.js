// src/utils/metaPixel.js

// Track standard Meta Pixel events
export const trackMetaEvent = (eventName, eventData = {}) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", eventName, eventData);
    return true;
  }
  console.warn(`Meta Pixel not loaded — event "${eventName}" skipped.`);
  return false;
};

// Track with custom event name
export const trackMetaCustomEvent = (eventName, eventData = {}) => {
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("trackCustom", eventName, eventData);
  }
};

// Fire CompleteRegistration with required value field
export const trackCompleteRegistration = ({
  value,
  currency = "USD",
  orderId,
  contentName = "Trading Course Registration",
  contentCategory = "Education",
  numItems = 1,
}) => {
  const numericValue = parseFloat(value);

  // Meta REQUIRES value > 0
  if (!numericValue || numericValue <= 0) {
    console.warn(
      `Skipping CompleteRegistration: value must be > 0 (got ${value})`
    );
    return false;
  }

  // Prevent duplicate fires for the same order in this session
  const dedupeKey = `cr_fired_${orderId}`;
  if (sessionStorage.getItem(dedupeKey)) {
    console.log(`CompleteRegistration already fired for order ${orderId}`);
    return false;
  }

  const eventId = `cr_${orderId}_${Date.now()}`;

  // ✅ Fire Meta Pixel (browser)
  if (typeof window !== "undefined" && window.fbq) {
    window.fbq("track", "CompleteRegistration", {
      value: numericValue,
      currency,
      content_name: contentName,
      content_category: contentCategory,
      content_ids: [String(orderId)],
      content_type: "product",
      num_items: numItems,
    }, { eventID: eventId });
  }

  // ✅ Fire Google Ads conversion (optional — uncomment if needed)
  // if (window.gtag) {
  //   window.gtag("event", "conversion", {
  //     send_to: "AW-XXXXXXXXXX/XXXXXXXXXXXXXX",
  //     value: numericValue,
  //     currency,
  //     transaction_id: orderId,
  //   });
  // }

  // Push to dataLayer for GTM
  if (typeof window !== "undefined") {
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: "CompleteRegistration",
      event_id: eventId,
      value: numericValue,
      currency,
      order_id: orderId,
      content_name: contentName,
      content_category: contentCategory,
      num_items: numItems,
    });
  }

  // Mark as fired
  sessionStorage.setItem(dedupeKey, "1");

  console.log(`✅ CompleteRegistration fired`, {
    value: numericValue,
    currency,
    orderId,
  });
  return true;
};