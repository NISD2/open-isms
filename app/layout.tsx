import type { Metadata, Viewport } from "next";
import "./globals.css";

const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://nisd2.eu";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: {
    default: "NIS2 software: step by step, for companies with 50 to 150 employees",
    template: "%s",
  },
  description:
    "You fill it in, we explain every point in plain words, and at the end management signs. For companies without their own security department.",
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
  manifest: "/site.webmanifest",
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
    title: "NIS2 software: step by step, for companies with 50 to 150 employees",
    description:
      "You fill it in, we explain every point in plain words, and at the end management signs. For companies without their own security department.",
  },
  twitter: {
    card: "summary_large_image",
  },
  category: "technology",
};

/** The page background, so a phone's browser bar runs into the page. Matches site.webmanifest. */
export const viewport: Viewport = {
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return children;
}
