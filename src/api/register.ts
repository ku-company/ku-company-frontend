export interface RegisterPayload {
  first_name: string
  last_name: string
  company_name?: string
  email: string
  role: string
  user_name: string
  password: string
  confirm_password: string
}

export async function registerUser(payload: RegisterPayload) {
  try {
    const res = await fetch("http://localhost:8000/api/user/sign-up", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      throw new Error(`Failed to register: ${res.statusText}`)
    }

    return await res.json()
  } catch (err) {
    console.error(err)
    throw err
  }
}
