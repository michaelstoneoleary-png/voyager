import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon } from 'leaflet';

// Fix for default marker icon
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

const DefaultIcon = new Icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});

export function WorldMap({ places = [] }: { places?: { lat: number; lng: number; name: string; date?: string }[] }) {
  return (
    <div className="h-full w-full rounded-lg overflow-hidden border border-border shadow-sm relative z-0">
      <MapContainer 
        center={[20, 0]} 
        zoom={2} 
        scrollWheelZoom={false} 
        style={{ height: "100%", width: "100%", zIndex: 0 }}
        attributionControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        />
        {places.map((place, idx) => (
          <CircleMarker 
            key={idx} 
            center={[place.lat, place.lng]}
            radius={6}
            pathOptions={{ 
              color: 'var(--primary)', 
              fillColor: 'var(--primary)', 
              fillOpacity: 0.6,
              weight: 1
            }}
          >
            <Popup>
              <div className="font-sans text-sm">
                <strong className="block text-primary">{place.name}</strong>
                {place.date && <span className="text-muted-foreground text-xs">{place.date}</span>}
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
