import Link from "next/link";

const capabilities = [
  { n: "01", title: "Patient administration", desc: "A complete patient journey, from first registration to every visit that follows.", icon: "＋", tags: ["Patient records", "Appointments", "Queue management"] },
  { n: "02", title: "Clinical care", desc: "Give care teams a clear, connected view of encounters, observations and decisions.", icon: "✚", tags: ["Clinical notes", "Vitals & history", "Care plans"] },
  { n: "03", title: "Diagnostics & pharmacy", desc: "Bring laboratory workflows and medication operations into one coordinated system.", icon: "⌬", tags: ["Lab orders", "Results review", "Stock control"] },
  { n: "04", title: "Finance & operations", desc: "Connect services, invoices, payments and operational visibility across your facility.", icon: "₦", tags: ["Billing", "Receipts", "Reporting"] },
];
const steps = [
  ["01", "One connected workspace", "Bring front desk, clinical, diagnostics, pharmacy and finance teams into a shared operating picture."],
  ["02", "Built around accountable access", "Facility-aware roles, tenant isolation and traceable actions are foundational—not add-ons."],
  ["03", "Designed to grow with care", "Start with the workflows your facility needs and expand as your operations mature."],
];
export default function LandingPage() {
  return <main className="landing">
    <header className="landing-nav">
      <Link className="landing-brand" href="/"><span className="landing-mark">✚</span><span>caregrid<span className="brand-period">.</span><small>HEALTH SYSTEMS</small></span></Link>
      <nav className="landing-links" aria-label="Main navigation"><a href="#platform">Platform</a><a href="#workflows">Workflows</a><a href="#security">Security</a><a href="#about">About</a></nav>
      <div className="landing-nav-actions"><Link className="nav-login" href="/dashboard">Sign in <span>↗</span></Link><Link className="nav-cta" href="/dashboard">Explore workspace <span>→</span></Link></div>
    </header>

    <section className="hero">
      <div className="hero-copy">
        <div className="hero-kicker"><i/> THE OPERATING SYSTEM FOR BETTER CARE <span>BUILT FOR AFRICA</span></div>
        <h1>Healthcare operations,<br/><em>finally in sync.</em></h1>
        <p className="hero-lede">One considered workspace for the people, processes and decisions behind exceptional care. Connect your hospital operations—from the first patient touchpoint to the final receipt.</p>
        <div className="hero-actions"><Link href="/dashboard" className="hero-primary">Explore Caregrid <span>↗</span></Link><a href="#platform" className="hero-secondary">Discover the platform <span>↓</span></a></div>
        <div className="hero-proof"><div className="proof-avatars"><span>+</span><span>✚</span><span>◎</span></div><p><b>Designed for connected care teams</b><small>Clinics · Hospitals · Diagnostic centres</small></p></div>
      </div>
      <div className="hero-art" aria-label="Caregrid connected hospital operations illustration">
        <div className="art-glow"/>
        <div className="art-orbit orbit-one"/><div className="art-orbit orbit-two"/>
        <div className="art-label label-top"><i/> ONE CONNECTED WORKSPACE</div>
        <div className="dashboard-preview">
          <div className="preview-top"><div className="preview-brand"><span>✚</span> caregrid</div><div className="preview-dots"><i/><i/><i/></div></div>
          <div className="preview-body"><div className="preview-side"><b/><i/><i/><i/><i/><i/></div><div className="preview-main"><div className="preview-greeting"><span><small>THURSDAY · FACILITY OVERVIEW</small><b>Your care, connected.</b></span><i>•••</i></div><div className="preview-metrics"><div><small>VISITS TODAY</small><b>128</b><i>↗ 8.4%</i></div><div><small>IN QUEUE</small><b>08</b><i>Live</i></div><div><small>LAB REVIEWS</small><b>12</b><i>4 pending</i></div></div><div className="preview-lower"><div className="preview-chart"><small>CARE ACTIVITY</small><div className="chart-lines"><i/><i/><i/><i/><i/><i/><i/></div><div className="chart-days"><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span><span>S</span></div></div><div className="preview-queue"><small>CARE TEAM QUEUE</small><div><i>AO</i><span><b>Patient check-in</b><small>General medicine</small></span><em/></div><div><i>EK</i><span><b>Lab review</b><small>Diagnostics</small></span><em/></div><div><i>TM</i><span><b>Consultation</b><small>Clinical care</small></span><em/></div></div></div></div></div>
        </div>
        <div className="floating-card float-care"><span>✚</span><div><small>CARE DELIVERY</small><b>Connected teams</b></div><i>↗</i></div>
        <div className="floating-card float-secure"><span>⌑</span><div><small>ACCESS BY DESIGN</small><b>Facility-aware security</b></div><i>✓</i></div>
        <div className="art-caption">A clearer view of the work that matters.</div>
      </div>
      <div className="hero-bottomline"><span>01 / A MORE CONNECTED STANDARD</span><span>BUILT FOR THE REALITIES OF MODERN HEALTHCARE <b>↓</b></span></div>
    </section>

    <section className="trust-strip"><span>ONE PLATFORM, EVERY PART OF THE PATIENT JOURNEY</span><div><b>Patient administration</b><i/> <b>Clinical care</b><i/> <b>Diagnostics</b><i/> <b>Pharmacy</b><i/> <b>Hospital finance</b></div></section>

    <section className="platform-section" id="platform"><div className="section-intro"><div><div className="section-kicker">THE CAREGRID PLATFORM <span>— 01</span></div><h2>Everything works better<br/>when it works <em>together.</em></h2></div><p>Care delivery is a team effort. Caregrid brings the essential work of running a healthcare facility into one coherent system—so information moves with the patient, not between disconnected tools.</p></div>
      <div className="capability-grid">{capabilities.map(c=><article className="capability" key={c.n}><div className="cap-top"><span>{c.n} / WORKFLOW</span><i>{c.icon}</i></div><h3>{c.title}</h3><p>{c.desc}</p><div className="cap-tags">{c.tags.map(t=><span key={t}>{t}</span>)}</div><div className="cap-arrow">↗</div></article>)}</div>
    </section>

    <section className="manifesto" id="workflows"><div className="manifesto-left"><div className="section-kicker light">A BETTER WAY TO RUN CARE <span>— 02</span></div><h2>Less operational<br/>friction. More room<br/>for <em>better care.</em></h2><p>When teams share context, handovers become clearer, work becomes easier to follow, and leaders can see where attention is needed.</p><Link href="/dashboard">See the workspace <span>↗</span></Link></div><div className="manifesto-right">{steps.map(s=><article key={s[0]}><span>{s[0]}</span><div><h3>{s[1]}</h3><p>{s[2]}</p></div><b>↗</b></article>)}</div><div className="manifesto-watermark">caregrid.</div></section>

    <section className="security-section" id="security"><div className="security-visual"><div className="security-ring ring-a"/><div className="security-ring ring-b"/><div className="security-core"><span>⌑</span><b>TRUST<br/>BY DESIGN</b><small>CAREGRID SECURITY FOUNDATION</small></div><div className="security-node node-a">TENANT ISOLATION</div><div className="security-node node-b">ROLE-AWARE ACCESS</div><div className="security-node node-c">AUDIT TRAILS</div></div><div className="security-copy"><div className="section-kicker">BUILT ON A STRONG FOUNDATION <span>— 03</span></div><h2>Trust is not a feature.<br/><em>It is the foundation.</em></h2><p>Healthcare software must take privacy, accountability and access seriously. Caregrid’s architecture is being built around tenant isolation, facility-aware permissions and traceable clinical and operational actions.</p><ul><li><i>✓</i> Organization and facility-level data boundaries</li><li><i>✓</i> Server-enforced access and role permissions</li><li><i>✓</i> Auditability for sensitive workflows</li><li><i>✓</i> Designed with Nigerian healthcare operations in mind</li></ul><small className="security-note">Caregrid is under active development. Production authentication, database connection, security validation and regulatory review are not yet complete.</small></div></section>

    <section className="closing-cta" id="about"><div className="closing-orb"/><div className="section-kicker light">THE NEXT CHAPTER OF CONNECTED CARE</div><h2>Make every part of care<br/><em>move as one.</em></h2><p>One thoughtful platform for the people who keep healthcare moving.</p><Link href="/dashboard">Explore Caregrid <span>↗</span></Link><div className="closing-index">CAREGRID HEALTH SYSTEMS <span>·</span> 2026</div></section>

    <footer className="landing-footer"><Link className="landing-brand" href="/"><span className="landing-mark">✚</span><span>caregrid<span className="brand-period">.</span><small>HEALTH SYSTEMS</small></span></Link><p>Connected operations. More focused care.</p><div><a href="#platform">Platform</a><a href="#security">Security</a><Link href="/dashboard">Workspace ↗</Link></div><small>© 2026 Caregrid Health Systems. All rights reserved.</small></footer>
  </main>;
}
