"use client";

import { useRouter } from "next/navigation";
import { getGoogleOAuthUrl } from "@/api/oauth";

interface RoleSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
  mode?: "register" | "oauth"; // 👈 new
}

const roles = [
  { name: "Student", icon: "/icons/student.png" },
  { name: "Professor", icon: "/icons/professor.png" },
  { name: "Company", icon: "/icons/company.png" },
];

export default function RoleSelectModal({ isOpen, onClose, mode = "register" }: RoleSelectModalProps) {
  const router = useRouter();

  function handleSelect(role: string) {
    onClose();
    const upperRole = role.charAt(0).toUpperCase() + role.slice(1); // Student, Professor, Company
    if (mode === "register") {
      router.push(`/register/${role.toLowerCase()}`);
    } else if (mode === "oauth") {
      window.location.href = getGoogleOAuthUrl(upperRole);
    }
  }


  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl p-12 w-full max-w-4xl shadow-2xl relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-gray-500 hover:text-gray-800 text-3xl"
          title="Close"
        >
          ✕
        </button>

        <h2 className="text-4xl font-bold text-black text-center mb-10">Choose Your Role</h2>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-10">
          {roles.map((role) => (
            <button
              key={role.name}
              onClick={() => handleSelect(role.name.toLowerCase())}
              className="flex flex-col items-center bg-gray-100 p-10 rounded-2xl hover:shadow-lg transition transform hover:scale-105"
            >
              <div className="bg-midgreen text-white rounded-full w-32 h-32 flex items-center justify-center">
                <img src={role.icon} alt={role.name} className="w-16 h-18" />
              </div>
              <span className="mt-6 text-lg text-black font-semibold">{role.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
