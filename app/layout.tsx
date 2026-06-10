import type { Metadata } from "next";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://www.nisd2.eu";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "NIS2 Compliance Platform. Free, EU-wide, no lock-in",
    template: "%s",
  },
  description:
    "Free NIS2 compliance platform for European companies. All 10 BSIG measures, audit trail, management liability protection, BSI registration guide. No lock-in.",
  keywords: [
    "NIS2",
    "NIS2 Richtlinie",
    "NIS2 Directive",
    "BSIG",
    "BSI-Gesetz",
    "NIS2UmsuCG",
    "KRITIS",
    "Cybersicherheit",
    "Cybersecurity Compliance",
    "NIS2 Deutschland",
    "NIS2 Germany",
    "Besonders wichtige Einrichtung",
    "Wichtige Einrichtung",
    "BSI Registrierung",
    "Geschäftsführerhaftung",
    "Management Liability NIS2",
    "Incident Reporting NIS2",
    "Supply Chain Security",
    "ISO 27001",
    "IT-Grundschutz",
    "NIS2 Compliance Software",
    "NIS2 Anforderungen",
    "NIS2 Requirements",
    "NIS2 Bußgeld",
    "NIS2 Penalties",
    "Section 30 BSIG",
    "Article 21 NIS2",
  ],
  authors: [{ name: "nisd2.eu" }],
  creator: "nisd2.eu",
  publisher: "nisd2.eu",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    locale: "de_DE",
    alternateLocale: "en_US",
    siteName: "nisd2.eu",
    title: "NIS2 Compliance Platform. Free, EU-wide",
    description:
      "Free NIS2 compliance platform for European companies. All 10 BSIG measures, audit trail, management liability protection, BSI registration guide. No lock-in.",
  },
  twitter: {
    card: "summary_large_image",
    title: "NIS2 Compliance Platform. Free, EU-wide",
    description:
      "Free NIS2 compliance platform. All 10 BSIG measures, audit trail, management liability, BSI registration guide. No lock-in.",
  },
  category: "technology",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
