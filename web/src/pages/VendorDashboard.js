import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchVendorProfile, updateVendorLocation } from '../services/api';
import styles from './VendorDashboard.module.css';
import { useTranslation } from '../i18n';

// VendorDashboard
function VendorDashboard() {
  // navigate
  const navigate = useNavigate();
  // t
  const t = useTranslation();
  const [vendor, setVendor] = useState(null);
  // token
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) return;
    fetchVendorProfile(token).then(setVendor);
  }, [token]);

  // logout
  const logout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  // shareLocation
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
    <main className={styles.container}>
      <h1>{t('vendorPanel')}</h1>
      <p>
        {t('name')}: {vendor.name}
      </p>
      <p>
        {t('product')}: {vendor.product}
      </p>
      <p>
        {t('location')}: {vendor.current_lat}, {vendor.current_lng}
      </p>
      <button onClick={shareLocation}>{t('shareLocation')}</button>
      <button onClick={logout}>{t('logout')}</button>
    </main>
  );
}

export default VendorDashboard;
