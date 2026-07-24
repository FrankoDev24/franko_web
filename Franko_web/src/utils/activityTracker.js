import { updateLastActivity } from "../Redux/Slice/AxiosInstance";

const ACTIVITY_EVENTS = [
  "mousemove",
  "mousedown",
  "keydown",
  "scroll",
  "touchstart",
  "click",
];

let activityTimeout;

const recordActivity = () => {
  clearTimeout(activityTimeout);

  activityTimeout = setTimeout(() => {
    updateLastActivity();
  }, 300);
};

export const startActivityTracking = () => {
  updateLastActivity();

  ACTIVITY_EVENTS.forEach((eventName) => {
    window.addEventListener(eventName, recordActivity, {
      passive: true,
    });
  });

  window.addEventListener("storage", (event) => {
    if (event.key === "lastActivityTimestamp") {
      // Keep activity synchronized across browser tabs.
      updateLastActivity();
    }
  });

  return () => {
    clearTimeout(activityTimeout);

    ACTIVITY_EVENTS.forEach((eventName) => {
      window.removeEventListener(eventName, recordActivity);
    });
  };
};