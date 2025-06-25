// Dashboard simples para o cliente listar os vendedores favoritos
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '../config';
import { getFavorites, clearFavorites } from '../favoritesService';
import { theme } from '../theme';
import t from '../i18n';

export default function ClientDashboardScreen({ navigation }) {
  const [client, setClient] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [menuOpen, setMenuOpen] = useState(false);

  const loadClient = async () => {
    try {
      const stored = await AsyncStorage.getItem('client');
      if (stored) {
        setClient(JSON.parse(stored));
      } else {
        setClient(null);
      }
    } catch (e) {
      console.log('Erro ao carregar cliente:', e);
      setClient(null);
    }
  };

  const loadFavorites = async () => {
    const ids = await getFavorites();
    if (ids.length === 0) {
      setFavorites([]);
      return;
    }
    try {
      const resp = await axios.get(`${BASE_URL}/vendors/`);
      const vendors = resp.data.filter((v) => ids.includes(v.id));
      setFavorites(vendors);
    } catch (e) {
      console.log('Erro ao carregar favoritos:', e);
    }
  };

  const clearAllFavorites = async () => {
    await clearFavorites();
    setFavorites([]);
  };

  const logout = async () => {
    await AsyncStorage.removeItem('client');
    await AsyncStorage.removeItem('clientToken');
    navigation.replace('ClientLogin');
  };

  useEffect(() => {
    loadFavorites();
    loadClient();
    const unsubscribe = navigation.addListener('focus', () => {
      loadFavorites();
      loadClient();
    });
    return unsubscribe;
  }, [navigation]);

  return (

    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <TouchableOpacity
          style={styles.mapButton}
          onPress={() => navigation.navigate('Map')}
        >
          <Text style={styles.mapIcon}>🗺️</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => setMenuOpen(!menuOpen)}
        >
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Meu Perfil</Text>

        {client?.profile_photo && (
          <Image
            source={{ uri: `${BASE_URL.replace(/\/$/, '')}/${client.profile_photo}` }}
            style={styles.imagePreview}
          />
        )}
        {client && (
          <>
            <Text style={styles.infoText}>
              <Text style={styles.label}>Nome:</Text> {client.name}
            </Text>
            <Text style={styles.infoText}>
              <Text style={styles.label}>Email:</Text> {client.email}
            </Text>
          </>
        )}

        <View style={styles.favoriteSection}>
          <Text style={styles.sectionTitle}>Vendedores Favoritos</Text>
          {favorites.map((item) => {
            const photoUri = item.profile_photo
              ? `${BASE_URL.replace(/\/$/, '')}/${item.profile_photo}`
              : null;
            return (
              <TouchableOpacity
                key={item.id.toString()}
                style={styles.vendor}
                onPress={() => navigation.navigate('VendorDetail', { vendor: item })}
              >
                {photoUri && (
                  <Image
                    source={{ uri: photoUri }}
                    style={[
                      styles.image,
                      item.subscription_active ? styles.activePhoto : styles.inactivePhoto,
                    ]}
                  />
                )}
                <Text>{item.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.fullButton, styles.logoutButton]}>
          <Button mode="outlined" onPress={logout}>Sair</Button>
        </View>
      </ScrollView>
      {menuOpen && (
        <View style={styles.menu}>
          <Button mode="text" onPress={() => { setMenuOpen(false); clearAllFavorites(); }}>
            {t('clearFavorites')}
          </Button>
          <Button mode="text" onPress={() => { setMenuOpen(false); navigation.navigate('AccountSettings'); }}>
            {t('proximityMenu')}
          </Button>
          <Button mode="text" onPress={() => { setMenuOpen(false); navigation.navigate('ManageAccount'); }}>
            {t('manageAccount')}
          </Button>
          <Button mode="text" onPress={() => { setMenuOpen(false); navigation.navigate('About'); }}>
            {t('aboutHelp')}
          </Button>
          <Button mode="text" onPress={() => { setMenuOpen(false); logout(); }}>
            Sair
          </Button>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 16,
    backgroundColor: theme.colors.background,
  },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  infoText: { marginBottom: 8, width: '100%' },
  label: { fontWeight: 'bold' },
  imagePreview: { width: 120, height: 120, marginVertical: 12, borderRadius: 60 },
  vendor: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  image: { width: 40, height: 40, borderRadius: 20, marginRight: 8 },
  activePhoto: { borderWidth: 2, borderColor: 'green' },
  inactivePhoto: { borderWidth: 2, borderColor: 'red' },
  fullButton: { width: '100%', marginBottom: 12 },
  logoutButton: { marginTop: 'auto' },
  mapButton: { position: 'absolute', top: 16, right: 16 },
  mapIcon: { fontSize: 50 },
  menuButton: { position: 'absolute', top: 16, left: 16 },
  menuIcon: { fontSize: 40 },
  menu: {
    position: 'absolute',
    top: 70,
    left: 16,
    backgroundColor: theme.colors.background,
    padding: 8,
    borderRadius: 8,
    elevation: 10,
    zIndex: 100,
  },
  favoriteSection: { width: '100%', marginTop: 16 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 4 },
});
