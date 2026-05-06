import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./image-compact.css";

export const metadata: Metadata = {
  title: "Wild Stories TV",
  description:
    "Cinematic AI wildlife reels, animal encounters, survival moments, and documentary-style wild stories. Join the Wild Crew.",
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
