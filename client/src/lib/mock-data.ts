import { 
  Map, 
  Compass, 
  Luggage, 
  Info, 
  Calendar, 
  CloudSun, 
  Utensils, 
  Landmark,
  ShieldAlert,
  TrainFront
} from "lucide-react";

export const TRIP_DATA = {
  id: "trip-1",
  title: "Balkan Odyssey: Bulgaria & Serbia",
  dates: "Oct 12 - Oct 22, 2026",
  origin: "New York (JFK)",
  timeDifference: "+7h",
  status: "Upcoming",
  destinations: [
    {
      id: "dest-1",
      name: "Sofia, Bulgaria",
      days: 3,
      image: "https://images.unsplash.com/photo-1565099824688-e93eb20fe622?q=80&w=2071&auto=format&fit=crop",
      coordinates: { lat: 42.6977, lng: 23.3219 },
      highlights: ["Alexander Nevsky Cathedral", "Vitosha Mountain", "Boyana Church"]
    },
    {
      id: "dest-2",
      name: "Rila Monastery",
      days: 1,
      image: "https://images.unsplash.com/photo-1596705352014-41d1d86d525f?q=80&w=2070&auto=format&fit=crop",
      coordinates: { lat: 42.1354, lng: 23.3402 },
      highlights: ["Main Church", "Tower of Hrelyu", "Monastery Museum"]
    },
    {
      id: "dest-3",
      name: "Belgrade, Serbia",
      days: 4,
      image: "https://images.unsplash.com/photo-1574786729007-0b5336e4f16a?q=80&w=2070&auto=format&fit=crop",
      coordinates: { lat: 44.7866, lng: 20.4489 },
      highlights: ["Kalemegdan Fortress", "Skadarlija", "Saint Sava Temple"]
    },
    {
      id: "dest-4",
      name: "Novi Sad",
      days: 1,
      image: "https://images.unsplash.com/photo-1627377011953-3b6b6b7a5a5a?q=80&w=2070&auto=format&fit=crop",
      coordinates: { lat: 45.2671, lng: 19.8335 },
      highlights: ["Petrovaradin Fortress", "Danube Park", "Trg Slobode"]
    }
  ],
  itinerary: [
    {
      day: 1,
      date: "Oct 12",
      location: "Sofia",
      weather: { temp: 18, condition: "Sunny" },
      activities: [
        { time: "10:00", title: "Arrival & Check-in", type: "logistics" },
        { time: "13:00", title: "Alexander Nevsky Cathedral", type: "culture" },
        { time: "19:00", title: "Dinner at Rakia & Co", type: "food" }
      ]
    },
    {
      day: 2,
      date: "Oct 13",
      location: "Sofia",
      weather: { temp: 16, condition: "Cloudy" },
      activities: [
        { time: "09:00", title: "Boyana Church Tour", type: "culture" },
        { time: "14:00", title: "National History Museum", type: "culture" }
      ]
    }
  ],
  packingList: {
    clothing: [
      { item: "Light Jacket", reason: "Cool evenings (10-15°C)", packed: false },
      { item: "Walking Shoes", reason: "Cobblestone streets & fortress visits", packed: true },
      { item: "Scarf", reason: "Modesty for church visits", packed: false }
    ],
    electronics: [
      { item: "Type C/F Adapter", reason: "Bulgaria/Serbia standard", packed: true },
      { item: "Power Bank", reason: "Long day trips", packed: false }
    ],
    documents: [
      { item: "Passport", reason: "Border crossing required", packed: true },
      { item: "Travel Insurance", reason: "Medical coverage", packed: true }
    ]
  },
  intel: {
    currency: "BGN (Lev) & RSD (Dinar)",
    etiquette: [
      "Remove hats when entering Orthodox churches",
      "Tipping 10% is standard in restaurants",
      "Handshakes are firm; eye contact is important"
    ],
    safety: [
      "Watch for pickpockets in crowded tourist areas",
      "Taxi scams can occur at airports - use official apps"
    ],
    emergency: "112 for all emergencies in both countries"
  }
};
