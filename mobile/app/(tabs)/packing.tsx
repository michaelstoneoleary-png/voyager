import { useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator, RefreshControl } from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Ionicons } from "@expo/vector-icons";
import { apiGet, apiPut } from "@/lib/api";
import { colors, spacing, radius, typography } from "@/constants/theme";

interface PackingItem {
  name: string;
  quantity: number;
  reason: string;
  packed: boolean;
  weight_grams?: number;
}

interface PackingCategory {
  name: string;
  icon: string;
  items: PackingItem[];
}

interface PackingList {
  id: string;
  destination: string;
  categories: PackingCategory[];
  journeyId?: string;
}

export default function PackingScreen() {
  const queryClient = useQueryClient();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const { data: list, isLoading, refetch, isRefetching } = useQuery<PackingList>({
    queryKey: ["packing-latest"],
    queryFn: () => apiGet("/api/packing-lists/latest"),
  });

  const saveMutation = useMutation({
    mutationFn: (categories: PackingCategory[]) =>
      apiPut(`/api/packing-lists/${list!.id}`, { categories }),
    onMutate: async (categories) => {
      await queryClient.cancelQueries({ queryKey: ["packing-latest"] });
      queryClient.setQueryData(["packing-latest"], (old: PackingList) => ({ ...old, categories }));
    },
  });

  const toggleItem = (catIndex: number, itemIndex: number) => {
    if (!list) return;
    const updated = list.categories.map((cat, ci) => ({
      ...cat,
      items: cat.items.map((item, ii) =>
        ci === catIndex && ii === itemIndex ? { ...item, packed: !item.packed } : item
      ),
    }));
    saveMutation.mutate(updated);
  };

  const toggleCategory = (name: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      next.has(name) ? next.delete(name) : next.add(name);
      return next;
    });
  };

  if (isLoading) {
    return <View style={styles.center}><ActivityIndicator color={colors.primary} size="large" /></View>;
  }

  if (!list?.categories?.length) {
    return (
      <View style={styles.center}>
        <Ionicons name="briefcase-outline" size={48} color={colors.textMuted} />
        <Text style={styles.emptyText}>No packing list yet</Text>
        <Text style={styles.emptySubtext}>Generate one from the Smart Pack page on web</Text>
      </View>
    );
  }

  const totalItems = list.categories.reduce((sum, c) => sum + c.items.length, 0);
  const packedItems = list.categories.reduce((sum, c) => sum + c.items.filter(i => i.packed).length, 0);
  const progress = totalItems > 0 ? packedItems / totalItems : 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Packing List</Text>
        {list.destination && <Text style={styles.destination}>{list.destination}</Text>}
        <View style={styles.progressRow}>
          <Text style={styles.progressText}>{packedItems}/{totalItems} packed</Text>
          <Text style={styles.progressPct}>{Math.round(progress * 100)}%</Text>
        </View>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
        </View>
      </View>

      <FlatList
        data={list.categories}
        keyExtractor={(c) => c.name}
        contentContainerStyle={styles.list}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={colors.primary} />}
        renderItem={({ item: category, index: catIndex }) => {
          const isExpanded = !expandedCategories.has(category.name);
          const catPacked = category.items.filter(i => i.packed).length;
          return (
            <View style={styles.category}>
              <TouchableOpacity style={styles.categoryHeader} onPress={() => toggleCategory(category.name)}>
                <View style={styles.categoryLeft}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryCount}>{catPacked}/{category.items.length}</Text>
                </View>
                <Ionicons name={isExpanded ? "chevron-up" : "chevron-down"} size={16} color={colors.textMuted} />
              </TouchableOpacity>
              {isExpanded && category.items.map((item, itemIndex) => (
                <TouchableOpacity
                  key={item.name}
                  style={styles.item}
                  onPress={() => toggleItem(catIndex, itemIndex)}
                  activeOpacity={0.6}
                >
                  <View style={[styles.checkbox, item.packed && styles.checkboxChecked]}>
                    {item.packed && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </View>
                  <View style={styles.itemContent}>
                    <Text style={[styles.itemName, item.packed && styles.itemNamePacked]}>
                      {item.quantity > 1 ? `${item.name} ×${item.quantity}` : item.name}
                    </Text>
                    {!item.packed && <Text style={styles.itemReason} numberOfLines={1}>{item.reason}</Text>}
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background, gap: spacing.sm },
  header: { paddingHorizontal: spacing.lg, paddingTop: 60, paddingBottom: spacing.md, backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.border },
  title: { fontSize: 22, fontFamily: typography.serif, fontWeight: "600", color: colors.text },
  destination: { fontSize: 13, color: colors.textSecondary, marginTop: 2, marginBottom: spacing.sm },
  progressRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  progressText: { fontSize: 13, color: colors.textSecondary },
  progressPct: { fontSize: 13, fontWeight: "600", color: colors.primary },
  progressBar: { height: 4, backgroundColor: colors.border, borderRadius: radius.full, overflow: "hidden" },
  progressFill: { height: "100%", backgroundColor: colors.primary, borderRadius: radius.full },
  list: { padding: spacing.md, gap: spacing.sm },
  category: { backgroundColor: colors.surface, borderRadius: radius.md, overflow: "hidden", shadowColor: "#000", shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  categoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", padding: spacing.md },
  categoryLeft: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  categoryName: { fontSize: 14, fontWeight: "700", color: colors.text },
  categoryCount: { fontSize: 12, color: colors.textMuted },
  item: { flexDirection: "row", alignItems: "center", paddingHorizontal: spacing.md, paddingVertical: 10, borderTopWidth: 1, borderTopColor: colors.border, gap: spacing.sm },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: colors.border, alignItems: "center", justifyContent: "center" },
  checkboxChecked: { backgroundColor: colors.primary, borderColor: colors.primary },
  itemContent: { flex: 1 },
  itemName: { fontSize: 14, color: colors.text },
  itemNamePacked: { color: colors.textMuted, textDecorationLine: "line-through" },
  itemReason: { fontSize: 11, color: colors.textMuted, marginTop: 1 },
  emptyText: { fontSize: 16, fontWeight: "600", color: colors.textSecondary },
  emptySubtext: { fontSize: 13, color: colors.textMuted, textAlign: "center", paddingHorizontal: spacing.xl },
});
