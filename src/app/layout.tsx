
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

  title: "Rionxdd – Official Website",
  description:
    "Official website of Rionxdd, showcasing Minecraft plugin development, Discord bots, web development and professional projects.",

  applicationName: "Rionxdd",

  alternates: {
    canonical: "/",
  },

  openGraph: {
    title: "Rionxdd – Official Website",
    description:
      "Discover projects and development services by Rionxdd, including Minecraft plugins, Discord bots and websites.",
    url: "https://rionxddprojects.vercel.app/",
    siteName: "Rionxdd",
    locale: "en_US",
    type: "website",
  },

  twitter: {
    card: "summary",
    title: "Rionxdd – Official Website",
    description:
      "Minecraft development, Discord bots and web projects by Rionxdd.",
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
