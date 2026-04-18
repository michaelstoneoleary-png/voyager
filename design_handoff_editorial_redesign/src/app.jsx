// App shell — navigation + Tweaks panel + routing
const { useState: useStateA, useEffect: useEffectA } = React;

const ACCENT_MAP = {
  clay:    "#b86a48",
  golden:  "#c89442",
  teal:    "#3a6b6a",
  rose:    "#c4856b",
  forest:  "#2d4a3e",
};

function App() {
  const [screen, setScreen] = useStateA(window.__voyagerInitialScreen || "dashboard");
  const [tweaks, setTweaks] = useStateA(window.__TWEAKS);
  const [tweaksOpen, setTweaksOpen] = useStateA(false);

  // Persist screen
  useEffectA(() => {
    try { localStorage.setItem('voyager_screen', screen); } catch(e){}
  }, [screen]);

  // Apply tweaks to root
  useEffectA(() => {
    const root = document.documentElement;
    root.classList.remove("aesthetic-editorial", "aesthetic-minimal", "aesthetic-bold");
    root.classList.add("aesthetic-" + tweaks.aesthetic);
    const dMap = { cinematic: 1.15, balanced: 1, compact: 0.85 };
    root.style.setProperty("--density", dMap[tweaks.density] || 1);
    root.style.setProperty("--accent", ACCENT_MAP[tweaks.accent] || "#b86a48");
    try { localStorage.setItem('voyager_tweaks', JSON.stringify(tweaks)); } catch(e){}
  }, [tweaks]);

  // Edit mode protocol
  useEffectA(() => {
    function onMsg(e) {
      const d = e.data || {};
      if (d.type === "__activate_edit_mode") setTweaksOpen(true);
      if (d.type === "__deactivate_edit_mode") setTweaksOpen(false);
    }
    window.addEventListener("message", onMsg);
    window.parent.postMessage({ type: "__edit_mode_available" }, "*");
    return () => window.removeEventListener("message", onMsg);
  }, []);

  function updateTweak(key, val) {
    setTweaks(prev => {
      const next = { ...prev, [key]: val };
      window.parent.postMessage({ type: "__edit_mode_set_keys", edits: { [key]: val } }, "*");
      return next;
    });
  }

  const nav = [
    { id: "dashboard", n: "01", label: "Dashboard", icon: I.book },
    { id: "inspire", n: "02", label: "Inspire", icon: I.spark },
    { id: "planner", n: "03", label: "Trip Planner", icon: I.compass },
    { id: "past", n: "04", label: "The Atlas", icon: I.globe },
  ];

  const Screen = { dashboard: Dashboard, inspire: Inspire, planner: Planner, past: Past }[screen] || Dashboard;

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="brand">
          <div>
            <div className="brand-mark"><em>Voy</em>ager</div>
            <div className="brand-sub">Field notes · est. 2026</div>
          </div>
        </div>
        <nav className="nav">
          {nav.map(n => (
            <button key={n.id} className={screen === n.id ? "active" : ""} onClick={() => setScreen(n.id)}>
              <span className="num">{n.n}</span>
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          <div className="avatar-row">
            <div className="avatar">M</div>
            <div>
              <div className="avatar-name">Michael</div>
              <div className="avatar-sub">Chicago · 23 countries</div>
            </div>
          </div>
          <button className="btn btn-ghost" style={{ width: "100%", justifyContent: "center", marginTop: 10, fontSize: 12, padding: "7px 10px" }}
                  onClick={() => setTweaksOpen(v => !v)}>
            <I.sliders/> Tweaks
          </button>
        </div>
      </aside>

      <main className="main">
        <Screen go={setScreen} tweaks={tweaks}/>
      </main>

      {tweaksOpen && (
        <div className="tweaks-panel">
          <div className="tweaks-head">
            <span className="tweaks-title">Tweaks</span>
            <button className="btn" style={{ padding: 4, color: "var(--ink-muted)" }} onClick={() => setTweaksOpen(false)}><I.x/></button>
          </div>
          <div className="tweaks-body">
            <div>
              <div className="tweaks-label">Aesthetic</div>
              <div className="seg">
                {["editorial","minimal","bold"].map(v => (
                  <button key={v} className={tweaks.aesthetic === v ? "on" : ""} onClick={() => updateTweak("aesthetic", v)}>
                    {v === "editorial" ? "Editorial" : v === "minimal" ? "Calm" : "Expedition"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="tweaks-label">Density</div>
              <div className="seg">
                {["cinematic","balanced","compact"].map(v => (
                  <button key={v} className={tweaks.density === v ? "on" : ""} onClick={() => updateTweak("density", v)}>
                    {v[0].toUpperCase() + v.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <div className="tweaks-label">Accent</div>
              <div className="swatch-row">
                {Object.entries(ACCENT_MAP).map(([k, v]) => (
                  <button key={k} className={"swatch" + (tweaks.accent === k ? " on" : "")} style={{ background: v }} onClick={() => updateTweak("accent", k)} title={k}/>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("app-root")).render(<App/>);
