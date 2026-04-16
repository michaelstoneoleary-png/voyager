// Amadeus Hotel Pricing
// Sign up at developers.amadeus.com → Self-Service APIs → get API Key & Secret
// Test environment only has reliable data for LON and NYC.
// For full global coverage, apply for production access and set:
//   AMADEUS_API_BASE=https://api.amadeus.com

const BASE = process.env.AMADEUS_API_BASE ?? "https://test.api.amadeus.com";

interface TokenCache { token: string; expiresAt: number; }
let tokenCache: TokenCache | null = null;

async function getToken(): Promise<string | null> {
  const id = process.env.AMADEUS_CLIENT_ID;
  const secret = process.env.AMADEUS_CLIENT_SECRET;
  if (!id || !secret) return null;
  if (tokenCache && Date.now() < tokenCache.expiresAt - 60_000) return tokenCache.token;
  try {
    const res = await fetch(`${BASE}/v1/security/oauth2/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "client_credentials", client_id: id, client_secret: secret }).toString(),
    });
    if (!res.ok) return null;
    const data = await res.json();
    tokenCache = { token: data.access_token, expiresAt: Date.now() + (data.expires_in ?? 1799) * 1000 };
    return tokenCache.token;
  } catch { return null; }
}

async function findHotelId(name: string, lat: number, lng: number, token: string): Promise<string | null> {
  // 1. Name autocomplete
  try {
    const r = await fetch(
      `${BASE}/v1/reference-data/locations/hotel?keyword=${encodeURIComponent(name)}&subType=HOTEL_LEISURE&max=5`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (r.ok) {
      const { data = [] } = await r.json();
      const parts = name.toLowerCase().split(/\s+/).filter(p => p.length > 3);
      const match = (data as any[]).find(h => parts.some(p => h.name?.toLowerCase().includes(p)));
      if (match) return match.hotelId;
    }
  } catch {}

  // 2. Geocode fallback — find hotels within 500m and match by name
  try {
    const r = await fetch(
      `${BASE}/v1/reference-data/locations/hotels/by-geocode?latitude=${lat}&longitude=${lng}&radius=1&radiusUnit=KM&max=20`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (r.ok) {
      const { data = [] } = await r.json();
      const parts = name.toLowerCase().split(/\s+/).filter(p => p.length > 3);
      const match = (data as any[]).find(h => parts.some(p => h.name?.toLowerCase().includes(p)));
      if (match) return match.hotelId;
    }
  } catch {}

  return null;
}

async function getRatePerNight(hotelId: string, checkIn: string, checkOut: string, token: string): Promise<string | null> {
  try {
    const r = await fetch(
      `${BASE}/v3/shopping/hotel-offers?hotelIds=${hotelId}&checkInDate=${checkIn}&checkOutDate=${checkOut}&adults=1&roomQuantity=1&max=1`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!r.ok) return null;
    const { data = [] } = await r.json();
    const offer = data[0]?.offers?.[0];
    if (!offer?.price?.total) return null;
    const total = parseFloat(offer.price.total);
    const nights = Math.max(1, Math.round(
      (new Date(checkOut).getTime() - new Date(checkIn).getTime()) / 86_400_000
    ));
    const perNight = Math.round(total / nights);
    return offer.price.currency === "USD" ? `$${perNight}` : `${offer.price.currency} ${perNight}`;
  } catch { return null; }
}

export function amadeusEnabled(): boolean {
  return !!(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET);
}

export async function getLiveHotelPrice(
  hotel: { name: string; lat?: number; lng?: number },
  checkIn: string,
  checkOut: string,
): Promise<string | null> {
  if (!hotel.lat || !hotel.lng) return null;
  const token = await getToken();
  if (!token) return null;
  const hotelId = await findHotelId(hotel.name, hotel.lat, hotel.lng, token);
  if (!hotelId) return null;
  return getRatePerNight(hotelId, checkIn, checkOut, token);
}
