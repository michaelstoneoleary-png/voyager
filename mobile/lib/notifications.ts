import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import Constants from "expo-constants";
import { Platform } from "react-native";
import { apiPost } from "./api";

// Configure how notifications appear when app is in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  if (!Device.isDevice) return false; // simulator — skip

  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;

  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

export async function getExpoPushToken(): Promise<string | null> {
  if (!Device.isDevice) return null;
  try {
    const projectId =
      Constants.expoConfig?.extra?.eas?.projectId ??
      Constants.easConfig?.projectId;
    const { data } = await Notifications.getExpoPushTokenAsync({ projectId });
    return data;
  } catch {
    return null;
  }
}

export async function registerPushToken(): Promise<void> {
  const token = await getExpoPushToken();
  if (!token) return;
  try {
    await apiPost("/api/push/register", { token, platform: Platform.OS });
  } catch (err) {
    console.warn("Could not register push token:", err);
  }
}

const JOURNAL_CHANNEL_ID = "evening-journal";

export async function scheduleEveningJournalPrompt(location: string): Promise<void> {
  // Cancel any previous journal prompts first
  await cancelEveningJournalPrompts();

  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(JOURNAL_CHANNEL_ID, {
      name: "Evening Journal",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }

  // Schedule for 8pm tonight (or 8pm every evening while the voyage is active)
  const now = new Date();
  const tonight8pm = new Date(now);
  tonight8pm.setHours(20, 0, 0, 0);
  // If it's already past 8pm, start tomorrow
  if (tonight8pm <= now) {
    tonight8pm.setDate(tonight8pm.getDate() + 1);
  }

  await Notifications.scheduleNotificationAsync({
    identifier: "evening-journal",
    content: {
      title: `How was your day in ${location}? ✍️`,
      body: "Tap to tell Marco about it and capture your memories.",
      data: {
        screen: "chat",
        prompt: `I just spent the day in ${location}. Help me journal it — ask me about highlights, food I tried, and anything surprising!`,
      },
      ...(Platform.OS === "android" && { channelId: JOURNAL_CHANNEL_ID }),
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DAILY,
      hour: 20,
      minute: 0,
    },
  });
}

export async function cancelEveningJournalPrompts(): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync("evening-journal").catch(() => {});
}

export async function scheduleWelcomeHomeJournalPrompt(location: string): Promise<void> {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: "Welcome home! 🏠",
      body: `Your voyage is saved. Want Marco to help you write up your trip to ${location}?`,
      data: {
        screen: "chat",
        prompt: `I just got back from a trip to ${location}. Help me write a travel journal entry covering the highlights, best meals, and memorable moments!`,
      },
    },
    trigger: null, // immediate
  });
}
