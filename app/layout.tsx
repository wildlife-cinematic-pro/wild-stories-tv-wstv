import type { Metadata } from "next";
import type { ReactNode } from "react";
import { BRAND_NAME, COMMUNITY_NAME } from "@/lib/brand";
import "./globals.css";
import "./image-compact.css";

export const metadata: Metadata = {
  title: BRAND_NAME,
  description: `Cinematic AI wildlife reels, animal encounters, survival moments, and documentary-style wild stories. Join the ${COMMUNITY_NAME}.`,
};

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
