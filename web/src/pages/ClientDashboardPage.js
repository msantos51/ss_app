// Página principal para clientes autenticados
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchFavorites } from '../services/api';
import { getFavorites } from '../services/favorites';

// ClientDashboardPage
function ClientDashboardPage() {
  // navigate
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    // load
    const load = async () => {
      // ids
      const ids = getFavorites();
      if (ids.length === 0) return;
      // vendors
      const vendors = await fetchFavorites(ids);
      setFavorites(vendors);
    };
    load();
  }, []);

  // handleLogout
  const handleLogout = () => {
    localStorage.removeItem('client');
    localStorage.removeItem('clientToken');
    navigate('/client/login');
  };

  return (
    <main style={{ padding: '1rem' }}>
      <h1>Perfil do Cliente</h1>
      <h2>Favoritos</h2>
      <ul>
        {favorites.map((v) => (
          <li key={v.id}>{v.name}</li>
        ))}
      </ul>
      <button onClick={handleLogout}>Sair</button>
    </main>
  );
}

export default ClientDashboardPage;
