import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  Alert, ActivityIndicator, ScrollView,
} from "react-native";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { apiGet, apiPut } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { colors, spacing, radius, typography } from "@/constants/theme";

interface UserSettings {
  displayName: string;
  email: string;
  firstName: string;
  lastName: string;
  homeLocation: string;
  temperatureUnit: string;
  distanceUnit: string;
}

export default function ProfileScreen() {
  const { logout } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<UserSettings>({
    queryKey: ["userSettings"],
    queryFn: () => apiGet("/api/user-settings"),
  });

  const [homeLocation, setHomeLocation] = useState("");
  const [editingHome, setEditingHome] = useState(false);

  const updateMutation = useMutation({
    mutationFn: (updates: Partial<UserSettings>) => apiPut("/api/user-settings", updates),
    onSuccess: (updated) => {
      queryClient.setQueryData(["userSettings"], updated);
      // Keep voyages query fresh so the detection toggle picks up new homeLocation
      queryClient.invalidateQueries({ queryKey: ["userSettings"] });
      setEditingHome(false);
    },
    onError: () => Alert.alert("Error", "Failed to save. Please try again."),
  });

  const handleSaveHome = () => {
    const trimmed = homeLocation.trim();
    if (!trimmed) return;
    updateMutation.mutate({ homeLocation: trimmed });
  };

  const handleLogout = () => {
    Alert.alert("Sign out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/(auth)/login");
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  const initials = (
    settings?.firstName?.[0] ?? settings?.displayName?.[0] ?? "?"
  ).toUpperCase();

  const fullName =
    settings?.displayName ||
    `${settings?.firstName ?? ""} ${settings?.lastName ?? ""}`.trim() ||
    "Traveler";

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Avatar + name */}
      <View style={styles.hero}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <Text style={styles.name}>{fullName}</Text>
        <Text style={styles.email}>{settings?.email}</Text>
      </View>

      {/* Home location — critical for Voyage detection */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Home Location</Text>
        <Text style={styles.cardDesc}>
          Required for Voyage auto-detection — Voyager watches for when you travel more than 50 miles from here.
        </Text>
        {editingHome ? (
          <View style={styles.editRow}>
            <TextInput
              style={styles.textInput}
              value={homeLocation}
              onChangeText={setHomeLocation}
              placeholder="e.g. Brooklyn, NY"
              placeholderTextColor={colors.textMuted}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleSaveHome}
            />
            <TouchableOpacity
              style={[styles.saveBtn, updateMutation.isPending && styles.saveBtnDisabled]}
              onPress={handleSaveHome}
              disabled={updateMutation.isPending || !homeLocation.trim()}
            >
              {updateMutation.isPending ? (
                <ActivityIndicator color="#fff" size="small" />
              ) : (
                <Text style={styles.saveBtnText}>Save</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setEditingHome(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.locationRow}
            onPress={() => {
              setHomeLocation(settings?.homeLocation ?? "");
              setEditingHome(true);
            }}
          >
            <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
            <Text
              style={[
                styles.locationText,
                !settings?.homeLocation && styles.locationPlaceholder,
              ]}
            >
              {settings?.homeLocation || "Tap to set home location"}
            </Text>
            <Ionicons name="pencil-outline" size={14} color={colors.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Preferences (read-only — edit on web) */}
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Preferences</Text>
        <View style={styles.prefRow}>
          <Text style={styles.prefKey}>Temperature</Text>
          <Text style={styles.prefVal}>
            {settings?.temperatureUnit === "C" ? "Celsius (°C)" : "Fahrenheit (°F)"}
          </Text>
        </View>
        <View style={[styles.prefRow, styles.prefRowLast]}>
          <Text style={styles.prefKey}>Distance</Text>
          <Text style={styles.prefVal}>
            {settings?.distanceUnit === "km" ? "Kilometres" : "Miles"}
          </Text>
        </View>
        <Text style={styles.prefHint}>
          Change these at bonvoyager.ai → Settings
        </Text>
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleLogout}>
        <Ionicons name="log-out-outline" size={20} color={colors.error} />
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingBottom: 48 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.background },

  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingTop: 60,
    paddingBottom: spacing.md,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: { width: 40 },
  headerTitle: { fontSize: 17, fontWeight: "600", color: colors.text },
  headerRight: { width: 40 },

  hero: {
    alignItems: "center",
    paddingVertical: spacing.xl,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: colors.primary,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: spacing.sm,
  },
  avatarText: { fontSize: 28, color: "#fff", fontWeight: "700" },
  name: { fontSize: 18, fontFamily: typography.serif, fontWeight: "600", color: colors.text },
  email: { fontSize: 13, color: colors.textSecondary, marginTop: 2 },

  card: {
    margin: spacing.md,
    marginBottom: 0,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  cardLabel: {
    fontSize: 11,
    fontWeight: "700",
    color: colors.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: spacing.xs,
  },
  cardDesc: {
    fontSize: 12,
    color: colors.textMuted,
    lineHeight: 17,
    marginBottom: spacing.sm,
  },

  editRow: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.xs },
  textInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 8,
    fontSize: 14,
    color: colors.text,
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    justifyContent: "center",
    alignItems: "center",
    minWidth: 52,
  },
  saveBtnDisabled: { opacity: 0.5 },
  saveBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  cancelBtn: { justifyContent: "center" },
  cancelBtnText: { fontSize: 14, color: colors.textSecondary },

  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  locationText: { flex: 1, fontSize: 14, color: colors.text },
  locationPlaceholder: { color: colors.textMuted },

  prefRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  prefRowLast: { borderBottomWidth: 0 },
  prefKey: { fontSize: 14, color: colors.text },
  prefVal: { fontSize: 14, color: colors.textSecondary },
  prefHint: { fontSize: 11, color: colors.textMuted, marginTop: spacing.xs },

  signOutBtn: {
    margin: spacing.md,
    marginTop: spacing.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.error,
  },
  signOutText: { fontSize: 15, fontWeight: "600", color: colors.error },
});
