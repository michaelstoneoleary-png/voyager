import React, { createContext, useContext, useState, useEffect } from 'react';

type TemperatureUnit = 'C' | 'F';

interface UserSettings {
  temperatureUnit: TemperatureUnit;
}

interface UserContextType {
  settings: UserSettings;
  updateSettings: (newSettings: Partial<UserSettings>) => void;
  convertTemp: (celsius: number) => number;
  formatTemp: (celsius: number) => string;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<UserSettings>({
    temperatureUnit: 'F', // Default for Jennifer (US)
  });

  const updateSettings = (newSettings: Partial<UserSettings>) => {
    setSettings(prev => ({ ...prev, ...newSettings }));
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
    <UserContext.Provider value={{ settings, updateSettings, convertTemp, formatTemp }}>
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
