export function getGoogleOAuthUrl(role: string) {
  const base = "http://localhost:8000/google/sign-up";
  return `${base}?role=${encodeURIComponent(role)}`; 
}
