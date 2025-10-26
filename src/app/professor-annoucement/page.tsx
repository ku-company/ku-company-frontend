"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";

// ✅ โหลด CompanyNavbar แบบ client-side เท่านั้น (ป้องกัน hydration mismatch)
const CompanyNavbar = dynamic(() => import("@/components/CompanyNavbar"), {
  ssr: false,
});

const GREEN = "#5b8f5b";

type Comment = { id: string; user: string; text: string; time: string };
type Post = {
  id: string;
  author: string;
  time: string;
  paragraphs: string[];
  hashtag?: string;
  likes: number;
  comments: number;
  saved: number;
  listComments: Comment[];
};

export default function AnnouncementPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [visibility, setVisibility] = useState("Everyone");
  const [text, setText] = useState("");
  const [hash, setHash] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const canPost = useMemo(() => text.trim().length > 0, [text]);

  // ✅ ใช้ useEffect เพื่อ initialize ตัวอย่าง post (ไม่ให้ SSR สร้างเวลาไม่ตรง)
  useEffect(() => {
    const initialPost: Post = {
      id: "p1",
      author: "Professor J",
      time: "8:27 PM - Dec 23, 2023",
      paragraphs: [
        "I'd like to highlight TechNova Solutions, a company I've collaborated with recently. They're doing impressive work in cloud computing and AI applications.",
        "For students interested in real-world projects and internships, this could be a great place to learn and grow.",
      ],
      hashtag: "#CompanyRecommendation",
      likes: 41,
      comments: 3,
      saved: 52,
      listComments: [],
    };
    setPosts([initialPost]);
  }, []);

  const submitPost = () => {
    if (!canPost) return;

    // ✅ ให้เวลาสร้างฝั่ง client เท่านั้น
    const now = new Date();
    const timeString =
      now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
      " - " +
      now.toLocaleDateString();

    const newPost: Post = {
      id: crypto.randomUUID(),
      author: "Professor M",
      time: timeString,
      paragraphs: text.split("\n").filter(Boolean),
      hashtag: hash ? `#${hash}` : undefined,
      likes: 0,
      comments: 0,
      saved: 0,
      listComments: [],
    };

    setPosts((prev) => [newPost, ...prev]);
    setText("");
    setHash("");
  };

  return (
    <>
      {/* ✅ Navbar fixed-top */}
      <CompanyNavbar />

      {/* ✅ Content */}
      <main className="min-h-screen bg-base-100 py-10 px-4 pt-24">
        {/* ─────────────── Header ─────────────── */}
        <div className="max-w-4xl mx-auto mb-10 text-center">
          <h1 className="text-3xl font-extrabold text-[#5b8f5b] tracking-tight">
            Announcement Board
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Post internship updates or share company announcements with students.
          </p>
        </div>

        {/* ─────────────── Composer ─────────────── */}
        <div className="max-w-3xl mx-auto card bg-white border border-emerald-100 shadow-md rounded-2xl overflow-hidden">
          <div className="bg-[#5b8f5b] text-white px-5 py-3 text-sm font-semibold">
            Create Announcement
          </div>

          <div className="card-body p-6 space-y-4">
            {/* Avatar + Visibility */}
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: GREEN }}
              >
                M
              </div>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
                className="select select-sm border-emerald-200 text-gray-700 focus:border-[#5b8f5b] rounded-full"
              >
                <option>Everyone</option>
                <option>Friends</option>
                <option>Only me</option>
              </select>
            </div>

            {/* Textarea */}
            <textarea
              className="textarea textarea-bordered w-full h-32 text-sm border-emerald-200 focus:border-[#5b8f5b] rounded-xl"
              placeholder="Write your announcement here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />

            {/* Hashtag + Image + Post Button */}
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3 flex-1">
                <input
                  type="text"
                  placeholder="Add hashtags (optional)"
                  className="input input-bordered input-sm flex-1 border-emerald-200 focus:border-[#5b8f5b] rounded-full"
                  value={hash}
                  onChange={(e) => setHash(e.target.value)}
                />
                <button
                  onClick={() => fileRef.current?.click()}
                  className="btn btn-sm btn-outline border-[#5b8f5b] text-[#5b8f5b] hover:bg-[#5b8f5b]/10 rounded-full"
                >
                  📎 Image
                </button>
                <input ref={fileRef} type="file" hidden />
              </div>

              <button
                disabled={!canPost}
                onClick={submitPost}
                className="btn btn-sm bg-[#5b8f5b] text-white hover:bg-emerald-700 rounded-full px-6 disabled:opacity-50"
              >
                Post
              </button>
            </div>
          </div>
        </div>

        {/* ─────────────── Feed ─────────────── */}
        <div className="max-w-3xl mx-auto mt-10 space-y-6">
          {posts.map((p) => (
            <div
              key={p.id}
              className="card bg-white border border-emerald-100 shadow-sm hover:shadow-md transition rounded-2xl"
            >
              {/* Post Header */}
              <div className="flex items-center justify-between bg-[#5b8f5b]/10 px-5 py-3 border-b border-emerald-100">
                <div className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-full grid place-items-center text-white font-semibold"
                    style={{ backgroundColor: GREEN }}
                  >
                    {p.author[0]}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">
                      {p.author}
                    </p>
                    <p className="text-xs text-gray-500">{p.time}</p>
                  </div>
                </div>
                <button
                  onClick={() =>
                    setPosts((arr) => arr.filter((x) => x.id !== p.id))
                  }
                  className="btn btn-xs btn-ghost text-gray-500 hover:text-red-500"
                >
                  ✕
                </button>
              </div>

              {/* Content */}
              <div className="card-body py-4 px-5 text-sm text-gray-700 leading-relaxed">
                {p.paragraphs.map((par, i) => (
                  <p key={i} className={i ? "mt-2" : ""}>
                    {par}
                  </p>
                ))}
                {p.hashtag && (
                  <div className="mt-3 text-[#5b8f5b] text-sm font-medium">
                    {p.hashtag}
                  </div>
                )}
              </div>

              {/* Footer icons */}
              <div className="px-5 py-3 flex items-center gap-6 text-gray-500 border-t border-emerald-100 text-sm">
                <button className="hover:text-[#5b8f5b] transition">
                  👍 {p.likes}
                </button>
                <button className="hover:text-[#5b8f5b] transition">
                  💬 {p.comments}
                </button>
                <button className="hover:text-[#5b8f5b] transition">
                  🔖 {p.saved}
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </>
  );
}
