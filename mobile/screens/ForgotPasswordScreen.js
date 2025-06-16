import React, { useState } from 'react';
import { View, TextInput, Button, StyleSheet, Text, ActivityIndicator, Alert } from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config';

export default function ForgotPasswordScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestReset = async () => {
    if (!email) return;
    setLoading(true);
    setError(null);
    try {
      await axios.post(`${BASE_URL}/password-reset-request`, { email });
      Alert.alert('Pedido enviado', 'Verifique o seu e-mail para definir nova password.');
      navigation.goBack();
    } catch (err) {
      console.error(err);
      setError('Falha ao solicitar recuperação');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {error && <Text style={styles.error}>{error}</Text>}
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={(t) => setEmail(t)}
        autoCapitalize="none"
      />
      {loading ? (
        <ActivityIndicator size="large" color="#0000ff" />
      ) : (
        <Button title="Enviar" onPress={requestReset} disabled={!email} />
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
});
