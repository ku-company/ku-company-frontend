"use client";

import { useState } from "react";
import RoleSelectModal from "@/components/roleselector";

export default function LoginPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <div className="flex min-h-screen items-center justify-center bg-white">
        <div className="flex w-full max-w-4xl items-center justify-between p-8">
          {/* Left logo */}
          <div className="hidden w-1/2 md:flex items-center justify-center ml-[-7em]">
            <div className="w-96 h-96 flex items-center justify-center">
              <img
                src="/logos/ku-company-logo.png"
                alt="Logo"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/*login form */}
          <div className="w-full md:w-1/2 max-w-md">
            <div className="flex items-center justify-center flex-col mb-5">
              <h2 className="text-4xl font-poppings text-midgreen">WELCOME BACK TO</h2>
              <h1 className="text-4xl font-poppings text-black">KU-COMPANY</h1>
            </div>

            <form className="space-y-4">
              <input
                type="text"
                placeholder="Username"
                className="w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen"
              />
              <input
                type="password"
                placeholder="Password"
                className="w-full rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-2 focus:ring-midgreen"
              />
              <button
                type="button"
                className="w-full rounded-full bg-midgreen py-2 text-white font-semibold hover:bg-green-800 transition"
              >
                Log in
              </button>
              <button
                type="button"
                className="w-full flex items-center justify-center gap-2 rounded-full bg-black py-2 text-white font-semibold hover:bg-gray-800 transition"
              >
                <img src="/logos/google.png" alt="Google Logo" className="w-5 h-5" />
                <span>Log in with Google</span>
              </button>
            </form>

            <div className="mt-4 flex justify-between text-sm">
              <a href="#" className="text-gray-500 hover:underline">
                Forgot Password?
              </a>
              <button
                onClick={() => setIsModalOpen(true)}
                className="text-midgreen font-medium hover:underline"
              >
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal */}
      <RoleSelectModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </>
  );
}
