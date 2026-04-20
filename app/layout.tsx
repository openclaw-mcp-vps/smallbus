import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";
import { IBM_Plex_Mono, Space_Grotesk } from "next/font/google";
import "leaflet/dist/leaflet.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"]
});

const plexMono = IBM_Plex_Mono({
  variable: "--font-plex-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"]
});

export const metadata: Metadata = {
  metadataBase: new URL("https://smallbus.app"),
  title: {
    default: "small_bus | Bus Routing & Scheduling for Small Operators",
    template: "%s | small_bus"
  },
  description:
    "small_bus helps shuttle and rural transit teams plan routes, assign drivers, and send passenger updates without enterprise complexity.",
  keywords: [
    "bus scheduling software",
    "small transit operations",
    "shuttle dispatch tool",
    "route planning",
    "driver scheduling"
  ],
  openGraph: {
    title: "small_bus",
    description:
      "Simple bus routing, dispatch, and passenger notifications for operators with 5-50 vehicles.",
    type: "website",
    siteName: "small_bus",
    url: "https://smallbus.app"
  },
  twitter: {
    card: "summary_large_image",
    title: "small_bus",
    description:
      "Route planning, driver scheduling, and passenger notifications for small transit teams."
  }
};

export const viewport: Viewport = {
  themeColor: "#0d1117",
  colorScheme: "dark"
};

export default function RootLayout({
  children
}: Readonly<{
  children: ReactNode;
}>) {
  return (
    <html lang="en" className={`${spaceGrotesk.variable} ${plexMono.variable}`}>
      <body className="min-h-screen bg-[#0d1117] text-slate-100 antialiased">{children}</body>
    </html>
  );
}
