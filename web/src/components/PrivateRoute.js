import { Navigate } from 'react-router-dom';

// Componente simples para proteger rotas que requerem autenticação
const PrivateRoute = ({ children }) => {
  // token
  const token = localStorage.getItem('token');
  return token ? children : <Navigate to="/login" replace />;
};

export default PrivateRoute;
