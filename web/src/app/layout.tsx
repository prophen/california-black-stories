import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SanityLive } from "@/sanity/lib/live";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "California Black Stories",
  description:
    "Ask the archive: 150 fact-checked stories of Black history in California, with per-claim sources.",
  icons: {
    icon: "/favicon.ico",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "California Black Stories",
    description:
      "Ask the archive: 150 fact-checked stories of Black history in California, with per-claim sources.",
    type: "website",
    siteName: "California Black Stories",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "California Black Stories",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "California Black Stories",
    description:
      "Ask the archive: 150 fact-checked stories of Black history in California, with per-claim sources.",
    images: ["/og-image.jpg"],
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        {children}
        <SanityLive />
      </body>
    </html>
  );
}
