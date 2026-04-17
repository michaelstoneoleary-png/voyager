import { useEffect } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

interface Activity {
  time: string;
  title: string;
  type: string;
  duration?: string;
  lat?: number;
  lng?: number;
}

interface Hotel {
  name: string;
  price_per_night: string;
  rating: number;
  lat?: number;
  lng?: number;
}

export interface ActivityMarker {
  lat: number;
  lng: number;
  title: string;
  index: number;
  activity: Activity;
}

export interface HotelMarker {
  lat: number;
  lng: number;
  name: string;
  hotel: Hotel;
}

interface TripPlannerMapProps {
  center: [number, number];
  zoom: number;
  bounds: [number, number][];
  allMarkers: ActivityMarker[];
  hotelMarkers: HotelMarker[];
  selectedActivity: Activity | null;
  selectedHotel: Hotel | null;
  routePath: [number, number][];
  onSelectActivity: (a: Activity) => void;
  onSelectHotel: (h: Hotel) => void;
  locationLabel: string;
  dayNumber: number;
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, zoom, { duration: 0.8 });
  }, [center[0], center[1], zoom]);
  return null;
}

function FitBoundsView({ bounds }: { bounds: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (bounds.length > 1) {
      map.fitBounds(bounds as L.LatLngBoundsExpression, { padding: [48, 48], maxZoom: 14 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 14);
    }
  }, [bounds.map(b => `${b[0]},${b[1]}`).join("|")]);
  return null;
}

function createNumberedIcon(num: number, isSelected: boolean) {
  return L.divIcon({
    className: "custom-numbered-marker",
    html: `<div style="
      width: 28px; height: 28px; border-radius: 50%;
      background: ${isSelected ? "#7c3aed" : "#1e293b"};
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 12px; font-weight: 700; border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,${isSelected ? "0.4" : "0.2"});
      transform: ${isSelected ? "scale(1.3)" : "scale(1)"};
      transition: transform 0.2s, background 0.2s;
    ">${num}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16],
  });
}

function createHotelIcon(isSelected: boolean) {
  return L.divIcon({
    className: "custom-hotel-marker",
    html: `<div style="
      width: 30px; height: 30px; border-radius: 6px;
      background: ${isSelected ? "#d97706" : "#f59e0b"};
      color: white; display: flex; align-items: center; justify-content: center;
      font-size: 14px; border: 2px solid white;
      box-shadow: 0 2px 8px rgba(0,0,0,${isSelected ? "0.4" : "0.2"});
      transform: ${isSelected ? "scale(1.3)" : "scale(1)"};
      transition: transform 0.2s, background 0.2s;
    ">🏨</div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 15],
    popupAnchor: [0, -18],
  });
}

export default function TripPlannerMap({
  center,
  zoom,
  bounds,
  allMarkers,
  hotelMarkers,
  selectedActivity,
  selectedHotel,
  routePath,
  onSelectActivity,
  onSelectHotel,
  locationLabel,
  dayNumber,
}: TripPlannerMapProps) {
  return (
    <MapContainer center={center} zoom={13} scrollWheelZoom={true} className="h-full w-full z-0">
      {(selectedActivity?.lat || selectedHotel?.lat)
        ? <ChangeView center={center} zoom={zoom} />
        : <FitBoundsView bounds={bounds} />
      }
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
      {routePath.length > 1 && (
        <Polyline
          positions={routePath}
          pathOptions={{ color: "#7c3aed", weight: 3, opacity: 0.6, dashArray: "8, 8" }}
        />
      )}
      {allMarkers.map((m) => (
        <Marker
          key={m.index}
          position={[m.lat, m.lng]}
          icon={createNumberedIcon(m.index + 1, selectedActivity === m.activity)}
          eventHandlers={{ click: () => onSelectActivity(m.activity) }}
        >
          <Popup>
            <div style={{ fontFamily: "serif", fontWeight: "bold" }}>{m.index + 1}. {m.title}</div>
            <div style={{ fontSize: "12px", color: "#666" }}>{m.activity.time}{m.activity.duration ? ` (${m.activity.duration})` : ""}</div>
          </Popup>
        </Marker>
      ))}
      {hotelMarkers.map((m, idx) => (
        <Marker
          key={`hotel-${idx}`}
          position={[m.lat, m.lng]}
          icon={createHotelIcon(selectedHotel === m.hotel)}
          eventHandlers={{ click: () => onSelectHotel(m.hotel) }}
        >
          <Popup>
            <div style={{ fontFamily: "serif", fontWeight: "bold" }}>{m.name}</div>
            <div style={{ fontSize: "12px", color: "#666" }}>{m.hotel.price_per_night}/night • ⭐ {m.hotel.rating}</div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
