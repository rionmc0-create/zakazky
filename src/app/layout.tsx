
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://rionxddprojects.vercel.app"),

  title: "Rionxdd – Official Website | Rionxdd Projects",

  description:
  "Official website of Rionxdd. Minecraft development, Discord services, custom plugins and web projects.",

  applicationName: "Rionxdd Projects",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "Rionxdd Projects – Minecraft & Discord Development",
    description:
      "Professional Minecraft and Discord development services by Rionxdd. Explore projects, services and collaborations.",
    url: "https://rionxddprojects.vercel.app/",
    siteName: "Rionxdd Projects",
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary",
    title: "Rionxdd Projects – Minecraft & Discord Development",
    description:
      "Minecraft and Discord development services by Rionxdd.",
  },

  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
