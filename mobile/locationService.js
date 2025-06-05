import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { BASE_URL } from './config';

let locationSubscription = null;

export const startLocationSharing = async (vendorId) => {
  if (locationSubscription) {
    return;
  }
  const { status } = await Location.requestForegroundPermissionsAsync();
  if (status !== 'granted') {
    throw new Error('Permissão de localização negada');
  }
  locationSubscription = await Location.watchPositionAsync(
    {
      accuracy: Location.Accuracy.High,
      timeInterval: 10000,
      distanceInterval: 10,
    },
    ({ coords }) => {
      axios
        .put(`${BASE_URL}/vendors/${vendorId}/location`, {
          lat: coords.latitude,
          lng: coords.longitude,
        })
        .catch((err) => console.log('Erro ao enviar localização:', err));
    }
  );
  await AsyncStorage.setItem('sharingLocation', 'true');
};

export const stopLocationSharing = async () => {
  if (locationSubscription) {
    locationSubscription.remove();
    locationSubscription = null;
  }
  await AsyncStorage.setItem('sharingLocation', 'false');
};

export const isLocationSharing = async () => {
  const value = await AsyncStorage.getItem('sharingLocation');
  return value === 'true';
};
