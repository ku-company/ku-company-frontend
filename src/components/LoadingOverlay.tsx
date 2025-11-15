"use client";

import React from "react";

type LoadingOverlayProps = {
  title?: string;
  subtitle?: string;
};

export default function LoadingOverlay({
  title = "Creating your account…",
  subtitle = "Please wait while our we verify your account.",
}: LoadingOverlayProps) {
  return (
    <div
      className="fixed inset-0 z-[1000] flex items-center justify-center bg-white/70 backdrop-blur-sm"
      aria-live="polite"
      aria-busy="true"
      role="status"
    >
      <div className="flex flex-col items-center gap-4 rounded-2xl border border-gray-200 bg-white px-8 py-6 shadow-xl">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-midgreen-500 border-t-transparent" />
        <div className="text-center">
          <p className="font-semibold text-gray-900">{title}</p>
          <p className="mt-1 text-sm text-gray-600">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

