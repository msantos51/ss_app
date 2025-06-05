import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';

export default function DashboardScreen() {
  const [vendor, setVendor] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [product, setProduct] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [error, setError] = useState(null);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [locationSub, setLocationSub] = useState(null);

  useEffect(() => {
    const loadVendor = async () => {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const v = JSON.parse(stored);
        setVendor(v);
        setEmail(v.user.email);
        setProduct(v.product);
      }
    };
    loadVendor();
  }, []);

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
      if (email !== vendor.user.email) data.append('email', email);
      if (password) data.append('password', password);
      if (product !== vendor.product) data.append('product', product);
      if (profilePhoto) {
        data.append('profile_photo', {
          uri: profilePhoto.uri,
          name: 'profile.jpg',
          type: 'image/jpeg',
        });
      }

      const response = await axios.put(
        `http://10.0.2.2:8000/vendors/${vendor.id}/profile`,
        data,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );

      await AsyncStorage.setItem('user', JSON.stringify(response.data));
      setVendor(response.data);
      setPassword('');
      setError(null);
    } catch (err) {
      console.error(err);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Falha ao atualizar');
      }
    }
  };

  const toggleLocation = async () => {
    if (sharingLocation) {
      if (locationSub) {
        locationSub.remove();
        setLocationSub(null);
      }
      setSharingLocation(false);
    } else {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Permissão de localização negada');
        return;
      }
      const sub = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 10000,
          distanceInterval: 10,
        },
        ({ coords }) => {
          axios
            .put(`http://10.0.2.2:8000/vendors/${vendor.id}/location`, {
              lat: coords.latitude,
              lng: coords.longitude,
            })
            .catch(err => console.log('Erro ao enviar localização:', err));
        }
      );
      setLocationSub(sub);
      setSharingLocation(true);
    }
  };

  useEffect(() => {
    return () => {
      if (locationSub) {
        locationSub.remove();
      }
    };
  }, [locationSub]);

  if (!vendor) {
    return (
      <View style={styles.container}>
        <Text>A carregar...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}

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

      <Picker
        selectedValue={product}
        onValueChange={(itemValue) => setProduct(itemValue)}
        style={styles.input}
      >
        <Picker.Item label="Bolas de Berlim" value="Bolas de Berlim" />
        <Picker.Item label="Gelados" value="Gelados" />
        <Picker.Item label="Acessórios" value="Acessórios" />
      </Picker>

      <Button title="Escolher Foto de Perfil" onPress={pickImage} />

      {profilePhoto && (
        <Image source={{ uri: profilePhoto.uri }} style={styles.imagePreview} />
      )}

      <Button title="Atualizar" onPress={updateProfile} />

      <Button
        title={sharingLocation ? 'Desativar Localização' : 'Ativar Localização'}
        onPress={toggleLocation}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  input: { borderWidth: 1, borderColor: '#ccc', marginBottom: 12, padding: 8 },
  error: { color: 'red', marginBottom: 12 },
  imagePreview: { width: 100, height: 100, marginVertical: 12, alignSelf: 'center' },
});
