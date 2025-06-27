// Página que lista trajetos registados pelo vendedor
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchVendorRoutes } from '../services/api';

// RoutesPage
function RoutesPage() {
  const [routes, setRoutes] = useState([]);

  useEffect(() => {
    fetchVendorRoutes().then(setRoutes).catch(() => setRoutes([]));
  }, []);

  return (
    <main style={{ padding: '1rem' }}>
      <h1>Trajetos</h1>
      <ul>
        {routes.map((r) => (
          <li key={r.id}>
            <Link to={`/routes/${r.id}`}>{r.start_time}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}

export default RoutesPage;
