import { useState, useCallback, useRef } from "react";
import {
  View, Text, FlatList, TouchableOpacity, StyleSheet,
  SafeAreaView, ActivityIndicator, Linking, Image,
  RefreshControl, Modal, Animated, Pressable, TextInput,
  KeyboardAvoidingView, Platform, Alert,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE, getSessionCookie, apiPost } from "@/lib/api";
import { colors, spacing, radius, typography } from "@/constants/theme";

// ── Types ─────────────────────────────────────────────────────────────────────

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

// ── API ───────────────────────────────────────────────────────────────────────

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

// ── Duration options ───────────────────────────────────────────────────────────

const DURATIONS = [
  { label: "Day Trip",  sub: "Back by tonight", days: 1, nights: 0 },
  { label: "1 Night",   sub: "Leave today",      days: 2, nights: 1 },
  { label: "2 Nights",  sub: "Short getaway",    days: 3, nights: 2 },
];

// ── Quick Trip Sheet ──────────────────────────────────────────────────────────

function QuickTripSheet({
  place,
  homeLocation,
  onClose,
  onCreated,
}: {
  place: DayTripResult;
  homeLocation: string;
  onClose: () => void;
  onCreated: (journeyId: string, journeyTitle: string) => void;
}) {
  const [selectedDuration, setSelectedDuration] = useState(0);
  const [title, setTitle] = useState(place.name);

  const createMutation = useMutation({
    mutationFn: () =>
      apiPost<{ id: string; title: string }>("/api/journeys", {
        title,
        origin: homeLocation,
        finalDestination: place.name,
        destinations: [],
        days: DURATIONS[selectedDuration].days,
        cost: "TBD",
        status: "planning",
      }),
    onSuccess: (journey) => {
      onCreated(journey.id, journey.title);
    },
    onError: (err: Error) => {
      Alert.alert("Couldn't create trip", err.message);
    },
  });

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.sheetContainer}
    >
      <Pressable style={styles.sheetBackdrop} onPress={onClose} />

      <View style={styles.sheet}>
        {/* Handle */}
        <View style={styles.sheetHandle} />

        <Text style={styles.sheetTitle}>Quick Trip</Text>
        <Text style={styles.sheetSub}>Plan a trip to {place.name} right now</Text>

        {/* Editable trip name */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>Trip name</Text>
          <TextInput
            style={styles.fieldInput}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Weekend at the Lake"
            placeholderTextColor={colors.textMuted}
            returnKeyType="done"
          />
        </View>

        {/* Duration selector */}
        <View style={styles.fieldGroup}>
          <Text style={styles.fieldLabel}>How long?</Text>
          <View style={styles.durationRow}>
            {DURATIONS.map((d, i) => (
              <TouchableOpacity
                key={d.label}
                style={[styles.durationBtn, i === selectedDuration && styles.durationBtnActive]}
                onPress={() => setSelectedDuration(i)}
              >
                <Text style={[styles.durationLabel, i === selectedDuration && styles.durationLabelActive]}>
                  {d.label}
                </Text>
                <Text style={[styles.durationSub, i === selectedDuration && styles.durationSubActive]}>
                  {d.sub}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Place summary */}
        <View style={styles.placeSummary}>
          <Ionicons name="location-outline" size={14} color={colors.primary} />
          <Text style={styles.placeSummaryText} numberOfLines={1}>{place.address}</Text>
          {place.rating > 0 && (
            <Text style={styles.placeSummaryRating}>★ {place.rating.toFixed(1)}</Text>
          )}
        </View>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.createBtn, createMutation.isPending && styles.createBtnDisabled]}
          onPress={() => createMutation.mutate()}
          disabled={createMutation.isPending || !title.trim()}
        >
          {createMutation.isPending ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="add-circle-outline" size={18} color="#fff" />
              <Text style={styles.createBtnText}>Create Trip & Pack</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelBtnText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ── Star Rating ───────────────────────────────────────────────────────────────

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

// ── Day Trip Card ─────────────────────────────────────────────────────────────

function DayTripCard({
  place,
  onPlan,
}: {
  place: DayTripResult;
  onPlan: (p: DayTripResult) => void;
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
          <TouchableOpacity onPress={() => Linking.openURL(place.url)}>
            <Text style={styles.mapsBtnText}>View on Google Maps →</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.planBtn} onPress={() => onPlan(place)}>
            <Ionicons name="add" size={14} color="#fff" />
            <Text style={styles.planBtnText}>Plan Trip</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

// ── Main Screen ───────────────────────────────────────────────────────────────

export default function DayTripsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);
  const [gpsCoords, setGpsCoords] = useState<{ lat: number; lng: number; label: string } | null>(null);
  const [gpsError, setGpsError] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<DayTripResult | null>(null);

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

  const handleTripCreated = (journeyId: string, journeyTitle: string) => {
    setSelectedPlace(null);
    queryClient.invalidateQueries({ queryKey: ["journeys"] });
    // Navigate to packing with the new journey selected
    router.push({ pathname: "/(tabs)/packing", params: { journeyId, journeyTitle } });
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

      {isLoading && (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.loadingText}>Finding great day trips near you…</Text>
          <Text style={styles.loadingSubText}>Searching Google for top-rated places</Text>
        </View>
      )}

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
            <DayTripCard place={item} onPlan={setSelectedPlace} />
          )}
        />
      )}

      {/* Quick Trip Sheet */}
      <Modal
        visible={!!selectedPlace}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedPlace(null)}
      >
        {selectedPlace && (
          <QuickTripSheet
            place={selectedPlace}
            homeLocation={data?.homeLocation ?? ""}
            onClose={() => setSelectedPlace(null)}
            onCreated={handleTripCreated}
          />
        )}
      </Modal>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  // Header
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: spacing.md, paddingTop: spacing.md, paddingBottom: spacing.sm, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
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
  mapsBtnText: { fontSize: 12, fontWeight: "600", color: "#4285F4" },
  planBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: colors.primary, borderRadius: radius.full, paddingHorizontal: 12, paddingVertical: 6 },
  planBtnText: { fontSize: 12, fontWeight: "700", color: "#fff" },

  // Quick Trip Sheet
  sheetContainer: { flex: 1, justifyContent: "flex-end" },
  sheetBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: { backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: spacing.lg, paddingBottom: 40 },
  sheetHandle: { width: 40, height: 4, borderRadius: 2, backgroundColor: colors.border, alignSelf: "center", marginBottom: spacing.lg },
  sheetTitle: { fontSize: 22, fontFamily: typography.serif, fontWeight: "700", color: colors.text, marginBottom: 4 },
  sheetSub: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.lg },

  fieldGroup: { marginBottom: spacing.md },
  fieldLabel: { fontSize: 12, fontWeight: "600", color: colors.textSecondary, textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 6 },
  fieldInput: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 16, color: colors.text },

  durationRow: { flexDirection: "row", gap: spacing.sm },
  durationBtn: { flex: 1, borderWidth: 2, borderColor: colors.border, borderRadius: radius.md, padding: spacing.sm, alignItems: "center" },
  durationBtnActive: { borderColor: colors.primary, backgroundColor: `${colors.primary}10` },
  durationLabel: { fontSize: 14, fontWeight: "700", color: colors.textSecondary },
  durationLabelActive: { color: colors.primary },
  durationSub: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  durationSubActive: { color: colors.primary },

  placeSummary: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: colors.background, borderRadius: radius.md, padding: spacing.sm, marginBottom: spacing.lg },
  placeSummaryText: { flex: 1, fontSize: 12, color: colors.textSecondary },
  placeSummaryRating: { fontSize: 12, fontWeight: "700", color: "#D97706" },

  createBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: colors.primary, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  createBtnDisabled: { opacity: 0.6 },
  createBtnText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  cancelBtn: { alignItems: "center", padding: spacing.sm },
  cancelBtnText: { fontSize: 14, color: colors.textMuted },
});
