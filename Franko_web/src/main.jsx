import "./utils/secureLocalStorageInit";
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from "react-redux";
import { store, persistor } from "./Redux/store.js";
import { PersistGate } from 'redux-persist/integration/react';
import { ThemeProvider } from '@material-tailwind/react';
import TagManager from 'react-gtm-module';
import { startAutoLogoutCheck } from './Redux/Slice/userSlice';

// ✅ Initialize GTM
TagManager.initialize({
  gtmId: 'GTM-WKCL4JTV', // Replace with your GTM ID
});
startAutoLogoutCheck(store.dispatch);


createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <Provider store={store}>
        <PersistGate loading={null} persistor={persistor}>
          <ThemeProvider>
            <App />
          </ThemeProvider>
        </PersistGate>
      </Provider>
    </BrowserRouter>
  </StrictMode>
);
