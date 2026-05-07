import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";
import AnnouncementBar from "@/components/AnnouncementBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Providers from "@/components/Providers";

const playfair = Playfair_Display({
  subsets: ["latin"],
  weight: ["900"],
  variable: "--font-playfair",
  display: "swap"
});

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-inter",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://gotbeef.us"),
  title: { default: "Got Beef — Gourmet Brisket Beef Jerky", template: "%s · Got Beef" },
  description: "All-natural, grass-fed gourmet brisket beef jerky. No fillers, no nonsense. Five flavors, hand-cut, made in the USA.",
  openGraph: {
    title: "Got Beef — Gourmet Brisket Beef Jerky",
    description: "All-natural, grass-fed gourmet brisket beef jerky.",
    siteName: "Got Beef",
    type: "website"
  },
  icons: { icon: "/favicon.svg" }
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${inter.variable}`}>
      <body className="font-sans antialiased text-ink bg-bone min-h-screen flex flex-col">
        <Providers>
          <AnnouncementBar />
          <Header />
          <main className="flex-1">{children}</main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
