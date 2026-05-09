// frontend/src/api.js
import axios from 'axios';

// Create an Axios instance pointing to the Node.js backend
const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Change to your actual backend port/URL
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor to attach JWT token to every request
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('jwt_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor to handle expired tokens (401 Unauthorized)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('jwt_token');
      localStorage.removeItem('user_data');
      window.location.href = '/login'; // Force re-login if token expires
    }
    return Promise.reject(error);
  }
);

export default api;