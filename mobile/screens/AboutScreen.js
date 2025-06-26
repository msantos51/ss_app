// Ecrã que apresenta informações de ajuda e navegação para Termos ou Suporte
import React from 'react';
import { View, StyleSheet, Linking } from 'react-native';
import { Button, Text } from 'react-native-paper';
import { theme } from '../theme';

export default function AboutScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sobre e Ajuda</Text>
      {/* Botão para abrir ecrã de Termos */}
      <Button
        mode="outlined"
        onPress={() => navigation.navigate('Terms')}
        style={styles.button}
      >
        <Text>Termos e Condições</Text>
      </Button>
      {/* Botão para contactar a equipa de suporte */}
      <Button
        mode="outlined"
        onPress={() => Linking.openURL('mailto:suporte@sunnysales.com')}
        style={styles.button}
      >
        <Text>Contactar Suporte</Text>
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  title: { fontSize: 20, marginBottom: 16, textAlign: 'center' },
  button: { marginBottom: 12 },
});
