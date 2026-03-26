import { useState } from "react";
import {
  View, Text, TouchableOpacity, StyleSheet, SafeAreaView,
  Platform, Linking,
} from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Location from "expo-location";
import { requestNotificationPermissions, registerPushToken } from "@/lib/notifications";
import { colors, spacing, radius, typography } from "@/constants/theme";

export const ONBOARDING_KEY = "voyager_onboarding_complete";

const STEPS = [
  {
    icon: "map" as const,
    color: colors.primary,
    title: "Welcome to Voyager",
    subtitle: "Your intelligent travel companion",
    body: "Voyager tracks your journeys, helps you plan, and remembers every adventure — automatically.",
    features: [
      { icon: "airplane-outline" as const, text: "Auto-detect when you travel" },
      { icon: "journal-outline" as const, text: "Capture daily travel memories" },
      { icon: "chatbubble-ellipses-outline" as const, text: "Marco journaling prompts at day's end" },
    ],
    cta: "Get Started",
    skip: false,
  },
  {
    icon: "location" as const,
    color: "#3B82F6",
    title: "Always-On Location",
    subtitle: "Required for Voyage detection",
    body: "Voyager needs \"Always\" location access to know when you leave home and automatically start logging a Voyage — even when the app is closed.",
    features: [
      { icon: "home-outline" as const, text: "Detects departure from your home address" },
      { icon: "navigate-outline" as const, text: "Tracks your current city while traveling" },
      { icon: "return-down-back-outline" as const, text: "Closes your Voyage when you return home" },
    ],
    cta: "Enable Location",
    skip: true,
    skipLabel: "Not now",
  },
  {
    icon: "notifications" as const,
    color: "#8B5CF6",
    title: "Evening Journal Prompts",
    subtitle: "Let Marco capture your day",
    body: "Each evening at 8pm while you're traveling, Marco will nudge you to journal your day. One tap opens a conversation — no blank page to stare at.",
    features: [
      { icon: "time-outline" as const, text: "Daily 8pm prompt while on a Voyage" },
      { icon: "pencil-outline" as const, text: "Marco asks the right questions" },
      { icon: "bookmark-outline" as const, text: "Memories saved forever in your Journey" },
    ],
    cta: "Enable Notifications",
    skip: true,
    skipLabel: "Skip for now",
  },
];

export default function PermissionsOnboarding() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const current = STEPS[step];

  const handleCta = async () => {
    setLoading(true);
    try {
      if (step === 1) {
        // Request foreground first, then background
        const { status: fg } = await Location.requestForegroundPermissionsAsync();
        if (fg === "granted") {
          await Location.requestBackgroundPermissionsAsync();
        }
      }
      if (step === 2) {
        const granted = await requestNotificationPermissions();
        if (granted) await registerPushToken();
      }
    } finally {
      setLoading(false);
    }
    advance();
  };

  const advance = async () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      await AsyncStorage.setItem(ONBOARDING_KEY, "true");
      router.replace("/(tabs)/journeys");
    }
  };

  const openSettings = () => Linking.openSettings();

  return (
    <SafeAreaView style={styles.safe}>
      {/* Progress dots */}
      <View style={styles.dots}>
        {STEPS.map((_, i) => (
          <View key={i} style={[styles.dot, i === step && styles.dotActive]} />
        ))}
      </View>

      <View style={styles.content}>
        {/* Icon */}
        <View style={[styles.iconCircle, { backgroundColor: `${current.color}18` }]}>
          <Ionicons name={current.icon} size={48} color={current.color} />
        </View>

        {/* Heading */}
        <Text style={styles.title}>{current.title}</Text>
        <Text style={styles.subtitle}>{current.subtitle}</Text>
        <Text style={styles.body}>{current.body}</Text>

        {/* Feature bullets */}
        <View style={styles.features}>
          {current.features.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: `${current.color}18` }]}>
                <Ionicons name={f.icon} size={16} color={current.color} />
              </View>
              <Text style={styles.featureText}>{f.text}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* CTAs */}
      <View style={styles.actions}>
        {step === 1 && (
          <TouchableOpacity style={styles.settingsHint} onPress={openSettings}>
            <Ionicons name="settings-outline" size={13} color={colors.textMuted} />
            <Text style={styles.settingsHintText}>
              Already denied? Open Settings → Privacy → Location Services → Voyager → Always
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.ctaBtn, { backgroundColor: current.color }, loading && styles.ctaBtnDisabled]}
          onPress={handleCta}
          disabled={loading}
        >
          <Text style={styles.ctaText}>{loading ? "…" : current.cta}</Text>
          {!loading && <Ionicons name="arrow-forward" size={16} color="#fff" />}
        </TouchableOpacity>

        {current.skip && (
          <TouchableOpacity style={styles.skipBtn} onPress={advance}>
            <Text style={styles.skipText}>{current.skipLabel}</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  dots: { flexDirection: "row", justifyContent: "center", gap: 6, paddingTop: spacing.lg },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.border },
  dotActive: { width: 20, backgroundColor: colors.primary },
  content: { flex: 1, paddingHorizontal: spacing.xl, paddingTop: spacing.xl, alignItems: "center" },
  iconCircle: { width: 96, height: 96, borderRadius: 48, alignItems: "center", justifyContent: "center", marginBottom: spacing.lg },
  title: { fontSize: 26, fontFamily: typography.serif, fontWeight: "700", color: colors.text, textAlign: "center", marginBottom: 6 },
  subtitle: { fontSize: 14, color: colors.primary, fontWeight: "600", textAlign: "center", marginBottom: spacing.md },
  body: { fontSize: 15, color: colors.textSecondary, textAlign: "center", lineHeight: 23, marginBottom: spacing.lg },
  features: { width: "100%", gap: spacing.sm },
  featureRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm, backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  featureIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  featureText: { flex: 1, fontSize: 14, color: colors.text },
  actions: { paddingHorizontal: spacing.xl, paddingBottom: 40, gap: spacing.sm },
  settingsHint: { flexDirection: "row", gap: 6, alignItems: "flex-start", backgroundColor: colors.surface, borderRadius: radius.sm, padding: spacing.sm },
  settingsHintText: { flex: 1, fontSize: 11, color: colors.textMuted, lineHeight: 16 },
  ctaBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.sm, padding: spacing.md, borderRadius: radius.md },
  ctaBtnDisabled: { opacity: 0.6 },
  ctaText: { fontSize: 16, fontWeight: "700", color: "#fff" },
  skipBtn: { alignItems: "center", padding: spacing.sm },
  skipText: { fontSize: 14, color: colors.textMuted },
});
