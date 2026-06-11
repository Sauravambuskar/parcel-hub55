import { Helmet } from "react-helmet-async";
import { useNavigate } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import PublicSiteLayout from "@/components/site/PublicSiteLayout";
import {
  Handshake,
  Network,
  TrendingUp,
  ShieldCheck,
  Zap,
  BarChart3,
  Settings,
  CheckCircle2,
  ArrowRight,
  Phone,
  Mail,
  Building2,
  Globe,
  Clock,
  FileCheck,
  Cpu,
  Layers,
  Headphones,
} from "lucide-react";

const C = {
  bg: "#FFFFFF",
  bg2: "#F4F7FB",
  teal: "#00A8A8",
  text: "#0B1220",
  gray: "#5A6B80",
  border: "#E2E8F0",
};

const benefits = [
  {
    icon: TrendingUp,
    title: "Incremental Revenue",
    text: "Access a growing base of individual senders and small businesses who book daily on ViaSetu — without spending on customer acquisition.",
  },
  {
    icon: Zap,
    title: "Zero Acquisition Cost",
    text: "We bring the demand to you. Focus on pickups and deliveries while we handle marketing, pricing and customer onboarding.",
  },
  {
    icon: ShieldCheck,
    title: "Verified Bookings Only",
    text: "Every shipment is pre-paid with validated sender and receiver addresses, reducing COD risk and failed deliveries.",
  },
  {
    icon: BarChart3,
    title: "Transparent Reporting",
    text: "Daily dashboards show booking volume, revenue, pincode coverage, NDR status and settlement summaries in one place.",
  },
  {
    icon: Clock,
    title: "Faster Settlement Cycles",
    text: "Our automated reconciliation engine ensures settlements are processed faster than typical industry timelines.",
  },
  {
    icon: Headphones,
    title: "Dedicated Partner Support",
    text: "A direct escalation channel with our operations team for exceptions, NDR resolution and SLA queries.",
  },
];

const steps = [
  {
    title: "Initial Discussion",
    text: "Share your company profile, network coverage and service capabilities with our partnerships team.",
  },
  {
    title: "Eligibility Review",
    text: "We evaluate coverage reach, SLA track record, tech-readiness and compliance standards.",
  },
  {
    title: "Integration & Testing",
    text: "Connect via our standard REST APIs. We support sandbox testing before any live bookings go through.",
  },
  {
    title: "Go Live",
    text: "Once certified, your services go live on ViaSetu — visible to every customer searching your covered routes.",
  },
];

const requirements = [
  "Valid GST registration and IEC (if applicable) for cross-border services",
  "Active pincode-level serviceability across your network",
  "API or webhook capability for booking, tracking, label and cancellation flows",
  "Ability to support doorstep pickup with time-bound SLAs",
  "Standard B2B/B2C liability coverage for shipments",
  "Commitment to ETAs agreed with ViaSetu for every service type",
];

const integrationPoints = [
  {
    icon: Cpu,
    title: "Unified Booking API",
    text: "Single REST contract for order creation, pickup scheduling and waybill generation.",
  },
  {
    icon: Layers,
    title: "Label & Invoice Generation",
    text: "Auto-generate compliant shipping labels and GST invoices synced with every booking.",
  },
  {
    icon: Globe,
    title: "Real-Time Tracking Push",
    text: "Webhooks push every status update — picked, in-transit, out-for-delivery, delivered — to ViaSetu in real time.",
  },
  {
    icon: Settings,
    title: "Serviceability Lookup",
    text: "Expose your pincode network so ViaSetu can surface your services only where you operate.",
  },
  {
    icon: FileCheck,
    title: "NDR & Cancellation",
    text: "Standardized non-delivery and cancellation APIs ensure consistent experience across all partners.",
  },
  {
    icon: BarChart3,
    title: "Analytics & Reconciliation",
    text: "Automated data exchange for daily order volume, delivered vs returned, and financial reconciliation.",
  },
];

const faqs = [
  {
    q: "What types of courier companies can partner with ViaSetu?",
    a: "We work with national express carriers, regional courier firms, last-mile delivery startups and hyperlocal logistics providers. If you have a valid network and API capability, we would love to talk.",
  },
  {
    q: "Is there a sign-up fee or revenue-sharing model?",
    a: "There is no upfront sign-up fee. ViaSetu operates on a transparent per-booking revenue share, agreed upon before go-live. You retain full control over your base rates.",
  },
  {
    q: "How long does the integration process take?",
    a: "Typical partner integrations take 2–4 weeks, depending on API readiness and sandbox testing cycles. We provide a dedicated integration checklist and test cases.",
  },
  {
    q: "Do we need to change our existing systems?",
    a: "Not at all. ViaSetu integrates with your existing booking, tracking and label APIs. If you do not have APIs yet, we can guide you on the minimal endpoints required.",
  },
  {
    q: "Which service types does ViaSetu support?",
    a: "We currently support standard surface, air/express and same-day metro services. Reverse logistics and bulk B2B solutions are on our near-term roadmap.",
  },
  {
    q: "How are disputes and NDRs handled?",
    a: "Every partner gets access to our partner portal for NDR management. Escalations are handled by our operations team within SLA timelines, with automated status updates.",
  },
  {
    q: "Can we restrict coverage to specific pincodes or cities?",
    a: "Yes. Your serviceability is fully configurable — expose as many or as few pincodes as you like. ViaSetu will only show your services where you confirm coverage.",
  },
  {
    q: "Who should we contact to start a partnership?",
    a: "Email us at partners@viasetu.com or fill the inquiry form on our Contact page. Our partnerships team typically responds within 48 hours.",
  },
];

export default function CourierPartners() {
  const navigate = useNavigate();

  return (
    <PublicSiteLayout>
      <Helmet>
        <title>Courier Partners — Join the ViaSetu Network</title>
        <meta
          name="description"
          content="Partner with ViaSetu to grow your courier business. Access verified bookings, transparent reporting and a nationwide customer base with zero acquisition cost."
        />
        <link rel="canonical" href="https://www.viasetu.com/courier-partners" />
        <meta property="og:title" content="Courier Partners — ViaSetu" />
        <meta
          property="og:description"
          content="Grow your courier business by partnering with India's consumer-first courier aggregator."
        />
      </Helmet>

      {/* Hero */}
      <section
        className="px-6 py-16 md:py-24"
        style={{ background: `linear-gradient(180deg, ${C.bg2} 0%, ${C.bg} 100%)` }}
      >
        <div className="max-w-5xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[12px] font-semibold mb-6"
            style={{ background: `${C.teal}1A`, color: C.teal }}
          >
            <Handshake className="h-3.5 w-3.5" /> Partnership Program
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold leading-tight" style={{ color: C.text }}>
            Grow Your Courier Business with ViaSetu
          </h1>
          <p className="mt-5 text-[15px] md:text-[17px] max-w-3xl mx-auto" style={{ color: C.gray }}>
            Join India's first consumer-first courier aggregator and unlock a nationwide customer base —
            incremental revenue, verified bookings and transparent reporting with zero acquisition spend.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-8">
            <a
              href="mailto:partners@viasetu.com"
              className="px-6 h-12 rounded-lg font-bold text-[14px] inline-flex items-center transition-transform hover:scale-[1.02]"
              style={{ background: C.teal, color: C.bg }}
            >
              Become a Partner <ArrowRight className="inline h-4 w-4 ml-1" />
            </a>
            <button
              onClick={() => navigate("/contact")}
              className="px-6 h-12 rounded-lg font-semibold text-[14px] border-2 transition-colors hover:bg-[#00C8C8]/10"
              style={{ borderColor: C.teal, color: C.teal }}
            >
              Contact Partnership Team
            </button>
          </div>

          <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { label: "Cities Covered", value: "2,800+" },
              { label: "Monthly Bookings", value: "50,000+" },
              { label: "Active Partners", value: "5+" },
              { label: "Avg. Settlement Time", value: "7 Days" },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border p-5 text-center"
                style={{ background: C.bg, borderColor: C.border }}
              >
                <div className="text-2xl md:text-3xl font-extrabold" style={{ color: C.teal }}>
                  {stat.value}
                </div>
                <div className="text-[12px] font-medium mt-1" style={{ color: C.gray }}>
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Partner Network Overview */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-center">
          <div>
            <div
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-semibold mb-4"
              style={{ background: `${C.teal}1A`, color: C.teal }}
            >
              <Network className="h-3.5 w-3.5" /> Partner Network
            </div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: C.text }}>
              Partner Network Overview
            </h2>
            <p className="text-[15px] leading-relaxed" style={{ color: C.gray }}>
              ViaSetu aggregates India's most trusted courier providers onto a single platform. Our partners range
              from large national networks to nimble regional operators — all benefiting from a shared technology
              layer, unified customer experience and predictable demand.
            </p>
            <p className="mt-4 text-[15px] leading-relaxed" style={{ color: C.gray }}>
              As a partner, you retain your brand identity while tapping into a curated audience of
              individuals, students, small sellers and D2C brands who are actively looking to ship parcels every day.
            </p>
            <ul className="mt-5 space-y-2.5">
              {[
                "Pre-paid, verified bookings — no COD risk",
                "Shared pincode intelligence and demand forecasting",
                "Standardized SLAs with clear escalation paths",
                "Brand visibility on every rate-comparison result",
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5 text-[14px]" style={{ color: C.text }}>
                  <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" style={{ color: C.teal }} />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Building2, label: "National Express" },
              { icon: Globe, label: "Regional Networks" },
              { icon: Zap, label: "Hyperlocal" },
              { icon: ShieldCheck, label: "Specialty Cargo" },
            ].map((c) => (
              <div
                key={c.label}
                className="p-6 rounded-2xl border text-center transition-shadow hover:shadow-md"
                style={{ background: C.bg2, borderColor: C.border }}
              >
                <div
                  className="inline-flex h-12 w-12 items-center justify-center rounded-xl mb-3 mx-auto"
                  style={{ background: `${C.teal}1A`, color: C.teal }}
                >
                  <c.icon className="h-6 w-6" />
                </div>
                <h3 className="font-bold text-[14px]" style={{ color: C.text }}>{c.label}</h3>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="px-6 py-16" style={{ background: C.bg2 }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: C.text }}>
              Benefits of Partnership
            </h2>
            <p className="mt-3 text-[15px]" style={{ color: C.gray }}>
              Everything we do is designed to help partners grow predictably and operate efficiently.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {benefits.map((b) => (
              <div
                key={b.title}
                className="p-6 rounded-2xl border transition-shadow hover:shadow-lg"
                style={{ background: C.bg, borderColor: C.border }}
              >
                <div
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3"
                  style={{ background: `${C.teal}1A`, color: C.teal }}
                >
                  <b.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-[16px]" style={{ color: C.text }}>
                  {b.title}
                </h3>
                <p className="text-[13.5px] mt-2 leading-relaxed" style={{ color: C.gray }}>
                  {b.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How the Partnership Process Works */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: C.text }}>
              How the Partnership Process Works
            </h2>
            <p className="mt-3 text-[15px]" style={{ color: C.gray }}>
              From first conversation to live bookings in as little as two weeks.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-5 relative">
            {steps.map((s, i) => (
              <div
                key={s.title}
                className="relative p-6 rounded-2xl border text-center"
                style={{ background: C.bg2, borderColor: C.border }}
              >
                <div
                  className="inline-flex h-10 w-10 items-center justify-center rounded-full font-bold text-[14px] mx-auto mb-4"
                  style={{ background: C.teal, color: C.bg }}
                >
                  {i + 1}
                </div>
                <h3 className="font-bold text-[16px]" style={{ color: C.text }}>
                  {s.title}
                </h3>
                <p className="text-[13.5px] mt-2 leading-relaxed" style={{ color: C.gray }}>
                  {s.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="px-6 py-16" style={{ background: C.bg2 }}>
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-10 items-start">
          <div>
            <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: C.text }}>
              Eligibility & Requirements
            </h2>
            <p className="text-[15px] leading-relaxed" style={{ color: C.gray }}>
              We keep our requirements practical — focused on legal compliance, network reach and
              operational reliability. If you meet the essentials below, we are ready to move fast.
            </p>
            <ul className="mt-6 space-y-3">
              {requirements.map((r) => (
                <li key={r} className="flex items-start gap-3 text-[14px]" style={{ color: C.text }}>
                  <CheckCircle2 className="h-5 w-5 mt-0.5 shrink-0" style={{ color: C.teal }} />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="p-7 rounded-2xl border" style={{ background: C.bg, borderColor: C.border }}>
            <h3 className="font-bold text-[16px] mb-3" style={{ color: C.text }}>
              What We Look For
            </h3>
            <div className="space-y-4">
              {[
                { label: "Network Reach", value: 85, text: "Broad pincode coverage across states" },
                { label: "SLA Track Record", value: 92, text: "On-time pickup and delivery history" },
                { label: "Tech Readiness", value: 70, text: "API/webhook support for core flows" },
                { label: "Compliance Score", value: 95, text: "GST, insurance and legal adherence" },
              ].map((bar) => (
                <div key={bar.label}>
                  <div className="flex justify-between text-[13px] mb-1">
                    <span className="font-medium" style={{ color: C.text }}>{bar.label}</span>
                    <span style={{ color: C.teal }}>{bar.value}%</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: C.border }}>
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${bar.value}%`, background: C.teal }}
                    />
                  </div>
                  <p className="text-[12px] mt-1" style={{ color: C.gray }}>{bar.text}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Integration Capabilities */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold" style={{ color: C.text }}>
              Integration Capabilities
            </h2>
            <p className="mt-3 text-[15px]" style={{ color: C.gray }}>
              A lightweight, well-documented API layer that slots into your existing operations.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {integrationPoints.map((p) => (
              <div
                key={p.title}
                className="p-6 rounded-2xl border transition-shadow hover:shadow-lg"
                style={{ background: C.bg2, borderColor: C.border }}
              >
                <div
                  className="inline-flex h-10 w-10 items-center justify-center rounded-xl mb-3"
                  style={{ background: `${C.teal}1A`, color: C.teal }}
                >
                  <p.icon className="h-5 w-5" />
                </div>
                <h3 className="font-bold text-[16px]" style={{ color: C.text }}>
                  {p.title}
                </h3>
                <p className="text-[13.5px] mt-2 leading-relaxed" style={{ color: C.gray }}>
                  {p.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-6 py-16" style={{ background: C.bg2 }}>
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold mb-2 text-center" style={{ color: C.text }}>
            Partnership FAQs
          </h2>
          <p className="text-center text-[14px] mb-8" style={{ color: C.gray }}>
            Common questions from courier companies considering the ViaSetu network.
          </p>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border rounded-xl px-4"
                style={{ borderColor: C.border, background: C.bg }}
              >
                <AccordionTrigger className="text-left font-semibold" style={{ color: C.text }}>
                  {f.q}
                </AccordionTrigger>
                <AccordionContent>
                  <p className="text-[14px] leading-relaxed" style={{ color: C.gray }}>
                    {f.a}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{
              __html: JSON.stringify({
                "@context": "https://schema.org",
                "@type": "FAQPage",
                mainEntity: faqs.map((f) => ({
                  "@type": "Question",
                  name: f.q,
                  acceptedAnswer: { "@type": "Answer", text: f.a },
                })),
              }),
            }}
          />
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16">
        <div
          className="max-w-5xl mx-auto rounded-3xl px-8 py-14 text-center"
          style={{ background: `linear-gradient(135deg, ${C.teal} 0%, #00C8C8 100%)`, color: C.bg }}
        >
          <h2 className="text-2xl md:text-3xl font-extrabold">
            Ready to partner with India's fastest-growing courier aggregator?
          </h2>
          <p className="mt-3 text-[15px] opacity-95 max-w-2xl mx-auto">
            Talk to our partnerships team today and discover how ViaSetu can become your most reliable
            demand channel.
          </p>
          <div className="flex flex-wrap gap-3 justify-center mt-7">
            <a
              href="mailto:partners@viasetu.com"
              className="px-6 h-12 inline-flex items-center rounded-lg font-bold text-[14px] transition-transform hover:scale-[1.02]"
              style={{ background: C.bg, color: C.teal }}
            >
              <Mail className="h-4 w-4 mr-2" /> Email Partners Team
            </a>
            <button
              onClick={() => navigate("/contact")}
              className="px-6 h-12 inline-flex items-center rounded-lg font-semibold text-[14px] border-2 transition-colors hover:bg-white/10"
              style={{ borderColor: C.bg, color: C.bg }}
            >
              <Phone className="h-4 w-4 mr-2" /> Contact Us
            </button>
          </div>
        </div>
      </section>
    </PublicSiteLayout>
  );
}
