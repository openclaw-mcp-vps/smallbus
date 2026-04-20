import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Sora, Space_Grotesk } from "next/font/google";
import "./globals.css";

const sora = Sora({
  subsets: ["latin"],
  variable: "--font-sora",
  display: "swap",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-ibm-plex-mono",
  weight: ["400", "500"],
  display: "swap",
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
  weight: ["500", "700"],
  display: "swap",
});

const siteUrl = "https://smallbus.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "small_bus | Scheduling for small transit fleets",
    template: "%s | small_bus",
  },
  description:
    "small_bus helps shuttle operators plan routes, assign drivers, and keep passengers informed without enterprise complexity.",
  applicationName: "small_bus",
  keywords: [
    "bus scheduling",
    "shuttle operations",
    "driver dispatch",
    "small transit software",
    "micro SaaS",
  ],
  openGraph: {
    title: "small_bus | Lightweight dispatch for 5-50 vehicle fleets",
    description:
      "Plan routes, build weekly schedules, and send passenger notices from one fast dashboard.",
    type: "website",
    url: siteUrl,
    siteName: "small_bus",
    images: [
      {
        url: "/og-smallbus.svg",
        width: 1200,
        height: 630,
        alt: "small_bus transit operations dashboard preview",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "small_bus",
    description:
      "Simple route and schedule operations software built for small bus companies.",
    images: ["/og-smallbus.svg"],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0d1117",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`dark ${sora.variable} ${ibmPlexMono.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-[#0d1117] text-foreground antialiased">
        {children}
      </body>
    </html>
  );
}
