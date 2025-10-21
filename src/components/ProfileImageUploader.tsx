"use client";

import { useEffect, useRef, useState } from "react";
import {
  getEmployeeProfileImage,
  uploadEmployeeProfileImage,
  patchEmployeeProfileImage,
  getCompanyProfileImage,
  uploadCompanyProfileImage,
  patchCompanyProfileImage,
  PROFILE_IMAGE_UPDATED_EVENT,
} from "@/api/profileimage";

type Kind = "employee" | "company";

type Props = {
  kind: Kind;
  initialUrl?: string | null;
  className?: string;
  onUpdated?: (url: string) => void;
  size?: number; // square size in px for the container (optional)
};

export default function ProfileImageUploader({ kind, initialUrl, className, onUpdated, size }: Props) {
  const [hover, setHover] = useState(false);
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState<string | null>(initialUrl ?? null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync with backend on mount if no initialUrl provided
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (initialUrl) return;
      try {
        const u = kind === "employee" ? await getEmployeeProfileImage() : await getCompanyProfileImage();
        if (!cancelled) setUrl(u);
      } catch {
        if (!cancelled) setUrl(null);
      }
    })();
    return () => { cancelled = true; };
  }, [kind, initialUrl]);

  useEffect(() => { setUrl(initialUrl ?? null); }, [initialUrl]);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      // Decide POST or PATCH based on whether an image exists now
      const doPatch = !!url;
      const newUrl = kind === "employee"
        ? doPatch
          ? await patchEmployeeProfileImage(file)
          : await uploadEmployeeProfileImage(file)
        : doPatch
          ? await patchCompanyProfileImage(file)
          : await uploadCompanyProfileImage(file);

      // After upload/patch, refetch current URL to ensure we have a fresh pre-signed link (if used)
      const refetched = kind === "employee" ? await getEmployeeProfileImage() : await getCompanyProfileImage();
      const finalUrl = refetched || newUrl;

      setUrl(finalUrl);
      onUpdated?.(finalUrl);
      // notify navbar and other listeners
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent(PROFILE_IMAGE_UPDATED_EVENT, { detail: { url: finalUrl, kind } }));
      }
    } catch (e) {
      console.error("Profile image upload failed:", e);
    } finally {
      setBusy(false);
    }
  }

  function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    handleFile(f);
    // reset input so the same file can be picked again
    e.currentTarget.value = "";
  }

  const fallback = "/icons/default-profile.png";
  const src = url || fallback;

  return (
    <div
      className={`relative w-full h-full ${className || ""}`}
      style={size ? { width: size, height: size } : undefined}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <img src={src} alt="Profile" className="absolute inset-0 w-full h-full object-cover" />

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={onChange}
      />

      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        title="Change profile picture"
        className={`absolute inset-0 grid place-items-center rounded-full transition duration-150 ease-in-out cursor-pointer ${
          hover
            ? "opacity-100 bg-black/45 text-white shadow-lg ring-2 ring-white/70"
            : "opacity-0 bg-transparent text-transparent"
        }`}
        aria-busy={busy}
      >
        {busy ? "Uploading..." : "Edit"}
      </button>
    </div>
  );
}
