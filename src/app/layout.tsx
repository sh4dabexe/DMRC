import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "MetroFlow — Delhi Metro Multi-Route Planner | Plan smarter. Change less.",
  description: "Find least-station metro routes and all meaningful alternative interchange options across Delhi-NCR with official DMRC fare slabs, first & last train timings, and an interactive zoomable map.",
  keywords: ["Delhi Metro", "DMRC", "Metro Route Planner", "Delhi Metro Multi Route", "DMRC Fares", "MetroFlow"],
  authors: [{ name: "MetroFlow" }],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="h-full bg-[#F5F6F7] text-neutral-900">{children}</body>
    </html>
  );
}
