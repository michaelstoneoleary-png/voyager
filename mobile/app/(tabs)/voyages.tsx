import { useState, useEffect } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Switch, Alert, ActivityIndicator } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@/lib/auth";
import { colors, spacing, radius, typography } from "@/constants/theme";
import {
  startVoyageDetection, stopVoyageDetection, isVoyageDetectionActive,
  geocodeHomeLocation, getVoyages, type Voyage,
} from "@/lib/voyage";

export default function VoyagesScreen() {
  const { user } = useAuth();
  const [detectionActive, setDetectionActive] = useState(false);
  const [toggling, setToggling] = useState(false);
  const [checking, setChecking] = useState(true);

  const { data: voyages = [], isLoading } = useQuery<Voyage[]>({
    queryKey: ["voyages"],
    queryFn: getVoyages,
  });

  useEffect(() => {
    isVoyageDetectionActive().then(active => {
      setDetectionActive(active);
      setChecking(false);
    });
  }, []);

  const handleToggleDetection = async (value: boolean) => {
    setToggling(true);
    try {
      if (value) {
        if (!user?.homeLocation) {
          Alert.alert("Home location required", "Tap your profile icon on the Journeys tab to set your home location.");
          return;
        }
        const coords = await geocodeHomeLocation(user.homeLocation);
        if (!coords) {
          Alert.alert("Location error", `Couldn't find coordinates for "${user.homeLocation}". Try a more specific address.`);
          return;
        }
        const started = await startVoyageDetection(coords);
        if (!started) {
          Alert.alert("Permission required", "Voyager needs 'Always' location access to detect when you leave home. Please update this in iOS Settings.");
          return;
        }
        setDetectionActive(true);
      } else {
        await stopVoyageDetection();
        setDetectionActive(false);
      }
    } finally {
      setToggling(false);
    }
  };

  const activeVoyage = voyages.find(v => v.status === "active");
  const pastVoyages = voyages.filter(v => v.status === "completed");

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Voyages</Text>
        <Text style={styles.subtitle}>Auto-detected travel journal</Text>
      </View>

      {/* Detection toggle */}
      <View style={styles.toggleCard}>
        <View style={styles.toggleLeft}>
          <Ionicons name="radio-outline" size={20} color={detectionActive ? colors.voyage : colors.textMuted} />
          <View>
            <Text style={styles.toggleTitle}>Voyage Detection</Text>
            <Text style={styles.toggleDesc}>
              {user?.homeLocation
                ? `Tracking from ${user.homeLocation}`
                : "Set home location in your Profile first"}
            </Text>
          </View>
        </View>
        {checking || toggling
          ? <ActivityIndicator color={colors.voyage} />
          : <Switch
              value={detectionActive}
              onValueChange={handleToggleDetection}
              trackColor={{ true: colors.voyage, false: colors.border }}
              thumbColor="#fff"
            />
        }
      </View>

      {/* Active voyage banner */}
      {activeVoyage && (
        <View style={styles.activeBanner}>
          <Ionicons name="airplane" size={16} color={colors.voyage} />
          <Text style={styles.activeBannerText}>
            Voyage active · started {new Date(activeVoyage.startedAt).toLocaleDateString()}
          </Text>
        </View>
      )}

      {/* Past voyages */}
      {isLoading ? (
        <View style={styles.center}><ActivityIndicator color={colors.voyage} /></View>
      ) : pastVoyages.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="compass-outline" size={48} color={colors.textMuted} />
          <Text style={styles.emptyTitle}>No voyages yet</Text>
          <Text style={styles.emptyText}>
            Enable detection above and Voyager will automatically log a Voyage the next time you travel more than 50 miles from home.
          </Text>
        </View>
      ) : (
        <FlatList
          data={pastVoyages}
          keyExtractor={v => v.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.voyageCard}>
              <View style={styles.voyageHeader}>
                <Text style={styles.voyageDestination}>{item.currentLocation ?? item.startLocation}</Text>
                {item.distanceMiles && (
                  <Text style={styles.voyageDistance}>{Math.round(item.distanceMiles)} mi</Text>
                )}
              </View>
              <Text style={styles.voyageDates}>
                {new Date(item.startedAt).toLocaleDateString()}
                {item.endedAt && ` – ${new Date(item.endedAt).toLocaleDateString()}`}
              </Text>
              {item.notes && <Text style={styles.voyageNotes}>{item.notes}</Text>}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 22, fontFamily: typography.serif, fontWeight: "600", color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  toggleCard: { margin: spacing.md, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, flexDirection: "row", justifyContent: "space-between", alignItems: "center", shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 6, elevation: 2 },
  toggleLeft: { flexDirection: "row", gap: spacing.sm, alignItems: "center", flex: 1 },
  toggleTitle: { fontSize: 14, fontWeight: "700", color: colors.text },
  toggleDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },
  activeBanner: { marginHorizontal: spacing.md, marginBottom: spacing.sm, backgroundColor: colors.voyageLight, borderRadius: radius.sm, padding: spacing.sm, flexDirection: "row", alignItems: "center", gap: spacing.sm },
  activeBannerText: { fontSize: 13, color: colors.voyage, fontWeight: "600" },
  list: { padding: spacing.md, gap: spacing.sm },
  voyageCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, borderLeftWidth: 3, borderLeftColor: colors.voyage },
  voyageHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  voyageDestination: { fontSize: 16, fontFamily: typography.serif, fontWeight: "600", color: colors.text },
  voyageDistance: { fontSize: 12, color: colors.textMuted },
  voyageDates: { fontSize: 12, color: colors.textSecondary, marginTop: 4 },
  voyageNotes: { fontSize: 13, color: colors.textSecondary, marginTop: spacing.sm },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.xl, gap: spacing.sm },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: colors.textSecondary },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: "center", lineHeight: 20 },
});
