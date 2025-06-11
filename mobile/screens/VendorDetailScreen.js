import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, FlatList, TextInput, Button } from 'react-native';
import axios from 'axios';
import { BASE_URL } from '../config';

export default function VendorDetailScreen({ route }) {
  const { vendor } = route.params;
  const [reviews, setReviews] = useState([]);
  const [rating, setRating] = useState('');
  const [comment, setComment] = useState('');

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
  }, []);

  const submitReview = async () => {
    try {
      await axios.post(`${BASE_URL}/vendors/${vendor.id}/reviews`, {
        rating: parseInt(rating) || 0,
        comment,
      });
      setRating('');
      setComment('');
      loadReviews();
    } catch (e) {
      console.log('Erro ao enviar review:', e);
    }
  };

  const photoUri = vendor.profile_photo
    ? `${BASE_URL.replace(/\/$/, '')}/${vendor.profile_photo}`
    : null;

  return (
    <View style={styles.container}>
      {photoUri && <Image source={{ uri: photoUri }} style={styles.photo} />}
      <Text style={styles.name}>{vendor.name || 'Vendedor'}</Text>
      <Text style={styles.product}>Produto: {vendor.product}</Text>

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

      <TextInput
        style={styles.input}
        placeholder="Avaliação 1-5"
        value={rating}
        onChangeText={setRating}
        keyboardType="numeric"
      />
      <TextInput
        style={styles.input}
        placeholder="Comentário"
        value={comment}
        onChangeText={setComment}
      />
      <Button title="Enviar" onPress={submitReview} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#fff' },
  photo: { width: 120, height: 120, borderRadius: 60, alignSelf: 'center', marginBottom: 16 },
  name: { fontSize: 20, fontWeight: 'bold', textAlign: 'center' },
  product: { textAlign: 'center', marginBottom: 16 },
  reviewList: { marginVertical: 8 },
  reviewItem: { paddingVertical: 4, borderBottomWidth: 1, borderBottomColor: '#ccc' },
  reviewRating: { fontWeight: 'bold' },
  input: { borderWidth: 1, borderColor: '#ccc', padding: 8, borderRadius: 8, marginBottom: 8 },
});
