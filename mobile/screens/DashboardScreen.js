import React, { useEffect, useState } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Text,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  ScrollView,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from '../config';
import {
  startLocationSharing,
  stopLocationSharing,
  isLocationSharing,
} from '../locationService';

const AVAILABLE_ICONS = ['📍', '🍦', '🍩', '🌭', '🏖️'];

export default function DashboardScreen({ navigation }) {
  const [vendor, setVendor] = useState(null);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [product, setProduct] = useState('');
  const [icon, setIcon] = useState('📍');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [error, setError] = useState(null);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [editing, setEditing] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [reviews, setReviews] = useState([]);

  const fetchVendorFromServer = async (vendorId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.get(`${BASE_URL}/vendors/`, {
        headers: { Authorization: token ? `Bearer ${token}` : undefined },
      });
      const updated = res.data.find((v) => v.id === vendorId);
      if (updated) {
        await AsyncStorage.setItem('user', JSON.stringify(updated));
        setVendor(updated);
        setName(updated.name);
        setEmail(updated.email);
        setProduct(updated.product);
        setIcon(updated.icon || '📍');
        fetchReviews(vendorId);
      }
    } catch (err) {
      console.log('Erro ao atualizar vendedor:', err);
    }
  };

  const fetchReviews = async (vendorId) => {
    try {
      const resp = await axios.get(`${BASE_URL}/vendors/${vendorId}/reviews`);
      setReviews(resp.data);
    } catch (e) {
      console.log('Erro ao carregar reviews:', e);
    }
  };

  const logout = async () => {
    await stopLocationSharing();
    await AsyncStorage.removeItem('user');
    await AsyncStorage.removeItem('token');
    navigation.replace('Login');
  };

  useEffect(() => {
    const loadVendor = async () => {
      try {
        const stored = await AsyncStorage.getItem('user');
        if (stored) {
          const v = JSON.parse(stored);
          setVendor(v);
          setName(v.name);
          setEmail(v.email);
          setProduct(v.product);
          setIcon(v.icon || '📍');
          fetchVendorFromServer(v.id);
          fetchReviews(v.id);

          const share = await isLocationSharing();
          setSharingLocation(share);
          if (share) {
            try {
              await startLocationSharing(v.id);
            } catch (err) {
              setError(err.message);
            }
          }
        } else {
          setError('Utilizador não encontrado.');
        }
      } catch (e) {
        console.log('Erro ao carregar vendor:', e);
        setError('Erro ao carregar dados do utilizador');
      }
    };
    loadVendor();
    const unsubscribe = navigation.addListener('focus', () => {
      if (vendor?.id) {
        fetchVendorFromServer(vendor.id);
        fetchReviews(vendor.id);
      }
    });
    return unsubscribe;
  }, [navigation, vendor?.id]);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });

    if (!result.canceled && result.assets.length > 0) {
      setProfilePhoto(result.assets[0]);
    }
  };

  const updateProfile = async () => {
    if (!vendor) return;
    try {
      const data = new FormData();

      if (name !== vendor.name) data.append('name', name);
      if (email !== vendor.email) data.append('email', email);
      if (password) data.append('password', password);
      if (product !== vendor.product) data.append('product', product);
      if (icon !== (vendor.icon || '📍')) data.append('icon', icon);

      if (profilePhoto) {
        const fileUri = profilePhoto.uri;
        const file = {
          uri: fileUri,
          name: 'profile.jpg',
          type: 'image/jpeg',
        };
        data.append('profile_photo', file);
      }

      const token = await AsyncStorage.getItem('token');
      const response = await axios.patch(`${BASE_URL}/vendors/${vendor.id}/profile`, data, {
        headers: {
          Accept: 'application/json',
          'Content-Type': 'multipart/form-data',
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });

      await AsyncStorage.setItem('user', JSON.stringify(response.data));
      setVendor(response.data);
      setName(response.data.name);
      setEmail(response.data.email);
      setProduct(response.data.product);
      setIcon(response.data.icon || '📍');
      setPassword('');
      setError(null);
      setProfilePhoto(null);
      setEditing(false);
    } catch (err) {
      console.error('Erro ao atualizar:', err);
      setError(err.response?.data?.detail || err.message || 'Falha ao atualizar');
    }
  };

  const toggleLocation = async () => {
    if (!vendor) return;
    if (sharingLocation) {
      await stopLocationSharing();
      setSharingLocation(false);
    } else {
      try {
        await startLocationSharing(vendor.id);
        setSharingLocation(true);
      } catch (err) {
        setError(err.message);
      }
    }
  };

  const paySubscription = async () => {
    if (!vendor) return;
    try {
      const token = await AsyncStorage.getItem('token');
      const res = await axios.post(
        `${BASE_URL}/vendors/${vendor.id}/create-checkout-session`,
        null,
        {
          headers: { Authorization: token ? `Bearer ${token}` : undefined },
        }
      );
      if (res.data.checkout_url) {
        Linking.openURL(res.data.checkout_url);
      }
    } catch (err) {
      console.error('Erro no pagamento:', err);
      setError(err.response?.data?.detail || err.message || 'Falha ao iniciar pagamento');
    }
  };

  if (!vendor) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#0000ff" />
        <Text>A carregar...</Text>
        {error && <Text style={styles.error}>{error}</Text>}
      </View>
    );
  }

  const profileUri = profilePhoto
    ? profilePhoto.uri
    : vendor.profile_photo
    ? `${BASE_URL.replace(/\/$/, '')}/${vendor.profile_photo}`
    : null;

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        {error && <Text style={styles.error}>{error}</Text>}

        <TouchableOpacity style={styles.mapButton} onPress={() => navigation.navigate('Map')}>
          <Text style={styles.mapIcon}>🗺️</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuButton} onPress={() => setMenuOpen(!menuOpen)}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Meu Perfil</Text>

        {editing ? (
          <>
            {profileUri && (
              <TouchableOpacity onPress={pickImage}>
                <Image source={{ uri: profileUri }} style={styles.imagePreview} />
              </TouchableOpacity>
            )}

            <TextInput
              style={styles.input}
              placeholder="Nome"
              value={name}
              onChangeText={setName}
            />

            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />

            <TextInput
              style={styles.input}
              placeholder="Password"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            <Picker selectedValue={product} onValueChange={(itemValue) => setProduct(itemValue)} style={styles.input}>
              <Picker.Item label="Bolas de Berlim" value="Bolas de Berlim" />
              <Picker.Item label="Gelados" value="Gelados" />
              <Picker.Item label="Acessórios" value="Acessórios" />
            </Picker>

            <Picker selectedValue={icon} onValueChange={(val) => setIcon(val)} style={styles.input}>
              {AVAILABLE_ICONS.map((ic) => (
                <Picker.Item key={ic} label={ic} value={ic} />
              ))}
            </Picker>

            <View style={styles.row}>
              <View style={styles.halfButton}>
                <Button title="Guardar" onPress={updateProfile} />
              </View>
              <View style={[styles.halfButton, styles.leftSpacing]}>
                <Button
                  title="Cancelar"
                  onPress={() => {
                    setName(vendor.name);
                    setEmail(vendor.email);
                    setProduct(vendor.product);
                    setIcon(vendor.icon || '📍');
                    setProfilePhoto(null);
                    setPassword('');
                    setEditing(false);
                  }}
                />
              </View>
            </View>
          </>
        ) : (
          <>
            {profileUri && <Image source={{ uri: profileUri }} style={styles.imagePreview} />}
            <Text style={styles.infoText}>Nome: {vendor.name}</Text>
            <Text style={styles.infoText}>Email: {vendor.email}</Text>
            <Text style={styles.infoText}>Produto: {vendor.product}</Text>
            <Text style={styles.infoText}>Ícone: {vendor.icon || '📍'}</Text>
          </>
        )}

        <View style={styles.fullButton}>
          <Button title={sharingLocation ? 'Desativar Localização' : 'Ativar Localização'} onPress={toggleLocation} />
        </View>

        <Text style={{ color: sharingLocation ? 'green' : 'gray', marginVertical: 8, textAlign: 'center' }}>
          {sharingLocation ? 'Partilha de localização ativa' : 'Localização não partilhada'}
        </Text>

        {(() => {
          if (vendor.subscription_active) {
            if (vendor.subscription_valid_until) {
              const diffMs = new Date(vendor.subscription_valid_until).getTime() - Date.now();
              const daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
              return (
                <Text style={{ marginVertical: 8, textAlign: 'center' }}>
                  {`Subscrição ativa – termina em ${daysLeft} dia${daysLeft !== 1 ? 's' : ''}`}
                </Text>
              );
            }
            return <Text style={{ marginVertical: 8, textAlign: 'center' }}>Subscrição ativa</Text>;
          }
          return <Text style={{ marginVertical: 8, textAlign: 'center' }}>Subscrição inativa</Text>;
        })()}

        <View style={styles.reviewSection}>
          <Text style={styles.sectionTitle}>Minhas Avaliações</Text>
          {reviews.length > 0 ? (
            <>
              <Text style={styles.averageText}>
                {vendor.rating_average != null
                  ? `Média: ${vendor.rating_average.toFixed(1)}\u2605`
                  : 'Ainda sem avaliações'}
              </Text>
              {reviews.map((r) => (
                <View key={r.id} style={styles.reviewItem}>
                  <Text style={styles.reviewRating}>⭐ {r.rating}</Text>
                  {r.comment ? <Text>{r.comment}</Text> : null}
                </View>
              ))}
            </>
          ) : (
            <Text style={styles.averageText}>Ainda sem avaliações</Text>
          )}
        </View>

        <View style={[styles.fullButton, styles.logoutButton]}>
          <Button title="Logout" onPress={logout} />
        </View>
      </ScrollView>

      {menuOpen && (
        <View style={styles.menu}>
          <Button title="Atualizar Dados" onPress={() => { setMenuOpen(false); setEditing(true); }} />
          <Button title="Pagar Semanalidade" onPress={() => { setMenuOpen(false); paySubscription(); }} />
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
    backgroundColor: '#fff',
  },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
    padding: 8,
    borderRadius: 8,
    width: '100%',
  },
  inputDisabled: { backgroundColor: '#eee', color: '#666' },
  infoText: { marginBottom: 8, width: '100%' },
  error: { color: 'red', marginBottom: 12, textAlign: 'center' },
  imagePreview: { width: 120, height: 120, marginVertical: 12, borderRadius: 60 },
  row: { flexDirection: 'row', width: '100%', justifyContent: 'space-between', marginBottom: 12 },
  halfButton: { flex: 1 },
  leftSpacing: { marginLeft: 12 },
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
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 8,
    elevation: 10,
    zIndex: 100,
  },
  reviewSection: { width: '100%', marginTop: 16 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 4 },
  averageText: { marginBottom: 8 },
  reviewItem: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  reviewRating: { fontWeight: 'bold' },
});
