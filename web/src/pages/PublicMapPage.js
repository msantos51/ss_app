import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { fetchActiveVendors } from '../services/api';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// fix default icon paths for webpack
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});
import styles from './PublicMapPage.module.css';

// PublicMapPage
function PublicMapPage() {
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    fetchActiveVendors().then(setVendors);
  }, []);

  // center
  const center = vendors.length
    ? [vendors[0].current_lat, vendors[0].current_lng]
    : [38.716, -9.139];

  return (
    <div className={styles.map}>
      <MapContainer center={center} zoom={13} style={{ height: '100vh' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {vendors.map(
          (v) =>
            v.current_lat && (
              <Marker key={v.id} position={[v.current_lat, v.current_lng]}>
                <Popup>
                  <strong>{v.name}</strong>
                  <br />
                  {v.product}
                </Popup>
              </Marker>
            )
        )}
      </MapContainer>
    </div>
  );
}

export default PublicMapPage;
