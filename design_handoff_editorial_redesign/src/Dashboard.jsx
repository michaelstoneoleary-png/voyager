// Dashboard — editorial, "Field Notes" direction
const { useState: useStateD, useEffect: useEffectD } = React;

function Dashboard({ go, tweaks }) {
  const [now, setNow] = useStateD(new Date());
  useEffectD(() => {
    const t = setInterval(() => setNow(new Date()), 60_000);
    return () => clearInterval(t);
  }, []);

  const trip = {
    title: "Balkans in Autumn",
    sub: "A slow loop through Serbia, Bulgaria & Montenegro",
    origin: "Chicago",
    route: ["Belgrade", "Sofia", "Plovdiv", "Kotor"],
    dates: "Sep 24 — Oct 08, 2026",
    days: 14,
    cost: "$3,200",
    hero: "assets/hero-travel.png",
    status: "In planning",
  };

  const daysUntil = 158;

  // Progress steps
  const steps = [
    { n: "01", label: "Destinations locked", done: true },
    { n: "02", label: "Dates firmed", done: true },
    { n: "03", label: "Marco's itinerary draft", done: true },
    { n: "04", label: "Flights booked", done: false, current: true },
    { n: "05", label: "Accommodation holds", done: false },
    { n: "06", label: "Packing list — 12 days out", done: false },
  ];
  const pct = Math.round(steps.filter(s => s.done).length / steps.length * 100);

  const dateStr = now.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });

  return (
    <div style={{ padding: "48px 56px 80px", maxWidth: 1340, margin: "0 auto" }}>

      {/* Masthead */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}
           className="voy-fade">
        <div>
          <div className="mono" style={{ color: "var(--ink-muted)", marginBottom: 12 }}>Vol. IV · Issue 09 — {dateStr}</div>
          <h1 style={{ fontSize: "clamp(56px, 8vw, 104px)", lineHeight: 0.95, letterSpacing: "-0.035em", fontWeight: 400, fontStyle: "italic" }}>
            Good morning,<br/>
            <span style={{ fontStyle: "normal", fontWeight: 500 }}>Michael.</span>
          </h1>
        </div>
        <button className="btn btn-ink voy-fade voy-fade-2" onClick={() => go("inspire")}>
          <I.plus/> New journey
        </button>
      </div>

      <hr className="rule" style={{ margin: "32px 0 40px" }}/>

      {/* Hero — Current journey */}
      <div className="voy-fade voy-fade-1" style={{
        display: "grid",
        gridTemplateColumns: "1.3fr 1fr",
        gap: 0,
        background: "var(--bg-raised)",
        borderRadius: 4,
        overflow: "hidden",
        border: "1px solid var(--rule-soft)",
      }}>
        {/* Image column */}
        <div className="img-grain" style={{ position: "relative", minHeight: 520, background: "#111" }}>
          <Img src={trip.hero} alt={trip.title} style={{ width: "100%", height: "100%", objectFit: "cover", position: "absolute", inset: 0 }} />
          {/* Overlay corner caption */}
          <div style={{ position: "absolute", top: 24, left: 28, color: "rgba(255,255,255,0.92)", display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ width: 28, height: 1, background: "rgba(255,255,255,0.6)" }}/>
            <span className="mono" style={{ color: "rgba(255,255,255,0.85)" }}>Currently planning</span>
          </div>
          {/* Bottom-left stamp */}
          <div style={{ position: "absolute", bottom: 28, left: 28, color: "#fff" }}>
            <div className="mono" style={{ color: "rgba(255,255,255,0.7)", marginBottom: 6 }}>
              {trip.route.join(" · ")}
            </div>
            <div style={{ fontFamily: "var(--serif)", fontStyle: "italic", fontSize: 20, fontWeight: 400, letterSpacing: "-0.01em" }}>
              "A slow loop — the kind you remember in November."
            </div>
          </div>
          {/* Countdown badge */}
          <div style={{ position: "absolute", top: 24, right: 24, background: "rgba(255,255,255,0.95)", padding: "12px 16px", borderRadius: 2, textAlign: "center", minWidth: 92 }}>
            <div style={{ fontFamily: "var(--serif)", fontSize: 34, fontWeight: 500, lineHeight: 1, color: "var(--forest)" }}>{daysUntil}</div>
            <div className="mono" style={{ color: "var(--ink-muted)", marginTop: 4 }}>days away</div>
          </div>
        </div>

        {/* Content column */}
        <div style={{ padding: "44px 44px 36px", display: "flex", flexDirection: "column", position: "relative" }}>
          <Eyebrow style={{ marginBottom: 14 }}>The journey at hand — №04</Eyebrow>
          <h2 style={{ fontSize: 52, lineHeight: 0.98, letterSpacing: "-0.03em", fontWeight: 500, marginBottom: 12 }}>
            {trip.title}
          </h2>
          <p style={{ color: "var(--ink-soft)", fontSize: 16, lineHeight: 1.55, maxWidth: 420, margin: 0, fontFamily: "var(--serif)", fontStyle: "italic", fontWeight: 400 }}>
            {trip.sub}
          </p>

          {/* meta strip */}
          <div style={{ display: "flex", gap: 28, margin: "28px 0 24px", paddingTop: 20, borderTop: "1px solid var(--rule-soft)" }}>
            {[
              { label: "When", val: "Sep 24 — Oct 08" },
              { label: "Length", val: "14 days" },
              { label: "Budget", val: trip.cost },
              { label: "Mode", val: "Train + Drive" },
            ].map(m => (
              <div key={m.label}>
                <div className="mono" style={{ color: "var(--ink-muted)", marginBottom: 4 }}>{m.label}</div>
                <div style={{ fontSize: 15, fontWeight: 500 }}>{m.val}</div>
              </div>
            ))}
          </div>

          {/* Progress */}
          <div style={{ marginTop: "auto" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
              <span className="mono" style={{ color: "var(--ink-muted)" }}>Preparation · {pct}% complete</span>
              <span className="mono" style={{ color: "var(--accent)" }}>{steps.filter(s => s.done).length} of {steps.length}</span>
            </div>
            {/* Dotted progress */}
            <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
              {steps.map((s, i) => (
                <div key={i} style={{
                  flex: 1, height: 3, borderRadius: 2,
                  background: s.done ? "var(--forest)" : s.current ? "var(--accent)" : "var(--rule)",
                }}/>
              ))}
            </div>
            <div style={{ fontSize: 14, color: "var(--ink-soft)", marginBottom: 4 }}>
              Up next — <span style={{ color: "var(--ink)", fontWeight: 500 }}>{steps.find(s=>s.current)?.label}</span>
            </div>

            <div style={{ display: "flex", gap: 10, marginTop: 24 }}>
              <button className="btn btn-ink" onClick={() => go("planner")}>Open itinerary <I.arrow/></button>
              <button className="btn btn-ghost">Packing list</button>
            </div>
          </div>
        </div>
      </div>

      {/* Lower deck — Marco + Atlas + Agenda */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 32, marginTop: 60 }}>

        {/* Marco's note */}
        <div className="voy-fade voy-fade-2" style={{
          background: "var(--bg-raised)",
          border: "1px solid var(--rule-soft)",
          padding: 32, borderRadius: 4,
          position: "relative",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
            <Marco size={36} pulse/>
            <div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>A note from Marco</div>
              <div className="mono" style={{ color: "var(--ink-muted)" }}>Drafted 6:42 this morning</div>
            </div>
          </div>
          <Divider label="Dispatch №158" style={{ margin: "16px 0 22px" }}/>
          <p style={{ fontFamily: "var(--serif)", fontSize: 19, lineHeight: 1.45, color: "var(--ink)", margin: 0, fontWeight: 400, letterSpacing: "-0.005em" }}>
            A found a quieter boutique in <em style={{ color: "var(--accent)" }}>Plovdiv's Old Town</em> — 
            family-run, wisteria on the balcony, three rooms left for your dates. 
            It'd save you <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 500 }}>$180</span> over 
            the current pick and puts you closer to the Roman theatre.
          </p>
          <div style={{ display: "flex", gap: 10, marginTop: 22 }}>
            <button className="btn btn-accent" style={{ background: "var(--forest)" }}>See the room <I.arrow/></button>
            <button className="btn btn-ghost">Dismiss</button>
          </div>
          {/* decorative serif quote mark */}
          <div style={{ position: "absolute", top: 18, right: 24, fontFamily: "var(--serif)", fontSize: 80, color: "var(--rule)", lineHeight: 1, fontStyle: "italic" }}>"</div>
        </div>

        {/* Atlas — stats */}
        <div className="voy-fade voy-fade-3" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <Eyebrow>The Atlas · lifetime</Eyebrow>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
            {[
              { n: "23", l: "countries" },
              { n: "47", l: "cities" },
              { n: "312", l: "days abroad" },
              { n: "6", l: "continents" },
            ].map(s => (
              <div key={s.l} style={{ borderTop: "1px solid var(--rule)", paddingTop: 10 }}>
                <div style={{ fontFamily: "var(--serif)", fontSize: 56, fontWeight: 500, lineHeight: 1, letterSpacing: "-0.04em" }}>{s.n}</div>
                <div className="mono" style={{ color: "var(--ink-muted)", marginTop: 4 }}>{s.l}</div>
              </div>
            ))}
          </div>
          <button className="btn btn-ghost" style={{ alignSelf: "flex-start", marginTop: 8 }} onClick={() => go("past")}>
            Read the atlas <I.arrow/>
          </button>
        </div>

        {/* Other journeys */}
        <div className="voy-fade voy-fade-4">
          <Eyebrow style={{ marginBottom: 20 }}>Other journeys</Eyebrow>
          {[
            { title: "Kyoto in maple season", when: "Nov 2026", status: "Planning" },
            { title: "Patagonia self-drive", when: "Feb 2027", status: "Idea" },
            { title: "Tuscany — anniversary", when: "Jun 2027", status: "Idea" },
          ].map((j, i) => (
            <button key={i}
              onClick={() => go("planner")}
              style={{
                all: "unset", cursor: "pointer", display: "block", width: "100%",
                padding: "18px 0", borderTop: "1px solid var(--rule)",
              }}
              onMouseEnter={e => e.currentTarget.style.paddingLeft = "8px"}
              onMouseLeave={e => e.currentTarget.style.paddingLeft = "0"}
              onTransitionEnd={null}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 4 }}>
                <span className="mono" style={{ color: "var(--ink-muted)" }}>№{(i + 5).toString().padStart(2, "0")}</span>
                <span className="mono" style={{ color: j.status === "Idea" ? "var(--ink-muted)" : "var(--accent)" }}>{j.status}</span>
              </div>
              <div style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 500, letterSpacing: "-0.015em", lineHeight: 1.15 }}>{j.title}</div>
              <div style={{ color: "var(--ink-muted)", fontSize: 13, marginTop: 2 }}>{j.when}</div>
            </button>
          ))}
          <div style={{ borderTop: "1px solid var(--rule)", marginTop: 0 }}/>
        </div>
      </div>

      {/* Footer dispatch */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 80, paddingTop: 24, borderTop: "1px solid var(--rule)" }}>
        <span className="mono" style={{ color: "var(--ink-muted)" }}>Voyager · est. 2026 · bound in cloth</span>
        <span className="mono" style={{ color: "var(--ink-muted)" }}>Compiled by Marco, your curator</span>
      </div>
    </div>
  );
}

window.Dashboard = Dashboard;
