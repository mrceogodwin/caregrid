import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = "https://caregrid-beatgodzilla-2361.vercel.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Caregrid — Healthcare Operations, Connected",
    template: "%s | Caregrid",
  },
  description:
    "One connected workspace for patient administration, clinical care, diagnostics, pharmacy and hospital finance. Designed for clinics, hospitals and diagnostic centres.",
  applicationName: "Caregrid",
  keywords: [
    "hospital management software",
    "clinic management system",
    "healthcare operations",
    "patient administration",
    "laboratory management",
    "pharmacy inventory",
    "Nigeria healthcare software",
  ],
  openGraph: {
    type: "website",
    url: siteUrl,
    siteName: "Caregrid",
    title: "Caregrid — Healthcare Operations, Connected",
    description:
      "One thoughtful platform for the people, processes and decisions behind exceptional care.",
    locale: "en_NG",
  },
  twitter: {
    card: "summary",
    title: "Caregrid — Healthcare Operations, Connected",
    description:
      "A connected workspace for modern healthcare operations.",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
    },
  },
  icons: {
    icon: "/caregrid-icon.svg",
    shortcut: "/caregrid-icon.svg",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#f7f8f4",
  colorScheme: "light",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en-NG">
      <body>{children}</body>
    </html>
  );
}
