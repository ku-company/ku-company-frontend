"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
  disabled?: boolean; // when true, hide/disable edit affordance
};

function normalizeUrl(value?: string | null): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  return trimmed ? trimmed : null;
}

export default function ProfileImageUploader({ kind, initialUrl, className, onUpdated, size, disabled = false }: Props) {
  const [hover, setHover] = useState(false);
  const [busy, setBusy] = useState(false);
  const resolvedInitial = useMemo(() => normalizeUrl(initialUrl ?? null), [initialUrl]);
  const [url, setUrl] = useState<string | null>(resolvedInitial);
  const inputRef = useRef<HTMLInputElement>(null);

  // Always try to hydrate from the API if we don't already have a usable URL.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (resolvedInitial) return;
      try {
        const fetched = kind === "employee" ? await getEmployeeProfileImage() : await getCompanyProfileImage();
        if (!cancelled && fetched) {
          setUrl(fetched);
        }
      } catch {
        if (!cancelled) {
          setUrl((prev) => prev ?? null);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [kind, resolvedInitial]);

  // Keep local state in sync when parent provides a new URL (e.g., after profile refetch)
  useEffect(() => {
    if (resolvedInitial) {
      setUrl(resolvedInitial);
    } else if (initialUrl === null) {
      setUrl(null);
    }
  }, [initialUrl, resolvedInitial]);

  async function handleFile(file: File) {
    setBusy(true);
    try {
      const doPatch = !!url;
      const newUrl = kind === "employee"
        ? doPatch
          ? await patchEmployeeProfileImage(file)
          : await uploadEmployeeProfileImage(file)
        : doPatch
          ? await patchCompanyProfileImage(file)
          : await uploadCompanyProfileImage(file);

      const refetched = kind === "employee" ? await getEmployeeProfileImage() : await getCompanyProfileImage();
      const finalUrl = refetched || newUrl || null;

      setUrl(finalUrl);
      if (finalUrl) {
        onUpdated?.(finalUrl);
      }

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
        disabled={disabled}
      />

      <button
        type="button"
        onClick={() => !disabled && inputRef.current?.click()}
        disabled={busy || disabled}
        title={disabled ? "Verification required" : "Change profile picture"}
        className={`absolute inset-0 grid place-items-center rounded-full transition duration-150 ease-in-out cursor-pointer ${
          disabled
            ? "opacity-0 bg-transparent text-transparent cursor-not-allowed"
            : hover
            ? "opacity-100 bg-black/45 text-white shadow-lg ring-2 ring-white/70"
            : "opacity-0 bg-transparent text-transparent"
        }`}
        aria-busy={busy}
      >
        {busy ? "Uploading..." : disabled ? "" : "Edit"}
      </button>
    </div>
  );
}
