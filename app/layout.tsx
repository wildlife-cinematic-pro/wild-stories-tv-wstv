import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Wildlife Cinematic Director",
  description:
    "Generate Seedance-first 4-shot wildlife prompt packs with optional Runway and Kling alternate workflows.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
