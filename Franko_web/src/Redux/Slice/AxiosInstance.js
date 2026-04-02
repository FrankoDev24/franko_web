// src/Redux/Slice/AxiosInstance.js
import axios from "axios";

const LAMBDA_BASE_URL = import.meta.env.VITE_LAMBDA_BASE_URL;
const LAMBDA_HEADER_NAME =
  import.meta.env.VITE_LAMBDA_HEADER_NAME || "Identifier";
const LAMBDA_HEADER_VALUE =
  import.meta.env.VITE_LAMBDA_HEADER_VALUE || "Franko";

const axiosInstance = axios.create({
  baseURL: LAMBDA_BASE_URL,
  headers: {
    [LAMBDA_HEADER_NAME]: LAMBDA_HEADER_VALUE,
  },
});

// Request interceptor for debugging
axiosInstance.interceptors.request.use(
  (config) => {
 
    return config;
  },
  (error) => {

    return Promise.reject(error);
  }
);

// Response interceptor for debugging
axiosInstance.interceptors.response.use(
  (response) => {
   
    return response;
  },
  (error) => {
 
    return Promise.reject(error);
  }
);

export default axiosInstance;