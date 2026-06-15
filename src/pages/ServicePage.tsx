import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import PublicSiteLayout from "@/components/site/PublicSiteLayout";
import { ArrowRight, CheckCircle2 } from "lucide-react";

const C = {
  bg: "#FFFFFF",
  bg2: "#F4F7FB",
  teal: "#00A8A8",
  text: "#0B1220",
  gray: "#5A6B80",
  border: "#E2E8F0",
};

export type ServiceContent = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  features: string[];
  metaDescription: string;
};

export const SERVICES: ServiceContent[] = [
  {
    slug: "parcel-tracking",
    title: "Parcel Tracking",
    tagline: "Track every shipment across every courier — in one place.",
    description:
      "ViaSetu unifies tracking from Delhivery, Xpressbees, Shadowfax, Shree Maruti and UrbaneBolt. Enter any AWB and we automatically detect the partner network and surface the latest status, location and ETA.",
    features: [
      "Universal AWB lookup across 5+ courier partners",
      "Live status updates with timestamped scans",
      "Predictive ETA adjusted for weather and holidays",
      "Works for shipments booked on ViaSetu or elsewhere",
    ],
    metaDescription:
      "Track any courier parcel by AWB number across Delhivery, Xpressbees, Shadowfax and more on ViaSetu.",
  },
  {
    slug: "bulk-shipment",
    title: "Bulk Shipment",
    tagline: "Ship hundreds of parcels with a single dashboard.",
    description:
      "Built for D2C brands, marketplace sellers and warehouses. Upload your order sheet, get instant rate comparisons across partners and dispatch in bulk with consolidated pickups and invoicing.",
    features: [
      "Bulk CSV order upload and rate comparison",
      "Single consolidated pickup across multiple orders",
      "Volume discounts via aggregated partner contracts",
      "Centralised invoicing and reconciliation",
    ],
    metaDescription:
      "Book bulk courier shipments online with the best rates across 5+ logistics partners on ViaSetu.",
  },
  {
    slug: "express-delivery",
    title: "Express Delivery",
    tagline: "Next-day and same-day delivery across major Indian metros.",
    description:
      "When speed matters, ViaSetu surfaces the fastest air and surface express options from our partner network. Compare ETAs side-by-side and pick the courier that fits your deadline.",
    features: [
      "Same-day and next-day options in metro cities",
      "Live ETA comparison across air and surface modes",
      "Priority pickup slots",
      "Real-time tracking until delivery",
    ],
    metaDescription:
      "Book express courier delivery in India — next-day and same-day shipping with ViaSetu.",
  },
  {
    slug: "domestic-courier-service",
    title: "Domestic Courier Service",
    tagline: "Send parcels anywhere in India with confidence.",
    description:
      "From metros to remote pin codes, ViaSetu's combined partner network covers 27,000+ serviceable pin codes across India. One booking, the best rate, end-to-end tracking.",
    features: [
      "27,000+ serviceable pin codes across India",
      "Best-rate comparison across multiple couriers",
      "Doorstep pickup and contactless delivery",
      "Single platform for tracking and support",
    ],
    metaDescription:
      "Affordable domestic courier service across India. Compare and book the best courier on ViaSetu.",
  },
  {
    slug: "individual-business",
    title: "Individual Business",
    tagline: "Logistics built for freelancers and solo founders.",
    description:
      "Just getting started? Ship as an individual without a GST number or business account. Pay per shipment, get partner-grade rates and scale up only when you need to.",
    features: [
      "No GST or business registration required",
      "Pay-as-you-ship with no monthly minimums",
      "Access to partner-grade rates from day one",
      "Simple dashboard for orders and invoices",
    ],
    metaDescription:
      "Courier service for individuals and solo founders — no GST required. Book parcels online on ViaSetu.",
  },
  {
    slug: "personal-business",
    title: "Personal Business",
    tagline: "Reliable shipping for home-run brands and hobby sellers.",
    description:
      "Selling on Instagram, WhatsApp or your own site? ViaSetu makes it easy to ship from home with doorstep pickup, prepaid labels and unified tracking across every order.",
    features: [
      "Doorstep pickup from home address",
      "Prepaid shipping labels you can print",
      "Saved buyer addresses for repeat orders",
      "Order history and downloadable invoices",
    ],
    metaDescription:
      "Personal business courier service in India — doorstep pickup and prepaid labels with ViaSetu.",
  },
  {
    slug: "sme-courier-service",
    title: "SME Courier Service",
    tagline: "Enterprise-grade logistics priced for small businesses.",
    description:
      "ViaSetu gives growing SMEs the negotiating power of an enterprise shipper. Access aggregated partner rates, dedicated support and tooling that scales with your order volume.",
    features: [
      "Aggregated partner rates without volume commitments",
      "Dedicated account manager for growing SMEs",
      "API and CSV order ingestion",
      "Consolidated GST-compliant invoicing",
    ],
    metaDescription:
      "SME courier service in India with the best partner rates, dedicated support and bulk tools on ViaSetu.",
  },
  {
    slug: "doorstep-pickup",
    title: "Doorstep Pickup",
    tagline: "Pickup at your doorstep — no store visits, no queues.",
    description:
      "Schedule pickup from your home or office in a few taps. Choose your slot, our partner courier arrives, and you get tracking the moment the parcel is collected.",
    features: [
      "Same-day and next-day pickup slots",
      "SMS and email pickup confirmations",
      "Live tracking from the moment of pickup",
      "Available across 27,000+ pin codes",
    ],
    metaDescription:
      "Free doorstep parcel pickup across India. Schedule a courier pickup at home with ViaSetu.",
  },
];

export default function ServicePage({ service }: { service: ServiceContent }) {
  const navigate = useNavigate();
  const related = SERVICES.filter((s) => s.slug !== service.slug).slice(0, 4);

  return (
    <PublicSiteLayout>
      <Helmet>
        <title>{service.title} | ViaSetu</title>
        <meta name="description" content={service.metaDescription} />
        <link rel="canonical" href={`/services/${service.slug}`} />
      </Helmet>

      <section className="px-6 py-16" style={{ background: C.bg2 }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-[12px] font-bold uppercase tracking-wider mb-3" style={{ color: C.teal }}>
            Our Services
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4" style={{ color: C.text }}>
            {service.title}
          </h1>
          <p className="text-lg md:text-xl" style={{ color: C.gray }}>
            {service.tagline}
          </p>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: C.text }}>
              About this service
            </h2>
            <p className="text-[15px] leading-relaxed" style={{ color: C.gray }}>
              {service.description}
            </p>
            <div className="mt-6 flex gap-3 flex-wrap">
              <button
                onClick={() => navigate("/login")}
                className="px-5 h-11 rounded-lg font-bold text-[14px] inline-flex items-center gap-2"
                style={{ background: C.teal, color: "#fff" }}
              >
                Book Now <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate("/tracking")}
                className="px-5 h-11 rounded-lg font-semibold text-[14px] border-2"
                style={{ borderColor: C.teal, color: C.teal }}
              >
                Track a Parcel
              </button>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: C.text }}>
              What you get
            </h2>
            <ul className="space-y-3">
              {service.features.map((f) => (
                <li key={f} className="flex items-start gap-3 text-[14px]" style={{ color: C.text }}>
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" style={{ color: C.teal }} />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="px-6 py-14" style={{ background: C.bg2, borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-6" style={{ color: C.text }}>
            Explore other services
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {related.map((r) => (
              <Link
                key={r.slug}
                to={`/services/${r.slug}`}
                className="block p-4 rounded-xl border bg-white hover:border-[#00A8A8] transition-colors"
                style={{ borderColor: C.border }}
              >
                <div className="font-bold text-[14px] mb-1" style={{ color: C.text }}>
                  {r.title}
                </div>
                <div className="text-[12px]" style={{ color: C.gray }}>
                  {r.tagline}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PublicSiteLayout>
  );
}
