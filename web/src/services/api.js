import axios from 'axios';
import { BASE_URL } from '../config';

const api = axios.create({
  baseURL: BASE_URL,
});

export const login = (email, password) =>
  api.post('/token', { email, password }).then((r) => r.data);

export const fetchVendorProfile = (token) =>
  api
    .get('/vendors/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

export const updateVendorLocation = (token, coords) =>
  api
    .put('/vendors/me/location', coords, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

export const fetchActiveVendors = () =>
  api.get('/vendors').then((r) => r.data);

export default api;
