// Página que mostra detalhes de um vendedor
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { fetchVendor } from '../services/api';

// VendorDetailPage
function VendorDetailPage() {
  const { id } = useParams();
  const [vendor, setVendor] = useState(null);

  useEffect(() => {
    fetchVendor(id).then(setVendor).catch(() => setVendor(null));
  }, [id]);

  if (!vendor) return <p>Carregando...</p>;

  return (
    <div style={{ padding: '1rem' }}>
      <h1>{vendor.name}</h1>
      {vendor.profile_photo && (
        <img src={vendor.profile_photo} alt={vendor.name} width={120} />
      )}
      <p>Produto: {vendor.product}</p>
    </div>
  );
}

export default VendorDetailPage;
