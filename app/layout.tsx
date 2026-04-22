import type { Metadata } from "next";
import { Space_Grotesk } from "next/font/google";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL("https://smallbus.app"),
  title: {
    default: "small_bus | Smart Dispatch for Small Fleet Operators",
    template: "%s | small_bus"
  },
  description:
    "small_bus helps small transit operators plan routes, assign drivers, and send passenger updates without enterprise software overhead.",
  openGraph: {
    title: "small_bus | Route Planning + Driver Scheduling",
    description:
      "Dispatch software built for shuttle and rural bus teams with 5-50 vehicles. Replace spreadsheets in a single afternoon.",
    url: "https://smallbus.app",
    siteName: "small_bus",
    locale: "en_US",
    type: "website"
  },
  twitter: {
    card: "summary_large_image",
    title: "small_bus | Route Planning + Driver Scheduling",
    description:
      "A lightweight transit operations dashboard for route planning, scheduling, and passenger notifications."
  },
  alternates: {
    canonical: "/"
  }
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className={`${spaceGrotesk.className} bg-[#0d1117] text-[#c9d1d9] antialiased`}>{children}</body>
    </html>
  );
}
