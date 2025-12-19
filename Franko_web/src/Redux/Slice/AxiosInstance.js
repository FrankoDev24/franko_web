import axios from "axios";

const API_KEY_NAME = import.meta.env.VITE_API_KEY_NAME;
const API_KEY_VALUE = import.meta.env.VITE_API_KEY_VALUE;

const axiosInstance = axios.create({
  baseURL: '/api', // ✅ Use the Vite proxy
  headers: {
    "Content-Type": "application/json",
    [API_KEY_NAME]: API_KEY_VALUE,
  },
});

export default axiosInstance;
