"use client";

import { useMemo, useRef, useState } from "react";
import CompanyNavbar from "@/components/CompanyNavbar"; 

/* -------------------- Brand color -------------------- */
const GREEN = "#5b8f5b";

/* ----------------------- Types ----------------------- */
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

/* -------------------- Mock initial post -------------------- */
const INITIAL_POST: Post = {
  id: "p1",
  author: "Professor J",
  time: "8:27 PM - Dec 23, 2023",
  paragraphs: [
    "I'd like to highlight TechNova Solutions, a company I've collaborated with recently. They're doing impressive work in cloud computing and AI applications and often look for young talent with fresh ideas.",
    "For students interested in real-world projects and internships, this could be a great place to learn and grow. Definitely worth keeping an eye on!",
  ],
  hashtag: "#CompanyRecommendation",
  likes: 41,
  comments: 3,
  saved: 52,
  listComments: [
    { id: "c1", user: "jetaime_op", text: "Amazing", time: "7:44 PM - Dec 23, 2023" },
    { id: "c2", user: "milliebobbybrown", text: "Interesting", time: "10:08 PM - Jan 02, 2024" },
    { id: "c3", user: "junior_np", text: "good!", time: "11:37 PM - Jan 15, 2024" },
  ],
};

/* ---------------------- Small UI ---------------------- */
const TitleBar = () => (
  <div className="flex items-center gap-3">
    <svg width="28" height="28" viewBox="0 0 24 24" style={{ color: GREEN }}>
      <path
        d="M5 11a5 5 0 0 1 10 0v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3z"
        fill="currentColor"
        opacity=".15"
      />
      <path
        d="M5 11a5 5 0 0 1 10 0v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3z"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
      <path
        d="M17 13h1a3 3 0 1 1 0 6h-1"
        stroke="currentColor"
        strokeWidth="1.5"
        fill="none"
      />
    </svg>
    <h1 className="text-2xl font-extrabold tracking-tight">ANNOUNCEMENT</h1>
  </div>
);

/* ------------------ Composer + Feed ------------------ */
export default function AnnouncementPage() {
  const [posts, setPosts] = useState<Post[]>([INITIAL_POST]);
  const [visibility, setVisibility] = useState<"Everyone" | "Friends" | "Only me">("Everyone");
  const [text, setText] = useState("");
  const [hash, setHash] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const canPost = useMemo(
    () => text.trim().length > 0 || hash.trim().length > 0,
    [text, hash]
  );

  const submitPost = () => {
    if (!canPost) return;
    const now = new Date();
    const newPost: Post = {
      id: crypto.randomUUID(),
      author: "Professor M",
      time:
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) +
        " - " +
        now.toLocaleDateString(),
      paragraphs: text
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean),
      hashtag: hash
        ? hash
            .split(",")
            .map((h) => h.trim())
            .join(" ")
        : undefined,
      likes: 0,
      comments: 0,
      saved: 0,
      listComments: [],
    };
    setPosts((p) => [newPost, ...p]);
    setText("");
    setHash("");
  };

  return (
    <>
      {/* ✅ Company Navbar */}
      <CompanyNavbar />

      {/* ✅ Main Content */}
      <main className="mt-24 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6">
        <TitleBar />
        <div className="mt-6 border-t" />

        {/* ---------------- Composer Box ---------------- */}
        <section
          className="mt-6 rounded-2xl border bg-white shadow-sm"
          style={{ borderColor: GREEN }}
        >
          <div className="p-3 sm:p-4">
            {/* Top Row */}
            <div className="flex items-center gap-3">
              <span
                className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold"
                style={{ backgroundColor: `${GREEN}22`, color: GREEN }}
              >
                M
              </span>

              <div className="flex w-full items-center rounded-md border">
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value as any)}
                  className="h-10 w-40 rounded-l-md bg-gray-50 px-3 text-sm focus:outline-none"
                >
                  <option>Everyone</option>
                  <option>Friends</option>
                  <option>Only me</option>
                </select>

                <input
                  placeholder="What is happening?!"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  className="h-10 w-full px-3 text-sm focus:outline-none"
                />

                <button
                  type="button"
                  title="Add image"
                  onClick={() => fileRef.current?.click()}
                  className="grid h-10 w-10 place-items-center rounded-r-md border-l text-gray-600 hover:bg-gray-50"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24">
                    <path
                      d="M21 19V5a2 2 0 0 0-2-2H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2ZM8.5 12 6 15.5V18h12l-4-5.5-3 3.5-2.5-4Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
                <input ref={fileRef} type="file" hidden />
              </div>
            </div>

            {/* Hashtag Input */}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-xl font-bold" style={{ color: GREEN }}>
                #
              </span>
              <input
                placeholder="Add hashtags, comma-separated"
                value={hash}
                onChange={(e) => setHash(e.target.value)}
                className="h-9 w-full rounded-md border px-3 text-sm"
              />
            </div>

            {/* Text Area */}
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="mt-3 h-40 w-full resize-y rounded-md border p-3 text-sm"
            />

            <div className="mt-3 flex justify-end">
              <button
                disabled={!canPost}
                onClick={submitPost}
                className="rounded-full px-5 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                style={{ backgroundColor: GREEN }}
              >
                Post
              </button>
            </div>
          </div>
        </section>

        {/* ---------------- Feed Section ---------------- */}
        <div className="mt-6 space-y-5">
          {posts.map((p) => (
            <article
              key={p.id}
              className="relative rounded-2xl border bg-white shadow-sm"
              style={{ borderColor: GREEN }}
            >
              {/* delete icon */}
              <button
                title="Delete"
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg border bg-white text-gray-600 hover:bg-gray-50"
                onClick={() =>
                  setPosts((arr) => arr.filter((x) => x.id !== p.id))
                }
              >
                <svg viewBox="0 0 24 24" className="h-4 w-4">
                  <path
                    d="M7 6h10l1 14H6L7 6zm3-3h4l1 2H9l1-2z"
                    fill="currentColor"
                  />
                </svg>
              </button>

              <div className="p-4 sm:p-5">
                <div className="flex items-center gap-3">
                  <span
                    className="grid h-6 w-6 place-items-center rounded-full"
                    style={{ backgroundColor: `${GREEN}22`, color: GREEN }}
                  >
                    •
                  </span>
                  <div className="text-sm">
                    <span className="font-semibold">{p.author}</span>
                    <span className="ml-2 text-xs text-gray-500">{p.time}</span>
                  </div>
                </div>

                {/* body */}
                <div className="mt-3 text-sm leading-6 text-gray-800">
                  {p.paragraphs.map((par, i) => (
                    <p key={i} className={i ? "mt-3" : ""}>
                      {par}
                    </p>
                  ))}
                  {p.hashtag && (
                    <div
                      className="mt-3 text-[13px] font-medium"
                      style={{ color: GREEN }}
                    >
                      {p.hashtag}
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>
    </>
  );
}
