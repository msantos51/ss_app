// Página com detalhes de um trajeto específico
import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapContainer, TileLayer, Polyline } from 'react-leaflet';
import { fetchRoute } from '../services/api';
import 'leaflet/dist/leaflet.css';

function RouteDetailPage() {
  const { id } = useParams();
  const [route, setRoute] = useState(null);

  useEffect(() => {
    fetchRoute(id).then(setRoute).catch(() => setRoute(null));
  }, [id]);

  if (!route) return <p>Carregando...</p>;

  const polyline = route.points.map((p) => [p.lat, p.lng]);
  const position = polyline.length ? polyline[0] : [0, 0];

  return (
    <div style={{ padding: '1rem' }}>
      <h1>Detalhes do Trajeto</h1>
      <MapContainer center={position} zoom={13} style={{ height: '300px' }}>
        <TileLayer
          attribution='&copy; OpenStreetMap'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        <Polyline positions={polyline} />
      </MapContainer>
      <p>Distância: {(route.distance_m / 1000).toFixed(2)} km</p>
    </div>
  );
}

export default RouteDetailPage;
