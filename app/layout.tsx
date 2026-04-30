import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import "./image-compact.css";

export const metadata: Metadata = {
  title: "AI Wildlife Cinematic Director",
  description:
    "Generate Seedance-first 4-shot wildlife prompt packs with optional Runway and Kling alternate workflows.",
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
