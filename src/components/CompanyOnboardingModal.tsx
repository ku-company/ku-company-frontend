"use client";

import { useEffect, useRef, useState } from "react";
import { updateCompanyProfile } from "@/api/companyprofile";
import LoadingOverlay from "@/components/LoadingOverlay";
import { requestAiRegistrationReview } from "@/api/ai";
import { fetchAuthMe } from "@/api/session";
import { useAuth } from "@/context/AuthContext";
import notify from "@/lib/toast";
import { reloginAfterAiReview } from "@/utils/authRefresh";
import { interpretAiReviewOutcome } from "@/utils/aiReview";

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

export default function CompanyOnboardingModal({ isOpen, onClose }: Props) {
  const overlayRef = useRef<HTMLDivElement>(null);
  const nameRef = useRef<HTMLInputElement>(null);
  const { user, login } = useAuth();

  const [companyName, setCompanyName] = useState("");
  const [country, setCountry] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reviewing, setReviewing] = useState(false);

  // Basic country list for dropdown; adjust as needed
  const COUNTRIES = [
    "Afghanistan",
    "Albania",
    "Algeria",
    "Andorra",
    "Angola",
    "Argentina",
    "Armenia",
    "Australia",
    "Austria",
    "Azerbaijan",
    "Bahamas",
    "Bahrain",
    "Bangladesh",
    "Barbados",
    "Belarus",
    "Belgium",
    "Belize",
    "Benin",
    "Bhutan",
    "Bolivia",
    "Bosnia and Herzegovina",
    "Botswana",
    "Brazil",
    "Brunei",
    "Bulgaria",
    "Burkina Faso",
    "Burundi",
    "Cambodia",
    "Cameroon",
    "Canada",
    "Cape Verde",
    "Central African Republic",
    "Chad",
    "Chile",
    "China",
    "Colombia",
    "Comoros",
    "Congo (Congo-Brazzaville)",
    "Costa Rica",
    "Croatia",
    "Cuba",
    "Cyprus",
    "Czechia",
    "Democratic Republic of the Congo",
    "Denmark",
    "Djibouti",
    "Dominica",
    "Dominican Republic",
    "Ecuador",
    "Egypt",
    "El Salvador",
    "Equatorial Guinea",
    "Eritrea",
    "Estonia",
    "Eswatini",
    "Ethiopia",
    "Fiji",
    "Finland",
    "France",
    "Gabon",
    "Gambia",
    "Georgia",
    "Germany",
    "Ghana",
    "Greece",
    "Grenada",
    "Guatemala",
    "Guinea",
    "Guinea-Bissau",
    "Guyana",
    "Haiti",
    "Honduras",
    "Hungary",
    "Iceland",
    "India",
    "Indonesia",
    "Iran",
    "Iraq",
    "Ireland",
    "Israel",
    "Italy",
    "Jamaica",
    "Japan",
    "Jordan",
    "Kazakhstan",
    "Kenya",
    "Kiribati",
    "Kuwait",
    "Kyrgyzstan",
    "Laos",
    "Latvia",
    "Lebanon",
    "Lesotho",
    "Liberia",
    "Libya",
    "Liechtenstein",
    "Lithuania",
    "Luxembourg",
    "Madagascar",
    "Malawi",
    "Malaysia",
    "Maldives",
    "Mali",
    "Malta",
    "Marshall Islands",
    "Mauritania",
    "Mauritius",
    "Mexico",
    "Micronesia",
    "Moldova",
    "Monaco",
    "Mongolia",
    "Montenegro",
    "Morocco",
    "Mozambique",
    "Myanmar",
    "Namibia",
    "Nauru",
    "Nepal",
    "Netherlands",
    "New Zealand",
    "Nicaragua",
    "Niger",
    "Nigeria",
    "North Korea",
    "North Macedonia",
    "Norway",
    "Oman",
    "Pakistan",
    "Palau",
    "Panama",
    "Papua New Guinea",
    "Paraguay",
    "Peru",
    "Philippines",
    "Poland",
    "Portugal",
    "Qatar",
    "Romania",
    "Russia",
    "Rwanda",
    "Saint Kitts and Nevis",
    "Saint Lucia",
    "Saint Vincent and the Grenadines",
    "Samoa",
    "San Marino",
    "Sao Tome and Principe",
    "Saudi Arabia",
    "Senegal",
    "Serbia",
    "Seychelles",
    "Sierra Leone",
    "Singapore",
    "Slovakia",
    "Slovenia",
    "Solomon Islands",
    "Somalia",
    "South Africa",
    "South Korea",
    "South Sudan",
    "Spain",
    "Sri Lanka",
    "Sudan",
    "Suriname",
    "Sweden",
    "Switzerland",
    "Syria",
    "Taiwan",
    "Tajikistan",
    "Tanzania",
    "Thailand",
    "Timor-Leste",
    "Togo",
    "Tonga",
    "Trinidad and Tobago",
    "Tunisia",
    "Turkey",
    "Turkmenistan",
    "Tuvalu",
    "Uganda",
    "Ukraine",
    "United Arab Emirates",
    "United Kingdom",
    "United States",
    "Uruguay",
    "Uzbekistan",
    "Vanuatu",
    "Vatican City",
    "Venezuela",
    "Vietnam",
    "Yemen",
    "Zambia",
    "Zimbabwe",
  ];

  useEffect(() => {
    if (isOpen) {
      setError(null);
      setSaving(false);
      setTimeout(() => nameRef.current?.focus(), 0);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const canSave = [companyName, country, description].every((v) => (v ?? "").trim().length > 0);

  const resolveUserId = async (): Promise<number | null> => {
    if (user?.id) return Number(user.id);
    const latest = await fetchAuthMe();
    if (latest?.id) return Number(latest.id);
    const stored = localStorage.getItem("user_id");
    return stored ? Number(stored) : null;
  };

  const handleSave = async () => {
    if (!canSave || saving) return;
    setSaving(true);
    setError(null);
    try {
      // Save with explicit country field
      await updateCompanyProfile({
        company_name: companyName,
        description,
        industry: "",
        tel: "",
        location: "",
        country,
      });

      try {
        setReviewing(true);
        const userId = await resolveUserId();
        if (!userId) throw new Error("Missing user id for AI review");
        const response = await requestAiRegistrationReview(userId);
        const payload = response?.data ?? response;
        const outcome = interpretAiReviewOutcome(payload);
        await reloginAfterAiReview(login, payload);

        if (outcome.rejected) {
          if (typeof window !== "undefined") {
            window.alert(outcome.reason || "Your application got rejected.");
          } else {
            notify.error(outcome.reason || "Your application got rejected.");
          }
        } else {
          notify.success("AI is reviewing your company profile.");
        }
      } catch (aiErr: any) {
        console.error("AI review failed:", aiErr);
        notify.error(aiErr?.message || "AI review failed after onboarding.");
      } finally {
        setReviewing(false);
      }

      onClose();
    } catch (e: any) {
      setError(e?.message || "Failed to save company info");
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      {reviewing && (
        <LoadingOverlay
          title="Submitting to AI…"
          subtitle="Please wait while we verify your company."
        />
      )}
      <div
        ref={overlayRef}
        className="fixed inset-0 z-[110] flex items-center justify-center bg-black/40 p-4"
        role="dialog"
        aria-modal="true"
      >
        <div className="w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="flex items-center justify-between px-5 py-4">
          <h2 className="text-lg font-semibold">Company Information</h2>
          {/* No close button to enforce completion */}
        </div>

        <div className="space-y-4 px-5 pb-5">
          <div className="grid gap-2">
            <label className="text-sm font-medium">Company Name</label>
            <input
              ref={nameRef}
              type="text"
              className="rounded-md border px-3 py-2 text-sm"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Country</label>
            <select
              className="rounded-md border px-3 py-2 text-sm bg-white"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
            >
              <option value="" disabled>
                Select a country
              </option>
              {COUNTRIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              className="h-28 rounded-md border px-3 py-2 text-sm"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {error && (
            <div className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
          )}
        </div>

        <div className="flex flex-col gap-2 rounded-b-2xl bg-gray-50 px-5 py-3">
          <div className="flex items-center justify-end gap-2">
          <button
            onClick={handleSave}
            disabled={!canSave || saving}
            className="rounded-full bg-midgreen-500 px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          </div>
        </div>
      </div>
    </div>
    </>
  );
}

