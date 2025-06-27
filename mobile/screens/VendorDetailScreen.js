// Tela com detalhes do vendedor
import React, { useEffect, useState } from 'react';
import { View, Image, StyleSheet, TouchableOpacity, Alert, Modal, FlatList } from 'react-native';
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
  const [stories, setStories] = useState([]);
  const [selectedStory, setSelectedStory] = useState(null);

  const openStory = () => {
    if (stories.length > 0) {
      setSelectedStory(stories[0].media_url);
    }
  };

  const loadReviews = async () => {
    try {
      const resp = await axios.get(`${BASE_URL}/vendors/${vendor.id}/reviews`);
      setReviews(resp.data);
    } catch (e) {
      console.log('Erro ao buscar reviews:', e);
    }
  };

  const loadStories = async () => {
    try {
      const resp = await axios.get(`${BASE_URL}/vendors/${vendor.id}/stories`);
      setStories(resp.data);
    } catch (e) {
      console.log('Erro ao buscar stories:', e);
    }
  };

  useEffect(() => {
    loadReviews();
    isFavorite(vendor.id).then(setFavorite);
    loadStories();
  }, []);

const submitReview = async () => {
  try {
    // 1️⃣ Vai buscar o token ao AsyncStorage
    const token = await AsyncStorage.getItem('clientToken');

    // 2️⃣ Mostra no log o token e os dados enviados
    console.log("🚀 Token usado na review:", token);
    console.log("🚀 Dados enviados na review:", { rating, comment });

    if (!token) {
      Alert.alert(
        'Inicie sessão',
        'É necessário iniciar sessão para avaliar um vendedor.'
      );
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


  const baseUrl = BASE_URL.replace(/\/$/, '');
  const photoUri = vendor.profile_photo ? `${baseUrl}/${vendor.profile_photo}` : null;

  return (
    <View style={styles.container}>
      {photoUri && (
        <TouchableOpacity onPress={openStory} activeOpacity={stories.length > 0 ? 0.7 : 1}>
          <Image
            source={{ uri: photoUri }}
            style={[styles.photo, stories.length > 0 && styles.storyBorder]}
          />
        </TouchableOpacity>
      )}
      <View style={styles.nameRow}>
        <Text style={styles.name}>{vendor.name || 'Vendedor'}</Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={favorite ? t('removeFavorite') : t('addFavorite')}
          onPress={async () => {
            const token = await AsyncStorage.getItem('clientToken');
            if (!token) {
              Alert.alert(
                'Inicie sessão',
                'É necessário iniciar sessão para adicionar favoritos.'
              );
              return;
            }
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

      <Modal
        visible={!!selectedStory}
        transparent
        onRequestClose={() => setSelectedStory(null)}
      >
        <TouchableOpacity style={styles.modalBg} onPress={() => setSelectedStory(null)}>
          {selectedStory && (
            <Image
              source={{ uri: `${baseUrl}/${selectedStory}` }}
              style={styles.fullStory}
            />
          )}
        </TouchableOpacity>
      </Modal>

      <FlatList
        data={reviews}
        keyExtractor={(item) => item.id.toString()}
        style={styles.reviewList}
        renderItem={({ item }) => (
          <View style={styles.reviewItem}>
            <Text style={styles.reviewRating}>⭐ {item.rating}</Text>
            {item.comment ? <Text>{item.comment}</Text> : null}
          </View>
        )}
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
        <Text>Enviar</Text>
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
  reviewItem: { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  reviewRating: { fontWeight: 'bold' },
  input: { marginBottom: 8 },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  storyBorder: { borderWidth: 3, borderColor: 'purple' },
  modalBg: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullStory: {
    width: '90%',
    height: '90%',
    resizeMode: 'contain',
  },
});
