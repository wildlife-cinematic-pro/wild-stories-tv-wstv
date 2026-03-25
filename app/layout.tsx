import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Wildlife Cinematic Director",
  description:
    "Generate cinematic AI wildlife prompts for Runway, Kling, and social media platforms.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
