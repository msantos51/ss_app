import React, { useState } from 'react';
import {
  View,
  TextInput,
  Button,
  StyleSheet,
  Text,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { BASE_URL } from '../config';

const AVAILABLE_ICONS = ['📍', '🍦', '🍩', '🌭', '🏖️'];

export default function RegisterScreen({ navigation }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [product, setProduct] = useState('');
  const [icon, setIcon] = useState('📍');
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

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

  const register = async () => {
    if (!name || !email || !password || !product) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = new FormData();
      data.append('name', name);
      data.append('email', email);
      data.append('password', password);
      data.append('product', product);
      data.append('icon', icon);

      if (profilePhoto) {
        data.append('profile_photo', {
          uri: profilePhoto.uri,
          name: 'profile.jpg',
          type: 'image/jpeg',
        });
      }

      await axios.post(`${BASE_URL}/vendors/`, data);

      navigation.navigate('Login');
    } catch (err) {
      console.error(err.response?.data);
      if (err.response?.data?.detail) {
        setError(err.response.data.detail);
      } else {
        setError('Falha no registo');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Nome"
        value={name}
        onChangeText={(text) => {
          setName(text);
          setError(null);
        }}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          setError(null);
        }}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          setError(null);
        }}
      />

      <Picker
        selectedValue={product}
        onValueChange={(itemValue) => {
          setProduct(itemValue);
          setError(null);
        }}
        style={styles.input}
      >
        <Picker.Item label="Selecione um produto" value="" />
        <Picker.Item label="Bolas de Berlim" value="Bolas de Berlim" />
        <Picker.Item label="Gelados" value="Gelados" />
        <Picker.Item label="Acessórios" value="Acessórios" />
      </Picker>

      <Picker
        selectedValue={icon}
        onValueChange={(val) => setIcon(val)}
        style={styles.input}
      >
        {AVAILABLE_ICONS.map((ic) => (
          <Picker.Item key={ic} label={ic} value={ic} />
        ))}
      </Picker>

      <Button title="Escolher Foto de Perfil" onPress={pickImage} />

      {profilePhoto && (
        <Image
          source={{ uri: profilePhoto.uri }}
          style={styles.imagePreview}
        />
      )}

      <View style={{ marginTop: 12 }} />

      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Registar" onPress={register} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 16 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 12,
    padding: 8,
    borderRadius: 8,
  },
  error: { color: 'red', marginBottom: 12, textAlign: 'center' },
  imagePreview: {
    width: 100,
    height: 100,
    marginVertical: 12,
    borderRadius: 50,
    alignSelf: 'center',
  },
});
