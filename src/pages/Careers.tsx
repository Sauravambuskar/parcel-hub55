import { Briefcase, Heart, Rocket, Users, MapPin, Clock, ArrowRight, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import PublicSiteLayout from "@/components/site/PublicSiteLayout";
import PageSeo from "@/components/PageSeo";

const C = {
  bg: "#FFFFFF",
  bg2: "#F4F7FB",
  card: "#FFFFFF",
  teal: "#00A8A8",
  text: "#0B1220",
  gray: "#5A6B80",
  border: "#E2E8F0",
};

const openings = [
  {
    title: "Senior Full-Stack Engineer",
    location: "Pune / Remote",
    type: "Full-time",
    team: "Engineering",
  },
  {
    title: "Product Designer (UI/UX)",
    location: "Pune / Remote",
    type: "Full-time",
    team: "Design",
  },
  {
    title: "Logistics Operations Manager",
    location: "Pune",
    type: "Full-time",
    team: "Operations",
  },
  {
    title: "Customer Support Associate",
    location: "Remote",
    type: "Full-time",
    team: "Support",
  },
  {
    title: "Growth Marketing Lead",
    location: "Pune / Remote",
    type: "Full-time",
    team: "Marketing",
  },
];

const values = [
  {
    icon: Rocket,
    title: "Move Fast",
    desc: "We ship quickly, learn from real users, and iterate without ego.",
  },
  {
    icon: Heart,
    title: "Customer First",
    desc: "Every decision starts with the person sending the parcel.",
  },
  {
    icon: Users,
    title: "Own It",
    desc: "Small team, big impact. Everyone owns outcomes end-to-end.",
  },
  {
    icon: Briefcase,
    title: "Build to Last",
    desc: "We pick simple, reliable solutions that scale with India.",
  },
];

const perks = [
  "Competitive salary + meaningful equity",
  "Remote-friendly with flexible hours",
  "Health insurance for you and family",
  "Annual learning & development budget",
  "Latest hardware of your choice",
  "Paid time off + sick leave",
];

export default function Careers() {
  return (
    <PublicSiteLayout>
      <PageSeo
        title="Careers at ViaSetu — Join India's Courier Aggregator"
        description="Help us build India's first consumer courier aggregator. Open roles in engineering, design, operations, support and marketing."
        path="/careers"
      />

      {/* Hero */}
      <section className="px-6 py-16 md:py-24" style={{ background: C.bg2 }}>
        <div className="max-w-5xl mx-auto text-center">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[12px] font-semibold mb-5"
            style={{ background: `${C.teal}1a`, color: C.teal }}
          >
            <Briefcase className="h-3.5 w-3.5" /> We're hiring
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4" style={{ color: C.text }}>
            Build the future of shipping in India
          </h1>
          <p className="text-[16px] md:text-[18px] max-w-2xl mx-auto" style={{ color: C.gray }}>
            ViaSetu is a small, ambitious team making courier booking effortless for every Indian.
            Join us and help millions ship smarter, every day.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <a
              href="#openings"
              className="px-6 h-12 inline-flex items-center rounded-lg font-bold text-[14px] transition-transform hover:scale-[1.02]"
              style={{ background: C.teal, color: C.bg }}
            >
              View Open Roles <ArrowRight className="h-4 w-4 ml-2" />
            </a>
            <Link
              to="/about"
              className="px-6 h-12 inline-flex items-center rounded-lg border-2 font-semibold text-[14px]"
              style={{ borderColor: C.teal, color: C.teal }}
            >
              About ViaSetu
            </Link>
          </div>
        </div>
      </section>

      {/* Values */}
      <section className="px-6 py-16">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10" style={{ color: C.text }}>
            How we work
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {values.map((v) => {
              const Icon = v.icon;
              return (
                <div
                  key={v.title}
                  className="p-6 rounded-2xl border"
                  style={{ background: C.card, borderColor: C.border }}
                >
                  <div
                    className="h-11 w-11 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: `${C.teal}1a` }}
                  >
                    <Icon className="h-5 w-5" style={{ color: C.teal }} />
                  </div>
                  <h3 className="font-bold text-[16px] mb-1" style={{ color: C.text }}>
                    {v.title}
                  </h3>
                  <p className="text-[13px]" style={{ color: C.gray }}>
                    {v.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Perks */}
      <section className="px-6 py-16" style={{ background: C.bg2 }}>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10" style={{ color: C.text }}>
            Perks & benefits
          </h2>
          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
            {perks.map((p) => (
              <div
                key={p}
                className="p-4 rounded-xl border flex items-start gap-3"
                style={{ background: C.card, borderColor: C.border }}
              >
                <div
                  className="h-2 w-2 rounded-full mt-2 shrink-0"
                  style={{ background: C.teal }}
                />
                <span className="text-[14px]" style={{ color: C.text }}>
                  {p}
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Openings */}
      <section id="openings" className="px-6 py-16">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3" style={{ color: C.text }}>
            Open positions
          </h2>
          <p className="text-center text-[14px] mb-10" style={{ color: C.gray }}>
            Don't see your role? We'd still love to hear from you.
          </p>
          <div className="space-y-3">
            {openings.map((job) => (
              <div
                key={job.title}
                className="p-5 rounded-xl border flex flex-col md:flex-row md:items-center md:justify-between gap-4 transition-colors hover:border-[#00A8A8]"
                style={{ background: C.card, borderColor: C.border }}
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className="text-[11px] font-semibold px-2 py-0.5 rounded-full"
                      style={{ background: `${C.teal}1a`, color: C.teal }}
                    >
                      {job.team}
                    </span>
                  </div>
                  <h3 className="font-bold text-[16px]" style={{ color: C.text }}>
                    {job.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-4 mt-1 text-[13px]" style={{ color: C.gray }}>
                    <span className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" /> {job.location}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" /> {job.type}
                    </span>
                  </div>
                </div>
                <a
                  href={`mailto:careers@viasetu.com?subject=Application: ${encodeURIComponent(job.title)}`}
                  className="px-5 h-10 inline-flex items-center rounded-lg font-semibold text-[13px] border-2 transition-colors hover:bg-[#00A8A8]/10 self-start md:self-auto"
                  style={{ borderColor: C.teal, color: C.teal }}
                >
                  Apply <ArrowRight className="h-3.5 w-3.5 ml-1.5" />
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-16" style={{ background: C.bg2 }}>
        <div
          className="max-w-4xl mx-auto rounded-2xl p-8 md:p-12 text-center"
          style={{ background: C.teal }}
        >
          <Mail className="h-10 w-10 mx-auto mb-4" style={{ color: C.bg }} />
          <h2 className="text-2xl md:text-3xl font-bold mb-3" style={{ color: C.bg }}>
            Don't see a role that fits?
          </h2>
          <p className="text-[15px] mb-6" style={{ color: "rgba(255,255,255,0.9)" }}>
            We're always looking for exceptional people. Send us your CV and tell us how you can help.
          </p>
          <a
            href="mailto:careers@viasetu.com?subject=General Application"
            className="inline-flex items-center px-6 h-12 rounded-lg font-bold text-[14px] bg-white"
            style={{ color: C.teal }}
          >
            Email careers@viasetu.com <ArrowRight className="h-4 w-4 ml-2" />
          </a>
        </div>
      </section>
    </PublicSiteLayout>
  );
}
