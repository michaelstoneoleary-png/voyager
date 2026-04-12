import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";
import { apiPost, apiGet } from "./api";
import {
  scheduleEveningJournalPrompt,
  cancelEveningJournalPrompts,
  scheduleWelcomeHomeJournalPrompt,
} from "./notifications";

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

// Register the background geofencing task — must run at module level so it is
// available before any background task fires, but wrap to avoid a startup crash
// if the native module isn't ready yet.
try { TaskManager.defineTask(VOYAGE_TASK, async ({ data, error }: any) => {
  if (error) {
    console.error("Voyage geofence error:", error);
    return;
  }

  const { eventType } = data;

  if (eventType === Location.GeofencingEventType.Exit) {
    // User has left home — open a new voyage on the server
    try {
      // Try to get a reverse-geocoded location name
      let locationName = "away from home";
      try {
        const [pos] = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        const [geo] = await Location.reverseGeocodeAsync({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
        if (geo) {
          locationName = geo.city || geo.region || geo.country || locationName;
        }
      } catch {}

      await apiPost("/api/voyages", {
        startLocation: locationName,
        currentLocation: locationName,
      });

      // Schedule 8pm journal prompt for every evening of the voyage
      await scheduleEveningJournalPrompt(locationName);
    } catch (err) {
      console.error("Failed to start voyage:", err);
    }
  }

  if (eventType === Location.GeofencingEventType.Enter) {
    // User has returned home — close the active voyage
    try {
      await apiPost("/api/voyages/close", {});
      await cancelEveningJournalPrompts();

      // Retrieve the just-closed voyage to get its location for the welcome home prompt
      const voyages = await apiGet<Voyage[]>("/api/voyages");
      const last = voyages.find(v => v.status === "completed");
      const location = last?.currentLocation ?? "your destination";
      await scheduleWelcomeHomeJournalPrompt(location);
    } catch (err) {
      console.error("Failed to close voyage:", err);
    }
  }
}); } catch (taskErr) { console.warn("TaskManager.defineTask failed:", taskErr); }

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
  if (isRegistered) {
    await Location.stopGeofencingAsync(VOYAGE_TASK);
    await cancelEveningJournalPrompts();
  }
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
