// Past Journeys — The Atlas: an editorial archive
function Past({ go, tweaks }) {
  const trips = [
    { year: "2026", title: "Iceland ring road", dates: "Jun 12 — Jun 26", days: 14, country: "Iceland", img: "assets/patagonia.png", note: "Fourteen waterfalls in twelve days. Slept with the sun up.", rating: 5 },
    { year: "2025", title: "Kyoto for maples", dates: "Nov 03 — Nov 15", days: 12, country: "Japan", img: "assets/kyoto.png", note: "Eikandō at dusk made me briefly religious.", rating: 5 },
    { year: "2025", title: "Croatian coast", dates: "Jul 18 — Jul 30", days: 12, country: "Croatia", img: "assets/kotor.png", note: "Sailed Split to Dubrovnik. Never again in July.", rating: 4 },
    { year: "2024", title: "Tuscany anniversary", dates: "May 08 — May 18", days: 10, country: "Italy", img: "assets/tuscany.png", note: "Slow food, slow cars, faster memories.", rating: 5 },
    { year: "2024", title: "Patagonia self-drive", dates: "Feb 02 — Feb 20", days: 18, country: "Argentina", img: "assets/patagonia.png", note: "Wind everything. Glacier day worth the whole trip.", rating: 5 },
    { year: "2023", title: "Transylvania autumn", dates: "Oct 10 — Oct 22", days: 12, country: "Romania", img: "assets/transylvania.png", note: "Painted monasteries of Bucovina — ask me about Voroneț blue.", rating: 4 },
  ];

  const stats = [
    { n: "23", l: "countries" },
    { n: "47", l: "cities" },
    { n: "312", l: "days abroad" },
    { n: "6", l: "continents" },
    { n: "41k", l: "miles" },
    { n: "11", l: "years logged" },
  ];

  return (
    <div style={{ padding: "48px 56px 100px", maxWidth: 1340, margin: "0 auto" }}>

      {/* Masthead */}
      <div className="voy-fade">
        <div className="mono" style={{ color: "var(--ink-muted)", marginBottom: 14 }}>The Atlas · everywhere you've been</div>
        <h1 style={{ fontSize: "clamp(72px, 11vw, 160px)", lineHeight: 0.88, letterSpacing: "-0.045em", fontWeight: 400 }}>
          Twenty-three<br/>
          <em style={{ color: "var(--accent)", fontStyle: "italic", fontWeight: 400 }}>countries,</em>
          <span style={{ fontFamily: "var(--serif)", fontSize: "0.3em", verticalAlign: "super", color: "var(--ink-muted)", marginLeft: 8 }}>so far</span>
        </h1>
      </div>

      <hr className="rule" style={{ margin: "52px 0 40px" }}/>

      {/* Stats band */}
      <div className="voy-fade voy-fade-1" style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: 24, marginBottom: 72 }}>
        {stats.map(s => (
          <div key={s.l} style={{ borderTop: "1px solid var(--ink)", paddingTop: 12 }}>
            <div style={{ fontFamily: "var(--serif)", fontSize: 64, fontWeight: 500, lineHeight: 1, letterSpacing: "-0.045em" }}>{s.n}</div>
            <div className="mono" style={{ color: "var(--ink-muted)", marginTop: 6 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {/* The world, plotted */}
      <div className="voy-fade voy-fade-2" style={{ display: "grid", gridTemplateColumns: "1fr 0.6fr", gap: 40, marginBottom: 80, alignItems: "start" }}>
        <div style={{ background: "var(--sand)", borderRadius: 2, overflow: "hidden", border: "1px solid var(--rule)" }}>
          <div style={{ padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
            <span className="mono" style={{ color: "var(--ink-soft)" }}>World plot · 2014 — 2026</span>
            <span className="mono" style={{ color: "var(--ink-muted)" }}>47 pins</span>
          </div>
          <WorldPlot/>
        </div>

        {/* Reading list — by continent */}
        <div>
          <Eyebrow style={{ marginBottom: 20 }}>By the continent</Eyebrow>
          {[
            { c: "Europe", n: 14, pct: 70 },
            { c: "Asia", n: 6, pct: 30 },
            { c: "South America", n: 2, pct: 10 },
            { c: "North America", n: 12, pct: 60 },
            { c: "Africa", n: 2, pct: 10 },
            { c: "Oceania", n: 1, pct: 5 },
            { c: "Antarctica", n: 0, pct: 0 },
          ].map((r, i) => (
            <div key={r.c} style={{ padding: "14px 0", borderBottom: "1px solid var(--rule-soft)", display: "grid", gridTemplateColumns: "1fr 100px auto", gap: 14, alignItems: "center" }}>
              <span style={{ fontSize: 14, fontWeight: 450 }}>{r.c}</span>
              <div style={{ height: 3, background: "var(--rule)", position: "relative" }}>
                <div style={{ position: "absolute", inset: "0 auto 0 0", width: `${r.pct}%`, background: r.n > 0 ? "var(--forest)" : "transparent" }}/>
              </div>
              <span className="mono" style={{ color: "var(--ink-muted)", minWidth: 40, textAlign: "right" }}>{r.n}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Archive — grid of trips */}
      <Divider label="The archive · most recent first" style={{ marginBottom: 40 }}/>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 36, rowGap: 56 }}>
        {trips.map((t, i) => (
          <div key={i} className="voy-fade" style={{ animationDelay: `${0.05 + i * 0.04}s` }}>
            {/* Image */}
            <div style={{ position: "relative", aspectRatio: "4/3", overflow: "hidden", marginBottom: 16 }}>
              <Img src={t.img} alt={t.title} style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
              <div style={{ position: "absolute", top: 14, left: 14, background: "rgba(0,0,0,0.55)", color: "#fff", padding: "4px 10px" }}>
                <span className="mono">{t.year}</span>
              </div>
            </div>
            <div className="mono" style={{ color: "var(--ink-muted)", marginBottom: 6 }}>{t.country} · {t.dates} · {t.days}d</div>
            <h3 style={{ fontSize: 26, fontWeight: 500, letterSpacing: "-0.025em", lineHeight: 1.1, marginBottom: 8 }}>{t.title}</h3>
            <p style={{ fontFamily: "var(--serif)", fontSize: 15, fontStyle: "italic", color: "var(--ink-soft)", lineHeight: 1.5, margin: 0, marginBottom: 10 }}>
              "{t.note}"
            </p>
            <div style={{ display: "flex", gap: 2 }}>
              {[1,2,3,4,5].map(s => (
                <I.star key={s} style={{ color: s <= t.rating ? "var(--golden)" : "var(--rule)" }}/>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Upload nudge */}
      <div style={{
        marginTop: 80, padding: "36px 44px",
        border: "1px dashed var(--rule)", borderRadius: 2,
        display: "flex", justifyContent: "space-between", alignItems: "center", gap: 24, flexWrap: "wrap",
      }}>
        <div>
          <div className="mono" style={{ color: "var(--ink-muted)", marginBottom: 8 }}>Missing something?</div>
          <div style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 500, letterSpacing: "-0.015em" }}>
            Upload an old spreadsheet. Marco will rebuild the pins.
          </div>
        </div>
        <button className="btn btn-ghost">Upload travel log</button>
      </div>
    </div>
  );
}

// Decorative world — stylized. Not realistic continents (per guidelines), a subtle dotted grid with plotted travel pins.
function WorldPlot() {
  // seeded pin locations in 0-100 coords
  const pins = [
    { x: 28, y: 42, label: "Reykjavík" }, { x: 48, y: 40, label: "Kyoto" }, { x: 82, y: 40, label: "Kyoto" },
    { x: 27, y: 50, label: "NYC" }, { x: 52, y: 48, label: "Belgrade" }, { x: 54, y: 50, label: "Sofia" },
    { x: 55, y: 52, label: "Plovdiv" }, { x: 51, y: 52, label: "Kotor" }, { x: 50, y: 46, label: "Tuscany" },
    { x: 21, y: 68, label: "Patagonia" }, { x: 88, y: 58, label: "Tokyo" }, { x: 55, y: 45, label: "Transylvania" },
    { x: 53, y: 55, label: "Crete" }, { x: 49, y: 42, label: "Paris" }, { x: 23, y: 55, label: "Mexico" },
    { x: 60, y: 60, label: "Cairo" }, { x: 86, y: 70, label: "Sydney" },
  ];
  const rows = 14, cols = 34;
  return (
    <svg viewBox="0 0 600 300" style={{ display: "block", width: "100%", height: "auto" }}>
      {/* Dot grid */}
      {Array.from({length: rows}).map((_, r) =>
        Array.from({length: cols}).map((__, c) => {
          const x = 15 + c * (570 / (cols - 1));
          const y = 25 + r * (250 / (rows - 1));
          // fake continent mask — higher density in bands, sparse at top/bottom
          const inContinent =
            (r > 2 && r < 12) &&
            ((c > 2 && c < 10 && r > 3 && r < 9) ||  // americas
             (c > 14 && c < 20 && r > 3 && r < 10) || // europe/africa
             (c > 20 && c < 30 && r > 3 && r < 9) ||  // asia
             (c > 25 && c < 30 && r > 9 && r < 12));  // oceania
          return <circle key={`${r}-${c}`} cx={x} cy={y} r={inContinent ? 1.3 : 0.6} fill={inContinent ? "rgba(0,0,0,0.18)" : "rgba(0,0,0,0.07)"}/>;
        })
      )}
      {/* Trip lines */}
      <g stroke="var(--accent)" strokeWidth="0.8" strokeDasharray="2 3" fill="none">
        <path d={`M ${pins[0].x*6},${pins[0].y*3} Q 300,30 ${pins[3].x*6},${pins[3].y*3}`}/>
        <path d={`M ${pins[3].x*6},${pins[3].y*3} Q 260,130 ${pins[4].x*6},${pins[4].y*3}`}/>
        <path d={`M ${pins[4].x*6},${pins[4].y*3} L ${pins[10].x*6},${pins[10].y*3}`}/>
      </g>
      {/* Pins */}
      {pins.map((p, i) => (
        <g key={i}>
          <circle cx={p.x*6} cy={p.y*3} r="4" fill="var(--bg-raised)" stroke="var(--forest)" strokeWidth="1.5"/>
          <circle cx={p.x*6} cy={p.y*3} r="1.5" fill="var(--forest)"/>
        </g>
      ))}
    </svg>
  );
}

window.Past = Past;
