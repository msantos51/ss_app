// (em português) Este ecrã mostra o mapa com os vendedores ativos e permite filtrar por tipo de produto

import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Text,
  FlatList,
  Image,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LeafletMap from '../LeafletMap';
import axios from 'axios';
import { BASE_URL } from '../config';
import { subscribe as subscribeLocations } from '../socketService';
import {
  startLocationSharing,
  stopLocationSharing,
  isLocationSharing,
} from '../locationService';
import * as Location from 'expo-location';
import useProximityNotifications from '../useProximityNotifications';

export default function MapScreen({ navigation }) {
  const [vendors, setVendors] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState('Todos os vendedores');
  const [showList, setShowList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [initialPosition, setInitialPosition] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
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
    fetchVendors();
    loadUser();
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = subscribeLocations(({ vendor_id, lat, lng }) => {
      setVendors((prev) =>
        prev.map((v) =>
          v.id === vendor_id ? { ...v, current_lat: lat, current_lng: lng } : v
        )
      );
    });
    return unsubscribe;
  }, []);

  const locateUser = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        setInitialPosition({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        });
        mapRef.current?.setView(
          loc.coords.latitude,
          loc.coords.longitude
        );
      }
    } catch (err) {
      console.log('Erro ao obter localização:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      await locateUser();
      setLoadingLocation(false);
    };
    init();
  }, []);

  const activeVendors = vendors.filter(
    (v) => v?.current_lat != null && v?.current_lng != null
  );

  const filteredVendors = activeVendors.filter(
    (v) =>
      (selectedProduct === 'Todos os vendedores' || v?.product === selectedProduct) &&
      (searchQuery === '' || v?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useProximityNotifications(filteredVendors);

  return (
    <View style={styles.container}>
      {loadingLocation ? (
        <ActivityIndicator size="large" style={StyleSheet.absoluteFill} />
      ) : (
        <LeafletMap
          ref={mapRef}
          initialPosition={initialPosition}
          markers={filteredVendors.map((v) => {
            const photo = v.profile_photo
              ? `${BASE_URL.replace(/\/$/, '')}/${v.profile_photo}`
              : null;
            return {
              latitude: v.current_lat,
              longitude: v.current_lng,
              title: v.name || 'Vendedor',
              iconHtml: photo
                ? `<img src="${photo}" style="border: 2px solid ${v.pin_color || '#FF0000'};" />`
                : null,
            };
          })}
        />
      )}

      {!loadingLocation && (
        <TouchableOpacity
          style={styles.locateButton}
          onPress={locateUser}
        >
          <Text style={styles.locateIcon}>📍</Text>
        </TouchableOpacity>
      )}

      <View style={styles.filterContainer}>
        <Picker
          selectedValue={selectedProduct}
          onValueChange={(itemValue) => setSelectedProduct(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Todos os vendedores" value="Todos os vendedores" />
          <Picker.Item label="Bolas de Berlim" value="Bolas de Berlim" />
          <Picker.Item label="Acessórios" value="Acessórios" />
          <Picker.Item label="Gelados" value="Gelados" />
        </Picker>
        <TouchableOpacity
          style={styles.listToggle}
          onPress={() => setShowList((v) => !v)}
        >
          <Text style={styles.listToggleText}>{showList ? 'Fechar Lista' : 'Mostrar Lista'}</Text>
        </TouchableOpacity>

        {showList && (
          <>
            <TextInput
              style={styles.searchInput}
              placeholder="Procurar..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <FlatList
              data={filteredVendors}
              keyExtractor={(item) => item.id?.toString() ?? Math.random().toString()}
              style={styles.vendorList}
              renderItem={({ item }) => {
                const photoUri = item.profile_photo
                  ? `${BASE_URL.replace(/\/$/, '')}/${item.profile_photo}`
                  : null;
                return (
                  <TouchableOpacity
                    style={styles.vendorItem}
                    onPress={() => {
                      mapRef.current?.setView(item.current_lat, item.current_lng);
                    }}
                    onLongPress={() =>
                      navigation.navigate('VendorDetail', { vendor: item })
                    }
                  >
                    {photoUri && (
                      <Image source={{ uri: photoUri }} style={styles.vendorImage} />
                    )}
                    <Text>
                      {item.name || 'Vendedor'}
                      {item.rating_average != null
                        ? ` \u2013 ${item.rating_average.toFixed(1)}\u2605`
                        : ''}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </>
        )}
      </View>

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
  filterContainer: {
    position: 'absolute',
    top: 10,
    left: 70,
    right: 70,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 6,
  },
  picker: { backgroundColor: '#eee', marginBottom: 4 },
  vendorList: { maxHeight: 200 },
  vendorItem: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 4,
    marginBottom: 4,
  },
  listToggle: { backgroundColor: '#2196F3', padding: 6, borderRadius: 8, marginBottom: 4 },
  listToggleText: { color: '#fff', textAlign: 'center' },
  vendorImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
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
  locateButton: {
    position: 'absolute',
    bottom: 40,
    right: 20,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  locateIcon: {
    fontSize: 24,
  },
});
