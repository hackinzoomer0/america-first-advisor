import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const _geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const _geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "America First Advisor | Find Candidates Who Match Your Values",
  description:
    "AI-powered civic intelligence. Share your positions on key issues, then discover federal candidates in your district who align with your values on immigration, economy, foreign policy, and more.",
  keywords: ["voter guide", "candidate matching", "federal elections", "civic intelligence", "political quiz"],
  openGraph: {
    title: "America First Advisor",
    description: "Find candidates who match your values with AI-powered civic intelligence.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fafbfc" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${_geistSans.variable} ${_geistMono.variable} font-sans antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
