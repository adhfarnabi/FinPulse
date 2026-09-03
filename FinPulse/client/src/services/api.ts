import axios from 'axios';

export const api = axios.create({
  baseURL: '/api/v1',
  timeout: 10_000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('finpulse_token');
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('finpulse_token');
    }
    return Promise.reject(err);
  },
);

export const healthApi = axios.create({ baseURL: '/api', timeout: 5000 });
