export interface LoginPayload {
  user_name: string
  password: string
}

export interface LoginResponse {
  message: string
  data: {
    access_token: string
    refresh_token: string
    user_name: string
    roles: string
    email: string
  }
}

export async function loginUser(payload: LoginPayload): Promise<LoginResponse> {
  try {
    const res = await fetch("http://localhost:8000/api/user/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    })

    if (!res.ok) {
      throw new Error(`Failed to login: ${res.statusText}`)
    }

    return await res.json()
  } catch (err) {
    console.error("Login error:", err)
    throw err
  }
}
