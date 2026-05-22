import { useNavigate, Link } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Package, Search, CreditCard, MapPin, CheckCircle2, ChevronDown, Menu, X,
  Linkedin, Twitter, Instagram,
} from "lucide-react";

// Brand tokens (kept inline for the landing page only — does not affect app theme)
const C = {
  bg: "#FFFFFF",
  bg2: "#F4F7FB",
  card: "#FFFFFF",
  teal: "#00A8A8",
  white: "#0B1220",      // primary text (dark on light)
  gray: "#5A6B80",       // secondary text
  border: "#E2E8F0",
  err: "#C0392B",
  ok: "#1A7A4A",
};

const FONT_STACK = '"Montserrat", "Helvetica Neue", Arial, sans-serif';

// Partner logos
import delhiveryLogo from "@/assets/delhivery-logo.jpg";
import shadowfaxLogo from "@/assets/shadowfax-logo.svg";
import xpressbeesLogo from "@/assets/xpressbees-logo.webp";
import urbaneboltLogo from "@/assets/urbanebolt-logo.png";
import shreeMarutiLogo from "@/assets/shree-maruti-logo.png";

// Background imagery (logistics & courier)
import logisticsBg from "@/assets/logistics-bg.jpg";
import warehouseBg from "@/assets/warehouse-bg.jpg";
import parcelsBg from "@/assets/parcels-bg.jpg";
import shippingBg from "@/assets/shipping-bg.jpg";
import deliveryHero from "@/assets/delivery-hero.jpg";
import appPreview from "@/assets/app-preview.png";
import appPreview2 from "@/assets/app-preview-2.png";

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
    { href: "#hero", label: "Compare Couriers", external: false },
    { href: "#track", label: "Track Shipment", external: false },
    { href: "#how-it-works", label: "How It Works", external: false },
    { href: "/blog", label: "Blog", external: true },
    { href: "/faq", label: "FAQ", external: true },
  ];
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all ${scrolled ? "backdrop-blur-sm" : ""}`}
      style={{ background: scrolled ? "rgba(255,255,255,0.92)" : C.bg, borderBottom: `1px solid ${C.border}`, height: 64 }}
    >
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        <a href="/" className="flex items-center">
          <span className="text-[#0B1220] font-bold text-[22px]">Via</span>
          <span className="font-bold text-[22px]" style={{ color: C.teal }}>setu</span>
        </a>

        <nav className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            l.external ? (
              <Link key={l.label} to={l.href} className="text-[14px] transition-colors hover:text-[#00C8C8]" style={{ color: C.gray }}>
                {l.label}
              </Link>
            ) : (
              <a key={l.label} href={l.href} className="text-[14px] transition-colors hover:text-[#00C8C8]" style={{ color: C.gray }}>
                {l.label}
              </a>
            )
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

        <button className="md:hidden text-[#0B1220]" onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" style={{ background: C.bg }}>
          <div className="flex justify-between items-center px-6 h-16" style={{ borderBottom: `1px solid ${C.border}` }}>
            <span className="text-[#0B1220] font-bold text-[22px]">Via<span style={{ color: C.teal }}>setu</span></span>
            <button onClick={() => setOpen(false)} className="text-[#0B1220]" aria-label="Close menu"><X className="h-6 w-6" /></button>
          </div>
          <nav className="flex flex-col p-6 gap-5">
            {links.map((l) => (
              l.external ? (
                <Link key={l.label} to={l.href} onClick={() => setOpen(false)} className="text-[#0B1220] text-lg">{l.label}</Link>
              ) : (
                <a key={l.label} href={l.href} onClick={() => setOpen(false)} className="text-[#0B1220] text-lg">{l.label}</a>
              )
            ))}
            <button onClick={() => { setOpen(false); onTrackClick(); }} className="mt-4 h-12 rounded-lg border-2 font-semibold" style={{ borderColor: C.teal, color: C.teal }}>Track Your Parcel</button>
            <button onClick={() => { setOpen(false); onSendClick(); }} className="h-12 rounded-lg font-bold" style={{ background: C.teal, color: C.bg }}>Send a Parcel →</button>
          </nav>
        </div>
      )}
    </header>
  );
};

/* ---------------- TRACK FORM ---------------- */
const TrackForm = ({ onTrack }: { onTrack: (awb: string) => void }) => {
  const [awb, setAwb] = useState("");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (awb.trim()) onTrack(awb.trim());
  };
  return (
    <form onSubmit={submit} className="rounded-2xl p-5 md:p-6" style={{ background: C.bg2, border: `1px solid ${C.border}` }}>
      <label className="text-[12px] uppercase tracking-wider font-semibold" style={{ color: C.teal }}>
        Track your parcel — no login needed
      </label>
      <div className="mt-3 flex flex-col sm:flex-row gap-3">
        <input
          value={awb}
          onChange={(e) => setAwb(e.target.value)}
          placeholder="Enter AWB / Tracking Number"
          className="flex-1 h-12 rounded-lg px-4 text-[14px] outline-none focus:border-[#00C8C8]"
          style={{ background: C.card, border: `1px solid ${C.border}`, color: C.white }}
        />
        <button type="submit" className="h-12 px-6 rounded-lg font-bold text-[14px] flex items-center justify-center gap-2 whitespace-nowrap" style={{ background: C.teal, color: C.bg }}>
          <Search className="h-4 w-4" /> Track
        </button>
      </div>
    </form>
  );
};

/* ---------------- PHONE MOCKUP ---------------- */
const PhoneMockup = ({ children, src = appPreview }: { children?: React.ReactNode; src?: string }) => (
  <div className="mx-auto" style={{ width: 280 }}>
    <div className="rounded-[40px] p-3" style={{ background: "#000", border: `2px solid ${C.border}`, boxShadow: "0 30px 60px rgba(0,200,200,0.2)" }}>
      <div className="rounded-[32px] overflow-hidden" style={{ background: C.bg2, height: 560 }}>
        <img
          src={src}
          alt="Viasetu app showing courier comparison with ratings, ETA, reliability and prices"
          className="w-full h-full object-cover"
          loading="lazy"
        />
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
const FAQ_ITEMS: [string, string][] = [
  ["How do I compare courier prices on Viasetu?", "Sign in and enter your pickup pincode, delivery pincode and parcel weight. Viasetu instantly compares prices from our integrated courier partners — Delhivery, Shadowfax, XpressBees, UrbaneBolt and Shree Maruti — and shows you the cheapest and fastest options side by side."],
  ["Which is the cheapest courier service in India?", "Courier prices vary by route, weight and speed. Viasetu compares all integrated partners in real-time so you always get the best available price for your route."],
  ["Does Viasetu offer doorstep pickup?", "Yes. Viasetu schedules doorstep pickup from your home, office, hostel or any address across thousands of pincodes in India. No need to visit a courier shop."],
  ["How do I track my parcel on Viasetu?", "Just enter your AWB or tracking number on the home page — no login required. We provide unified real-time tracking across all our courier partners in one view."],
  ["How much can I save using Viasetu?", "Viasetu users save an average of 20–40% compared to walk-in rates at local courier shops."],
  ["Which couriers are available on Viasetu?", "Today: Delhivery, Shadowfax, XpressBees, UrbaneBolt and Shree Maruti. More partners (Blue Dart, DTDC, India Post, DHL, FedEx) are coming soon."],
  ["Is Viasetu free to use?", "Yes. Viasetu is free to use. You only pay for the courier service you book."],
  ["What payment methods does Viasetu accept?", "Viasetu accepts UPI (GPay, PhonePe, Paytm), credit cards, debit cards and net banking via Razorpay."],
];

const FAQItem = ({ q, a }: { q: string; a: string }) => {
  const [open, setOpen] = useState(false);
  return (
    <div className="rounded-xl mb-3" style={{ background: C.bg2, border: `1px solid ${C.border}` }}>
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between p-5 text-left">
        <span className="text-[#0B1220] font-semibold text-[15px] pr-4">{q}</span>
        <ChevronDown className={`h-5 w-5 transition-transform ${open ? "rotate-180" : ""}`} style={{ color: C.teal }} />
      </button>
      <div className="overflow-hidden transition-all" style={{ maxHeight: open ? 400 : 0 }}>
        <p className="px-5 pb-5 text-[14px] leading-relaxed" style={{ color: C.gray }}>{a}</p>
      </div>
    </div>
  );
};

/* ---------------- DATA ---------------- */
const ROUTES = [
  "Mumbai to Delhi", "Delhi to Mumbai", "Pune to Delhi", "Delhi to Pune",
  "Mumbai to Bangalore", "Bangalore to Mumbai", "Chennai to Delhi", "Delhi to Chennai",
  "Hyderabad to Mumbai", "Mumbai to Hyderabad", "Pune to Mumbai", "Mumbai to Pune",
  "Delhi to Kolkata", "Kolkata to Delhi", "Bangalore to Chennai", "Chennai to Bangalore",
  "Mumbai to Chennai", "Pune to Bangalore",
];

const ACTIVE_PARTNERS: { name: string; logo: string }[] = [
  { name: "Delhivery", logo: delhiveryLogo },
  { name: "Shadowfax", logo: shadowfaxLogo },
  { name: "XpressBees", logo: xpressbeesLogo },
  { name: "UrbaneBolt", logo: urbaneboltLogo },
  { name: "Shree Maruti", logo: shreeMarutiLogo },
];
const COMING_SOON_PARTNERS = ["Blue Dart", "DTDC", "India Post", "DHL", "FedEx"];

/* ---------------- MAIN ---------------- */
const Landing = () => {
  const navigate = useNavigate();
  const [cmsPosts, setCmsPosts] = useState<Array<{ slug: string; title: string; excerpt: string | null; body_html: string | null; featured_image_url: string | null; featured_image_alt: string | null; tags: string[] | null }>>([]);

  useEffect(() => {
    const authRaw = localStorage.getItem("auth_session") || localStorage.getItem("prayog_auth");
    if (authRaw) navigate("/home");
  }, [navigate]);

  useEffect(() => {
    const load = () => {
      supabase
        .from("cms_content")
        .select("slug,title,excerpt,body_html,featured_image_url,featured_image_alt,tags")
        .eq("type", "post")
        .eq("status", "published")
        .order("published_at", { ascending: false })
        .limit(3)
        .then(({ data }) => setCmsPosts((data as never) || []));
    };
    load();
    const channel = supabase
      .channel("public:cms_content:landing")
      .on("postgres_changes", { event: "*", schema: "public", table: "cms_content", filter: "type=eq.post" }, () => load())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const goSend = () => navigate("/login");
  const goTrack = () => navigate("/tracking");
  const trackAwb = (awb: string) => navigate("/tracking", { state: { awbNumber: awb } });

  return (
    <div style={{ background: C.bg, color: C.white, fontFamily: FONT_STACK }}>
      <NavBar onSendClick={goSend} onTrackClick={goTrack} />

      {/* HERO */}
      <section
        id="hero"
        aria-label="Compare courier services India"
        className="relative pt-24 md:pt-32 pb-16 px-6 overflow-hidden"
        style={{
          minHeight: "100vh",
          background: `linear-gradient(rgba(255,255,255,0.78), rgba(255,255,255,0.88)), url(${deliveryHero}) center/cover no-repeat`,
        }}
      >
        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full pointer-events-none" style={{ background: "radial-gradient(circle, rgba(0,200,200,0.15) 0%, transparent 70%)" }} />
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative">
          <div>
            <h1 className="font-bold leading-[1.15] text-[32px] md:text-[52px] text-[#0B1220]">
              Compare Courier Prices &amp; Book Online — <span style={{ color: C.teal }}>Save Up to 40%</span> on Every Parcel
            </h1>
            <h2 className="mt-5 text-[16px] md:text-[20px] font-normal" style={{ color: C.gray }}>
              India's First Consumer Courier Aggregator — Compare top couriers. Doorstep Pickup. Real-Time Tracking. All in One App.
            </h2>

            <div className="mt-8 flex flex-col sm:flex-row gap-3">
              <button
                onClick={goSend}
                className="h-14 px-8 rounded-lg font-bold text-[16px] flex items-center justify-center gap-2 transition-transform hover:scale-[1.02]"
                style={{ background: C.teal, color: C.bg }}
              >
                <Package className="h-5 w-5" /> Send a Parcel →
              </button>
              <a
                href="#track"
                className="h-14 px-8 rounded-lg font-bold text-[16px] flex items-center justify-center gap-2 border-2"
                style={{ borderColor: C.teal, color: C.teal }}
              >
                <Search className="h-5 w-5" /> Track a Parcel
              </a>
            </div>

            <div id="track" className="mt-6">
              <TrackForm onTrack={trackAwb} />
            </div>

            <div className="mt-6 text-[13px] md:text-[14px] flex flex-wrap gap-x-4 gap-y-2" style={{ color: C.gray }}>
              <span>⭐ Trusted by 10,000+ users</span>
              <span>·</span>
              <span>📦 Pan-India coverage</span>
              <span>·</span>
              <span>🚚 5 active courier partners</span>
              <span>·</span>
              <span>💰 Avg. saving ₹180 per shipment</span>
            </div>
          </div>
          <div className="hidden lg:block">
            <PhoneMockup />
          </div>
        </div>
      </section>

      {/* PARTNERS */}
      <section
        id="partners"
        className="relative py-16 px-6"
        style={{
          background: `linear-gradient(rgba(244,247,251,0.90), rgba(255,255,255,0.94)), url(${warehouseBg}) center/cover no-repeat`,
        }}
      >
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center text-[12px] uppercase tracking-[0.2em] mb-8" style={{ color: C.teal }}>Our Courier Partners</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {ACTIVE_PARTNERS.map((p) => (
              <div
                key={p.name}
                className="rounded-xl p-4 flex flex-col items-center justify-center gap-2 transition-transform hover:scale-[1.03]"
                style={{ background: "#FFFFFF", border: `1px solid ${C.border}`, minHeight: 110 }}
              >
                <div className="w-full h-14 flex items-center justify-center">
                  <img src={p.logo} alt={`${p.name} logo`} className="max-h-full max-w-full object-contain" loading="lazy" />
                </div>
                <div className="text-[12px] font-semibold" style={{ color: C.bg }}>{p.name}</div>
              </div>
            ))}
          </div>

          <div className="text-center text-[12px] uppercase tracking-[0.2em] mt-12 mb-4" style={{ color: C.gray }}>More Partners Coming Soon</div>
          <div className="flex flex-wrap justify-center gap-3">
            {COMING_SOON_PARTNERS.map((p) => (
              <div key={p} className="px-3 py-1.5 rounded-full text-[12px] flex items-center gap-2"
                style={{ background: C.card, border: `1px dashed ${C.border}`, color: C.gray }}>
                <span>{p}</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded" style={{ background: "rgba(0,200,200,0.15)", color: C.teal }}>SOON</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="relative py-20 px-6" style={{ background: `linear-gradient(rgba(255,255,255,0.88), rgba(244,247,251,0.94)), url(${logisticsBg}) center/cover no-repeat` }}>
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-[28px] md:text-[40px] font-bold text-[#0B1220]">How to Send a Parcel with Viasetu</h2>
          <p className="mt-3 text-[14px] md:text-[16px]" style={{ color: C.gray }}>4 steps. 2 minutes. Cheaper than walking into a courier shop.</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 mt-12">
            {[
              { n: "01", icon: <Package className="h-7 w-7" />, t: "Enter Shipment Details", b: "Add your pickup pincode, delivery location, weight and parcel type. Takes 30 seconds." },
              { n: "02", icon: <Search className="h-7 w-7" />, t: "Compare All Courier Prices", b: "See prices, delivery speed and reliability scores from our partners side by side. Instantly." },
              { n: "03", icon: <CreditCard className="h-7 w-7" />, t: "Book & Pay Securely", b: "Pay via UPI, card or wallet. Your doorstep pickup is scheduled automatically." },
              { n: "04", icon: <MapPin className="h-7 w-7" />, t: "Track Every Shipment Live", b: "Real-time status updates from pickup to delivery — all couriers in one dashboard." },
            ].map((s) => (
              <div key={s.n} className="rounded-xl p-7 text-left" style={{ background: C.bg2, border: `1px solid ${C.border}`, borderTop: `3px solid ${C.teal}` }}>
                <div className="h-14 w-14 rounded-full flex items-center justify-center mb-4" style={{ background: "rgba(0,200,200,0.15)", color: C.teal }}>{s.icon}</div>
                <div className="text-[12px] font-bold mb-1" style={{ color: C.teal }}>STEP {s.n}</div>
                <h3 className="text-[#0B1220] font-bold text-[16px] mb-2">{s.t}</h3>
                <p className="text-[13px] leading-relaxed" style={{ color: C.gray }}>{s.b}</p>
              </div>
            ))}
          </div>
          <div className="mt-10">
            <button onClick={goSend} className="h-14 px-8 rounded-lg font-bold text-[16px]" style={{ background: C.teal, color: C.bg }}>
              Send a Parcel Now →
            </button>
          </div>
        </div>
      </section>

      {/* WHY VIASETU */}
      <section id="why-viasetu" className="relative py-20 px-6" style={{ background: `linear-gradient(rgba(244,247,251,0.90), rgba(255,255,255,0.96)), url(${shippingBg}) center/cover no-repeat` }}>
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 className="text-[28px] md:text-[40px] font-bold text-[#0B1220] leading-tight">
              Why 10,000+ Indians Choose Viasetu to Send Their Parcels
            </h2>
            <div className="mt-8 space-y-5">
              {[
                ["Save 20–40% on Every Shipment", "Compare real-time prices across all integrated couriers. Stop overpaying at local courier shops."],
                ["5 Trusted Courier Partners in One App", "Delhivery, Shadowfax, XpressBees, UrbaneBolt and Shree Maruti — compared in 10 seconds."],
                ["Doorstep Pickup Across India", "Schedule pickup from your home, office or hostel. No shop visits. No queues."],
                ["AI-Powered Delivery Predictions", "Know your parcel's estimated arrival with a confidence score — not just a vague date range."],
                ["Unified Tracking for All Shipments", "Every parcel you've ever sent — tracked in one dashboard regardless of which courier carried it."],
              ].map(([t, b]) => (
                <div key={t} className="flex gap-3 p-3 rounded-lg" style={{ borderLeft: "2px solid transparent" }}>
                  <CheckCircle2 className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: C.teal }} />
                  <div>
                    <div className="text-[#0B1220] font-bold text-[15px]">{t}</div>
                    <div className="text-[13px] mt-1" style={{ color: C.gray }}>{b}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="hidden lg:block"><PhoneMockup src={appPreview2} /></div>
        </div>
      </section>

      {/* PERSONAS */}
      <section id="user-stories" className="py-20 px-6" style={{ background: C.bg }}>
        <div className="max-w-7xl mx-auto">
          <h2 className="text-center text-[28px] md:text-[40px] font-bold text-[#0B1220]">Who Uses Viasetu? Anyone Who Ships a Parcel in India.</h2>
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            {[
              { e: "🧁", t: "Home Bakers & Micro-Sellers", b: "Ship your products across India without visiting courier shops. Compare rates, book pickup, track deliveries — all from your phone while you run your business.", s: "Avg. saving ₹2,400/month" },
              { e: "🎓", t: "Students Living Away From Home", b: "Send clothes, books and packages home without the hassle. Get doorstep pickup at your hostel or PG. Track until it reaches your family.", s: "Doorstep pickup anywhere" },
              { e: "📱", t: "OLX / Meesho Sellers & SMEs", b: "Ship 10–50 orders a week with full tracking visibility. Professional shipping at consumer prices — no business account needed.", s: "Unified tracking dashboard" },
            ].map((p) => (
              <div key={p.t} className="rounded-xl p-8" style={{ background: C.bg2, border: `1px solid ${C.border}`, borderTop: `3px solid ${C.teal}` }}>
                <div className="h-14 w-14 rounded-full flex items-center justify-center text-2xl mb-4" style={{ background: "rgba(0,200,200,0.15)" }}>{p.e}</div>
                <h3 className="text-[#0B1220] font-bold text-[18px] mb-3">{p.t}</h3>
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
            { v: 5, s: "+", l: "Active Courier Partners" },
            { v: 21000, s: "+", l: "Pincodes Covered" },
            { v: 40, s: "%", l: "Average Savings" },
            { v: 4, s: " Steps", l: "To Send Any Parcel" },
          ].map((x, i) => (
            <div key={i} className="text-center px-4">
              <div className="text-[#0B1220] font-bold text-[32px] md:text-[42px]"><Counter end={x.v} suffix={x.s} /></div>
              <div className="text-[14px] mt-1" style={{ color: C.bg }}>{x.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* POPULAR ROUTES */}
      <section id="popular-routes" className="relative py-20 px-6" style={{ background: `linear-gradient(rgba(244,247,251,0.92), rgba(255,255,255,0.96)), url(${parcelsBg}) center/cover no-repeat` }}>
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-[28px] md:text-[40px] font-bold text-[#0B1220]">Popular Courier Routes in India</h2>
          <p className="mt-3 text-[14px] md:text-[16px]" style={{ color: C.gray }}>Compare prices and book courier pickup on India's most shipped routes</p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10">
            {ROUTES.map((r) => (
              <button
                key={r}
                onClick={goSend}
                aria-label={`Book ${r} Courier`}
                className="px-4 py-2 rounded-full text-[13px] text-[#0B1220] text-center transition-colors hover:bg-[#00C8C8] hover:text-white"
                style={{ background: C.card, border: `1px solid ${C.border}` }}
              >
                {r} Courier
              </button>
            ))}
          </div>
          <p className="mt-8 text-[13px]" style={{ color: C.gray }}>
            Can't find your route?{" "}
            <button onClick={goSend} className="underline" style={{ color: C.teal }}>
              Open the booking app →
            </button>{" "}
            to compare any pincode-to-pincode combination across India.
          </p>
        </div>
      </section>

      {/* BLOG */}
      <section id="blog" className="py-20 px-6" style={{ background: C.bg2 }}>
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-[28px] md:text-[40px] font-bold text-[#0B1220] mb-3">From the Viasetu Blog</h2>
            <p className="text-[16px]" style={{ color: C.gray }}>
              Tips, guides and insights to ship smarter across India.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {(cmsPosts.length > 0
              ? cmsPosts.map((p) => {
                  const stripped = (p.body_html || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
                  const derived = p.excerpt && p.excerpt.trim()
                    ? p.excerpt.trim()
                    : (stripped ? (stripped.length > 160 ? stripped.slice(0, 157) + "…" : stripped) : "Read the full article for more.");
                  const words = stripped ? stripped.split(" ").length : 0;
                  const mins = Math.max(1, Math.round(words / 200));
                  return {
                    slug: p.slug,
                    tag: (p.tags && p.tags[0]) || "Article",
                    img: p.featured_image_url || logisticsBg,
                    alt: p.featured_image_alt || p.title,
                    title: p.title,
                    excerpt: derived,
                    read: `${mins} min read`,
                  };
                })
              : [
                  { slug: null, tag: "Shipping Guide", img: parcelsBg, alt: "Packing fragile items", title: "How to Pack Fragile Items for Safe Delivery", excerpt: "Bubble wrap, double-boxing, and labelling tips that prevent damage during transit.", read: "5 min read" },
                  { slug: null, tag: "Compare Couriers", img: logisticsBg, alt: "Compare couriers", title: "Delhivery vs XpressBees vs Shadowfax: Which to Choose?", excerpt: "A practical breakdown of pricing, TAT and serviceability across India's top partners.", read: "7 min read" },
                  { slug: null, tag: "Cost Saving", img: shippingBg, alt: "Reduce courier costs", title: "5 Ways to Reduce Your Courier Costs in 2026", excerpt: "Volumetric weight, surface vs air, and pickup batching — small changes, big savings.", read: "4 min read" },
                ]
            ).map((p) => {
              const Card = (
                <article
                  className="rounded-2xl overflow-hidden flex flex-col cursor-pointer transition-all hover:-translate-y-1 hover:shadow-lg h-full"
                  style={{ background: C.card, border: `1px solid ${C.border}` }}
                >
                  <div className="h-44 w-full overflow-hidden">
                    <img src={p.img} alt={p.alt} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 hover:scale-105" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <span
                      className="self-start text-[11px] font-semibold px-2 py-1 rounded-full mb-3"
                      style={{ background: `${C.teal}15`, color: C.teal }}
                    >
                      {p.tag}
                    </span>
                    <h3 className="text-[18px] font-bold text-[#0B1220] mb-2 leading-snug">{p.title}</h3>
                    <p className="text-[14px] mb-4 flex-1" style={{ color: C.gray }}>{p.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <span className="text-[12px]" style={{ color: C.gray }}>{p.read}</span>
                      <span className="text-[13px] font-semibold" style={{ color: C.teal }}>Read more →</span>
                    </div>
                  </div>
                </article>
              );
              return p.slug ? (
                <Link key={p.slug} to={`/blog/${p.slug}`}>{Card}</Link>
              ) : (
                <div key={p.title}>{Card}</div>
              );
            })}
          </div>
          <div className="text-center mt-10">
            <Link
              to="/blog"
              className="inline-block px-6 h-11 leading-[44px] rounded-lg font-semibold text-[14px] border-2 transition-colors hover:bg-[#00C8C8]/10"
              style={{ borderColor: C.teal, color: C.teal }}
            >
              View all articles
            </Link>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20 px-6" style={{ background: C.bg }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-center text-[28px] md:text-[40px] font-bold text-[#0B1220] mb-10">Frequently Asked Questions About Sending Parcels in India</h2>
          {FAQ_ITEMS.map(([q, a]) => <FAQItem key={q} q={q} a={a} />)}
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 pt-16 pb-10" style={{ background: C.bg, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
          <div>
            <div className="text-[#0B1220] font-bold text-[20px]">Via<span style={{ color: C.teal }}>setu</span></div>
            <div className="text-[13px] font-semibold mt-2 text-[#0B1220]">India's First Consumer Courier Aggregator</div>
            <p className="text-[13px] mt-3" style={{ color: C.gray }}>Compare prices from top couriers, book doorstep pickup and track all shipments — all in one app.</p>
            <div className="flex gap-4 mt-4">
              <a href="#" aria-label="LinkedIn" className="hover:text-[#00C8C8] transition-colors" style={{ color: C.gray }}><Linkedin className="h-5 w-5" /></a>
              <a href="#" aria-label="Twitter" className="hover:text-[#00C8C8] transition-colors" style={{ color: C.gray }}><Twitter className="h-5 w-5" /></a>
              <a href="#" aria-label="Instagram" className="hover:text-[#00C8C8] transition-colors" style={{ color: C.gray }}><Instagram className="h-5 w-5" /></a>
            </div>
          </div>
          <div>
            <h3 className="text-[#0B1220] font-bold text-[14px] mb-4">Our Services</h3>
            <ul className="space-y-2 text-[13px]">
              {[
                { label: "Compare Courier Prices", onClick: goSend },
                { label: "Book Courier Online", onClick: goSend },
                { label: "Courier Tracking", onClick: goTrack },
                { label: "Doorstep Pickup", onClick: goSend },
                { label: "Bulk Shipping (Coming Soon)", onClick: goSend },
              ].map((x) => (
                <li key={x.label}>
                  <button onClick={x.onClick} className="hover:text-[#00C8C8] transition-colors text-left" style={{ color: C.gray }}>{x.label}</button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-[#0B1220] font-bold text-[14px] mb-4">Popular Routes</h3>
            <ul className="space-y-2 text-[13px]">
              {ROUTES.slice(0, 6).map((r) => (
                <li key={r}>
                  <button onClick={goSend} className="hover:text-[#00C8C8] transition-colors text-left" style={{ color: C.gray }}>{r} Courier</button>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h3 className="text-[#0B1220] font-bold text-[14px] mb-4">Company</h3>
            <ul className="space-y-2 text-[13px]">
              {["About Us","How It Works","Courier Partners","Press","Careers","Contact Us","Privacy Policy","Terms of Service","Refund Policy"].map((x) => (
                <li key={x}><a href="#" className="hover:text-[#00C8C8] transition-colors" style={{ color: C.gray }}>{x}</a></li>
              ))}
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-10 pt-6 flex flex-col md:flex-row justify-between gap-3 text-[12px]" style={{ borderTop: `1px solid ${C.border}`, color: C.gray }}>
          <span>© 2025 Viasetu. All rights reserved.</span>
          <span>Made with ❤️ for every Indian who ships a parcel.</span>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
