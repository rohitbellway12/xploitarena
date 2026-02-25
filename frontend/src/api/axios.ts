import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // Log error for debugging
    if (error.response) {
      console.error('API Error:', {
        url: originalRequest?.url,
        status: error.response.status,
        message: error.response.data?.message || error.message,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('Network Error:', error.request);
    } else {
      console.error('Error:', error.message);
    }
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      const refreshToken = localStorage.getItem('refreshToken');
      
      // Do not redirect if the original request was to login
      const isLoginRequest = originalRequest.url?.includes('/auth/login') || originalRequest.url?.includes('/login');

      if (refreshToken) {
        try {
          const { data } = await api.post('/auth/refresh-token', { token: refreshToken });
          localStorage.setItem('token', data.accessToken);
          originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
          return api(originalRequest);
        } catch (refreshError) {
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          if (!isLoginRequest) {
            window.location.href = '/login';
          }
        }
      } else {
        // No refresh token available, force logout
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        if (!isLoginRequest) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;
