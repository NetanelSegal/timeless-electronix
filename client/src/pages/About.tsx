import { Link } from "react-router-dom";
import {
  Shield,
  Zap,
  Globe,
  BadgeCheck,
  Users,
  Clock,
  HeartPulse,
  Cpu,
  Factory,
} from "lucide-react";
import { COMPANY } from "../lib/constants";
import PageSeo from "../components/PageSeo";

const VALUES = [
  {
    Icon: Shield,
    title: "Certified MOD Supplier",
    desc: "Officially certified by the Israeli Ministry of Defense. Supplier ID: 11006221.",
  },
  {
    Icon: Zap,
    title: "Fast Sourcing",
    desc: "Rapid response times. We find and deliver components faster than anyone else.",
  },
  {
    Icon: Globe,
    title: "Global Network",
    desc: "Access to worldwide supplier networks, ensuring availability even for hard-to-find parts.",
  },
  {
    Icon: BadgeCheck,
    title: "Quality Assured",
    desc: "Every component is quality-checked and traceable to ensure full compliance.",
  },
  {
    Icon: Users,
    title: "Expert Team",
    desc: "Decades of experience in electronic component distribution across critical industries.",
  },
  {
    Icon: Clock,
    title: "30+ Years Experience",
    desc: "Trusted by clients in defense, medical, and technology sectors for over three decades.",
  },
];

const SECTORS = [
  {
    Icon: Shield,
    title: "Defense & Military",
    desc: "Supplying mission-critical components for defense applications with full traceability and MOD certification.",
  },
  {
    Icon: HeartPulse,
    title: "Medical Devices",
    desc: "High-reliability components for life-critical medical equipment, meeting the strictest quality standards.",
  },
  {
    Icon: Cpu,
    title: "Technology & R&D",
    desc: "Supporting innovation with fast access to cutting-edge electronic components for tech companies.",
  },
  {
    Icon: Factory,
    title: "Industrial & Safety",
    desc: "Robust components for industrial automation and safety systems worldwide.",
  },
];

export default function About() {
  return (
    <>
      <PageSeo
        title="About Us"
        description={`${COMPANY.name} is a certified MOD supplier with 30+ years sourcing electronic components for defense, medical, industrial, and technology sectors worldwide.`}
        path="/about"
      />
      {/* Hero */}
      <section className="relative bg-bg-secondary overflow-hidden">
        <div className="absolute inset-0 bg-[url('/hero-bg.jpg')] bg-cover bg-center opacity-20" />
        <div className="relative max-w-4xl mx-auto text-center px-4 py-24">
          <p className="text-green-accent text-sm font-semibold uppercase tracking-wider mb-3">
            About Us
          </p>
          <h1 className="text-3xl md:text-5xl font-bold mb-6">
            Your Trusted Partner in Electronic Component Sourcing
          </h1>
          <p className="text-text-secondary text-lg max-w-2xl mx-auto">
            At Timeless Electronix, we&apos;ve built our reputation on speed,
            reliability, and expertise. We are a certified MOD supplier with a
            global reach and a passion for solving complex sourcing challenges.
          </p>
        </div>
      </section>

      {/* Story */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto">
          <p className="text-green-accent text-sm font-semibold uppercase tracking-wider mb-2">
            Our Story
          </p>
          <h2 className="text-3xl font-bold mb-6">
            Built on Expertise, Driven by Results
          </h2>
          <div className="space-y-4 text-text-secondary text-lg">
            <p>
              Timeless Electronix was founded with a single mission: to make
              electronic component sourcing faster, more reliable, and more
              accessible for businesses that can&apos;t afford delays.
            </p>
            <p>
              With over 30 years of experience, we&apos;ve grown into a trusted
              distributor serving clients across defense, medical, technology,
              and industrial sectors worldwide.
            </p>
            <p>
              Our certification as an official Ministry of Defense (MOD) supplier
              — ID: {COMPANY.modId} — reflects the high standards of quality,
              traceability, and reliability we maintain across all operations.
            </p>
          </div>
        </div>
      </section>

      {/* Core Values */}
      <section className="bg-bg-secondary py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-green-accent text-sm font-semibold uppercase tracking-wider mb-2 text-center">
            Why Choose Us
          </p>
          <h2 className="text-3xl font-bold mb-12 text-center">
            Our Core Values
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {VALUES.map((v) => (
              <div
                key={v.title}
                className="bg-bg-card border border-border rounded-xl p-6"
              >
                <div className="w-12 h-12 bg-green-brand/20 rounded-full flex items-center justify-center mb-4">
                  <v.Icon size={22} className="text-green-accent" />
                </div>
                <h3 className="font-bold mb-2">{v.title}</h3>
                <p className="text-text-secondary text-sm">{v.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Sectors */}
      <section className="py-20 px-4">
        <div className="max-w-5xl mx-auto">
          <p className="text-green-accent text-sm font-semibold uppercase tracking-wider mb-2 text-center">
            Industries
          </p>
          <h2 className="text-3xl font-bold mb-12 text-center">
            Sectors We Serve
          </h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {SECTORS.map((s) => (
              <div
                key={s.title}
                className="bg-bg-card border border-border rounded-xl p-6 flex gap-4"
              >
                <div className="w-12 h-12 shrink-0 bg-green-brand/20 rounded-full flex items-center justify-center">
                  <s.Icon size={22} className="text-green-accent" />
                </div>
                <div>
                  <h3 className="font-bold mb-1">{s.title}</h3>
                  <p className="text-text-secondary text-sm">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-green-brand/10 py-20 px-4">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Work With Us?</h2>
          <p className="text-text-secondary text-lg mb-8">
            Browse our catalog or reach out to our sourcing experts today.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link
              to="/catalog"
              className="bg-green-brand hover:bg-green-accent text-white px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Browse Catalog
            </Link>
            <Link
              to="/contact"
              className="border border-green-accent text-green-accent hover:bg-green-accent/10 px-8 py-3 rounded-lg font-medium transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
