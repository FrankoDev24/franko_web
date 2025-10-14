import CryptoJS from "crypto-js";

const SECRET_KEY = import.meta.env.VITE_SECRET_KEY || "your-secret-key";

// --- Encryption helpers ---
const encrypt = (data) => {
  try {
    // Always store strings (for safety)
    const str = typeof data === "string" ? data : JSON.stringify(data);
    return CryptoJS.AES.encrypt(str, SECRET_KEY).toString();
  } catch (err) {
 
    return data;
  }
};

const decrypt = (cipherText) => {
  try {
    // Skip if it's already plain text or malformed
    if (!cipherText || typeof cipherText !== "string") return cipherText;
    if (!cipherText.startsWith("U2FsdGVkX1")) return cipherText;

    const bytes = CryptoJS.AES.decrypt(cipherText, SECRET_KEY);
    const decrypted = bytes.toString(CryptoJS.enc.Utf8);

    // Try to parse JSON, else return string
    try {
      return JSON.parse(decrypted);
    } catch {
      return decrypted;
    }
  } catch (err) {
    return cipherText;
  }
};

// --- Monkey patch localStorage ---
(function enforceEncryptedLocalStorage() {
  const originalSet = Storage.prototype.setItem;
  const originalGet = Storage.prototype.getItem;
  const originalRemove = Storage.prototype.removeItem;

  Storage.prototype.setItem = function (key, value) {
    try {
      // Avoid double-encryption
      if (typeof value === "string" && value.startsWith("U2FsdGVkX1")) {
        originalSet.call(this, key, value);
      } else {
        const encrypted = encrypt(value);
        originalSet.call(this, key, encrypted);
      }
    } catch (err) {

      originalSet.call(this, key, value);
    }
  };

  Storage.prototype.getItem = function (key) {
    const encrypted = originalGet.call(this, key);
    if (!encrypted) return null;
    return decrypt(encrypted);
  };

  Storage.prototype.removeItem = function (key) {
    originalRemove.call(this, key);
  };

  
})();
