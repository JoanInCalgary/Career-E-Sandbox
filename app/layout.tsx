import type { Metadata } from "next";
import { Instrument_Serif, Geist, Geist_Mono } from "next/font/google";
import { AuthProvider } from "@/src/components/AuthProvider";
import "./globals.css";

/** Display / heading font — editorial serif, used for big titles. */
const instrumentSerif = Instrument_Serif({
  variable: "--font-display",
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
});

/** Body font — clean geometric sans. */
const geist = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

/** Monospace font — used for data, stats, codes. */
const geistMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Career-E-Sandbox",
  description: "Personality-Based Career Exploration",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${instrumentSerif.variable} ${geist.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
