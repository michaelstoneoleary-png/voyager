import { useState } from "react";
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { apiGet } from "@/lib/api";
import { colors, spacing, radius, typography } from "@/constants/theme";

interface Activity {
  time: string; title: string; type: string;
  duration?: string; description?: string; cost?: string; tip?: string;
  place_url?: string; place_rating?: number;
}
interface Hotel { name: string; category: string; price_per_night: string; rating: number; neighborhood: string; }
interface Day { day: number; date_label: string; location: string; activities: Activity[]; hotels: Hotel[]; }
interface Journey { id: string; title: string; itinerary?: { days: Day[]; summary?: string }; days?: number; origin?: string; finalDestination?: string; }

const TYPE_COLORS: Record<string, string> = {
  food: "#F59E0B", culture: "#8B5CF6", nature: "#10B981",
  shopping: "#EC4899", nightlife: "#6366F1", relaxation: "#14B8A6",
  logistics: "#6B7280",
};

export default function JourneyDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [selectedDay, setSelectedDay] = useState(0);

  const { data: journey, isLoading } = useQuery<Journey>({
    queryKey: ["journey", id],
    queryFn: () => apiGet(`/api/journeys/${id}`),
  });

  if (isLoading) return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  if (!journey) return <View style={styles.center}><Text style={styles.error}>Journey not found</Text></View>;

  const days = journey.itinerary?.days ?? [];
  const currentDay = days[selectedDay];

  if (!days.length) {
    return (
      <View style={styles.center}>
        <Ionicons name="map-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyTitle}>No itinerary yet</Text>
        <Text style={styles.emptyText}>Generate an itinerary on the Voyager web app</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Day selector */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dayBar} contentContainerStyle={styles.dayBarContent}>
        {days.map((day, i) => (
          <TouchableOpacity
            key={i}
            style={[styles.dayChip, i === selectedDay && styles.dayChipActive]}
            onPress={() => setSelectedDay(i)}
          >
            <Text style={[styles.dayChipLabel, i === selectedDay && styles.dayChipLabelActive]}>
              Day {day.day}
            </Text>
            <Text style={[styles.dayChipLocation, i === selectedDay && styles.dayChipLocationActive]} numberOfLines={1}>
              {day.location}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Activities */}
        {currentDay?.activities.map((activity, i) => (
          <View key={i} style={styles.activityCard}>
            <View style={styles.activityHeader}>
              <Text style={styles.activityTime}>{activity.time}</Text>
              <View style={[styles.typeBadge, { backgroundColor: `${TYPE_COLORS[activity.type] ?? "#6B7280"}20` }]}>
                <Text style={[styles.typeBadgeText, { color: TYPE_COLORS[activity.type] ?? "#6B7280" }]}>
                  {activity.type}
                </Text>
              </View>
            </View>
            <Text style={styles.activityTitle}>{activity.title}</Text>
            {activity.description && <Text style={styles.activityDesc}>{activity.description}</Text>}
            <View style={styles.activityMeta}>
              {activity.duration && <Text style={styles.metaText}>{activity.duration}</Text>}
              {activity.cost && activity.cost !== "Free" && <Text style={styles.metaText}>{activity.cost}</Text>}
              {activity.place_rating && <Text style={styles.metaText}>⭐ {activity.place_rating} on Google</Text>}
            </View>
            {activity.tip && (
              <View style={styles.tip}>
                <Ionicons name="bulb-outline" size={12} color={colors.primary} />
                <Text style={styles.tipText}>{activity.tip}</Text>
              </View>
            )}
          </View>
        ))}

        {/* Hotels */}
        {currentDay?.hotels?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Where to Stay</Text>
            {currentDay.hotels.map((hotel, i) => (
              <View key={i} style={styles.hotelCard}>
                <Text style={styles.hotelName}>{hotel.name}</Text>
                <Text style={styles.hotelMeta}>{hotel.neighborhood} · {hotel.price_per_night} · ⭐ {hotel.rating}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: spacing.sm, backgroundColor: colors.background },
  error: { color: colors.error, fontSize: 16 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: colors.textSecondary },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: "center" },
  dayBar: { backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border, maxHeight: 80 },
  dayBarContent: { paddingHorizontal: spacing.sm, paddingVertical: spacing.sm, gap: spacing.sm },
  dayChip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, minWidth: 80, alignItems: "center" },
  dayChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  dayChipLabel: { fontSize: 11, fontWeight: "700", color: colors.textMuted },
  dayChipLabelActive: { color: "#fff" },
  dayChipLocation: { fontSize: 11, color: colors.textSecondary, marginTop: 1, maxWidth: 80 },
  dayChipLocationActive: { color: "rgba(255,255,255,0.8)" },
  content: { padding: spacing.md, gap: spacing.sm },
  activityCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  activityHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  activityTime: { fontSize: 12, fontFamily: "Courier", color: colors.textMuted, backgroundColor: colors.background, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  typeBadge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 2 },
  typeBadgeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  activityTitle: { fontSize: 16, fontFamily: typography.serif, fontWeight: "600", color: colors.text, marginBottom: 4 },
  activityDesc: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 6 },
  activityMeta: { flexDirection: "row", gap: spacing.md },
  metaText: { fontSize: 12, color: colors.textMuted },
  tip: { flexDirection: "row", gap: 6, alignItems: "flex-start", marginTop: spacing.sm, backgroundColor: `${colors.primary}10`, borderRadius: radius.sm, padding: spacing.sm },
  tipText: { flex: 1, fontSize: 12, color: colors.primary, lineHeight: 17 },
  section: { marginTop: spacing.sm },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: colors.text, marginBottom: spacing.sm },
  hotelCard: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.sm },
  hotelName: { fontSize: 14, fontWeight: "600", color: colors.text },
  hotelMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
});
