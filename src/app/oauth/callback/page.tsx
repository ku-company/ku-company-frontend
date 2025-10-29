"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OAuthCallbackPage() {
  const router = useRouter();

  useEffect(() => {
    // BootstrapSession picks up tokens from URL and logs user in.
    // After a short tick, navigate user to homepage.
    const id = setTimeout(() => {
      router.replace("/homepage");
    }, 300);
    return () => clearTimeout(id);
  }, [router]);

  return (
    <div className="p-8 text-gray-600">Finishing sign-in   </div>
  );
}

