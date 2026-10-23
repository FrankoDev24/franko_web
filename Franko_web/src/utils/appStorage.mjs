import CryptoJS from 'crypto-js';

// Explicit app adapter: never modify Storage.prototype or third-party keys.
// Object returns intentionally preserve the application's existing storage API.
export function createAppStorage(storage, secret) {
  return {
    getItem(key) {
      const raw = storage.getItem(key);
      if (raw == null) return null;
      let value = raw;
      try {
        // Recover legacy encrypted values (including accidentally nested writes).
        for (let depth = 0; typeof value === 'string' && value.startsWith('U2FsdGVkX1'); depth++) {
          if (depth >= 3) throw new Error('Invalid storage encoding');
          value = CryptoJS.AES.decrypt(value, secret).toString(CryptoJS.enc.Utf8);
          if (!value) throw new Error('Unreadable storage value');
        }
        try { return JSON.parse(value); } catch { return value; }
      } catch {
        // Only discard this unreadable app entry. Never clear the entire store.
        storage.removeItem(key);
        return null;
      }
    },
    setItem(key, value) {
      const text = typeof value === 'string' ? value : JSON.stringify(value);
      // Activity is interoperable with tabs and existing timestamp readers.
      storage.setItem(key, key === 'lastActivityTimestamp'
        ? text : CryptoJS.AES.encrypt(text, secret).toString());
    },
    removeItem(key) { storage.removeItem(key); },
  };
}
