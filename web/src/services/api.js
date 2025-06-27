import axios from 'axios';
import { BASE_URL } from '../config';

// Instância pré-configurada do axios para apontar para o backend
const api = axios.create({
  baseURL: BASE_URL,
});

// Login de vendedores
export const login = (email, password) => {
  const params = new URLSearchParams();
  params.append('username', email);  // FastAPI espera 'username', não 'email'
  params.append('password', password);

  return api.post('/token', params, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  }).then((r) => r.data);
};


// Obtém o perfil do vendedor autenticado
export const fetchVendorProfile = (token) =>
  api
    .get('/vendors/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

// Atualiza localização do vendedor
export const updateVendorLocation = (token, coords) =>
  api
    .put('/vendors/me/location', coords, {
      headers: { Authorization: `Bearer ${token}` },
    })
    .then((r) => r.data);

// Lista vendedores ativos visíveis no mapa
export const fetchActiveVendors = () =>
  api.get('/vendors').then((r) => r.data);

// Login de clientes
export const clientLogin = (email, password) =>
  api.post('/client-token', { email, password }).then((r) => r.data);

// Registo de novo vendedor
export const registerVendor = (data) =>
  api.post('/vendors/', data).then((r) => r.data);

// Registo de novo cliente
export const registerClient = (data) =>
  api.post('/clients/', data).then((r) => r.data);

// Solicita recuperação de palavra-passe
export const requestPasswordReset = (email) =>
  api.post('/password-reset-request', { email });

// Lista trajetos do vendedor autenticado
export const fetchVendorRoutes = () =>
  api.get('/vendors/me/routes').then((r) => r.data);

// Obtém detalhes de trajeto específico
export const fetchRoute = (id) =>
  api.get(`/routes/${id}`).then((r) => r.data);

// Obtém detalhes de um vendedor
export const fetchVendor = (id) =>
  api.get(`/vendors/${id}`).then((r) => r.data);

// Lista semanas já pagas
export const fetchPaidWeeks = () =>
  api.get('/vendors/me/paid-weeks').then((r) => r.data);

// Lista vendedores favoritos dados os IDs
export const fetchFavorites = (ids) =>
  api.get('/vendors').then((r) => r.data.filter((v) => ids.includes(v.id)));

// Obtém perfil de cliente
export const fetchClientProfile = (id) =>
  api.get(`/clients/${id}`).then((r) => r.data);

export default api;
