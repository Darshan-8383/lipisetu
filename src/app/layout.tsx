import type { Metadata } from "next";
import {
  Geist,
  Geist_Mono,
  Noto_Sans_Devanagari,
  Noto_Sans_Kannada,
  Noto_Serif_Devanagari,
} from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansDevanagari = Noto_Sans_Devanagari({
  variable: "--font-devanagari",
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
});

const notoSerifDevanagari = Noto_Serif_Devanagari({
  variable: "--font-serif-devanagari",
  subsets: ["devanagari", "latin"],
  weight: ["400", "500", "600", "700"],
});

const notoSansKannada = Noto_Sans_Kannada({
  variable: "--font-kannada",
  subsets: ["kannada", "latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "LipiSetu — Sanskrit Inscription Translation",
  description:
    "LipiSetu (लिपिसेतु) bridges ancient inscriptions and digital understanding: upload temple inscription images, enhance them, extract Sanskrit text via OCR, translate to English and Kannada, and download translated images. Includes a complete Sanskrit learning section.",
  keywords: [
    "LipiSetu",
    "Sanskrit",
    "inscriptions",
    "epigraphy",
    "Devanagari OCR",
    "translation",
    "Kannada",
    "heritage",
    "OCR",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${notoSansDevanagari.variable} ${notoSerifDevanagari.variable} ${notoSansKannada.variable}`}
    >
      <body className="antialiased bg-background text-foreground">
        {children}
        <Toaster />
      </body>
    </html>
  );
}
