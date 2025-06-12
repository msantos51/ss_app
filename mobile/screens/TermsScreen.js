import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';

export default function TermsScreen() {
  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Termos e Condições</Text>
      <Text style={styles.text}>
        1. O vendedor é responsável por manter suas informações de conta
        atualizadas e verdadeiras.
      </Text>
      <Text style={styles.text}>
        2. A localização partilhada pelo aplicativo será usada apenas para
        exibir a posição do vendedor aos potenciais clientes.
      </Text>
      <Text style={styles.text}>
        3. O pagamento da semanalidade garante a manutenção da conta ativa
        durante o período contratado.
      </Text>
      <Text style={styles.text}>
        4. Qualquer uso indevido do aplicativo poderá resultar no
        cancelamento da conta do vendedor.
      </Text>
      <Text style={styles.text}>
        5. Estes termos podem ser alterados a qualquer momento. Avisaremos
        através do aplicativo sempre que houver mudanças relevantes.
      </Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  text: {
    marginBottom: 8,
    textAlign: 'left',
  },
});
