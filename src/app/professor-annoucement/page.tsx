"use client";

import { useMemo, useRef, useState } from "react";

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
    <svg width="28" height="28" viewBox="0 0 24 24" className="text-[color:var(--g)]" style={{ color: GREEN }}>
      <path d="M5 11a5 5 0 0 1 10 0v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3z" fill="currentColor" opacity=".15" />
      <path d="M5 11a5 5 0 0 1 10 0v3a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-3z" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <path d="M17 13h1a3 3 0 1 1 0 6h-1" stroke="currentColor" strokeWidth="1.5" fill="none" />
    </svg>
    <h1 className="text-2xl font-extrabold tracking-tight">ANNOUNCEMENT</h1>
  </div>
);

const ExploreBar = () => (
  <div className="mt-6 flex items-center gap-3">
    <svg width="22" height="22" viewBox="0 0 24 24" style={{ color: GREEN }}>
      <path d="M11 18a7 7 0 1 1 5.3-2.4l3.6 3.6-1.4 1.4-3.6-3.6A7 7 0 0 1 11 18z" fill="currentColor" />
    </svg>
    <div className="text-lg font-semibold">Explore</div>
  </div>
);

/* ------------------ Composer + Feed ------------------ */
export default function AnnouncementPage() {
  const [posts, setPosts] = useState<Post[]>([INITIAL_POST]);

  // composer state
  const [visibility, setVisibility] = useState<"Everyone" | "Friends" | "Only me">("Everyone");
  const [text, setText] = useState("");
  const [hash, setHash] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const canPost = useMemo(() => text.trim().length > 0 || hash.trim().length > 0, [text, hash]);

  const submitPost = () => {
    if (!canPost) return;
    const now = new Date();
    const newPost: Post = {
      id: crypto.randomUUID(),
      author: "Professor M",
      time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) + " - " + now.toLocaleDateString(),
      paragraphs: text
        .split("\n")
        .map((p) => p.trim())
        .filter(Boolean),
      hashtag: hash ? hash.split(",").map((h) => h.trim()).join(" ") : undefined,
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
    <main className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6">
      <TitleBar />

      <div className="mt-6 border-t" />

      <ExploreBar />

      <hr className="mt-4 border-gray-200" />

      {/* ---------------- Composer box (เหมือนรูปบน) ---------------- */}
      <section
        className="mt-6 rounded-2xl border bg-white shadow-sm"
        style={{ borderColor: GREEN }}
      >
        <div className="p-3 sm:p-4">
          {/* top row: avatar + visibility + input + image btn */}
          <div className="flex items-center gap-3">
            {/* avatar */}
            <span
              className="grid h-9 w-9 place-items-center rounded-full text-sm font-bold"
              style={{ backgroundColor: `${GREEN}22`, color: GREEN }}
            >
              {/* user initial */}
              M
            </span>

            {/* visibility dropdown + what happening */}
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

              {/* image button */}
              <button
                type="button"
                title="Add image"
                onClick={() => fileRef.current?.click()}
                className="grid h-10 w-10 place-items-center rounded-r-md border-l text-gray-600 hover:bg-gray-50"
              >
                <svg width="16" height="16" viewBox="0 0 24 24">
                  <path d="M21 19V5a2 2 0 0 0-2-2H5C3.9 3 3 3.9 3 5v14c0 1.1.9 2 2 2h14a2 2 0 0 0 2-2ZM8.5 12 6 15.5V18h12l-4-5.5-3 3.5-2.5-4Z" fill="currentColor"/>
                </svg>
              </button>
              <input ref={fileRef} type="file" hidden />
            </div>
          </div>

          {/* hashtag pill row */}
          <div className="mt-3 flex items-center gap-2">
            <span className="text-xl font-bold" style={{ color: GREEN }}>#</span>
            <input
              placeholder="Add hashtags, comma-separated"
              value={hash}
              onChange={(e) => setHash(e.target.value)}
              className="h-9 w-full rounded-md border px-3 text-sm"
            />
          </div>

          {/* big textarea (like in mock, the white area) */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder=""
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

      {/* ---------------- Feed cards (เหมือนรูปล่าง) ---------------- */}
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
              onClick={() => setPosts((arr) => arr.filter((x) => x.id !== p.id))}
            >
              <svg viewBox="0 0 24 24" className="h-4 w-4">
                <path d="M7 6h10l1 14H6L7 6zm3-3h4l1 2H9l1-2z" fill="currentColor" />
              </svg>
            </button>

            <div className="p-4 sm:p-5">
              {/* head */}
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
                  <div className="mt-3 text-[13px] font-medium" style={{ color: GREEN }}>
                    {p.hashtag}
                  </div>
                )}
              </div>

              {/* reactions */}
              <div className="mt-3">
                <div className="flex items-center gap-6 text-sm">
                  <button
                    className="inline-flex items-center gap-1.5 hover:opacity-80"
                    onClick={() =>
                      setPosts((arr) =>
                        arr.map((x) => (x.id === p.id ? { ...x, likes: x.likes + 1 } : x))
                      )
                    }
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" style={{ color: GREEN }}>
                      <path d="M12.1 8.64 12 8.77l-.1-.13C10.14 6.6 7.1 6.24 5.5 8.1c-1.2 1.36-1.1 3.4.23 4.66L12 19l6.27-6.24c1.33-1.27 1.43-3.3.23-4.66-1.6-1.86-4.64-1.5-6.4.54z" fill="currentColor" />
                    </svg>
                    {p.likes}
                  </button>

                  <div className="inline-flex items-center gap-1.5">
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path d="M21 6h-2v9H7l-4 4V6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z" fill="currentColor" />
                    </svg>
                    {p.comments}
                  </div>

                  <div className="inline-flex items-center gap-1.5">
                    <svg width="18" height="18" viewBox="0 0 24 24">
                      <path d="M17 10H7V7l-5 5 5 5v-3h12z" fill="currentColor" />
                    </svg>
                    {p.saved}
                  </div>
                </div>

                {/* comment input line */}
                <div className="mt-3 flex items-center gap-2">
                  <span
                    className="grid h-6 w-6 place-items-center rounded-full"
                    style={{ backgroundColor: `${GREEN}22`, color: GREEN }}
                  >
                    N
                  </span>
                  <div className="relative w-full">
                    <input
                      placeholder="Add a comment…"
                      className="w-full rounded-full border px-3 py-2 text-sm pr-10"
                      onKeyDown={(e) => {
                        if (e.key !== "Enter") return;
                        const val = (e.target as HTMLInputElement).value.trim();
                        if (!val) return;
                        setPosts((arr) =>
                          arr.map((x) =>
                            x.id === p.id
                              ? {
                                  ...x,
                                  comments: x.comments + 1,
                                  listComments: [
                                    ...x.listComments,
                                    { id: crypto.randomUUID(), user: "you", text: val, time: new Date().toLocaleString() },
                                  ],
                                }
                              : x
                          )
                        );
                        (e.target as HTMLInputElement).value = "";
                      }}
                    />
                    <button
                      className="absolute right-1 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full border text-gray-600 hover:bg-gray-50"
                      title="Send"
                    >
                      <svg viewBox="0 0 24 24" className="h-4 w-4">
                        <path d="M2 21 23 12 2 3v7l15 2-15 2v7z" fill="currentColor" />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* comments list */}
                <div className="mt-3 rounded-md border" style={{ borderColor: `${GREEN}66` }}>
                  {p.listComments.map((c) => (
                    <div key={c.id} className="flex items-start gap-3 border-b px-3 py-2 last:border-b-0">
                      <span
                        className="mt-1 grid h-6 w-6 place-items-center rounded-full text-xs font-semibold"
                        style={{ backgroundColor: `${GREEN}22`, color: GREEN }}
                      >
                        {c.user.charAt(0).toUpperCase()}
                      </span>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{c.user}</span>
                          <span className="text-[11px] text-gray-500">{c.time}</span>
                        </div>
                        <div className="text-sm text-gray-800">{c.text}</div>
                      </div>
                      <div className="ml-auto flex items-center gap-2 text-gray-500">
                        <button title="Upvote" className="hover:text-gray-700">
                          <svg viewBox="0 0 24 24" className="h-4 w-4">
                            <path d="M12 4l6 8H6l6-8zM12 20v-8" fill="currentColor" />
                          </svg>
                        </button>
                        <button title="Reply" className="hover:text-gray-700">
                          <svg viewBox="0 0 24 24" className="h-4 w-4">
                            <path d="M10 9V5L3 12l7 7v-4h8V9z" fill="currentColor" />
                          </svg>
                        </button>
                        <button title="More" className="hover:text-gray-700">
                          <svg viewBox="0 0 24 24" className="h-4 w-4">
                            <circle cx="5" cy="12" r="2" />
                            <circle cx="12" cy="12" r="2" />
                            <circle cx="19" cy="12" r="2" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </article>
        ))}
      </div>
    </main>
  );
}
