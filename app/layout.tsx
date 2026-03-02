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
  title: "America First Advisor",
  description:
    "Find federal candidates in your district and see how they score on America First criteria across immigration, foreign policy, social policy, and religion.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8f9fb" },
    { media: "(prefers-color-scheme: dark)", color: "#0c1021" },
  ],
  width: "device-width",
  initialScale: 1,
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
