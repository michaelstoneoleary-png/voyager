import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { apiGet } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, spacing, radius, typography } from "@/constants/theme";

interface Journey {
  id: string;
  title: string;
  destinations: string[];
  origin?: string;
  finalDestination?: string;
  dates?: string;
  days?: number;
  status: string;
  progress: number;
}

function StatusBadge({ status }: { status: string }) {
  const isPlanning = status === "Planning";
  return (
    <View style={[styles.badge, isPlanning ? styles.badgePlanning : styles.badgeDone]}>
      <Text style={[styles.badgeText, isPlanning ? styles.badgeTextPlanning : styles.badgeTextDone]}>
        {status}
      </Text>
    </View>
  );
}

export default function JourneysScreen() {
  const { user } = useAuth();
  const router = useRouter();

  const { data: journeys, isLoading, refetch, isRefetching } = useQuery<Journey[]>({
    queryKey: ["journeys"],
    queryFn: () => apiGet("/api/journeys"),
  });

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Hello, {user?.firstName ?? "Traveler"}</Text>
          <Text style={styles.subtitle}>Your journeys</Text>
        </View>
      </View>

      <FlatList
        data={journeys ?? []}
        keyExtractor={(j) => j.id}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No journeys yet</Text>
            <Text style={styles.emptySubtext}>Plan your first trip on voyager-7eka.onrender.com</Text>
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => router.push(`/journey/${item.id}`)}
            activeOpacity={0.7}
          >
            <View style={styles.cardTop}>
              <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
              <StatusBadge status={item.status} />
            </View>
            <Text style={styles.cardMeta}>
              {[item.origin, ...(item.destinations ?? []), item.finalDestination]
                .filter(Boolean)
                .join(" → ")}
            </Text>
            {item.dates && <Text style={styles.cardDates}>{item.dates}</Text>}
            {item.status !== "Completed" && item.progress > 0 && (
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${item.progress}%` }]} />
              </View>
            )}
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },
  header: { paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  greeting: { fontSize: 22, fontFamily: typography.serif, fontWeight: "600", color: colors.text },
  subtitle: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },
  list: { padding: spacing.md, gap: spacing.md },
  card: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md, shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 6 },
  cardTitle: { flex: 1, fontSize: 16, fontFamily: typography.serif, fontWeight: "600", color: colors.text, marginRight: spacing.sm },
  cardMeta: { fontSize: 12, color: colors.textSecondary, marginBottom: 4 },
  cardDates: { fontSize: 12, color: colors.textMuted },
  progressBar: { height: 3, backgroundColor: colors.border, borderRadius: radius.full, marginTop: spacing.sm, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.primary, borderRadius: radius.full },
  badge: { borderRadius: radius.full, paddingHorizontal: 8, paddingVertical: 3 },
  badgePlanning: { backgroundColor: "#FEF3C7" },
  badgeDone: { backgroundColor: "#D1FAE5" },
  badgeText: { fontSize: 10, fontWeight: "700", textTransform: "uppercase", letterSpacing: 0.5 },
  badgeTextPlanning: { color: "#92400E" },
  badgeTextDone: { color: "#065F46" },
  empty: { alignItems: "center", paddingTop: spacing.xxl },
  emptyText: { fontSize: 16, fontWeight: "600", color: colors.textSecondary },
  emptySubtext: { fontSize: 13, color: colors.textMuted, marginTop: 6, textAlign: "center", paddingHorizontal: spacing.xl },
});
