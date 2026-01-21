// AxiosInstance.js
import axios from "axios";

const LAMBDA_BASE_URL = import.meta.env.VITE_LAMBDA_BASE_URL;
const LAMBDA_HEADER_NAME =
  import.meta.env.VITE_LAMBDA_HEADER_NAME || "Identifier";
const LAMBDA_HEADER_VALUE =
  import.meta.env.VITE_LAMBDA_HEADER_VALUE || "Franko";

const axiosInstance = axios.create({
  baseURL: LAMBDA_BASE_URL,
  headers: {
    // ❌ do not set Content-Type globally; let each request decide
    [LAMBDA_HEADER_NAME]: LAMBDA_HEADER_VALUE,
  },
});

// For JSON requests, axios will set Content-Type automatically when you send an object.

export default axiosInstance;