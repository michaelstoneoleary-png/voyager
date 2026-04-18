// Shared components and icons for Voyager redesign
const { useState, useEffect, useRef, useMemo } = React;

// ---- Icons (inline SVG, minimal) ----
const I = {
  compass: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><circle cx="12" cy="12" r="9"/><path d="M16 8l-2 6-6 2 2-6z"/></svg>,
  map: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M9 4l-6 2v14l6-2 6 2 6-2V4l-6 2-6-2zM9 4v14M15 6v14"/></svg>,
  spark: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M12 3v4M12 17v4M4 12h4M16 12h4M6 6l2.5 2.5M15.5 15.5L18 18M6 18l2.5-2.5M15.5 8.5L18 6"/></svg>,
  book: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M4 5a2 2 0 0 1 2-2h13v17H6a2 2 0 0 0-2 2V5z"/><path d="M8 7h7M8 11h7"/></svg>,
  globe: (p) => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3 3 3 15 0 18M12 3c-3 3-3 15 0 18"/></svg>,
  plus: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M12 5v14M5 12h14"/></svg>,
  arrow: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M5 12h14M13 6l6 6-6 6"/></svg>,
  pin: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M12 22s7-7.5 7-13a7 7 0 1 0-14 0c0 5.5 7 13 7 13z"/><circle cx="12" cy="9" r="2.5"/></svg>,
  plane: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M2 12l20-7-7 20-3-8-10-5z"/></svg>,
  cal: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 9h18M8 3v4M16 3v4"/></svg>,
  clock: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>,
  dollar: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M12 3v18M17 7H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H7"/></svg>,
  sun: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M4.5 4.5l2 2M17.5 17.5l2 2M4.5 19.5l2-2M17.5 6.5l2-2"/></svg>,
  star: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none" {...p}><path d="M12 3l2.6 6 6.4.5-5 4.2 1.6 6.3L12 16.5 6.4 20l1.6-6.3-5-4.2 6.4-.5z"/></svg>,
  search: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>,
  x: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>,
  sliders: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M4 7h10M18 7h2M4 12h4M12 12h8M4 17h14M20 17h0"/><circle cx="15" cy="7" r="2"/><circle cx="10" cy="12" r="2"/><circle cx="18" cy="17" r="2"/></svg>,
  heart: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.7A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/></svg>,
  walk: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><circle cx="13" cy="4" r="1.5"/><path d="M10 21l2-7-3-3v-3l3-2 3 4 3 1M7 13l3-2"/></svg>,
  coffee: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M3 10h14v5a5 5 0 0 1-10 0v-5zM17 11h2a2 2 0 0 1 0 4h-2M7 3v3M11 3v3M15 3v3"/></svg>,
  moon: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M20 14A8 8 0 1 1 10 4a6 6 0 0 0 10 10z"/></svg>,
  mountain: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M3 20l6-11 4 6 3-4 5 9H3z"/></svg>,
  leaf: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M4 20s0-8 6-14c6-6 12-2 12-2s0 10-6 14c-4 3-9 3-12 2zM4 20c3-5 7-8 12-10"/></svg>,
  wave: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M2 12c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 17c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 7c2-2 4-2 6 0s4 2 6 0 4-2 6 0"/></svg>,
  building: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><rect x="4" y="3" width="16" height="18"/><path d="M8 7v0M12 7v0M16 7v0M8 11v0M12 11v0M16 11v0M8 15v0M12 15v0M16 15v0"/></svg>,
  utensils: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M4 3v7a2 2 0 0 0 2 2v9M8 3v7a2 2 0 0 1-2 2M16 3c-2 0-4 3-4 6s2 4 4 4v8"/></svg>,
  camera: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><rect x="2" y="7" width="20" height="14" rx="2"/><circle cx="12" cy="14" r="4"/><path d="M8 7l2-3h4l2 3"/></svg>,
  train: (p) => <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><rect x="5" y="3" width="14" height="14" rx="2"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/><path d="M7 20l-2 2M17 20l2 2M5 10h14"/></svg>,
};

// ---- Places data (reused across screens) ----
const PLACES = [
  { id: "kyoto", title: "Kyoto", country: "Japan", img: "assets/kyoto.png", lat: 35.01, lng: 135.77, desc: "Lanterned alleys, temple dust, autumn maples at Eikandō.", season: "Oct — Nov", budget: "$$$", cat: "Culture", catIcon: "building" },
  { id: "patagonia", title: "Patagonia", country: "Argentina", img: "assets/patagonia.png", lat: -49.3, lng: -73, desc: "Glacial lakes under Fitz Roy. Wind that redraws you.", season: "Nov — Mar", budget: "$$$", cat: "Nature", catIcon: "mountain" },
  { id: "tuscany", title: "Val d'Orcia", country: "Italy", img: "assets/tuscany.png", lat: 43.05, lng: 11.6, desc: "Golden hour on cypress ridges. Slow suppers, slow drives.", season: "May — Oct", budget: "$$", cat: "Wellness", catIcon: "leaf" },
  { id: "plovdiv", title: "Plovdiv", country: "Bulgaria", img: "assets/plovdiv.png", lat: 42.15, lng: 24.75, desc: "Painted houses on Roman stones. Seventh-oldest city on Earth.", season: "Apr — Oct", budget: "$", cat: "Culture", catIcon: "building" },
  { id: "kotor", title: "Bay of Kotor", country: "Montenegro", img: "assets/kotor.png", lat: 42.42, lng: 18.77, desc: "Fjord-shaped, sun-warmed. Red roofs against grey limestone.", season: "May — Sep", budget: "$$", cat: "Coastal", catIcon: "wave" },
  { id: "meteora", title: "Meteora", country: "Greece", img: "assets/hero-travel.png", lat: 39.72, lng: 21.63, desc: "Monasteries stitched to rock. Silence broken only by wind.", season: "Apr — Oct", budget: "$$", cat: "Spiritual", catIcon: "mountain" },
  { id: "transylvania", title: "Transylvania", country: "Romania", img: "assets/transylvania.png", lat: 46.0, lng: 25.0, desc: "Painted monasteries, lonely castles, sheepdog country.", season: "Jun — Sep", budget: "$", cat: "Culture", catIcon: "moon" },
  { id: "rila", title: "Rila", country: "Bulgaria", img: "assets/rila-hike.png", lat: 42.13, lng: 23.54, desc: "Seven lakes above the tree line. A cold plunge at 2500m.", season: "Jul — Sep", budget: "$", cat: "Adventure", catIcon: "mountain" },
  { id: "albania", title: "Albanian Riviera", country: "Albania", img: "assets/albania.png", lat: 40.17, lng: 19.67, desc: "Ionian blue, empty coves, grilled fish and raki.", season: "Jun — Sep", budget: "$", cat: "Coastal", catIcon: "wave" },
];

// ---- Marco avatar ----
const Marco = ({ size = 36, pulse = false }) => (
  <div style={{
    width: size, height: size, borderRadius: "50%",
    background: "var(--forest)", color: "var(--cream)",
    display: "grid", placeItems: "center",
    fontFamily: "var(--serif)", fontStyle: "italic", fontWeight: 500,
    fontSize: size * 0.42, position: "relative", flexShrink: 0,
  }}>
    M
    {pulse && <span style={{
      position: "absolute", bottom: -1, right: -1,
      width: size * 0.28, height: size * 0.28, borderRadius: "50%",
      background: "#6db089", border: "2px solid var(--bg)",
      animation: "voyPulse 1.6s ease-in-out infinite",
    }}/>}
  </div>
);

// ---- Small composition helpers ----
const Eyebrow = ({ children, style }) => (
  <div className="eyebrow" style={{ color: "var(--ink-muted)", ...style }}>{children}</div>
);

const Divider = ({ label, align = "left", style }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 14, ...style }}>
    {align !== "left" && <div style={{ flex: 1, height: 1, background: "var(--rule)" }} />}
    {label && <span className="mono" style={{ color: "var(--ink-muted)" }}>{label}</span>}
    <div style={{ flex: 1, height: 1, background: "var(--rule)" }} />
  </div>
);

// ---- Image placeholder with asset fallback ----
const Img = ({ src, alt, style, className }) => {
  const [err, setErr] = useState(false);
  if (err || !src) {
    return (
      <div className={className} style={{
        background: "linear-gradient(135deg, var(--sand) 0%, var(--rule) 100%)",
        display: "grid", placeItems: "center", color: "var(--ink-muted)",
        fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase",
        ...style
      }}>
        {alt || "image"}
      </div>
    );
  }
  return <img src={src} alt={alt} className={className} style={style} onError={() => setErr(true)} loading="lazy" />;
};

// expose
Object.assign(window, { I, Marco, Eyebrow, Divider, Img, PLACES });

// Animations
const animStyle = document.createElement("style");
animStyle.textContent = `
  @keyframes voyPulse { 0%,100% { opacity: 0.8; transform: scale(1); } 50% { opacity: 0.3; transform: scale(1.4); } }
  @keyframes voyFade { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
  .voy-fade { animation: voyFade 0.5s ease-out both; }
  .voy-fade-1 { animation-delay: 0.05s; }
  .voy-fade-2 { animation-delay: 0.1s; }
  .voy-fade-3 { animation-delay: 0.15s; }
  .voy-fade-4 { animation-delay: 0.2s; }
`;
document.head.appendChild(animStyle);
