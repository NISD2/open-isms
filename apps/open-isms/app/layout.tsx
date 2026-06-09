import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "open-isms",
  description: "Open-source NIS 2 ISMS platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
