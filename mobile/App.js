// Exemplo simples de mapa que busca os vendedores do backend
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';

export default function App() {
  // Estado para guardar os vendedores
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    // Buscar vendedores do backend
    axios.get('http://localhost:8000/vendors/')
      .then(res => setVendors(res.data))
      .catch(err => console.log(err));
  }, []);

  return (
    <View style={styles.container}>
      <MapView style={styles.map}>
        {vendors.map(vendor => (
          <Marker
            key={vendor.id}
            coordinate={{ latitude: vendor.current_lat, longitude: vendor.current_lng }}
            title={vendor.user.username}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 }
});
