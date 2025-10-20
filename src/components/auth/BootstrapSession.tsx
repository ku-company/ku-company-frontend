"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchAuthMe } from "@/api/session"; // ✅ ตรวจว่าไฟล์นี้มีจริงไหม

export default function BootstrapSession() {
  const { user, login } = useAuth();
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    console.log("🟡 BootstrapSession started...");
    (async () => {
      try {
        const me = await fetchAuthMe();
        console.log("🟢 fetchAuthMe() returned:", me);

        if (me && me.user_name) {
          login({
            access_token: localStorage.getItem("access_token") ?? "",
            refresh_token: localStorage.getItem("refresh_token") ?? "",
            user_name: me.user_name,
            email: me.email ?? "",
            role: me.role ?? me.roles ?? "student",
          });
          console.log("✅ Logged in as:", me.role ?? me.roles);
        } else {
          console.warn("⚠️ No user data from fetchAuthMe()");
        }
      } catch (err) {
        console.error("❌ BootstrapSession failed:", err);
      }
    })();
  }, [login]);

  return null;
}
