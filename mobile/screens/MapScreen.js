import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';

export default function MapScreen() {
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    axios
      .get('http://localhost:8000/vendors/')
      .then(res => setVendors(res.data))
      .catch(err => console.log(err));
  }, []);

  return (
    <View style={styles.container}>
      <MapView style={styles.map}>
        {vendors.map(vendor => (
          <Marker
            key={vendor.id}
            coordinate={{
              latitude: vendor.current_lat,
              longitude: vendor.current_lng,
            }}
            title={vendor.user.email}
          />
        ))}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
});
