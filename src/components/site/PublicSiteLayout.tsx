import { ReactNode, useEffect, useState, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Menu, X, Linkedin, Twitter, Instagram, ChevronDown, BookOpen, HelpCircle, Mail, Briefcase, Package, Truck, Zap, MapPin, User, Home, Building2, Hand } from "lucide-react";
import Logo from "@/components/Logo";

const C = {
  bg: "#FFFFFF",
  bg2: "#F4F7FB",
  card: "#FFFFFF",
  teal: "#00A8A8",
  text: "#0B1220",
  gray: "#5A6B80",
  border: "#E2E8F0",
};

const FONT_STACK = '"Montserrat", "Helvetica Neue", Arial, sans-serif';

const plainLinks = [
  { href: "/tracking", label: "Track Parcel" },
  { href: "/about", label: "About Us" },
  { href: "/courier-partners", label: "Courier Partners" },
  { href: "/contact", label: "Contact Us" },
];

const serviceItems = [
  { href: "/services/parcel-tracking", label: "Parcel Tracking", icon: Package },
  { href: "/services/bulk-shipment", label: "Bulk Shipment", icon: Truck },
  { href: "/services/express-delivery", label: "Express Delivery", icon: Zap },
  { href: "/services/domestic-courier-service", label: "Domestic Courier Service", icon: MapPin },
  { href: "/services/individual-business", label: "Individual Business", icon: User },
  { href: "/services/personal-business", label: "Personal Business", icon: Home },
  { href: "/services/sme-courier-service", label: "SME Courier Service", icon: Building2 },
  { href: "/services/doorstep-pickup", label: "Doorstep Pickup", icon: Hand },
];

const resourceItems = [
  { href: "/blog", label: "Blog", icon: BookOpen },
  { href: "/faq", label: "FAQ", icon: HelpCircle },
  { href: "/careers", label: "Careers", icon: Briefcase },
  { href: "/contact", label: "Contact Us", icon: Mail },
];

const ROUTES = [
  "Delhi to Mumbai",
  "Bangalore to Hyderabad",
  "Mumbai to Pune",
  "Chennai to Bangalore",
  "Delhi to Bangalore",
  "Kolkata to Delhi",
];

type DropdownItem = { href: string; label: string; icon: any };

function NavDropdown({ label, items, width = "w-52" }: { label: string; items: DropdownItem[]; width?: string }) {
  const [open, setOpen] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const location = useLocation();

  useEffect(() => {
    setOpen(false);
  }, [location]);

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setOpen(true);
  };
  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <div className="relative" onMouseEnter={handleEnter} onMouseLeave={handleLeave}>
      <button
        className="flex items-center gap-1 text-[14px] font-bold transition-colors hover:text-[#00C8C8] focus:outline-none"
        style={{ color: C.text }}
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="true"
        aria-expanded={open}
      >
        {label}
        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div
          className={`absolute top-full left-1/2 -translate-x-1/2 mt-2 ${width} rounded-xl border shadow-lg p-2 animate-in fade-in zoom-in-95 duration-200`}
          style={{ background: C.card, borderColor: C.border }}
        >
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                to={item.href}
                className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-colors hover:bg-[#00A8A8]/10 hover:text-[#00A8A8]"
                style={{ color: C.text }}
              >
                <Icon className="h-4 w-4 shrink-0" style={{ color: C.teal }} />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}


function SiteHeader() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [servicesOpenMobile, setServicesOpenMobile] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all ${scrolled ? "backdrop-blur-sm" : ""}`}
      style={{ background: scrolled ? "rgba(255,255,255,0.92)" : C.bg, borderBottom: `1px solid ${C.border}`, height: 64 }}
    >
      <div className="max-w-7xl mx-auto h-full px-6 flex items-center justify-between">
        <Link to="/" className="flex items-center" aria-label="ViaSetu home">
          <Logo size="md" />
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {plainLinks.map((l) => (
            <Link key={l.label} to={l.href} className="text-[14px] font-bold transition-colors hover:text-[#00C8C8]" style={{ color: C.text }}>
              {l.label}
            </Link>
          ))}
          <ResourcesDropdown />
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => navigate("/tracking")}
            className="px-4 h-10 rounded-lg font-semibold text-[14px] border-2 transition-colors hover:bg-[#00C8C8]/10"
            style={{ borderColor: C.teal, color: C.teal }}
          >
            Track Your Parcel
          </button>
          <button
            onClick={() => navigate("/login")}
            className="px-5 h-10 rounded-lg font-bold text-[14px] transition-transform hover:scale-[1.02]"
            style={{ background: C.teal, color: C.bg }}
          >
            Send a Parcel →
          </button>
        </div>

        <button className="md:hidden" style={{ color: C.text }} onClick={() => setOpen(true)} aria-label="Open menu">
          <Menu className="h-6 w-6" />
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-50 md:hidden" style={{ background: C.bg }}>
          <div className="flex justify-between items-center px-6 h-16" style={{ borderBottom: `1px solid ${C.border}` }}>
            <Logo size="md" />
            <button onClick={() => setOpen(false)} style={{ color: C.text }} aria-label="Close menu"><X className="h-6 w-6" /></button>
          </div>
          <nav className="flex flex-col p-6 gap-5">
            {plainLinks.map((l) => (
              <Link key={l.label} to={l.href} onClick={() => setOpen(false)} className="text-lg font-bold" style={{ color: C.text }}>{l.label}</Link>
            ))}

            <div>
              <button
                onClick={() => setResourcesOpenMobile((v) => !v)}
                className="flex items-center gap-2 text-lg w-full text-left font-bold"
                style={{ color: C.text }}
              >
                Resources
                <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${resourcesOpenMobile ? "rotate-180" : ""}`} />
              </button>
              {resourcesOpenMobile && (
                <div className="mt-3 ml-3 flex flex-col gap-3 border-l-2 pl-4" style={{ borderColor: C.border }}>
                  {resourceItems.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Link
                        key={item.label}
                        to={item.href}
                        onClick={() => setOpen(false)}
                        className="flex items-center gap-2 text-[15px] transition-colors hover:text-[#00C8C8]"
                        style={{ color: C.gray }}
                      >
                        <Icon className="h-4 w-4" style={{ color: C.teal }} />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <button onClick={() => { setOpen(false); navigate("/tracking"); }} className="mt-4 h-12 rounded-lg border-2 font-semibold" style={{ borderColor: C.teal, color: C.teal }}>Track Your Parcel</button>
            <button onClick={() => { setOpen(false); navigate("/login"); }} className="h-12 rounded-lg font-bold" style={{ background: C.teal, color: C.bg }}>Send a Parcel →</button>
          </nav>
        </div>
      )}
    </header>
  );
}

function SiteFooter() {
  const navigate = useNavigate();
  const goSend = () => navigate("/login");
  const goTrack = () => navigate("/tracking");
  return (
    <footer className="px-6 pt-16 pb-10" style={{ background: C.bg, borderTop: `1px solid ${C.border}` }}>
      <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
        <div>
          <Logo size="md" />
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
            {ROUTES.map((r) => (
              <li key={r}>
                <button onClick={goSend} className="hover:text-[#00C8C8] transition-colors text-left" style={{ color: C.gray }}>{r} Courier</button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-[#0B1220] font-bold text-[14px] mb-4">Company</h3>
          <ul className="space-y-2 text-[13px]">
            {[
              { label: "About Us", href: "/about" },
              { label: "How It Works", href: "/#how-it-works" },
              { label: "Courier Partners", href: "/courier-partners" },
              { label: "Press", href: "/" },
              { label: "Contact Us", href: "/contact" },
              { label: "Privacy Policy", href: "/Privacypolicy" },
              { label: "Terms & Conditions", href: "/Termsandconditions" },
              { label: "Refund Policy", href: "/Privacypolicy" },
            ].map((x) => (
              <li key={x.label}><a href={x.href} className="hover:text-[#00C8C8] transition-colors" style={{ color: C.gray }}>{x.label}</a></li>
            ))}
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-10 pt-6 flex flex-col md:flex-row justify-between gap-3 text-[12px]" style={{ borderTop: `1px solid ${C.border}`, color: C.gray }}>
        <span>© 2025 Viasetu. All rights reserved.</span>
        <span>Made with ❤️ for every Indian who ships a parcel.</span>
      </div>
    </footer>
  );
}

export default function PublicSiteLayout({ children }: { children: ReactNode }) {
  return (
    <div style={{ background: C.bg, color: C.text, fontFamily: FONT_STACK }} className="min-h-screen flex flex-col">
      <SiteHeader />
      <main className="flex-1 pt-20">{children}</main>
      <SiteFooter />
    </div>
  );
}
