import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  FlatList,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MapView, { Marker } from 'react-native-maps';
import axios from 'axios';
import { BASE_URL } from '../config';
import {
  startLocationSharing,
  stopLocationSharing,
  isLocationSharing,
} from '../locationService';

export default function MapScreen({ navigation }) {
  const [vendors, setVendors] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState('Todos');
  const mapRef = useRef(null);

  const fetchVendors = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/vendors/`);
      setVendors(res.data);
    } catch (err) {
      console.log('Erro ao buscar vendedores:', err);
    }
  };

  const loadUser = async () => {
    try {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const v = JSON.parse(stored);
        setCurrentUser(v);

        const share = await isLocationSharing();
        if (share) {
          try {
            await startLocationSharing(v.id);
          } catch (err) {
            console.log('Erro ao iniciar localização:', err);
          }
        }
      } else {
        setCurrentUser(null);
        await stopLocationSharing();
      }
    } catch (err) {
      console.log('Erro ao carregar utilizador:', err);
      setCurrentUser(null);
    }
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchVendors();
      loadUser();
    });

    // Também carregar na primeira vez
    fetchVendors();
    loadUser();

    return unsubscribe;
  }, [navigation]);

  const activeVendors = vendors.filter(
    (v) => v.current_lat != null && v.current_lng != null
  );
  const filteredVendors = activeVendors.filter(
    (v) => selectedProduct === 'Todos' || v.product === selectedProduct
  );

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: 38.736946, // Lisboa
          longitude: -9.142685,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
{filteredVendors.map((vendor) =>
  vendor.current_lat != null && vendor.current_lng != null ? (
    <Marker
      key={vendor.id}
      coordinate={{
        latitude: vendor.current_lat,
        longitude: vendor.current_lng,
      }}
      title={vendor.user.name}
      description={vendor.product}
    />
  ) : null
)}

      </MapView>

      <View style={styles.filterContainer}>
        <Picker
          selectedValue={selectedProduct}
          onValueChange={(itemValue) => setSelectedProduct(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Todos" value="Todos" />
          <Picker.Item label="Bolas de Berlim" value="Bolas de Berlim" />
          <Picker.Item label="Acessórios" value="Acessórios" />
          <Picker.Item label="Gelados" value="Gelados" />
        </Picker>
        <FlatList
          data={filteredVendors}
          keyExtractor={(item) => item.id.toString()}
          style={styles.vendorList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.vendorItem}
              onPress={() =>
                mapRef.current?.animateToRegion(
                  {
                    latitude: item.current_lat,
                    longitude: item.current_lng,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                  },
                  1000
                )
              }
            >
              <Text>{item.user.name}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Botões por cima do mapa */}
      <View style={styles.buttonsContainer}>
        {currentUser ? (
          <TouchableOpacity
            style={styles.button}
            onPress={() => navigation.navigate('Dashboard')}
          >
            <Text style={styles.buttonText}>Perfil</Text>
          </TouchableOpacity>
        ) : (
          <>
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
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  filterContainer: {
    position: 'absolute',
    top: 40,
    left: 10,
    right: 10,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
  },
  picker: { backgroundColor: '#eee', marginBottom: 8 },
  vendorList: { maxHeight: 150 },
  vendorItem: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
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
