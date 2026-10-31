"use client";

import { useMemo, useState } from "react";

type Section = "Overview" | "Patients" | "Appointments" | "Clinical" | "Laboratory" | "Pharmacy" | "Billing" | "Reports" | "Settings";
const groups: { title: string; items: { name: Section; icon: string }[] }[] = [
  { title: "WORKSPACE", items: [{ name: "Overview", icon: "▦" }, { name: "Patients", icon: "♙" }, { name: "Appointments", icon: "▣" }] },
  { title: "CARE DELIVERY", items: [{ name: "Clinical", icon: "✚" }, { name: "Laboratory", icon: "⌬" }, { name: "Pharmacy", icon: "⚕" }] },
  { title: "OPERATIONS", items: [{ name: "Billing", icon: "₦" }, { name: "Reports", icon: "▥" }, { name: "Settings", icon: "⚙" }] },
];
const appointments = [
  { initials: "AO", name: "Amaka Okafor", id: "CG-000184", department: "General medicine", time: "09:00 AM", status: "Checked in", tone: "green" },
  { initials: "EO", name: "Emeka Obi", id: "CG-000183", department: "Cardiology", time: "09:15 AM", status: "Waiting", tone: "amber" },
  { initials: "FA", name: "Fatima Abubakar", id: "CG-000182", department: "Paediatrics", time: "09:30 AM", status: "In consultation", tone: "blue" },
  { initials: "TI", name: "Tunde Ibrahim", id: "CG-000181", department: "General medicine", time: "10:00 AM", status: "Scheduled", tone: "slate" },
];
const summaries: Record<Section, string> = {
  Overview: "A clearer view of today’s operations, care delivery and team activity.",
  Patients: "Find patient records and manage registrations.",
  Appointments: "Coordinate today’s schedule and patient queue.",
  Clinical: "Encounters, observations and care notes.",
  Laboratory: "Track test orders, specimens and result reviews.",
  Pharmacy: "Manage dispensing, stock levels and expiry dates.",
  Billing: "Track invoices, receipts and outstanding balances.",
  Reports: "Operational snapshots for your facility.",
  Settings: "Manage your facility workspace and preferences.",
};
function Icon({ children }: { children: React.ReactNode }) { return <span className="nav-icon" aria-hidden="true">{children}</span>; }

export default function Home() {
  const [active, setActive] = useState<Section>("Overview");
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notice, setNotice] = useState("");
  const [patients, setPatients] = useState([
    { name: "Amaka Okafor", id: "CG-000184" }, { name: "Emeka Obi", id: "CG-000183" },
    { name: "Fatima Abubakar", id: "CG-000182" }, { name: "Tunde Ibrahim", id: "CG-000181" },
  ]);
  const filtered = useMemo(() => patients.filter(p => (p.name + p.id).toLowerCase().includes(search.toLowerCase())), [patients, search]);
  function addPatient(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    const id = "CG-" + String(185 + patients.length - 4).padStart(6, "0");
    setPatients(current => [{ name: name.trim(), id }, ...current]);
    setName(""); setPhone(""); setModal(false); setActive("Patients");
    setNotice("Demo record added to this browser session only. Database persistence is not connected yet.");
  }

  return <div className="shell">
    <aside className="sidebar">
      <button className="brand" onClick={() => setActive("Overview")} aria-label="Caregrid home"><span className="brand-mark">✚</span><span className="brand-name">caregrid<span>.</span><small>HOSPITAL OS</small></span></button>
      <div className="facility"><span className="facility-logo">CG</span><span><b>Caregrid Preview</b><small>Primary facility</small></span><span className="chevron">⌄</span></div>
      {groups.map(group => <nav className="nav-group" key={group.title} aria-label={group.title}><p>{group.title}</p>{group.items.map(item => <button key={item.name} className={active === item.name ? "nav-item active" : "nav-item"} onClick={() => { setActive(item.name); setNotice(""); }}><Icon>{item.icon}</Icon><span>{item.name}</span>{item.name === "Appointments" && <small className="count">8</small>}</button>)}</nav>)}
      <div className="sidebar-spacer" />
      <div className="help-box"><span>?</span><div><b>Need a hand?</b><small>Visit the help centre</small></div></div>
      <div className="profile"><span className="avatar">AD</span><span><b>Facility Admin</b><small>Administrator</small></span><span className="dots">···</span></div>
    </aside>

    <main className="main">
      <header className="topbar"><div className="crumb">Caregrid <span>/</span> <b>{active}</b></div><div className="top-actions"><label className="search"><span>⌕</span><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search patients, records..." aria-label="Search patients and records" /></label><button className="notification" aria-label="Notifications" onClick={() => setNotice("You’re all caught up. Notifications will appear here.")}>♧<i /></button><span className="avatar top-avatar">AD</span></div></header>
      <div className="content">
        {notice && <div className="notice" role="status">{notice}<button onClick={() => setNotice("")} aria-label="Dismiss">×</button></div>}
        <div className="page-heading"><div><div className="eyebrow"><i /> SATURDAY, 31 OCTOBER 2026</div><h1>{active === "Overview" ? "Your facility, at a glance" : active}</h1><p>{summaries[active]}</p></div><div className="heading-buttons"><button className="button secondary" onClick={() => setNotice("Exports will be enabled when reports are connected to saved data.")}>↧ Export report</button><button className="button primary" onClick={() => setModal(true)}>＋ Register patient</button></div></div>

        {active === "Overview" && <>
          <div className="demo-banner"><span className="banner-icon">✳</span><div><b>Your facility at a glance</b><p>This workspace uses sample data while secure patient workflows are being built.</p></div><span className="demo-tag">DEMO DATA</span></div>
          <section className="stats">
            <article className="stat"><div className="stat-head">Patients today <span className="stat-icon mint">♙</span></div><strong>48 <small className="positive">↗ 12.5%</small></strong><div className="stat-foot">vs. previous day <span>▁▃▂▅▄▆▅█</span></div></article>
            <article className="stat"><div className="stat-head">Waiting queue <span className="stat-icon yellow">◷</span></div><strong>08 <small className="neutral">Live queue</small></strong><div className="stat-foot">Average wait 18 min <span>▆▅▄▅▃▄▂▃</span></div></article>
            <article className="stat"><div className="stat-head">Lab requests <span className="stat-icon lilac">⌬</span></div><strong>23 <small className="positive">↗ 4.2%</small></strong><div className="stat-foot">4 results need review <span>▂▃▅▄▃▆▄█</span></div></article>
            <article className="stat"><div className="stat-head">Revenue today <span className="stat-icon peach">₦</span></div><strong>₦842,500</strong><div className="stat-foot">12 invoices outstanding <span>▂▃▂▄▅▄▆█</span></div></article>
          </section>
          <section className="dashboard-grid">
            <article className="panel"><div className="panel-head"><div><h2>Today’s appointments</h2><p>Thursday, 29 October <i className="tiny-dot" /> 8 scheduled</p></div><button className="text-link" onClick={() => setActive("Appointments")}>View schedule →</button></div>
              <div className="table-scroll"><table><thead><tr><th>PATIENT</th><th>DEPARTMENT</th><th>TIME</th><th>STATUS</th></tr></thead><tbody>{appointments.map(a => <tr key={a.id}><td><div className="patient"><span className="patient-avatar">{a.initials}</span><span><b>{a.name}</b><small>{a.id}</small></span></div></td><td>{a.department}</td><td>{a.time}</td><td><span className={"status " + a.tone}><i />{a.status}</span></td></tr>)}</tbody></table></div>
              <div className="panel-foot">Showing 4 of 8 appointments <button onClick={() => setActive("Appointments")}>See all appointments →</button></div>
            </article>
            <article className="panel attention"><div className="panel-head"><div><h2>Needs attention</h2><p>Items for your team today</p></div><span className="attention-count">3</span></div>
              {[["⌬","Review pending lab results","4 results awaiting review","purple","Laboratory"],["⚕","Low-stock medication alert","3 items need attention","orange","Pharmacy"],["₦","Outstanding balances","₦248,500 across 12 invoices","mint","Billing"]].map(t => <button className="task" key={t[1]} onClick={() => setActive(t[4] as Section)}><span className={"task-icon " + t[3]}>{t[0]}</span><span><b>{t[1]}</b><small>{t[2]}</small></span><i>→</i></button>)}
              <button className="text-link task-bottom" onClick={() => setActive("Reports")}>View operational summary →</button>
            </article>
          </section>
          <section className="bottom-grid"><article className="panel"><div className="panel-head"><div><h2>Patient activity</h2><p>Visits across the last 7 days</p></div><span className="select-chip">This week⌄</span></div><div className="chart">{[45,30,19,56,43,67,77].map((n,i) => <div className="bar" key={i}><div><span style={{height:n+"%"}} /></div><small>{["Fri","Sat","Sun","Mon","Tue","Wed","Thu"][i]}</small></div>)}</div><div className="chart-caption"><span><i /> Patient visits</span><small>Illustrative sample values</small></div></article>
          <article className="panel"><div className="panel-head"><div><h2>Quick actions</h2><p>Common tasks, one click away</p></div></div><div className="quick-grid"><button onClick={() => setModal(true)}><span className="quick-icon mint">＋</span><b>New patient</b><small>Register a patient</small></button><button onClick={() => setActive("Appointments")}><span className="quick-icon yellow">▣</span><b>Book appointment</b><small>Schedule a visit</small></button><button onClick={() => setActive("Clinical")}><span className="quick-icon lilac">✚</span><b>New encounter</b><small>Start a consultation</small></button><button onClick={() => setActive("Billing")}><span className="quick-icon peach">₦</span><b>Create invoice</b><small>Record a charge</small></button></div></article></section>
        </>}

        {active === "Patients" && <section className="panel patient-directory"><div className="panel-head"><div><h2>Patient directory</h2><p>{patients.length} demo records in this browser session</p></div><button className="button primary" onClick={() => setModal(true)}>＋ Register patient</button></div><div className="table-scroll"><table><thead><tr><th>PATIENT</th><th>PATIENT ID</th><th>RECORD STATUS</th></tr></thead><tbody>{filtered.map(p => <tr key={p.id}><td><div className="patient"><span className="patient-avatar">{p.name.split(" ").map(x=>x[0]).slice(0,2).join("")}</span><span><b>{p.name}</b><small>Demo record</small></span></div></td><td>{p.id}</td><td><span className="status green"><i />Demo only</span></td></tr>)}</tbody></table>{filtered.length === 0 && <div className="empty">No matching demo patients. Try another search.</div>}</div><div className="warning">Demo-only records are held in browser memory and are not saved to the database.</div></section>}

        {active !== "Overview" && active !== "Patients" && <section className="module-card"><span className="module-symbol">{groups.flatMap(g=>g.items).find(x=>x.name===active)?.icon}</span><div className="eyebrow">CAREGRID WORKSPACE</div><h2>{active} module</h2><p>{summaries[active]} This workspace is mapped in the interface; its secure data workflows will be implemented and connected to PostgreSQL in stages.</p><div className="module-list"><div><span>01</span><b>Data model and validation</b><small>Tenant-scoped records and safe input rules</small></div><div><span>02</span><b>Role-based access</b><small>Permissions enforced on the server</small></div><div><span>03</span><b>Audited workflow</b><small>Traceable actions and reliable error handling</small></div></div><button className="button secondary" onClick={() => setActive("Overview")}>← Back to overview</button></section>}
      </div>
      <footer className="footer"><span>© 2026 Caregrid Health Systems</span><span><i /> System workspace · <b>Demo environment</b></span></footer>
    </main>

    {modal && <div className="modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) setModal(false); }}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="register-title"><div className="modal-head"><div><div className="eyebrow">PATIENT ADMINISTRATION</div><h2 id="register-title">Register a patient</h2><p>Demo only — data is not persisted.</p></div><button className="close" onClick={() => setModal(false)} aria-label="Close">×</button></div><form onSubmit={addPatient}><label>Patient full name<input autoFocus value={name} onChange={e=>setName(e.target.value)} required placeholder="Enter full name" /></label><label>Phone number <small>OPTIONAL</small><input value={phone} onChange={e=>setPhone(e.target.value)} placeholder="+234 800 000 0000" /></label><div className="form-note">ⓘ Do not enter real patient information. Database persistence and access controls are not implemented yet.</div><div className="modal-actions"><button type="button" className="button secondary" onClick={() => setModal(false)}>Cancel</button><button type="submit" className="button primary">Add demo patient</button></div></form></section></div>}
  </div>;
}