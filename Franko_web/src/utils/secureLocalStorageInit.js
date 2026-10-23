import { createAppStorage } from './appStorage.mjs';

// Lazy access also allows imports in non-browser tooling. No global patching.
const nativeStorage = {
  getItem: key => window.localStorage.getItem(key),
  setItem: (key, value) => window.localStorage.setItem(key, value),
  removeItem: key => window.localStorage.removeItem(key),
};
export const appStorage = createAppStorage(
  nativeStorage, import.meta.env.VITE_SECRET_KEY || 'your-secret-key'
);
