import React, { useEffect, useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Image } from 'react-native';
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

export default function DashboardScreen({ navigation }) {
  const [vendor, setVendor] = useState(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [product, setProduct] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [error, setError] = useState(null);
  const [sharingLocation, setSharingLocation] = useState(false);

  const logout = async () => {
    await stopLocationSharing();
    await AsyncStorage.removeItem('user');
    navigation.replace('Login');
  };

  useEffect(() => {
    const loadVendor = async () => {
      const stored = await AsyncStorage.getItem('user');
      if (stored) {
        const v = JSON.parse(stored);
        setVendor(v);
        setEmail(v.user.email);
        setProduct(v.product);

        const share = await isLocationSharing();
        setSharingLocation(share);
        if (share) {
          try {
            await startLocationSharing(v.id);
          } catch (err) {
            setError(err.message);
          }
        }
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
        `${BASE_URL}/vendors/${vendor.id}/profile`,
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

      <Text style={styles.title}>Perfil do Vendedor</Text>

      {profilePhoto ? (
        <Image source={{ uri: profilePhoto.uri }} style={styles.imagePreview} />
      ) : (
        vendor.profile_photo && (
          <Image
            source={{ uri: `${BASE_URL}/${vendor.profile_photo}` }}
            style={styles.imagePreview}
          />
        )
      )}

      <Button title="Escolher Foto de Perfil" onPress={pickImage} />

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

      <Button title="Atualizar" onPress={updateProfile} />

      <Button
        title={sharingLocation ? 'Desativar Localização' : 'Ativar Localização'}
        onPress={toggleLocation}
      />

      <Text style={{
        color: sharingLocation ? 'green' : 'gray',
        marginVertical: 8,
        textAlign: 'center',
      }}>
        {sharingLocation ? 'Partilha de localização ativa' : 'Localização não partilhada'}
      </Text>

      <Button title="Logout" onPress={logout} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
    padding: 8,
    borderRadius: 8,
    width: '100%',
  },
  error: { color: 'red', marginBottom: 12 },
  imagePreview: {
    width: 120,
    height: 120,
    marginVertical: 12,
    borderRadius: 60,
  },
});
