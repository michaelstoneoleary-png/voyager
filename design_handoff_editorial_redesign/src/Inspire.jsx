// Inspire — dream voyage discovery, editorial-magazine layout
const { useState: useStateI } = React;

function Inspire({ go, tweaks }) {
  const [hovered, setHovered] = useStateI(null);
  const [filter, setFilter] = useStateI("all");

  const CATS = [
    { id: "all", label: "Everywhere" },
    { id: "Nature", label: "Wilder places" },
    { id: "Culture", label: "Old cities" },
    { id: "Coastal", label: "By the water" },
    { id: "Adventure", label: "Harder country" },
  ];

  const places = filter === "all" ? PLACES : PLACES.filter(p => p.cat === filter);

  // Hero picks — the "editor's three"
  const featured = [PLACES[0], PLACES[1], PLACES[2]];
  const rest = PLACES.slice(3);

  return (
    <div style={{ padding: "48px 56px 100px", maxWidth: 1340, margin: "0 auto" }}>

      {/* Masthead */}
      <div className="voy-fade">
        <div className="mono" style={{ color: "var(--ink-muted)", marginBottom: 14 }}>Inspire · the discovery desk</div>
        <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 60, alignItems: "end" }}>
          <h1 style={{ fontSize: "clamp(64px, 10vw, 140px)", lineHeight: 0.9, letterSpacing: "-0.04em", fontWeight: 400 }}>
            Where,<br/><span style={{ fontStyle: "italic", color: "var(--accent)" }}>exactly,</span><br/>are we going?
          </h1>
          <p style={{ fontFamily: "var(--serif)", fontSize: 19, lineHeight: 1.45, color: "var(--ink-soft)", maxWidth: 420, fontWeight: 400, fontStyle: "italic" }}>
            Marco has read your last eleven trips and the things you said you'd return for. Here are nine places he thinks you're ready for — sorted by the time of year that flatters them most.
          </p>
        </div>
      </div>

      <hr className="rule" style={{ margin: "48px 0 36px" }}/>

      {/* Filter tabs + Marco quick-brief */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, marginBottom: 48, flexWrap: "wrap" }}>
        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
          {CATS.map(c => (
            <button key={c.id} onClick={() => setFilter(c.id)}
              className="btn"
              style={{
                padding: "8px 16px",
                fontSize: 13,
                background: filter === c.id ? "var(--ink)" : "transparent",
                color: filter === c.id ? "var(--cream)" : "var(--ink-soft)",
                border: filter === c.id ? "1px solid var(--ink)" : "1px solid var(--rule)",
              }}>
              {c.label}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10, color: "var(--ink-muted)", fontSize: 13 }}>
          <Marco size={26}/>
          <span>Tell Marco what you're after —</span>
          <button className="btn btn-ghost" style={{ padding: "6px 14px", fontSize: 12 }}>
            Quick brief <I.arrow/>
          </button>
        </div>
      </div>

      {/* Featured triptych — magazine top-of-issue */}
      <div className="voy-fade voy-fade-1" style={{
        display: "grid",
        gridTemplateColumns: "2fr 1fr 1fr",
        gridTemplateRows: "auto auto",
        gap: 28,
        marginBottom: 72,
      }}>
        {/* Lead — large */}
        <FeaturedLead place={featured[0]} go={go} big/>
        <FeaturedLead place={featured[1]} go={go}/>
        <FeaturedLead place={featured[2]} go={go}/>
      </div>

      {/* Secondary run */}
      <Eyebrow style={{ marginBottom: 20 }}>The rest of the dispatch · nine picks</Eyebrow>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 40, rowGap: 56 }}>
        {places.filter(p => !featured.includes(p)).map((p, i) => (
          <PlaceCard key={p.id} place={p} n={i + 4} onClick={() => go("planner")}
            onHover={setHovered} hovered={hovered === p.id}/>
        ))}
      </div>

      {/* Serendipity */}
      <div style={{
        marginTop: 80, padding: "48px 56px",
        background: "var(--ink)", color: "var(--cream)",
        borderRadius: 4,
        display: "grid", gridTemplateColumns: "1fr auto", gap: 40, alignItems: "center",
      }}>
        <div>
          <div className="mono" style={{ color: "rgba(250,246,235,0.6)", marginBottom: 12 }}>Serendipity engine</div>
          <h2 style={{ fontSize: 48, fontWeight: 400, letterSpacing: "-0.03em" }}>
            Shuffle me somewhere <em>unexpected.</em>
          </h2>
          <p style={{ maxWidth: 540, color: "rgba(250,246,235,0.75)", fontFamily: "var(--serif)", fontSize: 17, marginTop: 8 }}>
            One weekend, one constraint, one place you'd never have thought of. Marco picks blind.
          </p>
        </div>
        <button className="btn" style={{ background: "var(--cream)", color: "var(--ink)", padding: "14px 22px", fontSize: 14 }}>
          Surprise me <I.arrow/>
        </button>
      </div>
    </div>
  );
}

// Magazine-style feature tile — either "big" lead or secondary
function FeaturedLead({ place, go, big }) {
  return (
    <button
      onClick={() => go("planner")}
      style={{
        all: "unset", cursor: "pointer",
        display: "block", position: "relative",
        gridRow: big ? "1 / 3" : "auto",
        height: big ? 620 : 296,
        overflow: "hidden", borderRadius: 4,
      }}
    >
      <Img src={place.img} alt={place.title} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }}/>
      <div style={{
        position: "absolute", inset: 0,
        background: "linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 45%, rgba(0,0,0,0.7) 100%)",
      }}/>
      {/* top-right: editor's pick */}
      <div style={{ position: "absolute", top: 18, right: 18, background: "rgba(255,255,255,0.9)", padding: "4px 10px", borderRadius: 2 }}>
        <span className="mono" style={{ color: "var(--ink)" }}>{big ? "Lead story" : "Editor's pick"}</span>
      </div>
      {/* bottom caption */}
      <div style={{ position: "absolute", bottom: big ? 32 : 20, left: big ? 32 : 20, right: 20, color: "#fff" }}>
        <div className="mono" style={{ color: "rgba(255,255,255,0.8)", marginBottom: 6 }}>{place.country} · {place.season}</div>
        <h3 style={{ fontSize: big ? 56 : 32, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 0.95, marginBottom: big ? 10 : 6 }}>
          {place.title}
        </h3>
        {big && (
          <p style={{ fontFamily: "var(--serif)", fontSize: 18, fontStyle: "italic", maxWidth: 500, lineHeight: 1.4, color: "rgba(255,255,255,0.92)", margin: 0 }}>
            {place.desc}
          </p>
        )}
      </div>
    </button>
  );
}

// Smaller cards in the run
function PlaceCard({ place, n, onClick, onHover, hovered }) {
  const IconCmp = I[place.catIcon];
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => onHover(place.id)}
      onMouseLeave={() => onHover(null)}
      style={{ cursor: "pointer" }}
    >
      <div style={{ position: "relative", aspectRatio: "4/5", overflow: "hidden", marginBottom: 16 }}>
        <Img src={place.img} alt={place.title} style={{
          width: "100%", height: "100%", objectFit: "cover",
          transform: hovered ? "scale(1.04)" : "scale(1)", transition: "transform 0.8s ease",
        }}/>
        {/* top-left number */}
        <div style={{ position: "absolute", top: 14, left: 14, color: "#fff", display: "flex", alignItems: "center", gap: 8 }}>
          <span className="mono" style={{ color: "rgba(255,255,255,0.85)" }}>№{n.toString().padStart(2, "0")}</span>
        </div>
        {/* bottom category */}
        <div style={{ position: "absolute", bottom: 14, left: 14, display: "flex", alignItems: "center", gap: 6, color: "rgba(255,255,255,0.92)" }}>
          {IconCmp && <IconCmp/>}
          <span className="mono">{place.cat}</span>
        </div>
      </div>
      <div>
        <div className="mono" style={{ color: "var(--ink-muted)", marginBottom: 6 }}>{place.country}</div>
        <h3 style={{ fontSize: 28, fontWeight: 500, letterSpacing: "-0.025em", lineHeight: 1.05, marginBottom: 8 }}>
          {place.title}
        </h3>
        <p style={{ fontFamily: "var(--serif)", fontSize: 15, fontStyle: "italic", color: "var(--ink-soft)", lineHeight: 1.45, margin: 0, marginBottom: 12 }}>
          {place.desc}
        </p>
        <div style={{ display: "flex", gap: 14, color: "var(--ink-muted)", fontSize: 12, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          <span>{place.season}</span>
          <span style={{ color: "var(--rule)" }}>·</span>
          <span>{place.budget}</span>
        </div>
      </div>
    </div>
  );
}

window.Inspire = Inspire;
