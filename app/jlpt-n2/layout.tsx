import type { Metadata, Viewport } from "next";
import type { ReactNode } from "react";

export const metadata: Metadata = {
  title: "JLPT N2 Study System",
  description:
    "A source-aware JLPT N2 150+ curriculum web app with original starter practice, personal imports, coverage tracking, source links, mistakes, mock tests, and SRS planning.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "JLPT N2",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/jlpt-n2-icon-192.png",
    apple: "/jlpt-n2-icon-192.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#1d5c3b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function JlptN2Layout({ children }: { children: ReactNode }) {
  return children;
}
