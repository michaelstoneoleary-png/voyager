import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';

export interface UserSettings {
  displayName: string;
  email: string;
  profileImageUrl: string;
  firstName: string;
  lastName: string;
  homeLocation: string;
  passportCountry: string;
  temperatureUnit: string;
  currency: string;
  distanceUnit: string;
  dateFormat: string;
  travelStyles: string[];
  onboardingCompleted: boolean;
  socialInstagram: string;
  socialBlogUrl: string;
  socialYoutube: string;
  socialTiktok: string;
  socialTwitter: string;
  publishBlog: boolean;
}

interface UserContextType {
  settings: UserSettings;
  isLoading: boolean;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  convertTemp: (celsius: number) => number;
  formatTemp: (celsius: number) => string;
}

const defaultSettings: UserSettings = {
  displayName: "",
  email: "",
  profileImageUrl: "",
  firstName: "",
  lastName: "",
  homeLocation: "",
  passportCountry: "",
  temperatureUnit: "F",
  currency: "USD",
  distanceUnit: "mi",
  dateFormat: "MM/DD/YYYY",
  travelStyles: [],
  onboardingCompleted: false,
  socialInstagram: "",
  socialBlogUrl: "",
  socialYoutube: "",
  socialTiktok: "",
  socialTwitter: "",
  publishBlog: false,
};

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();

  const { data: settings = defaultSettings, isLoading } = useQuery<UserSettings>({
    queryKey: ["/api/user-settings"],
    queryFn: async () => {
      const res = await fetch("/api/user-settings", { credentials: "include" });
      if (res.status === 401) {
        return defaultSettings;
      }
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return res.json();
    },
    retry: false,
  });

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    queryClient.setQueryData(["/api/user-settings"], (old: UserSettings) => ({
      ...(old || defaultSettings),
      ...newSettings,
    }));
  };

  const convertTemp = (celsius: number) => {
    if (settings.temperatureUnit === 'C') return celsius;
    return Math.round((celsius * 9/5) + 32);
  };

  const formatTemp = (celsius: number) => {
    const temp = convertTemp(celsius);
    return `${temp}°${settings.temperatureUnit}`;
  };

  return (
    <UserContext.Provider value={{ settings, isLoading, updateSettings, convertTemp, formatTemp }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
}
