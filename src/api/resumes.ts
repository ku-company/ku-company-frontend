const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000";

const getAuthHeader = () => {
  const token = localStorage.getItem("access_token");
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

// ---------------------- Upload Resume ----------------------
export async function uploadResume(file: File) {
  const token = localStorage.getItem("access_token");
  const formData = new FormData();
  formData.append("file", file);

  const res = await fetch(`${BASE_URL}/api/employee/profile/resumes`, {
    method: "POST",
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed (${res.status}): ${text}`);
  }
  return res.json();
}

// ---------------------- Get All Resumes ----------------------
export async function getResumes() {
  const res = await fetch(`${BASE_URL}/api/employee/profile/resumes`, {
    headers: getAuthHeader(),
  });

  if (!res.ok) throw new Error(`Failed to get resumes: ${res.status}`);
  return res.json();
}

// ---------------------- Delete All Resumes ----------------------
export async function deleteAllResumes() {
  const res = await fetch(`${BASE_URL}/api/employee/profile/resumes`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });

  if (!res.ok) throw new Error(`Failed to delete all resumes: ${res.status}`);
  return res.json();
}

// ---------------------- Get Resume by ID ----------------------
export async function getResumeById(id: string | number) {
  const res = await fetch(`${BASE_URL}/api/employee/profile/resumes/${id}`, {
    headers: getAuthHeader(),
  });

  if (!res.ok) throw new Error(`Failed to get resume: ${res.status}`);
  return res.json();
}

// ---------------------- Delete Resume by ID ----------------------
export async function deleteResumeById(id: string | number) {
  const res = await fetch(`${BASE_URL}/api/employee/profile/resumes/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });

  if (!res.ok) throw new Error(`Failed to delete resume: ${res.status}`);
  return res.json();
}

// ---------------------- Get Main Resume ----------------------
export async function getMainResume() {
  const res = await fetch(`${BASE_URL}/api/employee/profile/resumes/main`, {
    headers: getAuthHeader(),
  });

  if (!res.ok) throw new Error(`Failed to get main resume: ${res.status}`);
  return res.json();
}

// ---------------------- Set Main Resume ----------------------
export async function setMainResume(id: string | number) {
  const res = await fetch(`${BASE_URL}/api/employee/profile/resumes/${id}/set-main`, {
    method: "PATCH",
    headers: getAuthHeader(),
  });

  if (!res.ok) throw new Error(`Failed to set main resume: ${res.status}`);
  return res.json();
}
