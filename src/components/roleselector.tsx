"use client";

import { useRouter } from "next/navigation";

interface RoleSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const roles = [
  { name: "Student", icon: "/icons/student.png", href: "/register/student" },
  { name: "Professor", icon: "/icons/professor.png", href: "/register/professor" },
  { name: "Company", icon: "/icons/company.png", href: "/register/company" },
];

export default function RoleSelectModal({ isOpen, onClose }: RoleSelectModalProps) {
  const router = useRouter();

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
              onClick={() => router.push(role.href)}
              className="flex flex-col items-center bg-gray-100 p-10 rounded-2xl hover:shadow-lg transition transform hover:scale-105"
            >
              <div className="bg-midgreen text-white rounded-full w-32 h-32 flex items-center justify-center">
                <img src={role.icon} alt={role.name} className="w-16 h-16" />
              </div>
              <span className="mt-6 text-lg text-black font-semibold">{role.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
