import { useState, useCallback } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Linking, TextInput, Image,
  RefreshControl,
} from "react-native";
import { useQuery } from "@tanstack/react-query";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE, getSessionCookie } from "@/lib/api";
import { colors, spacing, radius, typography } from "@/constants/theme";

interface DayTripResult {
  id: string;
  name: string;
  category: string;
  description?: string;
  rating: number;
  review_count: number;
  url: string;
  address: string;
  photo_url?: string;
  coordinates: { latitude: number; longitude: number };
}

interface DayTripData {
  dayTrips: DayTripResult[];
  homeLocation: string;
}

async function fetchDayTrips(
  coords?: { lat: number; lng: number; label?: string }
): Promise<DayTripData> {
  const cookie = await getSessionCookie();
  let url = `${API_BASE}/api/inspire/day-trips`;
  if (coords) {
    const params = new URLSearchParams({
      lat: coords.lat.toString(),
      lng: coords.lng.toString(),
      ...(coords.label ? { locationLabel: coords.label } : {}),
    });
    url += `?${params}`;
  }
  const res = await fetch(url, {
    headers: { ...(cookie ? { Cookie: cookie } : {}) },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message ?? "Failed to fetch day trips");
  }
  return res.json();
}

function StarRow({ rating, reviewCount }: { rating: number; reviewCount: number }) {
  const full = Math.floor(rating);
  const stars = Array.from({ length: 5 }, (_, i) => (i < full ? "★" : "☆")).join("");
  return (
    <View style={styles.starRow}>
      <Text style={styles.stars}>{stars}</Text>
      <Text style={styles.ratingText}>{rating.toFixed(1)}</Text>
      <Text style={styles.reviewCount}>({reviewCount.toLocaleString()})</Text>
    </View>
  );
}

function DayTripCard({
  place,
  onPlanTrip,
}: {
  place: DayTripResult;
  onPlanTrip: (p: DayTripResult) => void;
}) {
  return (
    <View style={styles.card}>
      {place.photo_url ? (
        <Image source={{ uri: place.photo_url }} style={styles.cardImage} resizeMode="cover" />
      ) : (
        <View style={[styles.cardImage, styles.cardImageFallback]}>
          <Ionicons name="image-outline" size={32} color={colors.border} />
        </View>
      )}

      {/* Google attribution badge */}
      <View style={styles.googleBadge}>
        <Text style={styles.googleBadgeText}>Google</Text>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.categoryRow}>
          <Ionicons name="location-outline" size={12} color={colors.primary} />
          <Text style={styles.categoryText}>{place.category}</Text>
        </View>

        <Text style={styles.cardTitle}>{place.name}</Text>

        {place.rating > 0 && (
          <StarRow rating={place.rating} reviewCount={place.review_count} />
        )}

        {place.description ? (
          <Text style={styles.cardDescription} numberOfLines={2}>{place.description}</Text>
        ) : null}

        <Text style={styles.cardAddress} numberOfLines={1}>{place.address}</Text>

        <View style={styles.cardActions}>
          <TouchableOpacity
            style={styles.mapsBtn}
            onPress={() => Linking.openURL(place.url)}
          >
            <Text style={styles.mapsBtnText}>View on Google Maps →</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.planBtn}
            onPress={() => onPlanTrip(place)}
          >
            <Ionicons name="add" size={14} color="#fff" />
            <Text style={styles.planBtnText}>Plan</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function DayTripsScreen() {
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [customLocation, setCustomLocation] = useState("");
  const [editingLocation, setEditingLocation] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);

  const coordsForQuery = useCurrentLocation ? gpsCoords ?? undefined : undefined;

  const { data, isLoading, error, refetch, isRefetching } = useQuery<DayTripData>({
    queryKey: ["day-trips", coordsForQuery?.lat, coordsForQuery?.lng],
    queryFn: () => fetchDayTrips(coordsForQuery ?? undefined),
    staleTime: 60 * 60 * 1000,
  });

  const requestGps = useCallback(async () => {
    setGpsError(null);
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setGpsError("Location permission denied. Enable it in Settings.");
      return;
    }
    try {
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const [geo] = await Location.reverseGeocodeAsync({
        latitude: pos.coords.latitude,
        longitude: pos.coords.longitude,
      });
      const label = geo
        ? [geo.city, geo.region, geo.country].filter(Boolean).join(", ")
        : "Current Location";
      setGpsCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude, label });
      setUseCurrentLocation(true);
    } catch {
      setGpsError("Couldn't get your location. Try again.");
    }
  }, []);

  const handlePlanTrip = (place: DayTripResult) => {
    // Just open Google Maps for now; full journey creation via the web app
    Linking.openURL(place.url);
  };

  const locationLabel = useCurrentLocation && gpsCoords
    ? gpsCoords.label
    : data?.homeLocation ?? "your home";

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Day Trips</Text>
          <Text style={styles.headerSub}>Near {locationLabel}</Text>
        </View>
        <TouchableOpacity
          style={styles.gpsBtn}
          onPress={useCurrentLocation ? () => setUseCurrentLocation(false) : requestGps}
        >
          <Ionicons
            name={useCurrentLocation ? "location" : "location-outline"}
            size={18}
            color={useCurrentLocation ? colors.primary : colors.textMuted}
          />
          <Text style={[styles.gpsBtnText, useCurrentLocation && { color: colors.primary }]}>
            {useCurrentLocation ? "Using GPS" : "Use GPS"}
          </Text>
        </TouchableOpacity>
      </View>

      {gpsError && (
        <View style={styles.errorBanner}>
          <Ionicons name="warning-outline" size={14} color={colors.warning} />
          <Text style={styles.errorBannerText}>{gpsError}</Text>
        </View>
      )}

      {/* Loading */}
      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Finding great day trips near you…</Text>
          <Text style={styles.loadingSubText}>Searching Google for top-rated places</Text>
        </View>
      )}

      {/* Error */}
      {!isLoading && error && (
        <View style={styles.center}>
          <Ionicons name="compass-outline" size={48} color={colors.border} />
          <Text style={styles.errorTitle}>No day trips found</Text>
          <Text style={styles.errorMsg}>
            {error instanceof Error ? error.message : "Check that your home location is set in Settings."}
          </Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => refetch()}>
            <Text style={styles.retryBtnText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Results */}
      {!isLoading && !error && data && (
        <FlatList
          data={data.dayTrips}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />
          }
          ListHeaderComponent={
            <Text style={styles.resultCount}>
              {data.dayTrips.length} places found · Powered by{" "}
              <Text style={styles.googleText}>Google</Text>
            </Text>
          }
          renderItem={({ item }) => (
            <DayTripCard place={item} onPlanTrip={handlePlanTrip} />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { fontSize: 22, fontFamily: typography.serif, fontWeight: "700", color: colors.text },
  headerSub: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  gpsBtn: { flexDirection: "row", alignItems: "center", gap: 4, padding: spacing.sm, backgroundColor: colors.background, borderRadius: radius.full, borderWidth: 1, borderColor: colors.border },
  gpsBtnText: { fontSize: 12, fontWeight: "600", color: colors.textMuted },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#FEF3C7", margin: spacing.md, padding: spacing.sm, borderRadius: radius.sm },
  errorBannerText: { flex: 1, fontSize: 12, color: colors.warning },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm },
  loadingText: { fontSize: 17, fontWeight: "600", color: colors.text, textAlign: "center", marginTop: spacing.md },
  loadingSubText: { fontSize: 13, color: colors.textSecondary, textAlign: "center" },
  errorTitle: { fontSize: 18, fontWeight: "700", color: colors.text },
  errorMsg: { fontSize: 13, color: colors.textSecondary, textAlign: "center" },
  retryBtn: { backgroundColor: colors.primary, borderRadius: radius.md, paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, marginTop: spacing.sm },
  retryBtnText: { color: "#fff", fontWeight: "700" },
  list: { padding: spacing.md, gap: spacing.md },
  resultCount: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },
  googleText: { color: "#4285F4", fontWeight: "700" },

  // Card
  card: { backgroundColor: colors.surface, borderRadius: radius.lg, overflow: "hidden", shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.06, shadowRadius: 8, elevation: 2 },
  cardImage: { width: "100%", height: 180 },
  cardImageFallback: { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  googleBadge: { position: "absolute", top: spacing.sm, right: spacing.sm, backgroundColor: "rgba(255,255,255,0.92)", borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  googleBadgeText: { fontSize: 10, fontWeight: "700", color: "#4285F4" },
  cardBody: { padding: spacing.md },
  categoryRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 4 },
  categoryText: { fontSize: 11, fontWeight: "600", color: colors.primary, textTransform: "uppercase", letterSpacing: 0.5 },
  cardTitle: { fontSize: 18, fontFamily: typography.serif, fontWeight: "700", color: colors.text, marginBottom: 4 },
  starRow: { flexDirection: "row", alignItems: "center", gap: 4, marginBottom: 6 },
  stars: { fontSize: 13, color: "#F59E0B" },
  ratingText: { fontSize: 13, fontWeight: "700", color: "#D97706" },
  reviewCount: { fontSize: 12, color: colors.textMuted },
  cardDescription: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 6 },
  cardAddress: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.sm },
  cardActions: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 4 },
  mapsBtn: {},
  mapsBtnText: { fontSize: 12, fontWeight: "600", color: "#4285F4" },
  planBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  planBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },
});
