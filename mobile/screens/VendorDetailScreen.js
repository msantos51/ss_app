// Tela com detalhes do vendedor
import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Text, TextInput, Button } from 'react-native-paper';
import StarRatingInput from '../StarRatingInput';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from '../config';
import { theme } from '../theme';
import { isFavorite, addFavorite, removeFavorite } from '../favoritesService';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import t from '../i18n';

export default function VendorDetailScreen({ route }) {
  const { vendor } = route.params;
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [favorite, setFavorite] = useState(false);

  const loadReviews = async () => {
    try {
      const resp = await axios.get(`${BASE_URL}/vendors/${vendor.id}/reviews`);
      setReviews(resp.data);
    } catch (e) {
      console.log('Erro ao buscar reviews:', e);
    }
  };

  useEffect(() => {
    loadReviews();
    isFavorite(vendor.id).then(setFavorite);
  }, []);

const submitReview = async () => {
  try {
    // 1️⃣ Vai buscar o token ao AsyncStorage
    const token = await AsyncStorage.getItem('clientToken');

    // 2️⃣ Mostra no log o token e os dados enviados
    console.log("🚀 Token usado na review:", token);
    console.log("🚀 Dados enviados na review:", { rating, comment });

    if (!token) {
      console.warn("⚠️ Nenhum token encontrado. O utilizador fez login como cliente?");
      return;
    }

    // 3️⃣ Faz o pedido POST com o token no header
    await axios.post(
      `${BASE_URL}/vendors/${vendor.id}/reviews`,
      {
        rating: rating,
        comment: comment,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // 4️⃣ Limpa os campos e atualiza as reviews
    setRating(0);
    setComment('');
    loadReviews();

    console.log("✅ Review enviada com sucesso!");

  } catch (e) {
    console.error('❌ Erro ao enviar review:', e.response?.data || e.message);
  }
};


  const photoUri = vendor.profile_photo
    ? `${BASE_URL.replace(/\/$/, '')}/${vendor.profile_photo}`
    : null;

  return (
    <View style={styles.container}>
      {photoUri && <Image source={{ uri: photoUri }} style={styles.photo} />}
      <View style={styles.nameRow}>
        <Text style={styles.name}>{vendor.name || 'Vendedor'}</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={favorite ? t('removeFavorite') : t('addFavorite')}
          onPress={async () => {
            if (favorite) {
              await removeFavorite(vendor.id);
            } else {
              await addFavorite(vendor.id);
            }
            setFavorite(!favorite);
          }}
        >
          <MaterialCommunityIcons
            name={favorite ? 'star' : 'star-outline'}
            size={28}
            color={theme.colors.accent}
          />
        </TouchableOpacity>
      </View>
      <Text style={styles.product}>Produto: {vendor.product}</Text>

      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id.toString()}
        style={styles.reviewList}
        renderItem={({ item }) => {
          const photoUri = item.client_profile_photo
            ? `${BASE_URL.replace(/\/$/, '')}/${item.client_profile_photo}`
            : null;
          return (
            <View style={styles.reviewItem}>
              {photoUri && (
                <Image source={{ uri: photoUri }} style={styles.reviewerPhoto} />
              )}
              <View style={styles.reviewBody}>
                <Text style={styles.reviewerName}>
                  {item.client_name || 'Cliente'}
                </Text>
                <Text style={styles.reviewRating}>⭐ {item.rating}</Text>
                {item.comment ? <Text>{item.comment}</Text> : null}
              </View>
            </View>
          );
        }}
      />

      <StarRatingInput rating={rating} onChange={setRating} />
      <TextInput
        mode="outlined"
        style={styles.input}
        label="Comentário"
        value={comment}
        onChangeText={setComment}
      />
      <Button mode="contained" onPress={submitReview}>
        Enviar
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: theme.colors.background },
  photo: { width: 120, height: 120, borderRadius: 60, alignSelf: 'center', marginBottom: 16 },
  name: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  product: { textAlign: 'center', marginBottom: 16 },
  reviewList: { marginVertical: 8 },
  reviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  reviewerPhoto: { width: 40, height: 40, borderRadius: 20, marginRight: 8 },
  reviewBody: { flex: 1 },
  reviewerName: { fontWeight: 'bold' },
  reviewRating: { fontWeight: 'bold' },
  input: { marginBottom: 8 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
