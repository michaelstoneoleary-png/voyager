// Trip Planner — itinerary view, editorial-magazine layout with day ribbon + timeline + map
const { useState: useStateP } = React;

function Planner({ go, tweaks }) {
  const [selectedDay, setSelectedDay] = useStateP(3);

  const trip = {
    title: "Balkans in Autumn",
    sub: "Belgrade · Sofia · Plovdiv · Kotor",
    dates: "Sep 24 — Oct 08, 2026",
    days: 14,
    budget: "$3,200",
  };

  const days = [
    { n: 1, date: "Wed Sep 24", loc: "Belgrade", kind: "Arrival" },
    { n: 2, date: "Thu Sep 25", loc: "Belgrade", kind: "Old town" },
    { n: 3, date: "Fri Sep 26", loc: "Belgrade", kind: "Food" },
    { n: 4, date: "Sat Sep 27", loc: "Sofia", kind: "Transit" },
    { n: 5, date: "Sun Sep 28", loc: "Sofia", kind: "Culture" },
    { n: 6, date: "Mon Sep 29", loc: "Plovdiv", kind: "Old town" },
    { n: 7, date: "Tue Sep 30", loc: "Plovdiv", kind: "Rest" },
    { n: 8, date: "Wed Oct 01", loc: "Rila", kind: "Hike" },
    { n: 9, date: "Thu Oct 02", loc: "Kotor", kind: "Flight" },
    { n: 10, date: "Fri Oct 03", loc: "Kotor", kind: "Coastal" },
    { n: 11, date: "Sat Oct 04", loc: "Kotor", kind: "Bay" },
    { n: 12, date: "Sun Oct 05", loc: "Budva", kind: "Drive" },
    { n: 13, date: "Mon Oct 06", loc: "Tivat", kind: "Coastal" },
    { n: 14, date: "Tue Oct 07", loc: "Kotor", kind: "Depart" },
  ];

  // Activities for the selected day (Day 4 — Belgrade to Sofia, food & transit)
  const byDay = {
    3: {
      hero: "assets/belgrade-cafe.png",
      location: "Belgrade, Serbia",
      summary: "The eating day. Markets in the morning, a slow lunch by the Sava, and kafana supper under grapevines — the kind of day that starts planning itself.",
      activities: [
        { time: "08:30", title: "Coffee at Koffein", kind: "Coffee", dur: "45m", icon: "coffee", desc: "Belgrade's best flat white. Sit at the window.", cost: "$4" },
        { time: "09:30", title: "Bajloni Market", kind: "Walking", dur: "1h", icon: "walk", desc: "Autumn produce, a hundred kinds of pickle, and bakers pulling burek hot from the oven.", cost: "Free" },
        { time: "11:00", title: "Nikola Tesla Museum", kind: "Culture", dur: "1.5h", icon: "building", desc: "Small, strange, wonderful. The live-lightning demo is at noon.", cost: "$8", tip: "Book the 12:00 English tour in advance — it's worth the wait." },
        { time: "13:30", title: "Lunch at Šaran, Zemun", kind: "Food", dur: "2h", icon: "utensils", desc: "River fish grilled over coals. Order the carp — everyone else will.", cost: "$28" },
        { time: "16:00", title: "Kalemegdan fortress, slow loop", kind: "Walking", dur: "2h", icon: "walk", desc: "Stay for sunset. The confluence of two rivers is the whole point.", cost: "Free", marco: true },
        { time: "19:30", title: "Supper at Manufaktura", kind: "Food", dur: "2h", icon: "utensils", desc: "Kafana tradition, slightly polished. Ćevapi, rakia, live tamburitza from 8.", cost: "$45" },
      ],
    },
  };

  const day = byDay[selectedDay] || byDay[3];

  return (
    <div style={{ padding: "32px 56px 80px", maxWidth: 1440, margin: "0 auto" }}>

      {/* Back + header */}
      <button onClick={() => go("dashboard")} className="btn btn-ghost voy-fade" style={{ padding: "6px 14px", fontSize: 12, marginBottom: 28 }}>
        ← Back to dashboard
      </button>

      {/* Trip masthead */}
      <div className="voy-fade voy-fade-1" style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 48, alignItems: "end", marginBottom: 36 }}>
        <div>
          <div className="mono" style={{ color: "var(--ink-muted)", marginBottom: 14 }}>Journey №04 · In planning</div>
          <h1 style={{ fontSize: "clamp(48px, 7vw, 88px)", lineHeight: 0.95, letterSpacing: "-0.035em", fontWeight: 500 }}>
            Balkans <em style={{ color: "var(--accent)", fontWeight: 400 }}>in Autumn</em>
          </h1>
          <p style={{ fontFamily: "var(--serif)", fontSize: 18, color: "var(--ink-soft)", fontStyle: "italic", margin: "10px 0 0" }}>
            {trip.sub}
          </p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 18, paddingBottom: 6 }}>
          {[["Dates", "Sep 24 — Oct 08"], ["Length", "14 days"], ["Budget", trip.budget], ["Travel", "Train + drive"]].map(([l,v]) => (
            <div key={l} style={{ borderTop: "1px solid var(--rule)", paddingTop: 10 }}>
              <div className="mono" style={{ color: "var(--ink-muted)", marginBottom: 4 }}>{l}</div>
              <div style={{ fontSize: 14, fontWeight: 500 }}>{v}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Day ribbon — horizontal scroll of all 14 days */}
      <div className="voy-fade voy-fade-2" style={{
        borderTop: "1px solid var(--rule)", borderBottom: "1px solid var(--rule)",
        padding: "0", marginBottom: 48,
        display: "flex", overflowX: "auto",
      }}>
        {days.map(d => {
          const active = d.n === selectedDay;
          return (
            <button key={d.n}
              onClick={() => setSelectedDay(d.n)}
              style={{
                all: "unset", cursor: "pointer",
                padding: "18px 20px", minWidth: 118,
                borderRight: "1px solid var(--rule-soft)",
                background: active ? "var(--ink)" : "transparent",
                color: active ? "var(--cream)" : "var(--ink)",
                transition: "background 0.2s",
                display: "flex", flexDirection: "column", gap: 2,
              }}>
              <div className="mono" style={{ color: active ? "rgba(250,246,235,0.55)" : "var(--ink-muted)" }}>
                Day {d.n.toString().padStart(2, "0")}
              </div>
              <div style={{ fontSize: 14, fontWeight: 500, fontFamily: "var(--serif)", letterSpacing: "-0.01em" }}>{d.loc}</div>
              <div style={{ fontSize: 11, color: active ? "rgba(250,246,235,0.6)" : "var(--ink-muted)" }}>{d.date.split(" ").slice(1).join(" ")}</div>
            </button>
          );
        })}
      </div>

      {/* Day detail — 3 columns: timeline | day chapter | map rail */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1.35fr 0.95fr", gap: 40, alignItems: "start" }}>

        {/* Left: timeline */}
        <div className="voy-fade voy-fade-2" style={{ position: "sticky", top: 20 }}>
          <div className="mono" style={{ color: "var(--ink-muted)", marginBottom: 14 }}>The day in moments</div>
          <Timeline acts={day.activities}/>
        </div>

        {/* Middle: the chapter */}
        <div className="voy-fade voy-fade-3" style={{ background: "var(--bg-raised)", padding: 36, borderRadius: 4, border: "1px solid var(--rule-soft)" }}>
          {/* Day header */}
          <div style={{ marginBottom: 24 }}>
            <div className="mono" style={{ color: "var(--ink-muted)", marginBottom: 8 }}>Chapter III · Day Three</div>
            <h2 style={{ fontSize: 44, fontWeight: 500, letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 6 }}>{day.location}</h2>
            <div style={{ display: "flex", gap: 14, fontSize: 12, color: "var(--ink-muted)", fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.15em" }}>
              <span>Friday Sep 26</span><span>·</span><span>Sunny · 21°</span><span>·</span><span>Est. $85</span>
            </div>
          </div>

          {/* Hero image */}
          <div style={{ aspectRatio: "16/9", overflow: "hidden", borderRadius: 2, marginBottom: 28, background: "#222" }}>
            <Img src={day.hero} alt={day.location} style={{ width: "100%", height: "100%", objectFit: "cover" }}/>
          </div>

          {/* Marco's summary */}
          <p style={{ fontFamily: "var(--serif)", fontSize: 22, lineHeight: 1.4, fontStyle: "italic", color: "var(--ink)", letterSpacing: "-0.005em", marginBottom: 32 }}>
            <span style={{ fontSize: 52, float: "left", lineHeight: 0.8, marginRight: 8, marginTop: 6, color: "var(--accent)", fontWeight: 400 }}>T</span>
            {day.summary.slice(1)}
          </p>

          <Divider label="The plan" style={{ margin: "24px 0 28px" }}/>

          {/* Activities list */}
          <div>
            {day.activities.map((a, i) => (
              <ActivityRow key={i} act={a} i={i} last={i === day.activities.length - 1}/>
            ))}
          </div>

          {/* Marco ask */}
          <div style={{ marginTop: 36, padding: 24, background: "var(--cream)", border: "1px solid var(--rule-soft)", borderRadius: 2, display: "flex", gap: 16 }}>
            <Marco size={36}/>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 500, marginBottom: 4 }}>Something you'd rather not do?</div>
              <div style={{ fontSize: 13, color: "var(--ink-soft)", marginBottom: 14 }}>Tap any stop to swap it, move it, or tell me it's wrong for you. I'll re-plan around your feedback.</div>
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn btn-ghost" style={{ padding: "6px 14px", fontSize: 12 }}>Shuffle the whole day</button>
                <button className="btn btn-ghost" style={{ padding: "6px 14px", fontSize: 12 }}>Add a moment</button>
              </div>
            </div>
          </div>
        </div>

        {/* Right: map + meta rail */}
        <div className="voy-fade voy-fade-4" style={{ position: "sticky", top: 20, display: "flex", flexDirection: "column", gap: 24 }}>
          <MapRail acts={day.activities}/>

          {/* Where you'll sleep */}
          <div style={{ background: "var(--bg-raised)", padding: 20, border: "1px solid var(--rule-soft)", borderRadius: 2 }}>
            <div className="mono" style={{ color: "var(--ink-muted)", marginBottom: 8 }}>Where you'll sleep</div>
            <div style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 500, letterSpacing: "-0.015em", lineHeight: 1.1, marginBottom: 4 }}>Hotel Moskva</div>
            <div style={{ fontSize: 12, color: "var(--ink-muted)", marginBottom: 10, fontFamily: "var(--mono)", textTransform: "uppercase", letterSpacing: "0.1em" }}>Boutique · Terazije · $140/night</div>
            <p style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5, margin: 0 }}>
              1908, art nouveau — the corner suite looks down on the square. Breakfast is lavish.
            </p>
            <div style={{ display: "flex", gap: 6, marginTop: 12, alignItems: "center" }}>
              <div style={{ display: "flex", gap: 1 }}>
                {[1,2,3,4].map(s => <I.star key={s} style={{ color: "var(--golden)" }}/>)}
                <I.star style={{ color: "var(--rule)" }}/>
              </div>
              <span style={{ fontSize: 12, color: "var(--ink-muted)" }}>4.6 · 1,240 reviews</span>
            </div>
          </div>

          {/* Intel strip */}
          <div style={{ padding: 20, border: "1px solid var(--rule)", borderRadius: 2 }}>
            <div className="mono" style={{ color: "var(--ink-muted)", marginBottom: 12 }}>Travel intel · Friday</div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <span className="chip" style={{ background: "transparent", border: "1px solid var(--rule)" }}><I.sun/> 21° · sunny</span>
              <span className="chip" style={{ background: "transparent", border: "1px solid var(--rule)" }}>Dinar · RSD</span>
              <span className="chip" style={{ background: "transparent", border: "1px solid var(--rule)" }}>No visa (US)</span>
              <span className="chip" style={{ background: "transparent", border: "1px solid var(--rule)" }}>BEG airport · 20 min</span>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

// Timeline — vertical list of times + connector
function Timeline({ acts }) {
  return (
    <div style={{ position: "relative" }}>
      <div style={{ position: "absolute", left: 11, top: 6, bottom: 6, width: 1, background: "var(--rule)" }}/>
      {acts.map((a, i) => (
        <div key={i} style={{ position: "relative", paddingLeft: 34, paddingBottom: 22 }}>
          <div style={{
            position: "absolute", left: 5, top: 6, width: 13, height: 13, borderRadius: "50%",
            background: "var(--bg)", border: "1.5px solid var(--ink)",
          }}/>
          <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--accent)", fontWeight: 500, letterSpacing: "0.08em" }}>
            {a.time}
          </div>
          <div style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.3 }}>{a.title}</div>
          <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 2 }}>{a.kind} · {a.dur}</div>
        </div>
      ))}
    </div>
  );
}

// Activity row in chapter
function ActivityRow({ act, i, last }) {
  const IconCmp = I[act.icon];
  return (
    <div style={{ display: "grid", gridTemplateColumns: "54px 1fr auto", gap: 20, padding: "18px 0", borderBottom: last ? "none" : "1px dashed var(--rule)" }}>
      <div>
        <div style={{ fontFamily: "var(--mono)", fontSize: 11, color: "var(--ink-muted)", letterSpacing: "0.05em" }}>{(i+1).toString().padStart(2, "0")}</div>
        <div style={{ fontFamily: "var(--serif)", fontSize: 17, fontWeight: 500, color: "var(--accent)", letterSpacing: "-0.01em" }}>{act.time}</div>
      </div>
      <div>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
          {IconCmp && <span style={{ color: "var(--ink-muted)" }}><IconCmp/></span>}
          <span style={{ fontSize: 15, fontWeight: 500 }}>{act.title}</span>
          {act.marco && <span className="chip" style={{ background: "var(--forest)", color: "var(--cream)", fontSize: 10, padding: "2px 8px" }}>Marco's pick</span>}
        </div>
        <div style={{ fontSize: 13, color: "var(--ink-soft)", lineHeight: 1.5, marginTop: 4, fontFamily: "var(--serif)" }}>
          {act.desc}
        </div>
        {act.tip && (
          <div style={{ fontSize: 12, color: "var(--ink-muted)", marginTop: 8, paddingLeft: 12, borderLeft: "2px solid var(--accent)", fontStyle: "italic", fontFamily: "var(--serif)" }}>
            Tip — {act.tip}
          </div>
        )}
      </div>
      <div style={{ textAlign: "right", minWidth: 60 }}>
        <div style={{ fontSize: 13, fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>{act.cost}</div>
        <div className="mono" style={{ color: "var(--ink-muted)", marginTop: 2 }}>{act.dur}</div>
      </div>
    </div>
  );
}

// Decorative "map" panel — SVG abstraction (never hand-draw realistic maps)
function MapRail({ acts }) {
  // simple stylized layout — dots for each activity, connecting line
  const pts = acts.map((a, i) => ({
    x: 40 + (i % 3) * 80 + Math.sin(i * 1.3) * 15,
    y: 50 + i * 55,
  }));
  return (
    <div style={{ background: "var(--sand)", borderRadius: 2, overflow: "hidden", border: "1px solid var(--rule)", position: "relative" }}>
      <div style={{ padding: "14px 16px 10px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(0,0,0,0.06)" }}>
        <span className="mono" style={{ color: "var(--ink-soft)" }}>The day, walked</span>
        <span className="mono" style={{ color: "var(--ink-muted)" }}>6.2 km</span>
      </div>
      <svg viewBox="0 0 280 420" style={{ display: "block", width: "100%", height: 420, background: "var(--sand)" }}>
        {/* faux contour lines */}
        {[0,1,2,3,4,5].map(i => (
          <path key={i} d={`M 0 ${60 + i * 60} Q 140 ${30 + i * 60}, 280 ${60 + i * 60}`} fill="none" stroke="rgba(0,0,0,0.06)" strokeWidth="1"/>
        ))}
        {/* connecting line */}
        <path d={`M ${pts.map(p => `${p.x},${p.y}`).join(" L ")}`} fill="none" stroke="var(--ink)" strokeWidth="1.2" strokeDasharray="3 3"/>
        {/* dots */}
        {pts.map((p, i) => (
          <g key={i}>
            <circle cx={p.x} cy={p.y} r="10" fill="var(--bg-raised)" stroke="var(--ink)" strokeWidth="1.5"/>
            <text x={p.x} y={p.y + 3.5} textAnchor="middle" fontFamily="var(--mono)" fontSize="9" fontWeight="600" fill="var(--ink)">{i+1}</text>
          </g>
        ))}
        {/* label */}
        <text x="10" y="400" fontFamily="var(--mono)" fontSize="9" fill="rgba(0,0,0,0.4)">BELGRADE — STARI GRAD</text>
      </svg>
    </div>
  );
}

window.Planner = Planner;
