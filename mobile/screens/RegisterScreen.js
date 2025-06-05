import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text } from 'react-native';
import axios from 'axios';

export default function RegisterScreen({ navigation }) {
const [email, setEmail] = useState('');
const [password, setPassword] = useState('');
const [product, setProduct] = useState('');
const [profilePhoto, setProfilePhoto] = useState('');
const [error, setError] = useState(null);

const register = async () => {
  try {
    await axios.post('http://10.0.2.2:8000/vendors/', {
      email,
      password,
      product,
      profile_photo: profilePhoto,
    });
    navigation.navigate('Login');
  } catch (err) {
    setError('Falha no registo');
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
    <TextInput
      style={styles.input}
      placeholder="Produto"
      value={product}
      onChangeText={setProduct}
    />
    <TextInput
      style={styles.input}
      placeholder="Foto de perfil"
      value={profilePhoto}
      onChangeText={setProfilePhoto}
    />
    <Button title="Registar" onPress={register} />
  </View>
);
}

const styles = StyleSheet.create({
container: { flex: 1, justifyContent: 'center', padding: 16 },
input: { borderWidth: 1, borderColor: '#ccc', marginBottom: 12, padding: 8 },
error: { color: 'red', marginBottom: 12 },
});
