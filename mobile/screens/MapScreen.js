// (em português) Este ecrã mostra o mapa com os vendedores ativos e o pin azul do cliente

import React, { useEffect, useState, useRef } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
} from "react-native";
import { Button, Text, TextInput, ActivityIndicator } from "react-native-paper";
import { Picker } from "@react-native-picker/picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LeafletMap from "../LeafletMap";
import axios from "axios";
import { BASE_URL } from "../config";
import { theme } from "../theme";
import { isNotificationsEnabled, getNotificationRadius } from "../settingsService";
import { subscribe as subscribeLocations } from "../socketService";
import {
  startLocationSharing,
  stopLocationSharing,
  isLocationSharing,
} from "../locationService";
import * as Location from "expo-location";
import useProximityNotifications from "../useProximityNotifications";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { getFavorites, addFavorite, removeFavorite } from "../favoritesService";
import t from "../i18n";

export default function MapScreen({ navigation }) {
  const [vendors, setVendors] = useState([]);
  const [vendorUser, setVendorUser] = useState(null);
  const [clientUser, setClientUser] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState("Todos os vendedores");
  const [showList, setShowList] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [initialPosition, setInitialPosition] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(true);
  const [selectedVendorId, setSelectedVendorId] = useState(null);
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [userPosition, setUserPosition] = useState(null);
  const [mapKey, setMapKey] = useState(0);
  const [zoomLevel, setZoomLevel] = useState(13);
  const [notifEnabled, setNotifEnabled] = useState(true);
  const [notifRadius, setNotifRadius] = useState(20);
  const mapRef = useRef(null);
  const watchRef = useRef(null);

  const startWatch = async () => {
    if (watchRef.current) return;
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") return;
    watchRef.current = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.Highest,
        distanceInterval: 5,
      },
      (loc) => {
        const coords = {
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
        };
        setUserPosition(coords);
      },
    );
  };

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
        if (share) {
          try {
            await startLocationSharing(v.id);
          } catch (err) {
            console.log("Erro ao iniciar localização:", err);
          }
        }
      } else {
        setVendorUser(null);
        await stopLocationSharing();
      }
    } catch (err) {
      console.log("Erro ao carregar vendedor:", err);
      setVendorUser(null);
    }
  };

  const loadClient = async () => {
    try {
      const stored = await AsyncStorage.getItem("client");
      if (stored) {
        setClientUser(JSON.parse(stored));
      } else {
        setClientUser(null);
      }
    } catch (err) {
      console.log("Erro ao carregar cliente:", err);
      setClientUser(null);
    }
  };

  const loadFavorites = async () => {
    const favs = await getFavorites();
    setFavoriteIds(favs);
  };

  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      fetchVendors();
      loadVendor();
      loadClient();
      loadFavorites();
    });
    fetchVendors();
    loadVendor();
    loadClient();
    loadFavorites();
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = subscribeLocations(
      ({ vendor_id, lat, lng, remove }) => {
        setVendors((prev) => {
          if (remove === true) {
            return prev.filter((v) => v.id !== vendor_id);
          }
          const exists = prev.find((v) => v.id === vendor_id);
          if (exists) {
            return prev.map((v) =>
              v.id === vendor_id
                ? { ...v, current_lat: lat, current_lng: lng }
                : v,
            );
          } else {
            return [
              ...prev,
              { id: vendor_id, current_lat: lat, current_lng: lng },
            ];
          }
        });
      },
    );
    return unsubscribe;
  }, []);

  // Remove previous effect. The map will be remounted when the first
  // location is obtained inside `locateUser`.

  // Inicia o tracking da localização quando o componente monta
  useEffect(() => {
    startWatch();
    return () => {
      watchRef.current && watchRef.current.remove();
    };
  }, []);

  const locateUser = async (zoom = 19) => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") return;

      if (userPosition) {
        mapRef.current?.setView(
          userPosition.latitude,
          userPosition.longitude,
          zoom,
        );
        setZoomLevel(zoom);
        return;
      }

      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });
      const coords = {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
      };
      setInitialPosition(coords);
      setUserPosition(coords);
      startWatch();

      // Remount the map so the user pin becomes visible
      setMapKey((k) => k + 1);

      setTimeout(
        () =>
          mapRef.current?.setView(
            loc.coords.latitude,
            loc.coords.longitude,
            zoom,
          ),
        100,
      );
      setZoomLevel(zoom);
    } catch (err) {
      console.log("Erro ao obter localização:", err);
    }
  };

  useEffect(() => {
    const init = async () => {
      await locateUser(15);
      setLoadingLocation(false);
    };
    init();
  }, []);

  useEffect(() => {
    const load = async () => {
      setNotifEnabled(await isNotificationsEnabled());
      setNotifRadius(await getNotificationRadius());
    };
    load();
  }, []);
  const activeVendors = vendors.filter(
    (v) => v?.current_lat != null && v?.current_lng != null,
  );
  const filteredVendors = activeVendors.filter(
    (v) =>
      (selectedProduct === "Todos os vendedores" ||
        v?.product === selectedProduct) &&
      (searchQuery === "" ||
        v?.name?.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // Enviar notificações de proximidade se estiver ativo
  useProximityNotifications(filteredVendors, notifRadius, favoriteIds, notifEnabled);

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
          initialPosition={userPosition || initialPosition}
          initialZoom={zoomLevel}
          markers={[
            ...filteredVendors.map((v) => {
              const photo = v.profile_photo
                ? `${BASE_URL.replace(/\/$/, "")}/${v.profile_photo}`
                : null;
              return {
                latitude: v.current_lat,
                longitude: v.current_lng,
                title: v.name || "Vendedor",
                iconHtml: photo
                  ? `<div class="gm-pin" style="border: 2px solid ${v.pin_color || "#FFB6C1"};"><img src="${photo}" /></div>`
                  : null,
                selected: v.id === selectedVendorId,
              };
            }),
            ...(userPosition
              ? [
                  {
                    latitude: userPosition.latitude,
                    longitude: userPosition.longitude,
                    title: "Você",
                    iconHtml:
                      '<div class="gm-pin" style="background-color: white; border: 2px solid #0077FF;"></div>',
                  },
                ]
              : []),
          ]}
        />
      )}

      <TouchableOpacity
        style={styles.vendorIcon}
        onPress={() =>
          navigation.navigate(vendorUser ? "Dashboard" : "VendorLogin")
        }
        accessibilityRole="button"
        accessibilityLabel="Iniciar sessão de Vendedor"
        accessible
      >
        <MaterialCommunityIcons
          name="account"
          size={32}
          color={theme.colors.primary}
        />
      </TouchableOpacity>

      {!loadingLocation && (
        <TouchableOpacity
          style={styles.locateButton}
          onPress={() => locateUser(19)}
        >
          <Text style={styles.locateIcon}>📍</Text>
        </TouchableOpacity>
      )}

      <View style={styles.filterContainer}>
        <Picker
          selectedValue={selectedProduct}
          onValueChange={(itemValue) => setSelectedProduct(itemValue)}
          style={styles.picker}
        >
          <Picker.Item
            label="Todos os vendedores"
            value="Todos os vendedores"
          />
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
              label="Procurar..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <FlatList
              data={filteredVendors}
              keyExtractor={(item) =>
                item.id?.toString() ?? Math.random().toString()
              }
              style={styles.vendorList}
              renderItem={({ item }) => {
                const photoUri = item.profile_photo
                  ? `${BASE_URL.replace(/\/$/, "")}/${item.profile_photo}`
                  : null;
                const fav = favoriteIds.includes(item.id);
                return (
                  <TouchableOpacity
                    style={styles.vendorItem}
                    accessible
                    onPress={() => {
                      setSelectedVendorId(item.id);
                      mapRef.current?.setView(
                        item.current_lat,
                        item.current_lng,
                        zoomLevel,
                      );
                    }}
                    onLongPress={() => {
                      setSelectedVendorId(item.id);
                      navigation.navigate("VendorDetail", { vendor: item });
                    }}
                  >
                    {photoUri && (
                      <Image
                        source={{ uri: photoUri }}
                        style={styles.vendorImage}
                      />
                    )}
                    <Text>
                      {item.name || "Vendedor"}
                      {item.rating_average != null
                        ? ` \u2013 ${item.rating_average.toFixed(1)}\u2605`
                        : ""}
                    </Text>
                    <TouchableOpacity
                      accessibilityRole="button"
                      accessibilityLabel={
                        fav ? t("removeFavorite") : t("addFavorite")
                      }
                      onPress={async () => {
                        if (!clientUser) {
                          Alert.alert(
                            'Inicie sessão',
                            'É necessário iniciar sessão para adicionar favoritos.'
                          );
                          return;
                        }
                        if (fav) {
                          await removeFavorite(item.id);
                        } else {
                          await addFavorite(item.id);
                        }
                        loadFavorites();
                      }}
                      accessible
                    >
                      <MaterialCommunityIcons
                        name={fav ? "star" : "star-outline"}
                        size={24}
                        color={theme.colors.accent}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                );
              }}
            />
          </>
        )}
      </View>

      <View style={styles.buttonsContainer}>
        {clientUser ? (
          <Button
            mode="contained"
            style={styles.button}
            onPress={() => navigation.navigate("ClientDashboard")}
          >
            Perfil
          </Button>
        ) : (
          <>
            <Button
              mode="contained"
              style={styles.button}
              onPress={() => navigation.navigate("ClientLogin")}
            >
              Iniciar sessão Cliente
            </Button>

            <Button
              mode="outlined"
              style={styles.button}
              onPress={() => navigation.navigate("ClientRegister")}
            >
              Registar Cliente
            </Button>
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
    top: 10,
    left: 70,
    right: 70,
    backgroundColor: theme.colors.background,
    borderRadius: 16,
    padding: 6,
  },
  picker: { backgroundColor: "#eee", marginBottom: 4 },
  vendorList: { maxHeight: 200 },
  vendorItem: {
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
    flexDirection: "row",
    alignItems: "center",
  },
  searchInput: { marginBottom: 4 },
  listToggle: {
    backgroundColor: theme.colors.primary,
    padding: 6,
    borderRadius: 8,
    marginBottom: 4,
  },
  listToggleText: { color: "#fff", textAlign: "center" },
  vendorImage: { width: 32, height: 32, borderRadius: 16, marginRight: 8 },
  buttonsContainer: {
    position: "absolute",
    bottom: 40,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  button: { flex: 1, marginHorizontal: 4 },
  locateButton: {
    position: "absolute",
    bottom: 110,
    right: 20,
    backgroundColor: theme.colors.background,
    borderRadius: 20,
    padding: 8,
    borderWidth: 1,
    borderColor: "#ccc",
  },
  locateIcon: {
    fontSize: 24,
  },
  vendorIcon: {
    position: "absolute",
    top: 10,
    right: 10,
  },
});