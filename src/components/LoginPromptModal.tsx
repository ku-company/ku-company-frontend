"use client";

import React from "react";
import { useRouter } from "next/navigation";

export default function LoginPromptModal({ isOpen }: { isOpen: boolean }) {
  const router = useRouter();
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="w-full max-w-sm rounded-2xl bg-white shadow-xl p-6">
        <h2 className="text-lg font-semibold">Login Required</h2>
        <p className="mt-2 text-sm text-gray-600">You need to log in to continue.</p>
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => router.push("/homepage")}
            className="rounded-full border px-4 py-2 text-sm hover:bg-gray-50"
          >
            Back to homepage
          </button>
          <button
            onClick={() => router.push("/login")}
            className="rounded-full px-5 py-2 text-sm font-semibold text-white"
            style={{ backgroundColor: "#5D9252" }}
          >
            Go to login
          </button>
        </div>
      </div>
    </div>
  );
}

