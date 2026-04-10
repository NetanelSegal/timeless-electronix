import { Phone, Printer, Mail } from "lucide-react";
import { COMPANY } from "../lib/constants";
import ContactForm from "../components/ContactForm";
import PageSeo from "../components/PageSeo";

export default function Contact() {
  return (
    <>
      <PageSeo
        title="Contact Us"
        description={`Reach ${COMPANY.name} for sales, quotes, and sourcing. Phone ${COMPANY.phone}, email ${COMPANY.email}, WhatsApp available.`}
        path="/contact"
      />
      {/* Hero */}
      <section className="bg-bg-secondary py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-green-accent text-sm font-semibold uppercase tracking-wider mb-3">
            Get in Touch
          </p>
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Contact Us</h1>
          <p className="text-text-secondary text-lg">
            Have a sourcing challenge? Need a quote? Our experts are ready to
            help.
          </p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 py-16 grid md:grid-cols-2 gap-12">
        {/* Business Info */}
        <div>
          <h2 className="text-2xl font-bold mb-8">Business Information</h2>
          <div className="space-y-6">
            <InfoRow
              icon={<Phone size={18} className="text-green-accent" />}
              label="Phone"
            >
              <a
                href={`tel:${COMPANY.phone}`}
                className="text-white hover:text-green-accent"
              >
                {COMPANY.phone}
              </a>
            </InfoRow>
            <InfoRow
              icon={<Printer size={18} className="text-green-accent" />}
              label="Fax"
            >
              <span>{COMPANY.fax}</span>
            </InfoRow>
            <InfoRow
              icon={<Mail size={18} className="text-green-accent" />}
              label="Email"
            >
              <a
                href={`mailto:${COMPANY.email}`}
                className="text-white hover:text-green-accent"
              >
                {COMPANY.email}
              </a>
            </InfoRow>
          </div>
        </div>

        {/* Form */}
        <div>
          <h2 className="text-2xl font-bold mb-8">Send Us a Message</h2>
          <ContactForm variant="dark" />
        </div>
      </section>
    </>
  );
}

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-text-secondary text-sm">{label}</p>
        <div className="text-lg font-medium">{children}</div>
      </div>
    </div>
  );
}
