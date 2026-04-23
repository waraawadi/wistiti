import type { Metadata } from "next";
import { Inter } from "next/font/google";

import "./globals.css";

import { Providers } from "./providers";

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
});

const display = Inter({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

const appName = process.env.NEXT_PUBLIC_APP_NAME || "Wistitii";
const appDescription = "Partage de photos d'événements";
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://wistitii.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: appName,
  description: appDescription,
  applicationName: appName,
  icons: {
    icon: [{ url: "/images/wistitii-logo.png", type: "image/png" }],
    apple: [{ url: "/images/wistitii-logo.png", type: "image/png" }],
    shortcut: ["/images/wistitii-logo.png"],
  },
  openGraph: {
    title: appName,
    description: appDescription,
    siteName: appName,
    type: "website",
    locale: "fr_FR",
    images: [
      {
        url: "/images/wistitii-logo.png",
        width: 1024,
        height: 341,
        alt: appName,
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: appName,
    description: appDescription,
    images: ["/images/wistitii-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <body className={`${body.variable} ${display.variable} min-h-screen font-sans antialiased`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
