export interface RegisterPayload {
  first_name: string
  last_name: string
  stdId?: string
  company_name?: string
  email: string
  role: string
  user_name: string
  password: string
  confirm_password: string
  // Optional consent field for PDPA/GDPR ToS acceptance; backend may ignore it
  pdpa_consent?: boolean
  // Backend expects `is_consent`; keep both for compatibility
  is_consent?: boolean
}

import { assertOk } from "@/utils/httpError";

export async function registerUser(payload: RegisterPayload) {
  try {
    // Map consent field to the backend-expected key if needed
    const wire: any = { ...payload };
    if (typeof wire.is_consent === "undefined" && typeof wire.pdpa_consent !== "undefined") {
      wire.is_consent = !!wire.pdpa_consent;
    }
    const res = await fetch("https://ku-company-backend-ekg6.onrender.com/api/user/sign-up", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(wire),
    })
    await assertOk(res)
    return await res.json()
  } catch (err) {
    console.error(err)
    throw err
  }
}
