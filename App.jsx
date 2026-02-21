import { useState, useEffect } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import {
  login      as loginAPI,
  logout     as logoutAPI,
  getVehicles, createVehicle, updateVehicle, setVehicleRetired,
  getDrivers,  createDriver,  updateDriverStatus,
  getTrips,    createTrip,    updateTripStatus,
  getMaintenance,   createMaintenance,  completeMaintenance,
  getFuelLogs, createFuelLog,
} from './api';

/* ─────────────────────────────────────────────────────────────────────────────
   ROLE DISPLAY MAP
───────────────────────────────────────────────────────────────────────────── */
const ROLE_DISPLAY = {
  MANAGER:           'Fleet Manager',
  DISPATCHER:        'Dispatcher',
  SAFETY_OFFICER:    'Safety Officer',
  FINANCIAL_ANALYST: 'Financial Analyst',
};

/* ─────────────────────────────────────────────────────────────────────────────
   GLOBAL STYLES
───────────────────────────────────────────────────────────────────────────── */
const STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&family=Exo+2:wght@300;400;600;700;800&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg: #050810;
    --bg2: #080d18;
    --bg3: #0c1420;
    --panel: #0e1825;
    --border: #1a2d45;
    --border2: #1f3650;
    --cyan: #00e5ff;
    --cyan2: #00b8d9;
    --amber: #ffab00;
    --amber2: #ff8f00;
    --green: #00e676;
    --red: #ff1744;
    --purple: #e040fb;
    --text: #cdd9e5;
    --text2: #8899aa;
    --text3: #4a6070;
  }

  html, body { background: var(--bg); color: var(--text); font-family: 'Exo 2', sans-serif; overflow-x: hidden; }
  body { scrollbar-width: thin; scrollbar-color: var(--border2) transparent; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border2); border-radius: 2px; }

  .mono { font-family: 'Share Tech Mono', monospace; }
  .rajdhani { font-family: 'Rajdhani', sans-serif; }

  input, select, textarea {
    background: var(--bg2); border: 1px solid var(--border2); color: var(--text);
    border-radius: 4px; padding: 9px 12px; font-family: 'Exo 2', sans-serif; font-size: 13px;
    outline: none; width: 100%; transition: border-color .2s, box-shadow .2s;
    letter-spacing: .02em;
  }
  input:focus, select:focus { border-color: var(--cyan); box-shadow: 0 0 0 3px #00e5ff15, inset 0 0 12px #00e5ff08; }
  select option { background: #0c1420; }

  @keyframes fadeSlideIn {
    from { opacity: 0; transform: translateY(16px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes scanline {
    0%   { transform: translateY(-100%); }
    100% { transform: translateY(100vh); }
  }
  @keyframes pulseGlow {
    0%, 100% { opacity: 1; }
    50%       { opacity: .4; }
  }
  @keyframes rotate {
    from { transform: rotate(0deg); }
    to   { transform: rotate(360deg); }
  }
  @keyframes shimmer {
    from { background-position: -200% center; }
    to   { background-position: 200% center; }
  }
  @keyframes borderPulse {
    0%, 100% { border-color: var(--border2); }
    50%       { border-color: var(--cyan2); }
  }

  .page-anim { animation: fadeSlideIn .35s cubic-bezier(.22,1,.36,1) forwards; }

  .glow-cyan  { text-shadow: 0 0 20px #00e5ff80, 0 0 40px #00e5ff30; }
  .glow-amber { text-shadow: 0 0 20px #ffab0080, 0 0 40px #ffab0030; }

  .grid-bg {
    background-image: linear-gradient(var(--border) 1px, transparent 1px),
                      linear-gradient(90deg, var(--border) 1px, transparent 1px);
    background-size: 40px 40px;
    background-position: center center;
  }

  .card {
    background: var(--panel);
    border: 1px solid var(--border);
    border-radius: 8px;
    position: relative;
    overflow: hidden;
    transition: border-color .2s, box-shadow .2s;
  }
  .card::before {
    content: '';
    position: absolute; top: 0; left: 0; right: 0; height: 1px;
    background: linear-gradient(90deg, transparent, var(--cyan2), transparent);
    opacity: 0; transition: opacity .3s;
  }
  .card:hover::before { opacity: .7; }
  .card:hover { border-color: var(--border2); box-shadow: 0 8px 32px #00000060, 0 0 0 1px #00e5ff10; }

  table { width: 100%; border-collapse: collapse; }
  thead th {
    padding: 10px 16px; font-size: 10px; letter-spacing: .15em; text-transform: uppercase;
    color: var(--text3); border-bottom: 1px solid var(--border); font-family: 'Share Tech Mono', monospace;
    font-weight: 400; white-space: nowrap;
  }
  tbody td { padding: 13px 16px; border-bottom: 1px solid #0c1420; font-size: 13px; vertical-align: middle; }
  tbody tr { transition: background .15s; }
  tbody tr:hover td { background: #0c1420; }
  tbody tr:last-child td { border-bottom: none; }

  .btn {
    display: inline-flex; align-items: center; gap: 6px;
    border: none; border-radius: 4px; padding: 8px 16px;
    font-family: 'Rajdhani', sans-serif; font-size: 14px; font-weight: 600;
    letter-spacing: .05em; cursor: pointer; transition: all .15s; white-space: nowrap;
    text-transform: uppercase;
  }
  .btn-primary {
    background: linear-gradient(135deg, var(--cyan2), var(--cyan));
    color: #000; box-shadow: 0 4px 15px #00e5ff30;
  }
  .btn-primary:hover { box-shadow: 0 6px 25px #00e5ff50; transform: translateY(-1px); }
  .btn-amber {
    background: linear-gradient(135deg, var(--amber2), var(--amber));
    color: #000; box-shadow: 0 4px 15px #ffab0030;
  }
  .btn-ghost {
    background: transparent; color: var(--text2); border: 1px solid var(--border2);
  }
  .btn-ghost:hover { border-color: var(--cyan); color: var(--cyan); }
  .btn-danger {
    background: #ff174415; color: var(--red); border: 1px solid #ff174430;
  }
  .btn-danger:hover { background: #ff174425; }
  .btn-success {
    background: #00e67615; color: var(--green); border: 1px solid #00e67630;
  }
  .btn-success:hover { background: #00e67625; }
  .btn-sm { padding: 5px 12px; font-size: 12px; }

  .label {
    display: block; font-size: 10px; letter-spacing: .15em; text-transform: uppercase;
    color: var(--text3); margin-bottom: 6px; font-family: 'Share Tech Mono', monospace;
  }

  .tag {
    display: inline-flex; align-items: center; gap: 4px;
    border-radius: 3px; padding: 3px 10px; font-size: 11px;
    font-family: 'Share Tech Mono', monospace; letter-spacing: .05em; white-space: nowrap;
  }

  .notification {
    position: fixed; top: 20px; right: 20px; z-index: 9999;
    padding: 14px 20px; border-radius: 6px; font-size: 13px; font-weight: 600;
    border: 1px solid; max-width: 340px; animation: fadeSlideIn .3s ease forwards;
    display: flex; align-items: center; gap: 10px;
    box-shadow: 0 8px 32px #00000080;
  }
`;

/* ─────────────────────────────────────────────────────────────────────────────
   MOCK DATA (used as initial state / fallback when API is unavailable)
───────────────────────────────────────────────────────────────────────────── */
const INIT_VEHICLES = [
  { id:"V001", name:"Mercedes Sprinter", plate:"TRK-001", type:"Truck", capacity:1500, odometer:45200, status:"Available", region:"North", acqCost:42000, year:2021 },
  { id:"V002", name:"Ford Transit Van",  plate:"VAN-002", type:"Van",   capacity:800,  odometer:28900, status:"On Trip",  region:"South", acqCost:28000, year:2022 },
  { id:"V003", name:"Honda CB500",       plate:"BIK-003", type:"Bike",  capacity:50,   odometer:12100, status:"In Shop",  region:"North", acqCost:6000,  year:2023 },
  { id:"V004", name:"Isuzu NLR",         plate:"TRK-004", type:"Truck", capacity:2000, odometer:67300, status:"Available",region:"East",  acqCost:55000, year:2020 },
  { id:"V005", name:"VW Caddy",          plate:"VAN-005", type:"Van",   capacity:500,  odometer:19200, status:"Available",region:"West",  acqCost:22000, year:2022 },
  { id:"V006", name:"Toyota Hiace",      plate:"VAN-006", type:"Van",   capacity:700,  odometer:33100, status:"Available",region:"South", acqCost:31000, year:2021 },
];
const INIT_DRIVERS = [
  { id:"D001", name:"Alex Carter",   license:"A12345", expiry:"2026-08-15", category:"Van,Truck", status:"On Duty",  trips:142, score:94, phone:"+1-555-0101" },
  { id:"D002", name:"Jordan Lee",    license:"B67890", expiry:"2025-01-01", category:"Bike,Van",  status:"On Duty",  trips:89,  score:78, phone:"+1-555-0102" },
  { id:"D003", name:"Morgan Davis",  license:"C11223", expiry:"2027-01-20", category:"Truck",     status:"Off Duty", trips:201, score:97, phone:"+1-555-0103" },
  { id:"D004", name:"Riley Brooks",  license:"D44556", expiry:"2025-11-30", category:"Van,Bike",  status:"Suspended",trips:56,  score:61, phone:"+1-555-0104" },
  { id:"D005", name:"Sam Nguyen",    license:"E99001", expiry:"2028-03-10", category:"Truck,Van", status:"On Duty",  trips:178, score:91, phone:"+1-555-0105" },
];
const INIT_TRIPS = [
  { id:"TR001", _dbId:1, vehicleId:"V002", driverId:"D001", origin:"Warehouse A", dest:"Downtown Hub",   cargo:420, status:"Dispatched", date:"2026-02-20", revenue:1200, km:85  },
  { id:"TR002", _dbId:2, vehicleId:"V001", driverId:"D003", origin:"Port Terminal",dest:"Cold Storage B", cargo:1100,status:"Completed",  date:"2026-02-19", revenue:3400, km:210 },
  { id:"TR003", _dbId:3, vehicleId:"V004", driverId:"D002", origin:"Factory Floor", dest:"Retail Center", cargo:900, status:"Completed",  date:"2026-02-18", revenue:2800, km:165 },
  { id:"TR004", _dbId:4, vehicleId:"V005", driverId:"D001", origin:"Airport Cargo", dest:"Office Park",   cargo:200, status:"Draft",      date:"2026-02-21", revenue:600,  km:0   },
  { id:"TR005", _dbId:5, vehicleId:"V006", driverId:"D005", origin:"Central Hub",   dest:"East Depot",    cargo:580, status:"Completed",  date:"2026-02-17", revenue:1900, km:130 },
];
const INIT_MAINT = [
  { id:"M001", vehicleId:"V003", type:"Engine Repair",  date:"2026-02-15", cost:1200, notes:"Head gasket replacement",  status:"In Progress" },
  { id:"M002", vehicleId:"V001", type:"Oil Change",      date:"2026-01-10", cost:120,  notes:"Routine 10k service",      status:"Completed"   },
  { id:"M003", vehicleId:"V002", type:"Tire Rotation",   date:"2026-02-05", cost:80,   notes:"All 4 tires rotated",      status:"Completed"   },
  { id:"M004", vehicleId:"V004", type:"Brake Service",   date:"2026-01-28", cost:340,  notes:"Front pads replaced",      status:"Completed"   },
];
const INIT_FUEL = [
  { id:"F001", vehicleId:"V001", liters:85, cost:142, date:"2026-02-19", km:420 },
  { id:"F002", vehicleId:"V002", liters:62, cost:103, date:"2026-02-20", km:310 },
  { id:"F003", vehicleId:"V004", liters:91, cost:152, date:"2026-02-18", km:380 },
  { id:"F004", vehicleId:"V005", liters:38, cost:63,  date:"2026-02-17", km:190 },
  { id:"F005", vehicleId:"V006", liters:55, cost:91,  date:"2026-02-17", km:273 },
];

/* ─────────────────────────────────────────────────────────────────────────────
   UTILITY COMPONENTS
───────────────────────────────────────────────────────────────────────────── */
const STATUS_CFG = {
  "Available":     { bg:"#00e67612", color:"#00e676", dot:"#00e676" },
  "On Trip":       { bg:"#00e5ff12", color:"#00e5ff", dot:"#00e5ff" },
  "In Shop":       { bg:"#ffab0012", color:"#ffab00", dot:"#ffab00" },
  "Out of Service":{ bg:"#ff174412", color:"#ff1744", dot:"#ff1744" },
  "On Duty":       { bg:"#00e67612", color:"#00e676", dot:"#00e676" },
  "Off Duty":      { bg:"#8899aa15", color:"#8899aa", dot:"#8899aa" },
  "Suspended":     { bg:"#ff174412", color:"#ff1744", dot:"#ff1744" },
  "Completed":     { bg:"#00e67612", color:"#00e676", dot:"#00e676" },
  "Dispatched":    { bg:"#00e5ff12", color:"#00e5ff", dot:"#00e5ff" },
  "Draft":         { bg:"#8899aa15", color:"#8899aa", dot:"#8899aa" },
  "Cancelled":     { bg:"#ff174412", color:"#ff1744", dot:"#ff1744" },
  "In Progress":   { bg:"#ffab0012", color:"#ffab00", dot:"#ffab00" },
};

const Tag = ({ s }) => {
  const c = STATUS_CFG[s] || { bg:"#8899aa15", color:"#8899aa", dot:"#8899aa" };
  return (
    <span className="tag" style={{ background: c.bg, color: c.color, border:`1px solid ${c.color}22` }}>
      <span style={{ width:6, height:6, borderRadius:"50%", background:c.dot, display:"inline-block",
        boxShadow:`0 0 6px ${c.dot}`, animation: s==="On Trip"||s==="Dispatched"||s==="In Progress" ? "pulseGlow 2s infinite" : "none" }} />
      {s}
    </span>
  );
};

const Notification = ({ msg, type, onClose }) => {
  const cfg = type==="error"
    ? { bg:"#ff174412", border:"#ff174440", color:"#ff1744", icon:"✕" }
    : { bg:"#00e67612", border:"#00e67640", color:"#00e676", icon:"✓" };
  // Fixed: onClose added to deps array to prevent stale closure bug
  useEffect(() => { const t = setTimeout(onClose, 3500); return () => clearTimeout(t); }, [onClose]);
  return (
    <div className="notification" style={{ background:cfg.bg, borderColor:cfg.border, color:cfg.color }}>
      <span style={{ fontSize:16, fontWeight:700 }}>{cfg.icon}</span>
      <span>{msg}</span>
    </div>
  );
};

const isExpired     = d => d && new Date(d) < new Date();
const isExpiringSoon = d => { if (!d) return false; const x=new Date(d), n=new Date(); return x>n && x<new Date(n.getTime()+90*864e5); };

const uid = prefix => prefix + Date.now().toString(36).toUpperCase();

/* ─────────────────────────────────────────────────────────────────────────────
   LOGIN PAGE
───────────────────────────────────────────────────────────────────────────── */
const LoginPage = ({ onLogin }) => {
  const [email,   setEmail]   = useState("manager@fleetflow.io");
  const [pass,    setPass]    = useState("");
  const [loading, setLoading] = useState(false);
  const [err,     setErr]     = useState("");

  const submit = async () => {
    setErr("");
    setLoading(true);
    try {
      // Try real API login
      const user = await loginAPI(email, pass);
      onLogin(user);
    } catch (e) {
      // Demo fallback — useful during development before users are seeded
      if (import.meta.env.DEV && pass === "demo") {
        onLogin({ id: 0, name: "Demo User", email, role: "MANAGER" });
      } else {
        setErr(e.message || "Invalid credentials");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", background:"var(--bg)", position:"relative", overflow:"hidden" }}>
      <div className="grid-bg" style={{ position:"absolute", inset:0, opacity:.4 }} />
      <div style={{ flex:1, display:"flex", flexDirection:"column", justifyContent:"center", padding:"60px 80px", position:"relative", zIndex:1 }}>
        <div style={{ marginBottom:60 }}>
          <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:40 }}>
            <div style={{ width:40, height:40, border:"2px solid var(--cyan)", display:"flex", alignItems:"center", justifyContent:"center", transform:"rotate(45deg)" }}>
              <div style={{ width:16, height:16, background:"var(--cyan)", transform:"rotate(-45deg)" }} />
            </div>
            <span className="rajdhani" style={{ fontSize:26, fontWeight:700, letterSpacing:".1em", color:"var(--cyan)" }}>FLEETFLOW</span>
          </div>
          <h1 className="rajdhani glow-cyan" style={{ fontSize:56, fontWeight:700, lineHeight:1.1, letterSpacing:"-.02em", marginBottom:20 }}>
            Logistics<br />Command<br /><span style={{ color:"var(--cyan)" }}>System</span>
          </h1>
          <p style={{ color:"var(--text2)", fontSize:15, lineHeight:1.7, maxWidth:380 }}>
            Real-time fleet intelligence. Dispatch operations, track assets, and optimize your entire logistics network from one control center.
          </p>
        </div>
        <div style={{ display:"flex", gap:40 }}>
          {[["6","Vehicles Active"],["5","Drivers Managed"],["3","Regions Covered"]].map(([n,l]) => (
            <div key={l}>
              <div className="mono glow-amber" style={{ fontSize:32, color:"var(--amber)", fontWeight:400 }}>{n}</div>
              <div style={{ fontSize:11, color:"var(--text3)", letterSpacing:".1em", textTransform:"uppercase", marginTop:2 }}>{l}</div>
            </div>
          ))}
        </div>
        <div style={{ position:"absolute", right:0, top:"50%", transform:"translateY(-50%)", width:1, height:"60%", background:"linear-gradient(to bottom, transparent, var(--cyan2), transparent)", opacity:.3 }} />
      </div>

      <div style={{ width:440, display:"flex", alignItems:"center", justifyContent:"center", padding:40, position:"relative", zIndex:1 }}>
        <div style={{ width:"100%" }}>
          <div className="card" style={{ padding:40 }}>
            <div style={{ marginBottom:30 }}>
              <div className="mono" style={{ fontSize:11, color:"var(--cyan)", letterSpacing:".2em", marginBottom:8 }}>// AUTHENTICATION</div>
              <h2 className="rajdhani" style={{ fontSize:28, fontWeight:700, letterSpacing:".02em" }}>Sign In to Console</h2>
            </div>

            {err && (
              <div style={{ marginBottom:16, padding:"10px 14px", background:"#ff174412", border:"1px solid #ff174430", borderRadius:4, color:"var(--red)", fontSize:13 }}>
                {err}
              </div>
            )}

            <div style={{ marginBottom:16 }}>
              <label className="label">EMAIL ADDRESS</label>
              <input type="text" value={email} onChange={e=>setEmail(e.target.value)} />
            </div>
            <div style={{ marginBottom:28 }}>
              <label className="label">PASSWORD</label>
              <input type="password" value={pass} onChange={e=>setPass(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&submit()} placeholder="Enter password (or 'demo' in dev)" />
            </div>

            <button className="btn btn-primary" onClick={submit} disabled={loading}
              style={{ width:"100%", justifyContent:"center", padding:"12px", fontSize:15, letterSpacing:".1em" }}>
              {loading
                ? <span style={{ animation:"rotate 1s linear infinite", display:"inline-block", fontSize:18 }}>◌</span>
                : "ACCESS SYSTEM →"}
            </button>
            <div style={{ textAlign:"center", marginTop:16, fontSize:12, color:"var(--text3)", letterSpacing:".05em" }}>
              {import.meta.env.DEV ? "Use password 'demo' for offline demo mode" : "CONTACT YOUR ADMINISTRATOR FOR CREDENTIALS"}
            </div>
          </div>
          <div className="mono" style={{ textAlign:"center", marginTop:16, fontSize:10, color:"var(--text3)", letterSpacing:".1em" }}>
            FLEETFLOW v2.5.0 · SECURE CHANNEL · {new Date().getFullYear()}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   SIDEBAR
───────────────────────────────────────────────────────────────────────────── */
const NAV_ITEMS = [
  { id:"dashboard",    icon:"⬡", label:"Command Center",    badge:null },
  { id:"vehicles",     icon:"◈", label:"Vehicle Registry",  badge:null },
  { id:"trips",        icon:"⟶", label:"Trip Dispatcher",   badge:"LIVE" },
  { id:"maintenance",  icon:"⚙", label:"Maintenance",       badge:null },
  { id:"fuel",         icon:"◉", label:"Fuel & Expenses",   badge:null },
  { id:"drivers",      icon:"◷", label:"Driver Profiles",   badge:null },
  { id:"analytics",    icon:"▲", label:"Analytics",         badge:null },
];

const Sidebar = ({ page, setPage, role, userName, onLogout }) => (
  <aside style={{ width:240, background:"var(--bg2)", borderRight:"1px solid var(--border)", display:"flex", flexDirection:"column", position:"fixed", top:0, left:0, bottom:0, zIndex:200 }}>
    <div style={{ padding:"24px 20px 20px", borderBottom:"1px solid var(--border)" }}>
      <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:12 }}>
        <div style={{ width:28, height:28, border:"1.5px solid var(--cyan)", display:"flex", alignItems:"center", justifyContent:"center", transform:"rotate(45deg)", flexShrink:0 }}>
          <div style={{ width:10, height:10, background:"var(--cyan)", transform:"rotate(-45deg)" }} />
        </div>
        <span className="rajdhani" style={{ fontSize:20, fontWeight:700, letterSpacing:".08em", color:"var(--cyan)" }}>FLEETFLOW</span>
      </div>
      <div style={{ background:"var(--bg3)", borderRadius:4, padding:"6px 10px", border:"1px solid var(--border2)" }}>
        <div className="mono" style={{ fontSize:9, color:"var(--text3)", letterSpacing:".1em", marginBottom:2 }}>LOGGED IN AS</div>
        <div style={{ fontSize:12, color:"var(--cyan2)", fontWeight:600 }}>{role}</div>
        {userName && <div style={{ fontSize:11, color:"var(--text3)", marginTop:2 }}>{userName}</div>}
      </div>
    </div>

    <nav style={{ flex:1, padding:"12px 10px", overflowY:"auto" }}>
      {NAV_ITEMS.map(n => (
        <button key={n.id} className="btn" onClick={()=>setPage(n.id)} style={{
          width:"100%", justifyContent:"flex-start", gap:10, padding:"10px 12px", borderRadius:6, marginBottom:2,
          background: page===n.id ? "#00e5ff12" : "transparent",
          color: page===n.id ? "var(--cyan)" : "var(--text2)",
          borderLeft: page===n.id ? "2px solid var(--cyan)" : "2px solid transparent",
          textTransform:"none", letterSpacing:"normal", fontSize:13, transition:"all .15s",
        }}>
          <span style={{ fontSize:15, width:20, textAlign:"center" }}>{n.icon}</span>
          <span style={{ flex:1, textAlign:"left", fontWeight: page===n.id ? 600 : 500 }}>{n.label}</span>
          {n.badge && <span className="mono" style={{ fontSize:8, color:"var(--amber)", background:"#ffab0015", border:"1px solid #ffab0030", borderRadius:2, padding:"1px 5px", letterSpacing:".1em" }}>{n.badge}</span>}
        </button>
      ))}
    </nav>

    <div style={{ padding:"16px 20px", borderTop:"1px solid var(--border)" }}>
      <div className="mono" style={{ fontSize:9, color:"var(--text3)", letterSpacing:".08em", marginBottom:10 }}>
        SYS STATUS: <span style={{ color:"var(--green)" }}>ONLINE</span>
      </div>
      <button className="btn btn-ghost" onClick={onLogout} style={{ width:"100%", justifyContent:"center", fontSize:12 }}>
        DISCONNECT
      </button>
    </div>
  </aside>
);

/* ─────────────────────────────────────────────────────────────────────────────
   PAGE HEADER / KPI CARD / FORM PANEL / FIELD
───────────────────────────────────────────────────────────────────────────── */
const PageHeader = ({ label, title, action }) => (
  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-end", marginBottom:28 }}>
    <div>
      <div className="mono" style={{ fontSize:10, color:"var(--cyan)", letterSpacing:".2em", marginBottom:6 }}>// {label}</div>
      <h1 className="rajdhani" style={{ fontSize:32, fontWeight:700, letterSpacing:".02em", lineHeight:1 }}>{title}</h1>
    </div>
    {action}
  </div>
);

const KpiCard = ({ label, value, sub, color, icon, delay=0 }) => (
  <div className="card" style={{ padding:24, animation:`fadeSlideIn .4s cubic-bezier(.22,1,.36,1) ${delay}ms forwards`, opacity:0 }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14 }}>
      <span className="mono" style={{ fontSize:10, color:"var(--text3)", letterSpacing:".12em", textTransform:"uppercase" }}>{label}</span>
      <span style={{ fontSize:20, opacity:.5 }}>{icon}</span>
    </div>
    <div className="mono" style={{ fontSize:38, fontWeight:400, color, lineHeight:1, marginBottom:6, textShadow:`0 0 20px ${color}50` }}>{value}</div>
    <div style={{ fontSize:11, color:"var(--text3)", letterSpacing:".05em" }}>{sub}</div>
    <div style={{ position:"absolute", bottom:0, left:0, right:0, height:2, background:`linear-gradient(90deg, transparent, ${color}60, transparent)` }} />
  </div>
);

const FormPanel = ({ title, children, onSave, onCancel, saveLabel="Save", warn }) => (
  <div className="card" style={{ padding:28, marginBottom:24, borderColor:"var(--border2)", animation:"fadeSlideIn .25s ease forwards" }}>
    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
      <div>
        <div className="mono" style={{ fontSize:10, color:"var(--cyan)", letterSpacing:".15em", marginBottom:4 }}>// INPUT FORM</div>
        <h3 className="rajdhani" style={{ fontSize:18, fontWeight:600, letterSpacing:".03em" }}>{title}</h3>
      </div>
      <button className="btn btn-ghost btn-sm" onClick={onCancel}>✕ Cancel</button>
    </div>
    <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:14 }}>{children}</div>
    {warn && <div style={{ marginTop:14, padding:"10px 14px", background:"#ffab0010", border:"1px solid #ffab0030", borderRadius:4, fontSize:12, color:"var(--amber)", display:"flex", alignItems:"center", gap:8 }}>
      <span>⚠</span> {warn}
    </div>}
    <div style={{ display:"flex", gap:10, marginTop:20 }}>
      <button className="btn btn-primary" onClick={onSave}>{saveLabel}</button>
      <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
    </div>
  </div>
);

const Field = ({ label, children }) => (
  <div>
    <label className="label">{label}</label>
    {children}
  </div>
);

/* ─────────────────────────────────────────────────────────────────────────────
   DASHBOARD PAGE
───────────────────────────────────────────────────────────────────────────── */
const Dashboard = ({ vehicles, trips, drivers, fuelLogs, maintenance }) => {
  const [filter, setFilter] = useState({ type:"All", status:"All", region:"All" });

  const active   = vehicles.filter(v=>v.status==="On Trip").length;
  const inShop   = vehicles.filter(v=>v.status==="In Shop").length;
  const avail    = vehicles.filter(v=>v.status==="Available").length;
  const utilRate = vehicles.length ? Math.round(active/vehicles.length*100) : 0;
  const pending  = trips.filter(t=>t.status==="Draft").length;
  const expiredD = drivers.filter(d=>isExpired(d.expiry)).length;

  const filtered = vehicles.filter(v =>
    (filter.type==="All"   || v.type===filter.type) &&
    (filter.status==="All" || v.status===filter.status) &&
    (filter.region==="All" || v.region===filter.region)
  );

  const activityData = [
    { day:"Mon", trips:4, fuel:380 }, { day:"Tue", trips:6, fuel:510 },
    { day:"Wed", trips:5, fuel:440 }, { day:"Thu", trips:8, fuel:620 },
    { day:"Fri", trips:7, fuel:580 }, { day:"Sat", trips:3, fuel:290 },
    { day:"Sun", trips:2, fuel:180 },
  ];

  return (
    <div className="page-anim">
      <PageHeader label="LIVE OVERVIEW" title="Command Center" />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        <KpiCard label="Active Fleet"    value={active}         sub={`${vehicles.length} total vehicles`}         color="#00e5ff" icon="◈" delay={0}   />
        <KpiCard label="In Maintenance"  value={inShop}         sub="Currently in shop"                           color="#ffab00" icon="⚙" delay={60}  />
        <KpiCard label="Utilization"     value={`${utilRate}%`} sub={`${avail} idle · ${active} deployed`}        color="#00e676" icon="▲" delay={120} />
        <KpiCard label="Pending Cargo"   value={pending}        sub="Awaiting assignment"                          color="#e040fb" icon="⟶" delay={180} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 340px", gap:16, marginBottom:16 }}>
        <div className="card" style={{ padding:24 }}>
          <div className="mono" style={{ fontSize:10, color:"var(--text3)", letterSpacing:".12em", marginBottom:4 }}>WEEKLY ACTIVITY</div>
          <div className="rajdhani" style={{ fontSize:18, fontWeight:600, marginBottom:20 }}>Trip & Fuel Overview</div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={activityData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2d45" vertical={false} />
              <XAxis dataKey="day" tick={{ fill:"#4a6070", fontSize:11, fontFamily:"Share Tech Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"#4a6070", fontSize:10, fontFamily:"Share Tech Mono" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:"#0c1420", border:"1px solid #1a2d45", borderRadius:6, fontFamily:"Share Tech Mono", fontSize:12, color:"#cdd9e5" }} />
              <Bar dataKey="trips" fill="#00e5ff" radius={[3,3,0,0]} opacity={.85} />
              <Bar dataKey="fuel"  fill="#ffab00" radius={[3,3,0,0]} opacity={.6} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ display:"flex", gap:20, marginTop:10 }}>
            {[["#00e5ff","Trips"],["#ffab00","Fuel (L)"]].map(([c,l])=>(
              <div key={l} style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:10, height:10, background:c, borderRadius:2 }} />
                <span className="mono" style={{ fontSize:10, color:"var(--text3)" }}>{l}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="card" style={{ padding:24 }}>
          <div className="mono" style={{ fontSize:10, color:"var(--text3)", letterSpacing:".12em", marginBottom:4 }}>FLEET STATUS</div>
          <div className="rajdhani" style={{ fontSize:18, fontWeight:600, marginBottom:16 }}>Distribution</div>
          <ResponsiveContainer width="100%" height={140}>
            <PieChart>
              <Pie data={[
                { name:"Available", value:avail },
                { name:"On Trip",   value:active },
                { name:"In Shop",   value:inShop },
                { name:"Retired",   value:vehicles.filter(v=>v.status==="Out of Service").length }
              ]} cx="50%" cy="50%" innerRadius={40} outerRadius={65} paddingAngle={3} dataKey="value">
                {["#00e676","#00e5ff","#ffab00","#ff1744"].map((c,i)=><Cell key={i} fill={c} />)}
              </Pie>
              <Tooltip contentStyle={{ background:"#0c1420", border:"1px solid #1a2d45", borderRadius:6, fontFamily:"Share Tech Mono", fontSize:11 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, marginTop:8 }}>
            {[["#00e676","Available",avail],["#00e5ff","On Trip",active],["#ffab00","In Shop",inShop],["#ff1744","Retired",vehicles.filter(v=>v.status==="Out of Service").length]].map(([c,l,v])=>(
              <div key={l} style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:8, height:8, borderRadius:"50%", background:c, flexShrink:0 }} />
                <span style={{ fontSize:11, color:"var(--text3)" }}>{l}</span>
                <span className="mono" style={{ fontSize:11, color:c, marginLeft:"auto" }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {expiredD > 0 && (
        <div style={{ padding:"12px 18px", background:"#ff174410", border:"1px solid #ff174430", borderRadius:6, marginBottom:16, display:"flex", alignItems:"center", gap:10, fontSize:13 }}>
          <span style={{ color:"var(--red)", fontSize:16 }}>⚠</span>
          <span style={{ color:"var(--red)", fontWeight:600 }}>{expiredD} driver(s) with expired licenses</span>
          <span style={{ color:"var(--text2)" }}>— they are blocked from trip assignment.</span>
        </div>
      )}

      <div className="card">
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)", display:"flex", gap:10, alignItems:"center", flexWrap:"wrap" }}>
          <span style={{ fontSize:12, color:"var(--text2)", fontWeight:600, marginRight:4 }}>FILTER:</span>
          {[["type",["All","Truck","Van","Bike"]],["status",["All","Available","On Trip","In Shop","Out of Service"]],["region",["All","North","South","East","West"]]].map(([k,opts])=>(
            <select key={k} value={filter[k]} onChange={e=>setFilter(f=>({...f,[k]:e.target.value}))} style={{ width:"auto", fontSize:12, padding:"6px 10px" }}>
              {opts.map(o=><option key={o}>{o}</option>)}
            </select>
          ))}
          <span className="mono" style={{ marginLeft:"auto", fontSize:11, color:"var(--text3)" }}>{filtered.length} RECORDS</span>
        </div>
        <table>
          <thead><tr><th>VEHICLE</th><th>PLATE</th><th>TYPE</th><th>REGION</th><th>CAPACITY</th><th>ODOMETER</th><th>STATUS</th></tr></thead>
          <tbody>
            {filtered.map(v=>(
              <tr key={v.id}>
                <td style={{ fontWeight:600 }}>{v.name}</td>
                <td className="mono" style={{ color:"var(--text2)", fontSize:12 }}>{v.plate}</td>
                <td style={{ color:"var(--text2)" }}>{v.type}</td>
                <td style={{ color:"var(--text2)" }}>{v.region}</td>
                <td className="mono" style={{ color:"var(--cyan2)" }}>{v.capacity.toLocaleString()} kg</td>
                <td className="mono" style={{ color:"var(--text2)" }}>{v.odometer.toLocaleString()} km</td>
                <td><Tag s={v.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   VEHICLE REGISTRY
───────────────────────────────────────────────────────────────────────────── */
const Vehicles = ({ vehicles, setVehicles, notify }) => {
  const blank = { name:"", plate:"", type:"Van", capacity:"", odometer:"", region:"North", acqCost:"", year:"" };
  const [form,    setForm]    = useState(blank);
  const [editing, setEditing] = useState(null);
  const [show,    setShow]    = useState(false);
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const save = async () => {
    if (!form.name || !form.plate || !form.capacity) { notify("Fill all required fields","error"); return; }
    try {
      if (editing) {
        const updated = await updateVehicle(Number(editing), form);
        setVehicles(vs => vs.map(v => v.id===editing ? updated : v));
        notify("Vehicle updated");
      } else {
        if (vehicles.find(v=>v.plate===form.plate)) { notify("Plate already exists","error"); return; }
        const created = await createVehicle(form);
        setVehicles(vs => [...vs, created]);
        notify("Vehicle registered");
      }
    } catch (e) { notify(e.message, "error"); }
    setForm(blank); setEditing(null); setShow(false);
  };

  const edit   = v => { setForm({ name:v.name, plate:v.plate, type:v.type, capacity:v.capacity, odometer:v.odometer, region:v.region, acqCost:v.acqCost, year:v.year||"" }); setEditing(v.id); setShow(true); };
  const retire = async v => {
    try {
      const isRetired = v.status === "Out of Service";
      const updated = await setVehicleRetired(Number(v.id), !isRetired);
      setVehicles(vs => vs.map(x => x.id===v.id ? updated : x));
      notify("Vehicle status updated");
    } catch (e) { notify(e.message, "error"); }
  };

  return (
    <div className="page-anim">
      <PageHeader label="ASSET MANAGEMENT" title="Vehicle Registry"
        action={<button className="btn btn-primary" onClick={()=>{setShow(!show);setEditing(null);setForm(blank);}}>+ Register Vehicle</button>} />

      {show && (
        <FormPanel title={editing?"Edit Vehicle":"Register New Asset"} onSave={save} onCancel={()=>setShow(false)} saveLabel={editing?"Update Vehicle":"Register"}>
          <Field label="Name / Model *"><input value={form.name} onChange={f("name")} placeholder="e.g. Ford Transit" /></Field>
          <Field label="License Plate *"><input value={form.plate} onChange={f("plate")} placeholder="e.g. VAN-007" /></Field>
          <Field label="Vehicle Type"><select value={form.type} onChange={f("type")}><option>Truck</option><option>Van</option><option>Bike</option></select></Field>
          <Field label="Max Capacity (kg) *"><input type="number" value={form.capacity} onChange={f("capacity")} /></Field>
          <Field label="Odometer (km)"><input type="number" value={form.odometer} onChange={f("odometer")} /></Field>
          <Field label="Acquisition Cost ($)"><input type="number" value={form.acqCost} onChange={f("acqCost")} /></Field>
          <Field label="Region"><select value={form.region} onChange={f("region")}><option>North</option><option>South</option><option>East</option><option>West</option></select></Field>
          <Field label="Year"><input type="number" value={form.year} onChange={f("year")} placeholder="2023" /></Field>
        </FormPanel>
      )}

      <div className="card">
        <table>
          <thead><tr><th>VEHICLE</th><th>PLATE</th><th>TYPE</th><th>CAPACITY</th><th>ODOMETER</th><th>REGION</th><th>YEAR</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
          <tbody>
            {vehicles.map((v,i)=>(
              <tr key={v.id} style={{ animation:`fadeSlideIn .3s ease ${i*40}ms both` }}>
                <td style={{ fontWeight:600 }}>{v.name}</td>
                <td className="mono" style={{ color:"var(--text2)", fontSize:12 }}>{v.plate}</td>
                <td><span className="tag" style={{ background:"var(--bg3)", color:"var(--text2)", border:"1px solid var(--border2)", fontSize:11 }}>{v.type}</span></td>
                <td className="mono" style={{ color:"var(--cyan2)" }}>{v.capacity.toLocaleString()} kg</td>
                <td className="mono" style={{ color:"var(--text2)" }}>{v.odometer.toLocaleString()} km</td>
                <td style={{ color:"var(--text2)" }}>{v.region}</td>
                <td className="mono" style={{ color:"var(--text3)" }}>{v.year||"—"}</td>
                <td><Tag s={v.status} /></td>
                <td>
                  <div style={{ display:"flex", gap:8 }}>
                    <button className="btn btn-ghost btn-sm" onClick={()=>edit(v)}>Edit</button>
                    <button className={`btn btn-sm ${v.status==="Out of Service"?"btn-success":"btn-danger"}`} onClick={()=>retire(v)}>
                      {v.status==="Out of Service"?"Restore":"Retire"}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   TRIP DISPATCHER
───────────────────────────────────────────────────────────────────────────── */
const Trips = ({ vehicles, setVehicles, drivers, setDrivers, trips, setTrips, notify }) => {
  const blank = { vehicleId:"", driverId:"", origin:"", dest:"", cargo:"", revenue:"", notes:"" };
  const [form, setForm] = useState(blank);
  const [show, setShow] = useState(false);
  const [err,  setErr]  = useState("");
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const availV = vehicles.filter(v=>v.status==="Available");
  const availD = drivers.filter(d=>d.status==="On Duty" && !isExpired(d.expiry));

  const selV    = vehicles.find(v=>v.id===form.vehicleId);
  const overload = selV && form.cargo && +form.cargo > selV.capacity;

  const dispatch = async () => {
    setErr("");
    const v = vehicles.find(x=>x.id===form.vehicleId);
    const d = drivers.find(x=>x.id===form.driverId);
    if (!v||!d||!form.origin||!form.dest||!form.cargo) { setErr("Please complete all required fields."); return; }
    if (+form.cargo > v.capacity) { setErr(`⚠ Cargo weight (${form.cargo}kg) exceeds max capacity (${v.capacity}kg). Load rejected.`); return; }
    const categories = (d.category||"").split(",").map(c=>c.trim());
    if (categories.length && !categories.some(c=>v.type.toLowerCase().includes(c.toLowerCase()))) {
      setErr(`Driver "${d.name}" is not licensed for ${v.type} vehicles.`); return;
    }
    try {
      const created = await createTrip(form, true); // asDraft=true
      setTrips(ts => [...ts, created]);
      notify("Trip created as draft");
    } catch (e) {
      setErr(e.message);
      return;
    }
    setForm(blank); setShow(false);
  };

  const doUpdateStatus = async (id, ns) => {
    const t = trips.find(x=>x.id===id);
    try {
      const updated = await updateTripStatus(t, ns);
      setTrips(ts => ts.map(x => x.id===id ? updated : x));
      // Sync vehicle/driver status locally (server already updated DB)
      if (ns==="Dispatched") {
        setVehicles(vs => vs.map(v=>v.id===t.vehicleId?{...v,status:"On Trip"}:v));
        setDrivers(ds  => ds.map(d=>d.id===t.driverId ?{...d,status:"On Trip"}:d));
      }
      if (ns==="Completed"||ns==="Cancelled") {
        setVehicles(vs => vs.map(v=>v.id===t.vehicleId?{...v,status:"Available"}:v));
        setDrivers(ds  => ds.map(d=>d.id===t.driverId ?{...d,status:"On Duty", trips:ns==="Completed"?d.trips+1:d.trips}:d));
        notify(ns==="Completed"?"Trip completed — vehicle returned to pool":"Trip cancelled");
      }
    } catch (e) { notify(e.message, "error"); }
  };

  const LIFECYCLE = ["Draft","Dispatched","Completed","Cancelled"];

  return (
    <div className="page-anim">
      <PageHeader label="DISPATCH OPERATIONS" title="Trip Dispatcher"
        action={<button className="btn btn-primary" onClick={()=>setShow(!show)}>+ New Trip</button>} />

      {show && (
        <FormPanel title="Create New Trip" onSave={dispatch} onCancel={()=>{setShow(false);setErr("");}} saveLabel="Save as Draft"
          warn={overload ? `Cargo (${form.cargo}kg) will EXCEED capacity (${selV?.capacity}kg). Dispatch will be blocked.` : null}>
          {err && <div style={{ gridColumn:"1/-1", padding:"10px 14px", background:"#ff174412", border:"1px solid #ff174430", borderRadius:4, color:"var(--red)", fontSize:13 }}>{err}</div>}
          <Field label="Select Vehicle *">
            <select value={form.vehicleId} onChange={f("vehicleId")}>
              <option value="">— Select Available Vehicle —</option>
              {availV.map(v=><option key={v.id} value={v.id}>{v.name} · {v.plate} · {v.capacity}kg cap</option>)}
            </select>
          </Field>
          <Field label="Select Driver *">
            <select value={form.driverId} onChange={f("driverId")}>
              <option value="">— Select Active Driver —</option>
              {availD.map(d=><option key={d.id} value={d.id}>{d.name} · {d.category}</option>)}
            </select>
          </Field>
          <Field label="Cargo Weight (kg) *"><input type="number" value={form.cargo} onChange={f("cargo")} style={{ borderColor: overload ? "var(--red)" : undefined }} /></Field>
          <Field label="Origin *"><input value={form.origin} onChange={f("origin")} placeholder="e.g. Warehouse A" /></Field>
          <Field label="Destination *"><input value={form.dest} onChange={f("dest")} placeholder="e.g. Downtown Hub" /></Field>
          <Field label="Expected Revenue ($)"><input type="number" value={form.revenue} onChange={f("revenue")} /></Field>
        </FormPanel>
      )}

      <div style={{ display:"grid", gap:10 }}>
        {[...trips].reverse().map((t,i) => {
          const v = vehicles.find(vv=>vv.id===t.vehicleId);
          const d = drivers.find(dd=>dd.id===t.driverId);
          return (
            <div key={t.id} className="card" style={{ padding:20, animation:`fadeSlideIn .3s ease ${i*30}ms both` }}>
              <div style={{ display:"flex", gap:20, alignItems:"center", flexWrap:"wrap" }}>
                <div className="mono" style={{ color:"var(--amber)", fontSize:12, minWidth:70 }}>{t.id}</div>
                <div style={{ flex:1, minWidth:180 }}>
                  <div style={{ fontWeight:600, marginBottom:3 }}>{t.origin} <span style={{ color:"var(--cyan)", margin:"0 6px" }}>→</span> {t.dest}</div>
                  <div style={{ fontSize:12, color:"var(--text2)" }}>{v?.name||"—"} · <span style={{ color:"var(--text3)" }}>{d?.name||"—"}</span></div>
                </div>
                <div className="mono" style={{ fontSize:12, color:"var(--text2)", minWidth:80 }}>{t.cargo.toLocaleString()} kg</div>
                <div className="mono" style={{ fontSize:12, color:"var(--green)" }}>${t.revenue.toLocaleString()}</div>
                <div className="mono" style={{ fontSize:11, color:"var(--text3)" }}>{t.date}</div>
                <Tag s={t.status} />
                <div style={{ display:"flex", gap:8 }}>
                  {t.status==="Draft"      && <><button className="btn btn-success btn-sm" onClick={()=>doUpdateStatus(t.id,"Dispatched")}>Dispatch</button><button className="btn btn-danger btn-sm" onClick={()=>doUpdateStatus(t.id,"Cancelled")}>Cancel</button></>}
                  {t.status==="Dispatched" && <button className="btn btn-success btn-sm" onClick={()=>doUpdateStatus(t.id,"Completed")}>Complete</button>}
                </div>
              </div>
              <div style={{ display:"flex", alignItems:"center", marginTop:14, gap:0 }}>
                {LIFECYCLE.map((step,idx)=>{
                  const active = t.status===step;
                  const past   = LIFECYCLE.indexOf(t.status)>idx && t.status!=="Cancelled";
                  const color  = step==="Cancelled"?"var(--red)": step==="Completed"?"var(--green)": past||active ? "var(--cyan)" : "var(--text3)";
                  return (
                    <div key={step} style={{ display:"flex", alignItems:"center", flex: idx<LIFECYCLE.length-1 ? 1 : "none" }}>
                      <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
                        <div style={{ width:8, height:8, borderRadius:"50%", background: active||past ? color:"var(--bg3)", border:`1.5px solid ${color}`, boxShadow: active?`0 0 8px ${color}`:undefined }} />
                        <span className="mono" style={{ fontSize:9, color, letterSpacing:".05em", whiteSpace:"nowrap" }}>{step.toUpperCase()}</span>
                      </div>
                      {idx<LIFECYCLE.length-1 && <div style={{ flex:1, height:1, background:`linear-gradient(90deg, ${color}, var(--border))`, margin:"0 4px", marginBottom:14 }} />}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   MAINTENANCE PAGE
───────────────────────────────────────────────────────────────────────────── */
const Maintenance = ({ vehicles, setVehicles, maintenance, setMaintenance, notify }) => {
  const blank = { vehicleId:"", type:"Oil Change", date:"", cost:"", notes:"" };
  const [form, setForm] = useState(blank);
  const [show, setShow] = useState(false);
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const save = async () => {
    if (!form.vehicleId||!form.date||!form.cost) { notify("Fill required fields","error"); return; }
    try {
      const created = await createMaintenance(form);
      setMaintenance(ms => [...ms, created]);
      setVehicles(vs => vs.map(v => v.id===form.vehicleId ? {...v, status:"In Shop"} : v));
      notify("Service logged — vehicle set to In Shop");
    } catch (e) { notify(e.message, "error"); }
    setForm(blank); setShow(false);
  };

  const complete = async id => {
    const log = maintenance.find(m=>m.id===id);
    try {
      const updated = await completeMaintenance(Number(id));
      setMaintenance(ms => ms.map(m => m.id===id ? updated : m));
      setVehicles(vs => vs.map(v => v.id===log.vehicleId&&v.status==="In Shop" ? {...v,status:"Available"} : v));
      notify("Service completed — vehicle available");
    } catch (e) { notify(e.message, "error"); }
  };

  const totalCost = maintenance.reduce((a,m)=>a+m.cost,0);

  return (
    <div className="page-anim">
      <PageHeader label="FLEET HEALTH" title="Maintenance Logs"
        action={<button className="btn btn-primary" onClick={()=>setShow(!show)}>+ Log Service</button>} />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24 }}>
        {[
          ["Total Logged",maintenance.length,"records","◈","var(--cyan)"],
          ["Active Jobs",maintenance.filter(m=>m.status==="In Progress").length,"in progress","⚙","var(--amber)"],
          ["Total Spend","$"+totalCost.toLocaleString(),"maintenance cost","▲","var(--red)"],
        ].map(([l,v,s,i,c])=><KpiCard key={l} label={l} value={v} sub={s} icon={i} color={c} />)}
      </div>

      {show && (
        <FormPanel title="Log Service Entry" onSave={save} onCancel={()=>setShow(false)} saveLabel="Log Service"
          warn="Adding this log will automatically set the vehicle status to 'In Shop'.">
          <Field label="Vehicle *">
            <select value={form.vehicleId} onChange={f("vehicleId")}>
              <option value="">— Select Vehicle —</option>
              {vehicles.filter(v=>v.status!=="Out of Service").map(v=><option key={v.id} value={v.id}>{v.name} ({v.plate}) · {v.status}</option>)}
            </select>
          </Field>
          <Field label="Service Type">
            <select value={form.type} onChange={f("type")}>
              {["Oil Change","Tire Rotation","Brake Service","Engine Repair","Transmission","Electrical","Body Work","Full Inspection"].map(t=><option key={t}>{t}</option>)}
            </select>
          </Field>
          <Field label="Date *"><input type="date" value={form.date} onChange={f("date")} /></Field>
          <Field label="Cost ($) *"><input type="number" value={form.cost} onChange={f("cost")} /></Field>
          <Field label="Notes"><input value={form.notes} onChange={f("notes")} placeholder="Additional details..." /></Field>
        </FormPanel>
      )}

      <div className="card">
        <table>
          <thead><tr><th>ID</th><th>VEHICLE</th><th>SERVICE TYPE</th><th>DATE</th><th>COST</th><th>NOTES</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
          <tbody>
            {[...maintenance].reverse().map(m=>{
              const v = vehicles.find(vv=>vv.id===m.vehicleId);
              return (
                <tr key={m.id}>
                  <td className="mono" style={{ color:"var(--amber)", fontSize:12 }}>{m.id}</td>
                  <td style={{ fontWeight:600 }}>{v?.name||m.vehicleId}</td>
                  <td style={{ color:"var(--text2)" }}>{m.type}</td>
                  <td className="mono" style={{ color:"var(--text3)", fontSize:12 }}>{m.date}</td>
                  <td className="mono" style={{ color:"var(--red)" }}>${m.cost.toLocaleString()}</td>
                  <td style={{ color:"var(--text3)", fontSize:12, maxWidth:200 }}>{m.notes||"—"}</td>
                  <td><Tag s={m.status} /></td>
                  <td>{m.status==="In Progress" && <button className="btn btn-success btn-sm" onClick={()=>complete(m.id)}>Mark Complete</button>}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   FUEL & EXPENSES PAGE
───────────────────────────────────────────────────────────────────────────── */
const Fuel = ({ vehicles, fuelLogs, setFuelLogs, maintenance, notify }) => {
  const blank = { vehicleId:"", liters:"", cost:"", date:"", km:"" };
  const [form, setForm] = useState(blank);
  const [show, setShow] = useState(false);
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const save = async () => {
    if (!form.vehicleId||!form.liters||!form.cost||!form.date) { notify("Fill required fields","error"); return; }
    try {
      const created = await createFuelLog(form);
      setFuelLogs(fl => [...fl, created]);
      notify("Fuel log saved");
    } catch (e) { notify(e.message, "error"); }
    setForm(blank); setShow(false);
  };

  const getOps = id => ({
    fuel:  fuelLogs.filter(f=>f.vehicleId===id).reduce((a,b)=>a+b.cost,0),
    maint: maintenance.filter(m=>m.vehicleId===id).reduce((a,b)=>a+b.cost,0),
  });

  const totalFuel  = fuelLogs.reduce((a,b)=>a+b.cost,0);
  const totalMaint = maintenance.reduce((a,b)=>a+b.cost,0);

  return (
    <div className="page-anim">
      <PageHeader label="FINANCIAL TRACKING" title="Fuel & Expenses"
        action={<button className="btn btn-primary" onClick={()=>setShow(!show)}>+ Log Fuel</button>} />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:16, marginBottom:24 }}>
        <KpiCard label="Total Fuel Spend"  value={"$"+totalFuel.toLocaleString()}  sub="All vehicles combined"     color="var(--amber)" icon="◉" />
        <KpiCard label="Total Maintenance" value={"$"+totalMaint.toLocaleString()} sub="All service records"        color="var(--red)"   icon="⚙" />
        <KpiCard label="Total OpCost"      value={"$"+(totalFuel+totalMaint).toLocaleString()} sub="Fuel + Maintenance" color="var(--purple)" icon="▲" />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:12, marginBottom:24 }}>
        {vehicles.map(v=>{
          const ops  = getOps(v.id);
          const vFuel = fuelLogs.filter(fl=>fl.vehicleId===v.id);
          const km   = vFuel.reduce((a,b)=>a+b.km,0);
          const l    = vFuel.reduce((a,b)=>a+b.liters,0);
          const eff  = km&&l ? (km/l).toFixed(1) : "—";
          return (
            <div key={v.id} className="card" style={{ padding:20 }}>
              <div style={{ fontWeight:600, marginBottom:4 }}>{v.name}</div>
              <div className="mono" style={{ fontSize:11, color:"var(--text3)", marginBottom:12 }}>{v.plate}</div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:6 }}>
                <span style={{ fontSize:12, color:"var(--text2)" }}>Fuel</span>
                <span className="mono" style={{ fontSize:13, color:"var(--amber)" }}>${ops.fuel.toLocaleString()}</span>
              </div>
              <div style={{ display:"flex", justifyContent:"space-between", marginBottom:12 }}>
                <span style={{ fontSize:12, color:"var(--text2)" }}>Maint.</span>
                <span className="mono" style={{ fontSize:13, color:"var(--red)" }}>${ops.maint.toLocaleString()}</span>
              </div>
              <div style={{ borderTop:"1px solid var(--border)", paddingTop:10, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <span style={{ fontSize:11, fontWeight:600 }}>Total OpCost</span>
                <span className="mono" style={{ color:"var(--cyan)", fontSize:14, fontWeight:400 }}>${(ops.fuel+ops.maint).toLocaleString()}</span>
              </div>
              <div style={{ marginTop:8, display:"flex", justifyContent:"space-between" }}>
                <span style={{ fontSize:11, color:"var(--text3)" }}>Efficiency</span>
                <span className="mono" style={{ fontSize:12, color:"var(--green)" }}>{eff !== "—" ? `${eff} km/L` : "—"}</span>
              </div>
            </div>
          );
        })}
      </div>

      {show && (
        <FormPanel title="Log Fuel Entry" onSave={save} onCancel={()=>setShow(false)} saveLabel="Save Entry">
          <Field label="Vehicle *">
            <select value={form.vehicleId} onChange={f("vehicleId")}>
              <option value="">— Select Vehicle —</option>
              {vehicles.map(v=><option key={v.id} value={v.id}>{v.name}</option>)}
            </select>
          </Field>
          <Field label="Liters *"><input type="number" value={form.liters} onChange={f("liters")} /></Field>
          <Field label="Cost ($) *"><input type="number" value={form.cost} onChange={f("cost")} /></Field>
          <Field label="Distance (km)"><input type="number" value={form.km} onChange={f("km")} /></Field>
          <Field label="Date *"><input type="date" value={form.date} onChange={f("date")} /></Field>
        </FormPanel>
      )}

      <div className="card">
        <table>
          <thead><tr><th>ID</th><th>VEHICLE</th><th>DATE</th><th>LITERS</th><th>DISTANCE</th><th>COST</th><th>EFFICIENCY</th></tr></thead>
          <tbody>
            {[...fuelLogs].reverse().map(fl=>{
              const v   = vehicles.find(vv=>vv.id===fl.vehicleId);
              const eff = fl.km&&fl.liters ? (fl.km/fl.liters).toFixed(1) : "—";
              return (
                <tr key={fl.id}>
                  <td className="mono" style={{ color:"var(--amber)", fontSize:12 }}>{fl.id}</td>
                  <td style={{ fontWeight:600 }}>{v?.name||fl.vehicleId}</td>
                  <td className="mono" style={{ color:"var(--text3)", fontSize:12 }}>{fl.date}</td>
                  <td className="mono" style={{ color:"var(--text2)" }}>{fl.liters} L</td>
                  <td className="mono" style={{ color:"var(--text2)" }}>{fl.km ? `${fl.km} km` : "—"}</td>
                  <td className="mono" style={{ color:"var(--red)" }}>${fl.cost}</td>
                  <td className="mono" style={{ color:"var(--green)" }}>{eff!=="—"?`${eff} km/L`:"—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   DRIVER PROFILES
───────────────────────────────────────────────────────────────────────────── */
const Drivers = ({ drivers, setDrivers, notify }) => {
  const blank = { name:"", license:"", expiry:"", category:"Van", phone:"", score:85 };
  const [form, setForm] = useState(blank);
  const [show, setShow] = useState(false);
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const save = async () => {
    if (!form.name||!form.license||!form.expiry) { notify("Fill required fields","error"); return; }
    try {
      const created = await createDriver(form);
      setDrivers(ds => [...ds, created]);
      notify("Driver registered");
    } catch (e) { notify(e.message, "error"); }
    setForm(blank); setShow(false);
  };

  const cycleStatus = async id => {
    const d = drivers.find(x=>x.id===id);
    const cycle = ["On Duty","Off Duty","Suspended"];
    const next  = cycle[(cycle.indexOf(d.status)+1)%3];
    try {
      const updated = await updateDriverStatus(Number(id), next);
      setDrivers(ds => ds.map(x => x.id===id ? updated : x));
      notify("Driver status updated");
    } catch (e) { notify(e.message, "error"); }
  };

  return (
    <div className="page-anim">
      <PageHeader label="HR & COMPLIANCE" title="Driver Profiles"
        action={<button className="btn btn-primary" onClick={()=>setShow(!show)}>+ Add Driver</button>} />

      {show && (
        <FormPanel title="Register Driver" onSave={save} onCancel={()=>setShow(false)} saveLabel="Register">
          <Field label="Full Name *"><input value={form.name} onChange={f("name")} /></Field>
          <Field label="License Number *"><input value={form.license} onChange={f("license")} /></Field>
          <Field label="License Expiry *"><input type="date" value={form.expiry} onChange={f("expiry")} /></Field>
          <Field label="Vehicle Category"><input value={form.category} onChange={f("category")} placeholder="e.g. Van,Truck" /></Field>
          <Field label="Phone"><input value={form.phone} onChange={f("phone")} /></Field>
          <Field label="Initial Safety Score"><input type="number" min="0" max="100" value={form.score} onChange={f("score")} /></Field>
        </FormPanel>
      )}

      <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:16 }}>
        {drivers.map((d,i)=>{
          const expired      = isExpired(d.expiry);
          const expiringSoon = isExpiringSoon(d.expiry);
          const scoreColor   = d.score>=90?"var(--green)":d.score>=70?"var(--amber)":"var(--red)";
          return (
            <div key={d.id} className="card" style={{ padding:24, animation:`fadeSlideIn .3s ease ${i*60}ms both` }}>
              <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:18 }}>
                <div style={{ width:52, height:52, borderRadius:"50%", background:"var(--bg3)", border:`2px solid ${d.status==="On Duty"?"var(--cyan)":"var(--border2)"}`, display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, fontWeight:800, color:"var(--cyan)", flexShrink:0, boxShadow: d.status==="On Duty"?"0 0 15px #00e5ff25":undefined }}>
                  {d.name.charAt(0)}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:17, marginBottom:3 }}>{d.name}</div>
                  <div className="mono" style={{ fontSize:11, color:"var(--text3)" }}>{d.license} · {d.category}</div>
                  {d.phone && <div style={{ fontSize:11, color:"var(--text3)", marginTop:2 }}>{d.phone}</div>}
                </div>
                <Tag s={d.status} />
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:8, marginBottom:16 }}>
                {[
                  [d.trips,"#3b82f6","Trips"],
                  [d.score,scoreColor,"Safety"],
                ].map(([val,col,lbl])=>(
                  <div key={lbl} style={{ background:"var(--bg3)", borderRadius:6, padding:12, textAlign:"center", border:"1px solid var(--border)" }}>
                    <div className="mono" style={{ fontSize:24, color:col, lineHeight:1, marginBottom:4 }}>{val}</div>
                    <div style={{ fontSize:10, color:"var(--text3)", letterSpacing:".1em", textTransform:"uppercase" }}>{lbl}</div>
                  </div>
                ))}
                <div style={{ background:"var(--bg3)", borderRadius:6, padding:12, textAlign:"center", border:`1px solid ${expired?"#ff174430":expiringSoon?"#ffab0030":"var(--border)"}` }}>
                  <div className="mono" style={{ fontSize:11, color:expired?"var(--red)":expiringSoon?"var(--amber)":"var(--text3)", lineHeight:1.4 }}>{d.expiry}</div>
                  <div style={{ fontSize:10, color:"var(--text3)", letterSpacing:".1em", textTransform:"uppercase", marginTop:4 }}>Expiry</div>
                </div>
              </div>

              {expired     && <div style={{ padding:"6px 12px", background:"#ff174412", border:"1px solid #ff174430", borderRadius:4, fontSize:11, color:"var(--red)", marginBottom:12, fontWeight:700 }}>⚠ LICENSE EXPIRED — Blocked from all assignments</div>}
              {expiringSoon && !expired && <div style={{ padding:"6px 12px", background:"#ffab0012", border:"1px solid #ffab0030", borderRadius:4, fontSize:11, color:"var(--amber)", marginBottom:12 }}>⚠ License expires within 90 days — renew soon</div>}

              <div style={{ marginBottom:14 }}>
                <div style={{ display:"flex", justifyContent:"space-between", marginBottom:4 }}>
                  <span style={{ fontSize:10, color:"var(--text3)", letterSpacing:".1em", textTransform:"uppercase" }}>Safety Score</span>
                  <span className="mono" style={{ fontSize:11, color:scoreColor }}>{d.score}/100</span>
                </div>
                <div style={{ height:4, background:"var(--bg3)", borderRadius:2, overflow:"hidden" }}>
                  <div style={{ height:"100%", width:`${d.score}%`, background:scoreColor, borderRadius:2, boxShadow:`0 0 8px ${scoreColor}60`, transition:"width .5s ease" }} />
                </div>
              </div>

              <button className="btn btn-ghost btn-sm" onClick={()=>cycleStatus(d.id)} style={{ width:"100%", justifyContent:"center" }}>
                Change Status →
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   ANALYTICS PAGE
───────────────────────────────────────────────────────────────────────────── */
const Analytics = ({ vehicles, trips, fuelLogs, maintenance }) => {
  const [month, setMonth] = useState("All");

  // Fixed: actually filter data by selected month
  const filterByMonth = items => {
    if (month === "All") return items;
    const [mon, yr] = month.split(" ");
    const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
    const targetMonth = MONTHS.indexOf(mon);
    const targetYear  = Number(yr);
    return items.filter(item => {
      const d = new Date(item.date);
      return d.getMonth() === targetMonth && d.getFullYear() === targetYear;
    });
  };

  const filteredTrips = filterByMonth(trips);
  const filteredFuel  = filterByMonth(fuelLogs);
  const filteredMaint = filterByMonth(maintenance);

  const totRev    = filteredTrips.filter(t=>t.status==="Completed").reduce((a,b)=>a+(b.revenue||0),0);
  const totFuel   = filteredFuel.reduce((a,b)=>a+b.cost,0);
  const totMaint  = filteredMaint.reduce((a,b)=>a+b.cost,0);
  const netProfit = totRev - totFuel - totMaint;
  const margin    = totRev>0 ? (netProfit/totRev*100).toFixed(1) : 0;

  const roiData = vehicles.map(v=>{
    const vFuel  = filteredFuel.filter(f=>f.vehicleId===v.id).reduce((a,b)=>a+b.cost,0);
    const vMaint = filteredMaint.filter(m=>m.vehicleId===v.id).reduce((a,b)=>a+b.cost,0);
    const vRev   = filteredTrips.filter(t=>t.vehicleId===v.id&&t.status==="Completed").reduce((a,b)=>a+(b.revenue||0),0);
    const vKm    = filteredFuel.filter(f=>f.vehicleId===v.id).reduce((a,b)=>a+b.km,0);
    const vL     = filteredFuel.filter(f=>f.vehicleId===v.id).reduce((a,b)=>a+b.liters,0);
    const roi    = v.acqCost>0 ? ((vRev-(vMaint+vFuel))/v.acqCost*100).toFixed(1) : 0;
    const eff    = vKm&&vL ? (vKm/vL).toFixed(1) : 0;
    return { name:v.plate, roi:+roi, eff:+eff, rev:vRev, fuel:vFuel, maint:vMaint };
  });

  const effData = roiData.map(r=>({ name:r.name, eff:r.eff }));

  // Derive available month options from actual data dates
  const monthOptions = ["All", ...Array.from(new Set([...trips,...fuelLogs,...maintenance].map(x=>{
    if (!x.date) return null;
    const d = new Date(x.date);
    return `${["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"][d.getMonth()]} ${d.getFullYear()}`;
  }).filter(Boolean))).sort()];

  const downloadCSV = () => {
    const rows = [["Trip ID","Origin","Destination","Cargo","Revenue","Status","Date"],...filteredTrips.map(t=>[t.id,t.origin,t.dest,t.cargo,t.revenue,t.status,t.date])];
    const csv  = rows.map(r=>r.join(",")).join("\n");
    const a    = document.createElement("a"); a.href = "data:text/csv," + encodeURIComponent(csv); a.download = "fleetflow_trips.csv"; a.click();
  };

  return (
    <div className="page-anim">
      <PageHeader label="BUSINESS INTELLIGENCE" title="Analytics & Reports"
        action={<div style={{ display:"flex", gap:10 }}>
          <select value={month} onChange={e=>setMonth(e.target.value)} style={{ width:"auto", fontSize:12, padding:"7px 12px" }}>
            {monthOptions.map(m=><option key={m}>{m}</option>)}
          </select>
          <button className="btn btn-amber" onClick={downloadCSV}>⬇ Export CSV</button>
        </div>} />

      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        <KpiCard label="Total Revenue" value={"$"+totRev.toLocaleString()}            sub="Completed trips"      color="var(--green)"  icon="▲" delay={0}   />
        <KpiCard label="Total Costs"   value={"$"+(totFuel+totMaint).toLocaleString()} sub="Fuel + Maintenance"   color="var(--red)"    icon="◉" delay={60}  />
        <KpiCard label="Net Profit"    value={"$"+netProfit.toLocaleString()}          sub="Revenue minus costs"  color={netProfit>=0?"var(--cyan)":"var(--red)"} icon="◈" delay={120} />
        <KpiCard label="Profit Margin" value={`${margin}%`}                           sub="Net / Revenue"        color="var(--purple)" icon="⬡" delay={180} />
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        <div className="card" style={{ padding:24 }}>
          <div className="mono" style={{ fontSize:10, color:"var(--text3)", letterSpacing:".12em", marginBottom:4 }}>VEHICLE ROI ANALYSIS</div>
          <div className="rajdhani" style={{ fontSize:18, fontWeight:600, marginBottom:20 }}>ROI by Asset (%)</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={roiData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2d45" horizontal={false} />
              <XAxis type="number" tick={{ fill:"#4a6070", fontSize:10, fontFamily:"Share Tech Mono" }} axisLine={false} tickLine={false} />
              <YAxis type="category" dataKey="name" tick={{ fill:"#8899aa", fontSize:11, fontFamily:"Share Tech Mono" }} axisLine={false} tickLine={false} width={55} />
              <Tooltip contentStyle={{ background:"#0c1420", border:"1px solid #1a2d45", borderRadius:6, fontFamily:"Share Tech Mono", fontSize:11 }} />
              <Bar dataKey="roi" radius={[0,4,4,0]}>
                {roiData.map((r,i)=><Cell key={i} fill={r.roi>=0?"#00e676":"#ff1744"} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding:24 }}>
          <div className="mono" style={{ fontSize:10, color:"var(--text3)", letterSpacing:".12em", marginBottom:4 }}>FUEL EFFICIENCY</div>
          <div className="rajdhani" style={{ fontSize:18, fontWeight:600, marginBottom:20 }}>km per Liter by Vehicle</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={effData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1a2d45" vertical={false} />
              <XAxis dataKey="name" tick={{ fill:"#8899aa", fontSize:11, fontFamily:"Share Tech Mono" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill:"#4a6070", fontSize:10, fontFamily:"Share Tech Mono" }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background:"#0c1420", border:"1px solid #1a2d45", borderRadius:6, fontFamily:"Share Tech Mono", fontSize:11 }} />
              <Bar dataKey="eff" fill="#00e5ff" radius={[4,4,0,0]} opacity={.85} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="card">
        <div style={{ padding:"16px 20px", borderBottom:"1px solid var(--border)" }}>
          <div className="rajdhani" style={{ fontSize:16, fontWeight:600 }}>Vehicle Financial Summary</div>
        </div>
        <table>
          <thead><tr><th>VEHICLE</th><th>REVENUE</th><th>FUEL COST</th><th>MAINT COST</th><th>NET</th><th>EFF (km/L)</th><th>ROI</th></tr></thead>
          <tbody>
            {roiData.map((r,i)=>(
              <tr key={i}>
                <td className="mono" style={{ color:"var(--text2)", fontSize:12 }}>{r.name}</td>
                <td className="mono" style={{ color:"var(--green)"  }}>${r.rev.toLocaleString()}</td>
                <td className="mono" style={{ color:"var(--amber)"  }}>${r.fuel.toLocaleString()}</td>
                <td className="mono" style={{ color:"var(--red)"    }}>${r.maint.toLocaleString()}</td>
                <td className="mono" style={{ color:(r.rev-r.fuel-r.maint)>=0?"var(--cyan)":"var(--red)" }}>${(r.rev-r.fuel-r.maint).toLocaleString()}</td>
                <td className="mono" style={{ color:"var(--cyan)"   }}>{r.eff||"—"}{r.eff?" km/L":""}</td>
                <td><span className="mono" style={{ color:r.roi>=0?"var(--green)":"var(--red)", fontSize:14 }}>{r.roi!==0?`${r.roi}%`:"—"}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────────────────────────────────────────
   APP ROOT
───────────────────────────────────────────────────────────────────────────── */
export default function App() {
  const [authed,      setAuthed]      = useState(false);
  const [user,        setUser]        = useState(null);      // { id, name, email, role }
  const [dataLoading, setDataLoading] = useState(false);
  const [page,        setPage]        = useState("dashboard");
  const [vehicles,    setVehicles]    = useState(INIT_VEHICLES);
  const [drivers,     setDrivers]     = useState(INIT_DRIVERS);
  const [trips,       setTrips]       = useState(INIT_TRIPS);
  const [maintenance, setMaintenance] = useState(INIT_MAINT);
  const [fuelLogs,    setFuelLogs]    = useState(INIT_FUEL);
  const [notif,       setNotif]       = useState(null);

  const notify = (msg, type="success") => setNotif({ msg, type, key: Date.now() });

  // Load real data from API after login
  useEffect(() => {
    if (!authed) return;
    setDataLoading(true);
    Promise.all([
      getVehicles(),
      getDrivers(),
      getTrips(),
      getMaintenance(),
      getFuelLogs(),
    ]).then(([v, d, t, m, f]) => {
      setVehicles(v);
      setDrivers(d);
      setTrips(t);
      setMaintenance(m);
      setFuelLogs(f);
    }).catch(err => {
      // API unavailable — keep mock data, show warning
      notify(`API unavailable (${err.message}) — showing demo data`, "error");
    }).finally(() => setDataLoading(false));
  }, [authed]);

  const handleLogin = userData => {
    setUser(userData);
    setAuthed(true);
  };

  const handleLogout = () => {
    logoutAPI();
    setAuthed(false);
    setUser(null);
    // Reset to mock data for next login
    setVehicles(INIT_VEHICLES);
    setDrivers(INIT_DRIVERS);
    setTrips(INIT_TRIPS);
    setMaintenance(INIT_MAINT);
    setFuelLogs(INIT_FUEL);
    setPage("dashboard");
  };

  const roleDisplay = user ? (ROLE_DISPLAY[user.role] || user.role) : "";

  const PAGES = {
    dashboard:   <Dashboard   vehicles={vehicles} trips={trips} drivers={drivers} fuelLogs={fuelLogs} maintenance={maintenance} />,
    vehicles:    <Vehicles    vehicles={vehicles} setVehicles={setVehicles} notify={notify} />,
    trips:       <Trips       vehicles={vehicles} setVehicles={setVehicles} drivers={drivers} setDrivers={setDrivers} trips={trips} setTrips={setTrips} notify={notify} />,
    maintenance: <Maintenance vehicles={vehicles} setVehicles={setVehicles} maintenance={maintenance} setMaintenance={setMaintenance} notify={notify} />,
    fuel:        <Fuel        vehicles={vehicles} fuelLogs={fuelLogs} setFuelLogs={setFuelLogs} maintenance={maintenance} notify={notify} />,
    drivers:     <Drivers     drivers={drivers} setDrivers={setDrivers} notify={notify} />,
    analytics:   <Analytics   vehicles={vehicles} trips={trips} fuelLogs={fuelLogs} maintenance={maintenance} />,
  };

  return (
    <>
      <style>{STYLES}</style>

      {notif && <Notification key={notif.key} msg={notif.msg} type={notif.type} onClose={()=>setNotif(null)} />}

      {!authed
        ? <LoginPage onLogin={handleLogin} />
        : <div style={{ display:"flex" }}>
            <Sidebar page={page} setPage={setPage} role={roleDisplay} userName={user?.name} onLogout={handleLogout} />
            <main style={{ marginLeft:240, flex:1, minHeight:"100vh", padding:"36px 40px", background:"var(--bg)", maxWidth:"calc(100vw - 240px)" }}>
              {dataLoading
                ? <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"60vh", flexDirection:"column", gap:16 }}>
                    <div style={{ fontSize:36, animation:"rotate 1s linear infinite", display:"inline-block" }}>◌</div>
                    <div className="mono" style={{ fontSize:12, color:"var(--text3)", letterSpacing:".1em" }}>LOADING FLEET DATA...</div>
                  </div>
                : PAGES[page]
              }
            </main>
          </div>
      }
    </>
  );
}
