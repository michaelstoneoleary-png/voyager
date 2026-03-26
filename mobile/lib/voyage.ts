import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import * as Notifications from "expo-notifications";
import { apiPost, apiGet } from "./api";

export const VOYAGE_TASK = "VOYAGE_GEOFENCE_TASK";
export const DEFAULT_RADIUS_MILES = 50;
const MILES_TO_METERS = 1609.34;

export interface Voyage {
  id: string;
  userId: string;
  startedAt: string;
  endedAt?: string;
  startLocation: string;
  currentLocation?: string;
  distanceMiles?: number;
  notes?: string;
  status: "active" | "completed";
}

// Register the background geofencing task
TaskManager.defineTask(VOYAGE_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error("Voyage geofence error:", error);
    return;
  }

  const { eventType, region } = data;

  if (eventType === Location.GeofencingEventType.Exit) {
    // User has left home — start a voyage
    try {
      await apiPost("/api/voyages", {
        trigger: "geofence_exit",
        regionIdentifier: region.identifier,
      });
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Voyage started! ✈️",
          body: "You've left home — Voyager is logging your trip.",
        },
        trigger: null,
      });
    } catch (err) {
      console.error("Failed to start voyage:", err);
    }
  }

  if (eventType === Location.GeofencingEventType.Enter) {
    // User has returned home — close the voyage
    try {
      await apiPost("/api/voyages/close", {
        trigger: "geofence_enter",
        regionIdentifier: region.identifier,
      });
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Welcome home! 🏠",
          body: "Your voyage has been saved. Want Marco to write it up?",
        },
        trigger: null,
      });
    } catch (err) {
      console.error("Failed to close voyage:", err);
    }
  }
});

export async function requestLocationPermissions(): Promise<boolean> {
  const { status: foreground } = await Location.requestForegroundPermissionsAsync();
  if (foreground !== "granted") return false;
  const { status: background } = await Location.requestBackgroundPermissionsAsync();
  return background === "granted";
}

export async function startVoyageDetection(
  homeLocation: { latitude: number; longitude: number },
  radiusMiles: number = DEFAULT_RADIUS_MILES
): Promise<boolean> {
  const hasPermission = await requestLocationPermissions();
  if (!hasPermission) return false;

  await Location.startGeofencingAsync(VOYAGE_TASK, [
    {
      identifier: "home",
      latitude: homeLocation.latitude,
      longitude: homeLocation.longitude,
      radius: radiusMiles * MILES_TO_METERS,
      notifyOnEnter: true,
      notifyOnExit: true,
    },
  ]);
  return true;
}

export async function stopVoyageDetection(): Promise<void> {
  const isRegistered = await TaskManager.isTaskRegisteredAsync(VOYAGE_TASK);
  if (isRegistered) await Location.stopGeofencingAsync(VOYAGE_TASK);
}

export async function isVoyageDetectionActive(): Promise<boolean> {
  return TaskManager.isTaskRegisteredAsync(VOYAGE_TASK);
}

export async function geocodeHomeLocation(address: string): Promise<{ latitude: number; longitude: number } | null> {
  const results = await Location.geocodeAsync(address);
  if (!results.length) return null;
  return { latitude: results[0].latitude, longitude: results[0].longitude };
}

export async function getVoyages(): Promise<Voyage[]> {
  return apiGet<Voyage[]>("/api/voyages");
}
