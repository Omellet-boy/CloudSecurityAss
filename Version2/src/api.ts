import axios from 'axios';

// Create an Axios instance pointing to the Express backend
const api = axios.create({
  baseURL: '/api', // Proxy or relative path since we'll serve it from the same server
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
      if (window.location.pathname !== '/login') {
        window.location.href = '/login'; // Force re-login if token expires
      }
    }
    return Promise.reject(error);
  }
);

export default api;
