import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, Image } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import * as ImagePicker from 'expo-image-picker';
import axios from 'axios';
import { BASE_URL } from '../config';

export default function RegisterScreen({ navigation }) {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [product, setProduct] = useState('');
const [profilePhoto, setProfilePhoto] = useState(null);
const [error, setError] = useState(null);

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
try {
  const data = new FormData();
  data.append('email', email);
  data.append('password', password);
  data.append('product', product);

  if (profilePhoto) {
    data.append('profile_photo', {
      uri: profilePhoto.uri,
      name: 'profile.jpg',
      type: 'image/jpeg',
    });
  }

  await axios.post(`${BASE_URL}/vendors/`, data, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  navigation.navigate('Login');
} catch (err) {
  console.error(err.response?.data); // mostra o erro real do FastAPI
  if (err.response?.data?.detail) {
    setError(err.response.data.detail);
  } else {
    setError('Falha no registo');
  }
}
};


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
      <Picker.Item label="Selecione um produto" value="" />
      <Picker.Item label="Bolas de Berlim" value="Bolas de Berlim" />
      <Picker.Item label="Gelados" value="Gelados" />
      <Picker.Item label="Acessórios" value="Acessórios" />
    </Picker>

    <Button title="Escolher Foto de Perfil" onPress={pickImage} />

{profilePhoto && (
<Image source={{ uri: profilePhoto.uri }} style={styles.imagePreview} />
)}

<View style={{ marginTop: 12 }} />
<Button title="Registar" onPress={register} />

  </View>
);
}

const styles = StyleSheet.create({
container: { flex: 1, justifyContent: 'center', padding: 16 },
input: { borderWidth: 1, borderColor: '#ccc', marginBottom: 12, padding: 8 },
error: { color: 'red', marginBottom: 12 },
imagePreview: { width: 100, height: 100, marginVertical: 12, alignSelf: 'center' },
});
