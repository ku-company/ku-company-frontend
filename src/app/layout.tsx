import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Poppins } from "next/font/google";
import "./globals.css";

import { AuthProvider } from "@/context/AuthContext";
import BootstrapSession from "@/components/auth/BootstrapSession";
import AuthExpiryHandler from "@/components/auth/AuthExpiryHandler";
import ClientLayout from "@/components/ClientLayout"; // Dynamically chooses navbar based on role

// Font setup
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

// Metadata
export const metadata: Metadata = {
  title: "KU-COMPANY",
  description: "Job portal for CPE & SKE students",
};

// Root layout
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="ku-company">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${poppins.variable} antialiased bg-base-200 text-base-content`}
      >
        {/* Provide authentication context to all pages */}
        <AuthProvider>
          {/* Restore user from server session (cookies) if available */}
          <BootstrapSession />
          {/* Auto-logout when JWT expires */}
          <AuthExpiryHandler />
          {/* Dynamically render layout and navbar based on user role */}
          <ClientLayout>
            {/* Add top padding to prevent content from being overlapped by the fixed navbar */}
            <main className="min-h-[calc(100vh-3.5rem)]">{children}</main>
          </ClientLayout>
        </AuthProvider>
      </body>
    </html>
  );
}
