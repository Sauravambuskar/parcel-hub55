import { Helmet } from "react-helmet-async";
import { Link, useNavigate } from "react-router-dom";
import PublicSiteLayout from "@/components/site/PublicSiteLayout";
import { ArrowRight, MapPin, CheckCircle2 } from "lucide-react";

const C = {
  bg: "#FFFFFF",
  bg2: "#F4F7FB",
  teal: "#00A8A8",
  text: "#0B1220",
  gray: "#5A6B80",
  border: "#E2E8F0",
};

export type CitySection = {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
};

export type CityFaq = { q: string; a: string };

export type CityContent = {
  slug: string;
  city: string;
  intro: string;
  hubs: string[];
  highlights: string[];
  metaTitle?: string;
  metaDescription: string;
  h1?: string;
  tagline?: string;
  sections?: CitySection[];
  faqs?: CityFaq[];
  closingHeading?: string;
  closingParagraphs?: string[];
};

export const CITIES: CityContent[] = [
  {
    slug: "mumbai",
    city: "Mumbai",
    intro:
      "Mumbai moves fast, and your deliveries should too. Whether you're sending important documents from Nariman Point, dispatching online orders from Andheri, or shipping business parcels from Navi Mumbai, ViaSetu helps you compare courier services, schedule doorstep pickups, and track shipments through one simple platform. From individual parcels to regular business deliveries, shipping across Mumbai becomes faster, easier, and more organised.",
    hubs: [
      "Andheri",
      "Bandra",
      "Powai",
      "Borivali",
      "Dadar",
      "Goregaon",
      "Malad",
      "Kandivali",
      "Navi Mumbai",
      "Thane",
      "Lower Parel",
      "Kurla",
    ],
    highlights: [
      "Compare courier rates from multiple partners before booking",
      "Doorstep pickup from home, office or warehouse",
      "Track every shipment until successful delivery",
      "Ship from Mumbai to destinations across India",
    ],
    metaTitle: "Courier Service in Mumbai | Doorstep Pickup & Parcel Delivery | ViaSetu",
    metaDescription:
      "Book reliable courier services in Mumbai with ViaSetu. Compare courier partners, schedule doorstep pickups, track shipments, and send parcels across Mumbai and throughout India.",
    h1: "Courier Service in Mumbai",
    tagline: "Fast, Reliable Courier Services Across Mumbai",
    sections: [
      {
        heading: "Shipping in Mumbai Doesn't Have to Be Complicated",
        paragraphs: [
          "Anyone who has shipped a parcel in Mumbai knows the challenges.",
        ],
        bullets: [
          "Traffic can delay pickups.",
          "Courier offices may be far away.",
          "Comparing different courier companies takes time.",
          "Tracking multiple shipments often means visiting several websites.",
        ],
      },
      {
        heading: "One Platform for Booking, Pickup, Rates & Tracking",
        paragraphs: [
          "ViaSetu simplifies the entire process by bringing courier booking, pickup scheduling, rate comparison, and shipment tracking together in one place. Whether you're shipping across the city or anywhere in India, you can manage everything from a single dashboard.",
        ],
      },
      {
        heading: "Built for the Way Mumbai Ships",
        paragraphs: [
          "Every city has different shipping requirements. Mumbai businesses often dispatch hundreds of customer orders daily, while professionals send important documents and families regularly ship parcels to relatives across the country.",
          "ViaSetu supports all kinds of shipping needs, including:",
        ],
        bullets: [
          "Personal parcels",
          "Business deliveries",
          "Ecommerce shipments",
          "Office documents",
          "Bulk dispatches",
          "Time-sensitive deliveries",
        ],
      },
      {
        heading: "Why Businesses in Mumbai Choose ViaSetu",
        paragraphs: [
          "Mumbai businesses operate in one of India's busiest commercial environments. Reliable logistics can directly influence customer satisfaction and repeat business. ViaSetu helps businesses compare courier rates, schedule doorstep pickups, track every shipment, reach customers nationwide, and manage shipping efficiently — all from a single dashboard.",
        ],
      },
      {
        heading: "Frequently Sent Parcels From Mumbai",
        paragraphs: ["Customers regularly use courier services to ship:"],
        bullets: [
          "Business documents",
          "Legal paperwork",
          "Ecommerce orders",
          "Fashion products",
          "Electronics",
          "Healthcare supplies",
          "Gifts",
          "Household items",
          "Books",
          "Industrial samples",
        ],
      },
      {
        heading: "Looking for a Courier Service Near You?",
        paragraphs: [
          "Whether you're working from an office in BKC, managing a warehouse in Navi Mumbai, or running an online business from Andheri, finding a reliable courier service shouldn't be difficult.",
          "ViaSetu allows you to compare courier partners, schedule parcel pickups, and manage deliveries without visiting multiple courier offices. Everything starts with a few simple steps online.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can I book a courier pickup from my home in Mumbai?",
        a: "Yes. Pickup availability depends on your location and the courier partner selected.",
      },
      {
        q: "Which areas of Mumbai are covered?",
        a: "Many major residential, commercial, and industrial areas are serviceable, subject to courier coverage.",
      },
      {
        q: "Can I send parcels outside Mumbai?",
        a: "Yes. Shipments can be booked from Mumbai to destinations across India.",
      },
      {
        q: "How do I track my courier?",
        a: "After booking, you'll receive tracking details to monitor shipment progress.",
      },
      {
        q: "Is this service suitable for businesses?",
        a: "Yes. ViaSetu supports individuals, online sellers, startups, SMEs, and larger businesses.",
      },
    ],
    closingHeading: "Why Mumbai Businesses Need Smarter Shipping",
    closingParagraphs: [
      "Mumbai is one of India's busiest commercial centres, where speed and reliability are essential. Whether you're delivering customer orders, sending business documents, or managing daily dispatches, every shipment reflects your commitment to your customers.",
      "ViaSetu simplifies shipping by connecting multiple courier partners through a single platform, helping individuals and businesses save time while keeping deliveries organised from pickup to final destination.",
    ],
  },
  {
    slug: "pune",
    city: "Pune",
    intro:
      "Pune's mix of IT parks, manufacturing hubs and residential pockets makes it a high-volume courier city. ViaSetu surfaces the best courier rates from Hinjewadi to Hadapsar with reliable pickup slots.",
    hubs: ["Hinjewadi", "Kothrud", "Hadapsar", "Wakad", "Viman Nagar", "Kharadi"],
    highlights: [
      "Intra-city same-day options for Pune addresses",
      "Next-day express to Mumbai, Bangalore and Hyderabad",
      "Doorstep pickup across Pune and PCMC",
      "Coverage across all Pune pin codes",
    ],
    metaDescription:
      "Reliable courier service in Pune — compare top couriers and book online with ViaSetu.",
  },
  {
    slug: "bangalore",
    city: "Bangalore",
    intro:
      "Bangalore is India's tech and D2C startup capital. ViaSetu helps brands and individuals ship from Whitefield to Koramangala with the right courier for every shipment — express, economy or bulk.",
    hubs: ["Whitefield", "Koramangala", "Indiranagar", "HSR Layout", "Electronic City", "Jayanagar"],
    highlights: [
      "Same-day delivery options within Bangalore",
      "Next-day express to Chennai, Hyderabad and Mumbai",
      "Doorstep pickup across all major Bangalore zones",
      "Built for D2C sellers shipping from Bangalore",
    ],
    metaDescription:
      "Top courier service in Bangalore. Book Delhivery, Xpressbees, Shadowfax and more on ViaSetu.",
  },
  {
    slug: "hyderabad",
    city: "Hyderabad",
    intro:
      "Hyderabad's blend of commerce and tech drives steady courier demand from Hitech City to the Old City. ViaSetu gives you instant rate comparison and pickup scheduling for every Hyderabad pin code.",
    hubs: ["Hitech City", "Gachibowli", "Banjara Hills", "Madhapur", "Secunderabad", "Kondapur"],
    highlights: [
      "Same-day delivery within Hyderabad metro",
      "Next-day express to Bangalore, Chennai and Vijayawada",
      "Doorstep pickup across HMDA limits",
      "Coverage across all Hyderabad pin codes",
    ],
    metaDescription:
      "Fast and affordable courier service in Hyderabad. Compare and book on ViaSetu.",
  },
  {
    slug: "delhi",
    city: "Delhi",
    intro:
      "Delhi-NCR is India's largest courier corridor. ViaSetu covers Delhi, Gurgaon, Noida, Faridabad and Ghaziabad with the best partner rates and same-day pickup slots across the region.",
    hubs: ["Connaught Place", "Dwarka", "Saket", "Rohini", "Gurgaon", "Noida"],
    highlights: [
      "Same-day delivery within Delhi-NCR",
      "Next-day express to Mumbai, Jaipur and Chandigarh",
      "Doorstep pickup across NCR pin codes",
      "Coverage across all Delhi and NCR pin codes",
    ],
    metaDescription:
      "Best courier service in Delhi NCR. Compare top couriers and book online with ViaSetu.",
  },
];

export default function CityPage({ city }: { city: CityContent }) {
  const navigate = useNavigate();
  const others = CITIES.filter((c) => c.slug !== city.slug);
  const metaTitle = city.metaTitle || `Courier Service in ${city.city} | ViaSetu`;

  const faqSchema = city.faqs && city.faqs.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: city.faqs.map((f) => ({
          "@type": "Question",
          name: f.q,
          acceptedAnswer: { "@type": "Answer", text: f.a },
        })),
      }
    : null;

  return (
    <PublicSiteLayout>
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={city.metaDescription} />
        <link rel="canonical" href={`https://www.viasetu.com/courier-service-in-${city.slug}`} />
        {faqSchema && (
          <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
        )}
      </Helmet>

      <section className="px-6 py-16" style={{ background: C.bg2 }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-[12px] font-bold uppercase tracking-wider mb-3 inline-flex items-center gap-2" style={{ color: C.teal }}>
            <MapPin className="h-4 w-4" /> City Coverage
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-3" style={{ color: C.text }}>
            {city.h1 || `Courier Service in ${city.city}`}
          </h1>
          {city.tagline && (
            <p className="text-xl md:text-2xl font-semibold mb-4" style={{ color: C.teal }}>
              {city.tagline}
            </p>
          )}
          <p className="text-lg" style={{ color: C.gray }}>{city.intro}</p>
        </div>
      </section>

      <section className="px-6 py-14">
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10">
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: C.text }}>
              Couriers available in {city.city}
            </h2>
            <p className="text-[14px] mb-4" style={{ color: C.gray }}>
              ViaSetu compares live rates from Delhivery, Xpressbees, Shadowfax, Shree Maruti and UrbaneBolt for every {city.city} address.
            </p>
            <ul className="space-y-3">
              {city.highlights.map((h) => (
                <li key={h} className="flex items-start gap-3 text-[14px]" style={{ color: C.text }}>
                  <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" style={{ color: C.teal }} />
                  <span>{h}</span>
                </li>
              ))}
            </ul>
            <div className="mt-6 flex gap-3 flex-wrap">
              <button
                onClick={() => navigate("/login")}
                className="px-5 h-11 rounded-lg font-bold text-[14px] inline-flex items-center gap-2"
                style={{ background: C.teal, color: "#fff" }}
              >
                Book from {city.city} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div>
            <h2 className="text-2xl font-bold mb-4" style={{ color: C.text }}>
              Popular pickup zones
            </h2>
            <div className="flex flex-wrap gap-2">
              {city.hubs.map((h) => (
                <span
                  key={h}
                  className="px-3 py-1.5 rounded-full text-[13px] border bg-white"
                  style={{ borderColor: C.border, color: C.text }}
                >
                  {h}
                </span>
              ))}
            </div>
            {city.slug === "mumbai" && (
              <p className="text-[13px] mt-4" style={{ color: C.gray }}>
                Availability depends on the selected courier partner and serviceable PIN codes.
              </p>
            )}
          </div>
        </div>
      </section>

      {city.sections && city.sections.length > 0 && (
        <section className="px-6 py-14" style={{ background: C.bg2, borderTop: `1px solid ${C.border}` }}>
          <div className="max-w-5xl mx-auto space-y-12">
            {city.sections.map((s) => (
              <div key={s.heading}>
                <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: C.text }}>
                  {s.heading}
                </h2>
                {s.paragraphs?.map((p, i) => (
                  <p key={i} className="text-[15px] mb-3" style={{ color: C.gray }}>
                    {p}
                  </p>
                ))}
                {s.bullets && (
                  <ul className="mt-3 grid sm:grid-cols-2 gap-2">
                    {s.bullets.map((b) => (
                      <li key={b} className="flex items-start gap-2 text-[14px]" style={{ color: C.text }}>
                        <CheckCircle2 className="h-4 w-4 shrink-0 mt-1" style={{ color: C.teal }} />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      {city.faqs && city.faqs.length > 0 && (
        <section className="px-6 py-14">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-6" style={{ color: C.text }}>
              FAQs
            </h2>
            <div className="space-y-5">
              {city.faqs.map((f) => (
                <div key={f.q} className="p-5 rounded-xl border bg-white" style={{ borderColor: C.border }}>
                  <div className="font-bold text-[15px] mb-2" style={{ color: C.text }}>{f.q}</div>
                  <div className="text-[14px]" style={{ color: C.gray }}>{f.a}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {city.closingHeading && (
        <section className="px-6 py-14" style={{ background: C.bg2, borderTop: `1px solid ${C.border}` }}>
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl md:text-3xl font-bold mb-4" style={{ color: C.text }}>
              {city.closingHeading}
            </h2>
            {city.closingParagraphs?.map((p, i) => (
              <p key={i} className="text-[15px] mb-3" style={{ color: C.gray }}>
                {p}
              </p>
            ))}
            <div className="mt-6">
              <button
                onClick={() => navigate("/login")}
                className="px-6 h-12 rounded-lg font-bold text-[14px] inline-flex items-center gap-2"
                style={{ background: C.teal, color: "#fff" }}
              >
                Start shipping from {city.city} <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="px-6 py-14" style={{ borderTop: `1px solid ${C.border}` }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl font-bold mb-6" style={{ color: C.text }}>
            Courier service in other cities
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4">
            {others.map((o) => (
              <Link
                key={o.slug}
                to={`/courier-service-in-${o.slug}`}
                className="block p-4 rounded-xl border bg-white hover:border-[#00A8A8] transition-colors"
                style={{ borderColor: C.border }}
              >
                <div className="font-bold text-[14px]" style={{ color: C.text }}>
                  Courier Service in {o.city}
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </PublicSiteLayout>
  );
}
