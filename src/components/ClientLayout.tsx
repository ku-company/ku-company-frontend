"use client";

import React from "react";
import Navbar from "@/components/Navbar";
import { ApplyCartProvider } from "@/context/ApplyCartContext";

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  return (
    <ApplyCartProvider>
      <Navbar />
      {children}
    </ApplyCartProvider>
  );
}
