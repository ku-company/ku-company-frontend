import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Poppins } from "next/font/google";
import "./globals.css";
import "../../styles/style.scss";

import { AuthProvider } from "@/context/AuthContext";
import BootstrapSession from "@/components/auth/BootstrapSession";
import AuthExpiryHandler from "@/components/auth/AuthExpiryHandler";
import ClientLayout from "@/components/ClientLayout";

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
  weight: ["400", "600", "700"],
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
    <html lang="en" data-theme="kucompany">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased bg-base-100 text-gray-900 min-h-screen`}
      >
        <AuthProvider>
          <BootstrapSession />
          <AuthExpiryHandler />
          <ClientLayout>
            <main className="min-h-screen">{children}</main>
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
