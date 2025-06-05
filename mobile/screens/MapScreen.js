import React, { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';

export default function MapScreen({ navigation }) {
  const [vendors, setVendors] = useState([]);

  useEffect(() => {
    axios
      .get('http://10.0.2.2:8000/vendors/')
      .then(res => setVendors(res.data))
      .catch(err => console.log('Erro ao buscar vendedores:', err));
  }, []);

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 38.736946, // Exemplo: Lisboa
          longitude: -9.142685,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        {vendors.map(vendor => (
          vendor.current_lat && vendor.current_lng && (
            <Marker
              key={vendor.id}
              coordinate={{
                latitude: vendor.current_lat,
                longitude: vendor.current_lng,
              }}
              title={vendor.user.email}
              description={vendor.product}
            />
          )
        ))}
      </MapView>

      {/* Botões por cima do mapa */}
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.button}
          onPress={() => navigation.navigate('Register')}
        >
          <Text style={styles.buttonText}>Registar</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  buttonsContainer: {
    position: 'absolute',
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  button: {
    backgroundColor: '#2196F3',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
