import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Alert,
} from "react-native";
import { Button, Text, TextInput, ActivityIndicator } from "react-native-paper";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LeafletMap from "../LeafletMap";
import axios from "axios";
import { BASE_URL } from "../config";
import { theme } from "../theme";
import { Picker } from "@react-native-picker/picker";
import {
  isNotificationsEnabled,
  getNotificationRadius,
} from "../settingsService";
import { subscribe as subscribeLocations } from "../socketService";
import {
  startLocationSharing,
  stopLocationSharing,
  isLocationSharing,
} from "../locationService";
import * as Location from "expo-location";
import useProximityNotifications from "../useProximityNotifications";
import {
  getFavorites,
  addFavorite,
  removeFavorite,
} from "../favoritesService";
import t from "../i18n";

export default function MapScreen({ navigation }) {
  const [vendors, setVendors] = useState([]);
  const [vendorUser, setVendorUser] = useState(null);
  const [clientUser, setClientUser] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState("Todos os vendedores");
  const [showList, setShowList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [userPosition, setUserPosition] = useState(null);
  const [mapKey, setMapKey] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(13);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [notifRadius, setNotifRadius] = useState(20);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const mapRef = useRef(null);

  const fetchVendors = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/vendors/`);
      setVendors(res.data);
    } catch (err) {
      console.log("Erro ao buscar vendedores:", err);
    }
  };

  const loadVendor = async () => {
    try {
      const stored = await AsyncStorage.getItem("user");
      if (stored) {
        const v = JSON.parse(stored);
        setVendorUser(v);
        const share = await isLocationSharing();
        if (share) await startLocationSharing(v.id);
      } else {
        setVendorUser(null);
        await stopLocationSharing();
      }
    } catch {
      setVendorUser(null);
    }
  };

  const loadClient = async () => {
    try {
      const stored = await AsyncStorage.getItem("client");
      if (stored) setClientUser(JSON.parse(stored));
      else setClientUser(null);
    } catch {
      setClientUser(null);
    }
  };

  const loadFavorites = async () => {
    const favs = await getFavorites();
    setFavoriteIds(favs);
  };

  const locateUser = async (zoom = 15) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setUserPosition(coords);
      setMapKey((k) => k + 1);
      mapRef.current?.setView(coords.latitude, coords.longitude, zoom);
      setZoomLevel(zoom);
    } catch (err) {
      console.log("Erro ao obter localização:", err);
    }
  };

  useEffect(() => {
    fetchVendors();
    loadVendor();
    loadClient();
    loadFavorites();
    locateUser();

    const unsubFocus = navigation.addListener("focus", () => {
      fetchVendors();
      loadVendor();
      loadClient();
      loadFavorites();
    });

    return unsubFocus;
  }, [navigation]);

  useEffect(() => {
    const unsub = subscribeLocations(({ vendor_id, lat, lng, remove }) => {
      setVendors((prev) => {
        if (remove) return prev.filter((v) => v.id !== vendor_id);
        const exists = prev.find((v) => v.id === vendor_id);
        if (exists) {
          return prev.map((v) =>
            v.id === vendor_id ? { ...v, current_lat: lat, current_lng: lng } : v
          );
        } else {
          return [...prev, { id: vendor_id, current_lat: lat, current_lng: lng }];
        }
      });
    });
    return unsub;
  }, []);

  useEffect(() => {
    const loadNotif = async () => {
      setNotifEnabled(await isNotificationsEnabled());
      setNotifRadius(await getNotificationRadius());
    };
    loadNotif();
  }, []);

  const activeVendors = vendors.filter(
    (v) => v?.current_lat != null && v?.current_lng != null
  );

  const filteredVendors = activeVendors.filter(
    (v) =>
      (selectedProduct === "Todos os vendedores" ||
        v?.product === selectedProduct) &&
      (searchQuery === "" ||
        v?.name?.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  useProximityNotifications(
    filteredVendors,
    notifRadius,
    favoriteIds,
    notifEnabled
  );

  return (
    <View style={styles.container}>
      {loadingLocation ? (
        <ActivityIndicator
          animating
          size="large"
          style={StyleSheet.absoluteFill}
        />
      ) : (
        <LeafletMap
          key={mapKey}
          ref={mapRef}
          initialPosition={userPosition}
          initialZoom={zoomLevel}
          markers={[
            ...filteredVendors.map((v) => ({
              latitude: v.current_lat,
              longitude: v.current_lng,
              title: v.name || "Vendedor",
            })),
            ...(userPosition
              ? [
                  {
                    latitude: userPosition.latitude,
                    longitude: userPosition.longitude,
                    title: "Você",
                  },
                ]
              : []),
          ]}
        />
      )}

      <View style={styles.filterContainer}>
        <Picker
          selectedValue={selectedProduct}
          onValueChange={(itemValue) => setSelectedProduct(itemValue)}
          style={styles.picker}
        >
          <Picker.Item label="Todos os vendedores" value="Todos os vendedores" />
          <Picker.Item label="Bolas de Berlim" value="Bolas de Berlim" />
          <Picker.Item label="Acessórios" value="Acessórios" />
          <Picker.Item label="Gelados" value="Gelados" />
        </Picker>

        <TouchableOpacity
          style={styles.listToggle}
          onPress={() => setShowList((v) => !v)}
        >
          <Text style={styles.listToggleText}>
            {showList ? "Fechar Lista" : "Mostrar Lista"}
          </Text>
        </TouchableOpacity>

        {showList && (
          <>
            <TextInput
              mode="outlined"
              style={styles.searchInput}
              label="Procurar vendedor..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <FlatList
              data={filteredVendors}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <View style={{ paddingVertical: 4 }}>
                  <Text>{item.name || "Vendedor"}</Text>
                </View>
              )}
            />
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: theme.colors.background },
  filterContainer: {
    position: "absolute",
    top: 90,
    left: 20,
    right: 20,
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    padding: 6,
    zIndex: 5,
  },
  picker: {
    backgroundColor: "#eee",
    marginBottom: 4,
  },
  listToggle: {
    backgroundColor: theme.colors.primary,
    padding: 6,
    borderRadius: 8,
    marginBottom: 4,
  },
  listToggleText: {
    color: "#fff",
    textAlign: "center",
  },
  searchInput: {
    marginBottom: 4,
  },
});
