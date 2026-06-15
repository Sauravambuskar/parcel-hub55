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

export type CityContent = {
  slug: string;
  city: string;
  intro: string;
  hubs: string[];
  highlights: string[];
  metaDescription: string;
};

export const CITIES: CityContent[] = [
  {
    slug: "mumbai",
    city: "Mumbai",
    intro:
      "Mumbai is India's commercial capital and one of the busiest courier markets in the country. ViaSetu connects you to every major courier serving Mumbai — from Andheri to Navi Mumbai and Thane — with same-day and next-day options across the metro.",
    hubs: ["Andheri", "Bandra", "Borivali", "Thane", "Navi Mumbai", "Powai"],
    highlights: [
      "Same-day delivery within Mumbai metropolitan region",
      "Next-day express to Pune, Nashik and Ahmedabad",
      "Doorstep pickup from home or office",
      "Coverage across all 600+ Mumbai pin codes",
    ],
    metaDescription:
      "Best courier service in Mumbai — compare and book Delhivery, Xpressbees, Shadowfax and more on ViaSetu.",
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

  return (
    <PublicSiteLayout>
      <Helmet>
        <title>{`Courier Service in ${city.city} | ViaSetu`}</title>
        <meta name="description" content={city.metaDescription} />
        <link rel="canonical" href={`/courier-service-in-${city.slug}`} />
      </Helmet>

      <section className="px-6 py-16" style={{ background: C.bg2 }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-[12px] font-bold uppercase tracking-wider mb-3 inline-flex items-center gap-2" style={{ color: C.teal }}>
            <MapPin className="h-4 w-4" /> City Coverage
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4" style={{ color: C.text }}>
            Courier Service in {city.city}
          </h1>
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
          </div>
        </div>
      </section>

      <section className="px-6 py-14" style={{ background: C.bg2, borderTop: `1px solid ${C.border}` }}>
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
