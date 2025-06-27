import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchVendorProfile, updateVendorLocation } from '../services/api';
import styles from './VendorDashboard.module.css';

function VendorDashboard() {
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;
    fetchVendorProfile(token).then(setVendor);
  }, [token]);

  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  const shareLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      updateVendorLocation(token, {
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    });
  };

  if (!vendor) return <p>Carregando...</p>;

  return (
    <div className={styles.container}>
      <h1>Painel do Vendedor</h1>
      <p>Nome: {vendor.name}</p>
      <p>Produto: {vendor.product}</p>
      <p>
        Localização: {vendor.current_lat}, {vendor.current_lng}
      </p>
      <button onClick={shareLocation}>Partilhar localização</button>
      <button onClick={logout}>Sair</button>
    </div>
  );
}

export default VendorDashboard;
