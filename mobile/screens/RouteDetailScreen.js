import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import LeafletMap from '../LeafletMap';

export default function RouteDetailScreen({ route }) {
  const r = route.params.route;
  const polyline = r.points.map((p) => [p.lat, p.lng]);
  const start = new Date(r.start_time);
  const end = r.end_time ? new Date(r.end_time) : null;
  const durationMin = end ? Math.round((end - start) / 60000) : 0;
  const initial = polyline.length
    ? { latitude: polyline[0][0], longitude: polyline[0][1] }
    : { latitude: 0, longitude: 0 };
  return (
    <View style={styles.container}>
      <LeafletMap initialPosition={initial} polyline={polyline} />
      <View style={styles.info}>
        <Text>Início: {start.toLocaleString()}</Text>
        {end && <Text>Fim: {end.toLocaleString()}</Text>}
        <Text>Duração: {durationMin} min</Text>
        <Text>Distância: {(r.distance_m / 1000).toFixed(2)} km</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  info: { padding: 16 },
});
