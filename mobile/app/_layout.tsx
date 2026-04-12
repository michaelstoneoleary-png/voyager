import { useEffect, useRef } from "react";
import { Alert } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthProvider, useAuth } from "@/lib/auth";
import { ONBOARDING_KEY } from "./onboarding/permissions";
import { setupNotificationHandler } from "@/lib/notifications";

// Catch unhandled JS errors in release builds and show them instead of crashing
// Remove this block once the startup crash is resolved
if (!__DEV__) {
  const utils = (global as any).ErrorUtils;
  if (utils) {
    utils.setGlobalHandler((error: Error, isFatal: boolean) => {
      Alert.alert(
        isFatal ? "Fatal JS Error" : "JS Error",
        (error?.message ?? "Unknown error") + "\n\n" + (error?.stack ?? "").slice(0, 600),
      );
    });
  }
}

const queryClient = new QueryClient();

function RootGuard() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  // Listen for notification taps and deep-link into chat
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);

  useEffect(() => {
    // Handle tap on a notification when app is already open
    notificationListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as any;
        if (data?.screen === "chat" && data?.prompt) {
          router.push({ pathname: "/(tabs)/chat", params: { prompt: data.prompt } });
        }
      }
    );
    return () => notificationListener.current?.remove();
  }, []);

  useEffect(() => {
    if (isLoading) return;

    const inAuth = segments[0] === "(auth)";
    const inOnboarding = segments[0] === "onboarding";

    if (!user && !inAuth) {
      router.replace("/(auth)/login");
      return;
    }

    if (user && inAuth) {
      // Check whether onboarding has been completed
      AsyncStorage.getItem(ONBOARDING_KEY).then((done) => {
        if (done) {
          router.replace("/(tabs)/journeys");
        } else {
          router.replace("/onboarding/permissions");
        }
      });
      return;
    }

    // If logged in but stuck on onboarding for a returning user, let them through
    if (user && !inOnboarding) {
      AsyncStorage.getItem(ONBOARDING_KEY).then((done) => {
        if (!done && !inOnboarding) {
          router.replace("/onboarding/permissions");
        }
      });
    }
  }, [user, isLoading, segments]);

  return null;
}

export default function RootLayout() {
  setupNotificationHandler();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <RootGuard />
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen
            name="journey/[id]"
            options={{ headerShown: true, headerTitle: "", headerBackTitle: "Back", headerTintColor: "#2D6A4F" }}
          />
          <Stack.Screen
            name="profile"
            options={{ headerShown: false, presentation: "modal" }}
          />
        </Stack>
      </AuthProvider>
    </QueryClientProvider>
  );
}
