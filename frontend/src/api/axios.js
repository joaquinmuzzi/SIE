import axios from 'axios';

const api = axios.create({
  baseURL: 'https://sie-production-014a.up.railway.app/',
});

// Interceptor para agregar el token a todas las peticiones
api.interceptors.request.use((config) => {
  const userInfo = JSON.parse(localStorage.getItem('userInfo'));
  if (userInfo && userInfo.token) {
    config.headers.Authorization = `Bearer ${userInfo.token}`;
  }
  return config;
});

export default api;
