import React, { createContext, useContext, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { isUnauthorizedError } from '@/lib/auth-utils';
import { useToast } from '@/hooks/use-toast';

export type TripStatus = "Upcoming" | "Planning" | "Dreaming" | "Completed";

export interface Trip {
  id: string;
  title: string;
  dates: string;
  image: string | null;
  days: number;
  cost: string;
  progress: number;
  status: string;
  seasonality: {
    type: string;
    description: string;
    crowdLevel: string;
    weatherIcon: string;
  } | null;
  priceAlert?: {
    status: string;
    amount: string;
    trend: "up" | "down" | "stable";
    currentPrice: string;
    recommendation: string;
  } | null;
  logistics?: {
    visa: string;
    health: string;
  } | null;
  destinations?: string[] | null;
}

interface TripContextType {
  trips: Trip[];
  addTrip: (trip: Omit<Trip, 'id' | 'image' | 'progress' | 'seasonality' | 'priceAlert' | 'logistics'>, onSuccess?: (journey: Trip) => void) => void;
  deleteTrip: (id: string) => void;
  isLoading: boolean;
}

const TripContext = createContext<TripContextType | undefined>(undefined);

export function TripProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: trips = [], isLoading } = useQuery<Trip[]>({
    queryKey: ["/api/journeys"],
    queryFn: async () => {
      const res = await fetch("/api/journeys", { credentials: "include" });
      if (res.status === 401) {
        throw new Error("401: Unauthorized");
      }
      if (!res.ok) {
        throw new Error(`${res.status}: ${res.statusText}`);
      }
      return res.json();
    },
    retry: false,
  });

  const addMutation = useMutation({
    mutationFn: async (tripData: Omit<Trip, 'id' | 'image' | 'progress' | 'seasonality' | 'priceAlert' | 'logistics'>) => {
      const res = await apiRequest("POST", "/api/journeys", {
        title: tripData.title,
        dates: tripData.dates,
        days: tripData.days,
        cost: tripData.cost,
        status: tripData.status || "Planning",
        destinations: tripData.destinations || [],
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journeys"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Please log in again.",
          variant: "destructive",
        });
        window.location.href = "/api/login";
        return;
      }
      toast({
        title: "Error",
        description: "Failed to create journey.",
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/journeys/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/journeys"] });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Session expired",
          description: "Please log in again.",
          variant: "destructive",
        });
        window.location.href = "/api/login";
        return;
      }
      toast({
        title: "Error",
        description: "Failed to delete journey.",
        variant: "destructive",
      });
    },
  });

  const addTrip = (tripData: Omit<Trip, 'id' | 'image' | 'progress' | 'seasonality' | 'priceAlert' | 'logistics'>, onSuccess?: (journey: Trip) => void) => {
    addMutation.mutate(tripData, {
      onSuccess: (data) => {
        if (onSuccess) onSuccess(data);
      }
    });
  };

  const deleteTrip = (id: string) => {
    deleteMutation.mutate(id);
  };

  return (
    <TripContext.Provider value={{ trips, addTrip, deleteTrip, isLoading }}>
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
