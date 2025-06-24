// Dashboard simples para o cliente listar os vendedores favoritos
import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Image, FlatList, TouchableOpacity } from 'react-native';
import { Text, Button } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '../config';
import { getFavorites, clearFavorites } from '../favoritesService';
import { theme } from '../theme';
import t from '../i18n';

export default function ClientDashboardScreen({ navigation }) {
  const [favorites, setFavorites] = useState([]);

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
    const unsubscribe = navigation.addListener('focus', loadFavorites);
    return unsubscribe;
  }, [navigation]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Favoritos</Text>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => {
          const photoUri = item.profile_photo
            ? `${BASE_URL.replace(/\/$/, '')}/${item.profile_photo}`
            : null;
          return (
            <TouchableOpacity
              style={styles.vendor}
              onPress={() => navigation.navigate('VendorDetail', { vendor: item })}
            >
              {photoUri && (
                <Image
                  source={{ uri: photoUri }}
                  style={[
                    styles.image,
                    item.subscription_active
                      ? styles.activePhoto
                      : styles.inactivePhoto,
                  ]}
                />
              )}
              <Text>{item.name}</Text>
            </TouchableOpacity>
          );
        }}
      />
      <Button mode="outlined" onPress={clearAllFavorites} style={styles.button}>
        {t('clearFavorites')}
      </Button>
      <Button
        mode="outlined"
        onPress={() => navigation.navigate('AccountSettings')}
        style={styles.button}
      >
        {t('proximityMenu')}
      </Button>
      <Button
        mode="outlined"
        onPress={() => navigation.navigate('ManageAccount')}
        style={styles.button}
      >
        {t('manageAccount')}
      </Button>
      <Button
        mode="outlined"
        onPress={() => navigation.navigate('About')}
        style={styles.button}
      >
        {t('aboutHelp')}
      </Button>
      <Button
        mode="outlined"
        onPress={logout}
        style={styles.logout}
      >
        Sair
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  title: { fontSize: 18, marginBottom: 12, textAlign: 'center' },
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
  button: { marginTop: 12 },
  logout: { marginTop: 20 },
});
