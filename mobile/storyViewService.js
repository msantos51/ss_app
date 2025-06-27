// Serviço para guardar stories vistos localmente
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'seenStories';

export async function getSeenStories() {
  const data = await AsyncStorage.getItem(KEY);
  return data ? JSON.parse(data) : [];
}

export async function markStoriesSeen(ids) {
  const seen = await getSeenStories();
  const merged = Array.from(new Set([...seen, ...ids]));
  await AsyncStorage.setItem(KEY, JSON.stringify(merged));
}
