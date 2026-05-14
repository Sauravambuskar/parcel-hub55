import { ReactNode, useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Menu, X, Linkedin, Twitter, Instagram } from "lucide-react";

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

const links = [
  { href: "/", label: "Home" },
  { href: "/blog", label: "Blog" },
  { href: "/faq", label: "FAQ" },
];

function SiteHeader() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
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
        <Link to="/" className="flex items-center">
          <span className="font-bold text-[22px]" style={{ color: C.text }}>Via</span>
          <span className="font-bold text-[22px]" style={{ color: C.teal }}>setu</span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8">
          {links.map((l) => (
            <Link key={l.label} to={l.href} className="text-[14px] transition-colors hover:text-[#00C8C8]" style={{ color: C.gray }}>
              {l.label}
            </Link>
          ))}
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
            <span className="font-bold text-[22px]" style={{ color: C.text }}>Via<span style={{ color: C.teal }}>setu</span></span>
            <button onClick={() => setOpen(false)} style={{ color: C.text }} aria-label="Close menu"><X className="h-6 w-6" /></button>
          </div>
          <nav className="flex flex-col p-6 gap-5">
            {links.map((l) => (
              <Link key={l.label} to={l.href} onClick={() => setOpen(false)} className="text-lg" style={{ color: C.text }}>{l.label}</Link>
            ))}
            <button onClick={() => { setOpen(false); navigate("/tracking"); }} className="mt-4 h-12 rounded-lg border-2 font-semibold" style={{ borderColor: C.teal, color: C.teal }}>Track Your Parcel</button>
            <button onClick={() => { setOpen(false); navigate("/login"); }} className="h-12 rounded-lg font-bold" style={{ background: C.teal, color: C.bg }}>Send a Parcel →</button>
          </nav>
        </div>
      )}
    </header>
  );
}

function SiteFooter() {
  return (
    <footer className="px-6 pt-12 pb-8 mt-16" style={{ background: C.bg, borderTop: `1px solid ${C.border}` }}>
      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-10">
        <div>
          <div className="font-bold text-[20px]" style={{ color: C.text }}>Via<span style={{ color: C.teal }}>setu</span></div>
          <p className="text-[13px] mt-3" style={{ color: C.gray }}>Compare prices from top couriers, book doorstep pickup and track all shipments — all in one app.</p>
          <div className="flex gap-4 mt-4">
            <a href="#" aria-label="LinkedIn" className="hover:text-[#00C8C8] transition-colors" style={{ color: C.gray }}><Linkedin className="h-5 w-5" /></a>
            <a href="#" aria-label="Twitter" className="hover:text-[#00C8C8] transition-colors" style={{ color: C.gray }}><Twitter className="h-5 w-5" /></a>
            <a href="#" aria-label="Instagram" className="hover:text-[#00C8C8] transition-colors" style={{ color: C.gray }}><Instagram className="h-5 w-5" /></a>
          </div>
        </div>
        <div>
          <h3 className="font-bold text-[14px] mb-4" style={{ color: C.text }}>Explore</h3>
          <ul className="space-y-2 text-[13px]">
            {links.map((l) => (
              <li key={l.label}><Link to={l.href} className="hover:text-[#00C8C8] transition-colors" style={{ color: C.gray }}>{l.label}</Link></li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="font-bold text-[14px] mb-4" style={{ color: C.text }}>Get Started</h3>
          <ul className="space-y-2 text-[13px]">
            <li><Link to="/login" className="hover:text-[#00C8C8] transition-colors" style={{ color: C.gray }}>Send a Parcel</Link></li>
            <li><Link to="/tracking" className="hover:text-[#00C8C8] transition-colors" style={{ color: C.gray }}>Track Your Parcel</Link></li>
          </ul>
        </div>
      </div>
      <div className="max-w-7xl mx-auto mt-8 pt-6 flex flex-col md:flex-row justify-between gap-3 text-[12px]" style={{ borderTop: `1px solid ${C.border}`, color: C.gray }}>
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
