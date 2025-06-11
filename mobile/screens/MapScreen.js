// (em português) Este ecrã mostra o mapa com os vendedores ativos e permite filtrar por tipo de produto

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
// Substituímos react-native-maps por um componente baseado em WebView com Leaflet
import LeafletMap from '../LeafletMap';
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

  // (em português) Busca os vendedores ao backend
  const fetchVendors = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/vendors/`);
      setVendors(res.data);
    } catch (err) {
      console.log('Erro ao buscar vendedores:', err);
    }
  };

  // (em português) Carrega o utilizador autenticado (se existir)
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

  // (em português) Sempre que o ecrã abrir, atualiza dados
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchVendors();
      loadUser();
    });

    fetchVendors();
    loadUser();

    return unsubscribe;
  }, [navigation]);

  const activeVendors = vendors.filter(
    (v) => v?.current_lat != null && v?.current_lng != null
  );

  const filteredVendors = activeVendors.filter(
    (v) => selectedProduct === 'Todos' || v?.product === selectedProduct
  );

  return (
    <View style={styles.container}>
      {/* (em português) Mapa usando Leaflet via WebView */}
      <LeafletMap
        ref={mapRef}
        markers={filteredVendors.map((v) => ({
          latitude: v.current_lat,
          longitude: v.current_lng,
          title: v.name || 'Vendedor',
        }))}
      />

      {/* (em português) Filtros e lista de vendedores */}
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
          keyExtractor={(item) => item.id?.toString() ?? Math.random().toString()}
          style={styles.vendorList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.vendorItem}
              onPress={() =>
                mapRef.current?.setView(
                  item.current_lat,
                  item.current_lng
                )
              }
            >
              <Text>{item.name || 'Vendedor'}</Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* (em português) Botões Login/Registar ou ir para o Perfil */}
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
    // Colocamos a barra de filtros mais abaixo para nao sobrepor os botoes de
    // zoom do Leaflet
    top: 10,
    left: 70,
    right: 70,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 8,
  },
  picker: { backgroundColor: '#eee', marginBottom: 8 },
  vendorList: { maxHeight: 120 },
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
