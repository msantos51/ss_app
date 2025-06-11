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
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
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
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [product, setProduct] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [error, setError] = useState(null);
  const [sharingLocation, setSharingLocation] = useState(false);
  const [editing, setEditing] = useState(false);

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

      if (name !== vendor.name) data.append('name', name);
      if (email !== vendor.email) data.append('email', email);
      if (password) data.append('password', password);
      if (product !== vendor.product) data.append('product', product);

      if (profilePhoto) {
        const fileUri = profilePhoto.uri;

        // Lemos o ficheiro com FileSystem para evitar o Network Error
        const fileInfo = await FileSystem.getInfoAsync(fileUri);

        const file = {
          uri: fileUri,
          name: 'profile.jpg',
          type: 'image/jpeg',
        };

        data.append('profile_photo', file);
      }

      if (data._parts.length === 0) {
        setError("Nenhuma alteração efetuada.");
        return;
      }

      const token = await AsyncStorage.getItem('token');
      const response = await axios.patch(`${BASE_URL}/vendors/${vendor.id}/profile`, data, {
        headers: {
          Accept: 'application/json',
          Authorization: token ? `Bearer ${token}` : undefined,
        },
      });

      await AsyncStorage.setItem('user', JSON.stringify(response.data));
      setVendor(response.data);
      setName(response.data.name);
      setEmail(response.data.email);
      setProduct(response.data.product);
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
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}

      <Text style={styles.title}>Perfil do Vendedor</Text>

      {profileUri && (
        <TouchableOpacity onPress={editing ? pickImage : undefined}>
          <Image source={{ uri: profileUri }} style={styles.imagePreview} />
        </TouchableOpacity>
      )}

      <TextInput
        style={[styles.input, !editing && styles.inputDisabled]}
        placeholder="Nome"
        value={name}
        onChangeText={setName}
        editable={editing}
      />

      <TextInput
        style={[styles.input, !editing && styles.inputDisabled]}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        editable={editing}
      />

      <TextInput
        style={[styles.input, !editing && styles.inputDisabled]}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={setPassword}
        editable={editing}
      />

      <Picker
        selectedValue={product}
        onValueChange={(itemValue) => setProduct(itemValue)}
        style={styles.input}
        enabled={editing}
      >
        <Picker.Item label="Bolas de Berlim" value="Bolas de Berlim" />
        <Picker.Item label="Gelados" value="Gelados" />
        <Picker.Item label="Acessórios" value="Acessórios" />
      </Picker>

      {editing ? (
        <>
          <Button title="Guardar" onPress={updateProfile} />
          <Button
            title="Cancelar"
            onPress={() => {
              setName(vendor.name);
              setEmail(vendor.email);
              setProduct(vendor.product);
              setProfilePhoto(null);
              setPassword('');
              setEditing(false);
            }}
          />
        </>
      ) : (
        <Button title="Atualizar dados" onPress={() => setEditing(true)} />
      )}

      <Button
        title={sharingLocation ? 'Desativar Localização' : 'Ativar Localização'}
        onPress={toggleLocation}
      />

      <Text
        style={{
          color: sharingLocation ? 'green' : 'gray',
          marginVertical: 8,
          textAlign: 'center',
        }}
      >
        {sharingLocation
          ? 'Partilha de localização ativa'
          : 'Localização não partilhada'}
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
  inputDisabled: {
    backgroundColor: '#eee',
    color: '#666',
  },
  error: {
    color: 'red',
    marginBottom: 12,
    textAlign: 'center',
  },
  imagePreview: {
    width: 120,
    height: 120,
    marginVertical: 12,
    borderRadius: 60,
  },
});
