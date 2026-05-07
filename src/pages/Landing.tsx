import { useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import {
  Package, Search, ArrowRightLeft, Calendar, Scale, Truck,
  CreditCard, MapPin, CheckCircle2, ChevronDown, Menu, X,
  Linkedin, Twitter, Instagram, Globe, Smartphone,
} from "lucide-react";

// Brand tokens (kept inline for the landing page only — does not affect app theme)
const C = {
  bg: "#080E1A",
  bg2: "#0D1628",
  card: "#111E33",
  teal: "#00C8C8",
  white: "#FFFFFF",
  gray: "#B0BECE",
  border: "#1C2A44",
  err: "#C0392B",
  ok: "#1A7A4A",
};

/* ---------------- NAV ---------------- */
const NavBar = ({ onSendClick, onTrackClick }: { onSendClick: () => void; onTrackClick: () => void }) => {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  const links = [
    { href: "#hero", label: "Compare Couriers" },
    { href: "#hero", label: "Track Shipment" },
    { href: "#hero", label: "International" },
    { href: "#how-it-works", label: "How It Works" },
    { href: "#faq", label: "Blog" },
  ];
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all ${scrolled ? "backdrop-blur-sm" : ""}`}
      style={{ background: scrolled ? "rgba(8,14,26,0.95)" : C.bg, borderBottom: `1px solid ${C.border}`, height: 64 }}
    >
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        <a href="/" className="flex items-center gap-1">
          <span className="text-white font-bold text-[22px]">Via</span>
          <span className="font-bold text-[22px]" style={{ color: C.teal }}>Setu<span style={{ color: C.teal }}>.</span></span>
        </a>

        <nav className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <a key={l.label} href={l.href} className="text-[14px] transition-colors hover:text-[#00C8C8]" style={{ color: C.gray }}>
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={onTrackClick}
            className="px-4 h-10 rounded-lg font-semibold text-[14px] border-2 transition-colors hover:bg-[#00C8C8]/10"
            style={{ borderColor: C.teal, color: C.teal }}
          >
            Track Your Parcel
          </button>
          <button
            onClick={onSendClick}
            className="px-5 h-10 rounded-lg font-bold text-[14px] transition-transform hover:scale-[1.02]"
            style={{ background: C.teal, color: C.bg }}
          >
            Send a Parcel →
          </button>
        </div>

        <button className="md:hidden text-white" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" style={{ background: C.bg }}>
          <div className="flex justify-between items-center px-6 h-16" style={{ borderBottom: `1px solid ${C.border}` }}>
            <span className="text-white font-bold text-[22px]">Via<span style={{ color: C.teal }}>Setu.</span></span>
            <button onClick={() => setOpen(false)} className="text-white" aria-label="Close menu"><X className="h-6 w-6" /></button>
          </div>
          <nav className="flex flex-col p-6 gap-5">
            {links.map((l) => (
              <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="text-white text-lg">{l.label}</a>
            ))}
            <button onClick={() => { setOpen(false); onTrackClick(); }} className="mt-4 h-12 rounded-lg border-2 font-semibold" style={{ borderColor: C.teal, color: C.teal }}>Track Your Parcel</button>
            <button onClick={() => { setOpen(false); onSendClick(); }} className="h-12 rounded-lg font-bold" style={{ background: C.teal, color: C.bg }}>Send a Parcel →</button>
          </nav>
        </div>
      )}
    </header>
  );
};

/* ---------------- BOOKING WIDGET ---------------- */
const BookingWidget = ({ onGo }: { onGo: () => void }) => {
  const [tab, setTab] = useState<"dom" | "intl" | "track">("dom");
  const tabs = [
    { k: "dom", label: "📦 Domestic" },
    { k: "intl", label: "✈️ International" },
    { k: "track", label: "📍 Track Parcel" },
  ] as const;
  const inputCls = "w-full h-12 rounded-lg px-4 text-[14px] outline-none transition-colors focus:border-[#00C8C8]";
  const inputStyle = { background: C.card, border: `1px solid ${C.border}`, color: C.white } as const;

  return (
    <div className="rounded-2xl p-6 md:p-8 w-full" style={{ background: C.bg2, border: `1px solid ${C.border}`, boxShadow: "0 0 60px rgba(0,200,200,0.15)" }}>
      <div className="flex gap-6 mb-6 overflow-x-auto" style={{ borderBottom: `1px solid ${C.border}` }}>
        {tabs.map((t) => (
          <button key={t.k} onClick={() => setTab(t.k)} className="pb-3 text-[14px] font-semibold whitespace-nowrap transition-colors"
            style={{ color: tab === t.k ? C.teal : C.gray, borderBottom: tab === t.k ? `2px solid ${C.teal}` : "2px solid transparent" }}>
            {t.label}
          </button>
        ))}
      </div>

      {tab === "dom" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_1fr] gap-3 items-center">
            <input placeholder="From Pincode / City" className={inputCls} style={inputStyle} />
            <button aria-label="Swap" className="h-10 w-10 rounded-full flex items-center justify-center mx-auto" style={{ background: C.card, border: `1px solid ${C.border}`, color: C.teal }}>
              <ArrowRightLeft className="h-4 w-4" />
            </button>
            <input placeholder="To Pincode / City" className={inputCls} style={inputStyle} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="relative"><Scale className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.gray }} /><input placeholder="Weight (kg)" className={inputCls + " pl-10"} style={inputStyle} /></div>
            <div className="relative"><Package className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.gray }} /><input placeholder="Parcel Type" className={inputCls + " pl-10"} style={inputStyle} /></div>
            <div className="relative"><Calendar className="h-4 w-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.gray }} /><input placeholder="Pickup Date" className={inputCls + " pl-10"} style={inputStyle} /></div>
          </div>
          <button onClick={onGo} className="w-full h-14 rounded-lg font-bold text-[16px] flex items-center justify-center gap-2 transition-transform hover:scale-[1.01]" style={{ background: C.teal, color: C.bg }}>
            <Search className="h-5 w-5" /> Compare Courier Prices →
          </button>
        </div>
      )}

      {tab === "intl" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input placeholder="From India" className={inputCls} style={inputStyle} />
            <input placeholder="To Country" className={inputCls} style={inputStyle} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input placeholder="Weight (kg)" className={inputCls} style={inputStyle} />
            <input placeholder="Declared Value ₹" className={inputCls} style={inputStyle} />
          </div>
          <button onClick={onGo} className="w-full h-14 rounded-lg font-bold text-[16px] flex items-center justify-center gap-2" style={{ background: C.teal, color: C.bg }}>
            <Search className="h-5 w-5" /> Compare International Rates →
          </button>
        </div>
      )}

      {tab === "track" && (
        <div className="space-y-4">
          <input placeholder="Enter AWB / Tracking Number" className={inputCls + " h-14 text-base"} style={inputStyle} />
          <button onClick={onGo} className="w-full h-14 rounded-lg font-bold text-[16px]" style={{ background: C.teal, color: C.bg }}>
            Track My Parcel →
          </button>
        </div>
      )}
    </div>
  );
};

/* ---------------- PHONE MOCKUP ---------------- */
const PhoneMockup = ({ children }: { children?: React.ReactNode }) => (
  <div className="mx-auto" style={{ width: 280 }}>
    <div className="rounded-[40px] p-3" style={{ background: "#000", border: `2px solid ${C.border}`, boxShadow: "0 30px 60px rgba(0,200,200,0.2)" }}>
      <div className="rounded-[32px] overflow-hidden" style={{ background: C.bg2, height: 560 }}>
        <div className="h-7 flex items-center justify-center" style={{ background: "#000" }}>
          <div className="w-20 h-5 rounded-b-2xl" style={{ background: "#000" }} />
        </div>
        <div className="p-4 text-white">
          {children || (
            <>
              <div className="text-xs mb-3" style={{ color: C.gray }}>Compare Results</div>
              {["Delhivery", "DHL Express", "XpressBees", "India Post"].map((n, i) => (
                <div key={n} className="rounded-lg p-3 mb-2 flex items-center justify-between" style={{ background: C.card, border: `1px solid ${C.border}` }}>
                  <div>
                    <div className="text-sm font-semibold">{n}</div>
                    <div className="text-[10px]" style={{ color: C.gray }}>{2 + i}-{4 + i} days</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold" style={{ color: C.teal }}>₹{120 + i * 40}</div>
                    {i === 0 && <div className="text-[9px] font-bold" style={{ color: C.ok }}>BEST PRICE</div>}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  </div>
);

/* ---------------- COUNTER ---------------- */
const Counter = ({ end, suffix = "" }: { end: number; suffix?: string }) => {
  const [v, setV] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        const dur = 1500, start = performance.now();
        const tick = (t: number) => {
          const p = Math.min(1, (t - start) / dur);
          setV(Math.floor(end * (1 - Math.pow(1 - p, 3))));
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
        obs.disconnect();
      }
    }, { threshold: 0.3 });
    obs.observe(el);
    return () => obs.disconnect();
  }, [end]);
  return <span ref={ref}>{v.toLocaleString("en-IN")}{suffix}</span>;
};

/* ---------------- FAQ ---------------- */
const FAQ_ITEMS = [
  ["How do I compare courier prices in India?", "Enter your pickup pincode, delivery pincode and parcel weight on ViaSetu. We instantly compare prices from 14+ couriers including DHL, FedEx, Delhivery, India Post and more — showing you the cheapest and fastest options side by side."],
  ["Which is the cheapest courier service in India?", "Courier prices vary by route, weight and speed. India Post is often the cheapest for standard delivery while Delhivery and XpressBees offer competitive express rates. ViaSetu compares all options in real-time so you always get the best available price."],
  ["Does ViaSetu offer doorstep pickup?", "Yes. ViaSetu schedules doorstep pickup from your home, office, hostel or any address across 21,000+ pincodes in India. No need to visit a courier shop."],
  ["Can I send international parcels through ViaSetu?", "Yes. ViaSetu supports international courier booking to UAE, USA, UK, Singapore, Saudi Arabia and more. Compare international courier rates from DHL, FedEx and Aramex directly on the app."],
  ["How do I track my parcel on ViaSetu?", "Enter your AWB or tracking number in the Track Parcel tab on ViaSetu. We provide unified real-time tracking across all courier partners in one dashboard."],
  ["How much can I save using ViaSetu?", "ViaSetu users save an average of 20-40% compared to walk-in rates at local courier shops."],
  ["Is ViaSetu available across all of India?", "Yes. ViaSetu covers 21,000+ pincodes across India including all metros, Tier 1, Tier 2 and Tier 3 cities."],
  ["Which couriers are available on ViaSetu?", "DHL, FedEx, Aramex, Delhivery, India Post, XpressBees, Shadowfax, Shipyaari, Blue Dart, Porter, TSAW Drones, UniUni, Urbanbolt and Bigship."],
  ["Is ViaSetu free to use?", "Yes. ViaSetu is completely free to download and use. You only pay for the courier service you book."],
  ["What payment methods does ViaSetu accept?", "ViaSetu accepts all major payment methods including UPI (GPay, PhonePe, Paytm), credit cards, debit cards and net banking."],
];

const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl mb-3" style={{ background: C.bg2, border: `1px solid ${C.border}` }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left">
        <span className="text-white font-semibold text-[15px] pr-4">{q}</span>
        <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: C.teal }} />
      </button>
      <div className="overflow-hidden transition-all" style={{ maxHeight: open ? 400 : 0 }}>
        <p className="px-5 pb-5 text-[14px] leading-relaxed" style={{ color: C.gray }}>{a}</p>
      </div>
    </div>
  );
};

/* ---------------- ROUTES ---------------- */
const ROUTES = [
  "Mumbai to Delhi", "Delhi to Mumbai", "Pune to Delhi", "Delhi to Pune",
  "Mumbai to Bangalore", "Bangalore to Mumbai", "Chennai to Delhi", "Delhi to Chennai",
  "Hyderabad to Mumbai", "Mumbai to Hyderabad", "Pune to Mumbai", "Mumbai to Pune",
  "Delhi to Kolkata", "Kolkata to Delhi", "Bangalore to Chennai", "Chennai to Bangalore",
  "Mumbai to Chennai", "Pune to Bangalore",
];
const slug = (r: string) => r.toLowerCase().replace(/\s+/g, "-");

const PARTNERS = ["DHL","FedEx","Aramex","Delhivery","India Post","XpressBees","Shadowfax","Shipyaari","Bigship","Blue Dart","Porter","TSAW","UniUni","Urbanbolt"];

/* ---------------- MAIN ---------------- */
const Landing = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const authRaw = localStorage.getItem("auth_session") || localStorage.getItem("prayog_auth");
    if (authRaw) navigate("/home");
  }, [navigate]);

  const goSend = () => navigate("/login");
  const goTrack = () => navigate("/tracking");

  return (
    <div style={{ background: C.bg, color: C.white, fontFamily: "Inter, system-ui, sans-serif" }}>
      <NavBar onSendClick={goSend} onTrackClick={goTrack} />

      {/* HERO */}
      <section id="hero" aria-label="Compare courier services India" className="relative pt-24 md:pt-32 pb-16 px-6 overflow-hidden" style={{ minHeight: "100vh" }}>
        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(0,200,200,0.15) 0%, transparent 70%)" }} />
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative">
          <div>
            <h1 className="font-bold leading-[1.15] text-[32px] md:text-[52px] text-white">
              Compare Courier Prices &amp; Book Online — <span style={{ color: C.teal }}>Save Up to 40%</span> on Every Parcel
            </h1>
            <h2 className="mt-5 text-[16px] md:text-[20px] font-normal" style={{ color: C.gray }}>
              India's First Consumer Courier Aggregator — Compare 14+ Couriers. Doorstep Pickup. Real-Time Tracking. All in One App.
            </h2>
            <div className="mt-8"><BookingWidget onGo={goSend} /></div>
            <div className="mt-6 text-[13px] md:text-[14px] flex flex-wrap gap-x-4 gap-y-2" style={{ color: C.gray }}>
              <span>⭐ Trusted by 10,000+ users</span>
              <span>·</span>
              <span>📦 21,000+ pincodes covered</span>
              <span>·</span>
              <span>🚚 14+ courier partners</span>
              <span>·</span>
              <span>💰 Avg. saving ₹180 per shipment</span>
            </div>
          </div>
          <div className="hidden lg:block">
            <PhoneMockup />
            <div className="text-center mt-6">
              <div className="text-[12px] uppercase tracking-wider mb-2" style={{ color: C.teal }}>Available Now</div>
              <div className="flex justify-center gap-3">
                <div className="px-4 py-2 rounded-lg text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }}>📱 Android</div>
                <div className="px-4 py-2 rounded-lg text-sm" style={{ background: C.card, border: `1px solid ${C.border}` }}>🍎 iOS</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PARTNERS */}
      <section id="partners" className="py-10 px-6" style={{ background: C.bg2 }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center text-[12px] uppercase tracking-[0.2em] mb-6" style={{ color: C.teal }}>14+ Courier Partners — All In One App</div>
          <div className="flex flex-wrap justify-center gap-x-12 gap-y-4">
            {PARTNERS.map((p) => (
              <div key={p} className="text-white font-semibold opacity-60 hover:opacity-100 transition-opacity text-[14px]" style={{ filter: "grayscale(100%)" }}>
                {p}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="py-20 px-6" style={{ background: C.bg }}>
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-[28px] md:text-[40px] font-bold text-white">How to Send a Parcel with ViaSetu</h2>
          <p className="mt-3 text-[14px] md:text-[16px]" style={{ color: C.gray }}>4 steps. 2 minutes. Cheaper than walking into a courier shop.</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
            {[
              { n: "01", icon: <Package className="h-7 w-7" />, t: "Enter Shipment Details", b: "Add your pickup pincode, delivery location, weight and parcel type. Takes 30 seconds." },
              { n: "02", icon: <Search className="h-7 w-7" />, t: "Compare All Courier Prices", b: "See prices, delivery speed and reliability scores from 14+ couriers side by side. Instantly." },
              { n: "03", icon: <CreditCard className="h-7 w-7" />, t: "Book & Pay Securely", b: "Pay via UPI, card or wallet. Your doorstep pickup is scheduled automatically." },
              { n: "04", icon: <MapPin className="h-7 w-7" />, t: "Track Every Shipment Live", b: "Real-time status updates from pickup to delivery — all couriers in one dashboard." },
            ].map((s) => (
              <div key={s.n} className="rounded-xl p-7 text-left" style={{ background: C.bg2, border: `1px solid ${C.border}`, borderTop: `3px solid ${C.teal}` }}>
                <div className="h-14 w-14 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(0,200,200,0.15)", color: C.teal }}>{s.icon}</div>
                <div className="text-[12px] font-bold mb-1" style={{ color: C.teal }}>STEP {s.n}</div>
                <h3 className="text-white font-bold text-[16px] mb-2">{s.t}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: C.gray }}>{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHY VIASETU */}
      <section id="why-viasetu" className="py-20 px-6" style={{ background: C.bg2 }}>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-[28px] md:text-[40px] font-bold text-white leading-tight">
              Why 10,000+ Indians Choose ViaSetu to Send Their Parcels
            </h2>
            <div className="mt-8 space-y-5">
              {[
                ["Save 20–40% on Every Shipment", "Compare real-time prices across all major couriers. Stop overpaying at local courier shops."],
                ["14+ Courier Partners in One App", "DHL, FedEx, Delhivery, India Post, Aramex and 10 more — all compared in 10 seconds."],
                ["Doorstep Pickup Across 21,000+ Pincodes", "Schedule pickup from your home, office or hostel. No shop visits. No queues."],
                ["AI-Powered Delivery Predictions", "Know your parcel's estimated arrival with a confidence score — not just a vague date range."],
                ["International Shipping Made Simple", "UAE, USA, UK, Singapore, Saudi Arabia and more — best international courier rates in one search."],
                ["Unified Tracking for All Shipments", "Every parcel you've ever sent — tracked in one dashboard regardless of which courier carried it."],
              ].map(([t, b]) => (
                <div key={t} className="flex gap-3 p-3 rounded-lg transition-all hover:border-l-2" style={{ borderLeft: "2px solid transparent" }}>
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: C.teal }} />
                  <div>
                    <div className="text-white font-bold text-[15px]">{t}</div>
                    <div className="text-[13px] mt-1" style={{ color: C.gray }}>{b}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:block"><PhoneMockup /></div>
        </div>
      </section>

      {/* PERSONAS */}
      <section id="user-stories" className="py-20 px-6" style={{ background: C.bg }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center text-[28px] md:text-[40px] font-bold text-white">Who Uses ViaSetu? Anyone Who Ships a Parcel in India.</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {[
              { e: "🧁", t: "Home Bakers & Micro-Sellers", b: "Ship your products across India without visiting courier shops. Compare rates, book pickup, track deliveries — all from your phone while you run your business.", s: "Avg. saving ₹2,400/month" },
              { e: "🎓", t: "Students Living Away From Home", b: "Send clothes, books and packages home without the hassle. Get doorstep pickup at your hostel or PG. Track until it reaches your family.", s: "Doorstep pickup anywhere" },
              { e: "📱", t: "OLX / Meesho Sellers & SMEs", b: "Ship 10–50 orders a week with full tracking visibility. Professional shipping at consumer prices — no business account needed.", s: "Unified tracking dashboard" },
            ].map((p) => (
              <div key={p.t} className="rounded-xl p-8" style={{ background: C.bg2, border: `1px solid ${C.border}`, borderTop: `3px solid ${C.teal}` }}>
                <div className="h-14 w-14 rounded-full flex items-center justify-center text-2xl mb-4" style={{ background: "rgba(0,200,200,0.15)" }}>{p.e}</div>
                <h3 className="text-white font-bold text-[18px] mb-3">{p.t}</h3>
                <p className="text-[13px] leading-relaxed mb-4" style={{ color: C.gray }}>{p.b}</p>
                <span className="inline-block text-[12px] font-bold px-3 py-1 rounded-full" style={{ background: "rgba(0,200,200,0.15)", color: C.teal }}>{p.s}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="py-10 px-6" style={{ background: `linear-gradient(90deg, ${C.teal}, #007A7A)` }}>
        <div className="max-w-7xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6 divide-x divide-white/20">
          {[
            { v: 14, s: "+", l: "Courier Partners" },
            { v: 21000, s: "+", l: "Pincodes Covered" },
            { v: 40, s: "%", l: "Average Savings" },
            { v: 4, s: " Steps", l: "To Send Any Parcel" },
          ].map((x, i) => (
            <div key={i} className="text-center px-4">
              <div className="text-white font-bold text-[32px] md:text-[42px]"><Counter end={x.v} suffix={x.s} /></div>
              <div className="text-[14px] mt-1" style={{ color: C.bg }}>{x.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* POPULAR ROUTES */}
      <section id="popular-routes" className="py-20 px-6" style={{ background: C.bg2 }}>
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-[28px] md:text-[40px] font-bold text-white">Popular Courier Routes in India</h2>
          <p className="mt-3 text-[14px] md:text-[16px]" style={{ color: C.gray }}>Compare prices and book courier pickup on India's most shipped routes</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10">
            {ROUTES.map((r) => (
              <a key={r} href={`/courier/${slug(r)}`} aria-label={`${r} Courier`} className="px-4 py-2 rounded-full text-[13px] text-white text-center transition-colors hover:bg-[#00C8C8] hover:text-[#080E1A]"
                style={{ background: C.card, border: `1px solid ${C.border}` }}>
                {r} Courier
              </a>
            ))}
          </div>
          <p className="mt-8 text-[13px]" style={{ color: C.gray }}>
            Can't find your route? <a href="#hero" className="underline" style={{ color: C.teal }}>Enter details above →</a> to compare any pincode to pincode combination across India.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6" style={{ background: C.bg }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-[28px] md:text-[40px] font-bold text-white mb-10">Frequently Asked Questions About Sending Parcels in India</h2>
          {FAQ_ITEMS.map(([q, a]) => <FAQItem key={q} q={q} a={a} />)}
        </div>
      </section>

      {/* DOWNLOAD CTA */}
      <section id="download" className="py-20 px-6" style={{ background: `linear-gradient(180deg, ${C.bg2}, ${C.bg})` }}>
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-[28px] md:text-[40px] font-bold text-white">Send Your First Parcel in Under 2 Minutes</h2>
          <p className="mt-3 text-[14px] md:text-[16px]" style={{ color: C.gray }}>Join thousands of Indians who've stopped overpaying at courier shops.</p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 mt-8">
            <button className="h-12 px-6 rounded-lg font-bold flex items-center justify-center gap-2" style={{ background: C.teal, color: C.bg }}>
              <Smartphone className="h-5 w-5" /> Download on Android
            </button>
            <button onClick={goSend} className="h-12 px-6 rounded-lg font-bold flex items-center justify-center gap-2 border-2" style={{ borderColor: C.white, color: C.white }}>
              🍎 Download on iOS
            </button>
          </div>
          <button onClick={goSend} className="mt-5 text-[14px] font-semibold" style={{ color: C.teal }}>
            Or use ViaSetu on web →
          </button>
          <div className="mt-12"><PhoneMockup /></div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 pt-16 pb-10" style={{ background: C.bg, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
          <div>
            <div className="text-white font-bold text-[20px]">Via<span style={{ color: C.teal }}>Setu.</span></div>
            <div className="text-[13px] font-semibold mt-2 text-white">India's First Consumer Courier Aggregator</div>
            <p className="text-[13px] mt-3" style={{ color: C.gray }}>Compare prices from 14+ couriers, book doorstep pickup and track all shipments — all in one app.</p>
            <div className="flex gap-4 mt-4">
              <a href="#" aria-label="LinkedIn" className="hover:text-[#00C8C8] transition-colors" style={{ color: C.gray }}><Linkedin className="h-5 w-5" /></a>
              <a href="#" aria-label="Twitter" className="hover:text-[#00C8C8] transition-colors" style={{ color: C.gray }}><Twitter className="h-5 w-5" /></a>
              <a href="#" aria-label="Instagram" className="hover:text-[#00C8C8] transition-colors" style={{ color: C.gray }}><Instagram className="h-5 w-5" /></a>
            </div>
          </div>
          <div>
            <h3 className="text-white font-bold text-[14px] mb-4">Our Services</h3>
            <ul className="space-y-2 text-[13px]">
              {["Compare Courier Prices","Book Courier Online","International Shipping","Courier Tracking","Doorstep Pickup","Bulk Shipping (Coming Soon)"].map((x) => (
                <li key={x}><a href="#hero" className="hover:text-[#00C8C8] transition-colors" style={{ color: C.gray }}>{x}</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold text-[14px] mb-4">Popular Routes</h3>
            <ul className="space-y-2 text-[13px]">
              {ROUTES.slice(0, 6).map((r) => (
                <li key={r}><a href={`/courier/${slug(r)}`} className="hover:text-[#00C8C8] transition-colors" style={{ color: C.gray }}>{r} Courier</a></li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-white font-bold text-[14px] mb-4">Company</h3>
            <ul className="space-y-2 text-[13px]">
              {["About Us","How It Works","Courier Partners","Press","Careers","Contact Us","Privacy Policy","Terms of Service","Refund Policy"].map((x) => (
                <li key={x}><a href="#" className="hover:text-[#00C8C8] transition-colors" style={{ color: C.gray }}>{x}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-10 pt-6 flex flex-col md:flex-row justify-between gap-3 text-[12px]" style={{ borderTop: `1px solid ${C.border}`, color: C.gray }}>
          <span>© 2025 ViaSetu. All rights reserved.</span>
          <span>Made with ❤️ for every Indian who ships a parcel.</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
