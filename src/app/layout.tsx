import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Poppins } from "next/font/google";
import "./globals.css";
import Navbar from "../components/Navbar"; // <- keep relative path (src/components/Navbar)
import { AuthProvider } from "@/context/AuthContext";
import OAuthAutoLogin from "@/components/auth/OAuthAutoLogin";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-poppins",
});

export const metadata: Metadata = {
  title: "KU-COMPANY",
  description: "Job portal for CPE & SKE students",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased bg-gray-50 text-gray-900`}
      >
        {/* Wrap everything with AuthProvider */}
        <AuthProvider>
          <OAuthAutoLogin />
          {/* Global top navigation */}
          <Navbar />

          {/* Page content */}
          <main className="min-h-screen">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
