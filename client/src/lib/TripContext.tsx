import React, { createContext, useContext, useState, ReactNode } from 'react';
import { TRIP_DATA } from './mock-data';
import kyotoImg from "@/assets/kyoto.png";
import tuscanyImg from "@/assets/tuscany.png";
import patagoniaImg from "@/assets/patagonia.png";
import heroTravel from "@/assets/hero-travel.png";

export type TripStatus = "Upcoming" | "Planning" | "Dreaming" | "Completed";

export interface Trip {
  id: string;
  title: string;
  dates: string;
  image: string;
  days: number;
  cost: string;
  progress: number;
  status: TripStatus;
  seasonality: {
    type: string;
    description: string;
    crowdLevel: string;
    weatherIcon: string;
  };
  priceAlert?: {
    status: string;
    amount: string;
    trend: "up" | "down" | "stable";
    currentPrice: string;
    recommendation: string;
  };
  logistics?: {
    visa: string;
    health: string;
  };
  destinations?: string[];
}

interface TripContextType {
  trips: Trip[];
  addTrip: (trip: Omit<Trip, 'id' | 'image' | 'progress' | 'seasonality' | 'priceAlert' | 'logistics'>) => void;
  deleteTrip: (id: string) => void;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

const INITIAL_TRIPS: Trip[] = [
  {
    id: "trip-1",
    title: "Balkan Odyssey",
    dates: "Oct 12 - Oct 22, 2026",
    image: heroTravel,
    days: 10,
    cost: "$1,850",
    progress: 85,
    status: "Upcoming",
    seasonality: {
      type: "Shoulder Season",
      description: "Great choice! October offers cooler temperatures and fewer crowds compared to summer. You'll catch the beautiful autumn foliage in the Rila mountains.",
      crowdLevel: "Low",
      weatherIcon: "🍂"
    },
    priceAlert: {
      status: "Price Drop",
      amount: "-$120",
      trend: "down",
      currentPrice: "$850 (Flights)",
      recommendation: "Book Now"
    },
    logistics: {
      visa: "Visa Free",
      health: "Standard"
    },
    destinations: ["Sofia", "Plovdiv", "Rila"]
  },
  {
    id: "trip-2",
    title: "Kyoto: Autumn Colors",
    dates: "Nov 15 - Nov 24, 2026",
    image: kyotoImg,
    days: 10,
    cost: "$3,200",
    progress: 30,
    status: "Planning",
    seasonality: {
      type: "Peak Season",
      description: "You are visiting during the famous Momiji (maple leaf) season. Expect heavy crowds at major temples, but the scenery will be breathtaking.",
      crowdLevel: "Very High",
      weatherIcon: "🍁"
    },
    priceAlert: {
      status: "Tracking",
      amount: "+$50",
      trend: "stable",
      currentPrice: "$1,200 (Flights)",
      recommendation: "Wait"
    },
    logistics: {
      visa: "e-Visa Required",
      health: "None"
    },
    destinations: ["Kyoto", "Osaka", "Nara"]
  },
  {
    id: "trip-3",
    title: "Tuscan Wine Tour",
    dates: "May 20 - May 30, 2027",
    image: tuscanyImg,
    days: 11,
    cost: "$4,500",
    progress: 10,
    status: "Dreaming",
    seasonality: {
      type: "Shoulder Season",
      description: "Late May is perfect. The rolling hills are vibrant green, poppies are in bloom, and it's warm enough for al fresco dining without the intense summer heat.",
      crowdLevel: "Moderate",
      weatherIcon: "🌤️"
    },
    priceAlert: {
      status: "High Demand",
      amount: "+$200",
      trend: "up",
      currentPrice: "$1,400 (Flights)",
      recommendation: "Book Soon"
    },
    logistics: {
      visa: "Schengen",
      health: "Standard"
    },
    destinations: ["Florence", "Siena", "Chianti"]
  },
  {
    id: "trip-4",
    title: "Patagonia Trek",
    dates: "Jan 10 - Jan 24, 2025",
    image: patagoniaImg,
    days: 14,
    cost: "$2,800",
    progress: 100,
    status: "Completed",
    seasonality: {
      type: "Peak Season",
      description: "January is peak summer in Patagonia, offering the best hiking weather but requiring bookings months in advance.",
      crowdLevel: "High",
      weatherIcon: "🏔️"
    },
    destinations: ["El Chalten", "Torres del Paine"]
  }
];

export function TripProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>(INITIAL_TRIPS);

  const addTrip = (newTripData: Omit<Trip, 'id' | 'image' | 'progress' | 'seasonality' | 'priceAlert' | 'logistics'>) => {
    const newTrip: Trip = {
      id: `trip-${Date.now()}`,
      ...newTripData,
      image: heroTravel, // Default image for now
      progress: 0,
      seasonality: {
        type: "Unknown Season",
        description: "We're analyzing the best time to visit based on your dates.",
        crowdLevel: "Moderate",
        weatherIcon: "🌤️"
      },
      // Optional fields initialized as undefined or defaults
    };
    
    setTrips(prev => [newTrip, ...prev]);
  };

  const deleteTrip = (id: string) => {
    setTrips(prev => prev.filter(t => t.id !== id));
  };

  return (
    <TripContext.Provider value={{ trips, addTrip, deleteTrip }}>
      {children}
    </TripContext.Provider>
  );
}

export function useTrips() {
  const context = useContext(TripContext);
  if (context === undefined) {
    throw new Error('useTrips must be used within a TripProvider');
  }
  return context;
}
