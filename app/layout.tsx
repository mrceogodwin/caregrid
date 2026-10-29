import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Caregrid — Hospital operations, connected",
  description: "A connected workspace for patient administration, clinical workflows, diagnostics, pharmacy and hospital finance.",
  applicationName: "Caregrid",
};

export const viewport: Viewport = { width: "device-width", initialScale: 1, themeColor: "#f7f8fa" };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}