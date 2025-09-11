export function getGoogleOAuthUrl(role: string) {
  const base = "http://localhost:8000/api/auth/google";
  return `${base}?role=${encodeURIComponent(role)}`; 
}
