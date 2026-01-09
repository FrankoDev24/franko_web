import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_KEY_NAME = import.meta.env.VITE_API_KEY_NAME;
const API_KEY_VALUE = import.meta.env.VITE_API_KEY_VALUE;

const axiosInstance = axios.create({
  baseURL: API_BASE_URL, // Directly points to your production API
  headers: {
    "Content-Type": "application/json",
    [API_KEY_NAME]: API_KEY_VALUE, // Dynamically set API key
  },
});

export default axiosInstance;
