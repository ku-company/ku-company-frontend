"use client";

import { useEffect, useMemo, useState } from "react";
import {
  fetchProfessorAnnouncements,
  createProfessorAnnouncement,
  deleteProfessorAnnouncement,
} from "@/api/professorannouncement";

const GREEN = "#5b8f5b";

type Announcement = {
  id: number;
  author?: { id: number; username: string };
  content: string;
  created_at: string;
};

export default function ProfessorAnnouncementPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [content, setContent] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  /* ---------------- Fetch announcements ---------------- */
  useEffect(() => {
    (async () => {
      try {
        const data = await fetchProfessorAnnouncements();

        if (Array.isArray(data)) setAnnouncements(data);
        else if (data?.results) setAnnouncements(data.results);
        else if (data?.data) setAnnouncements(data.data);
        else setAnnouncements([]);

        setErrorMessage(null);
      } catch (err: any) {
        console.error("⚠️ Announcement fetch failed:", err);
        const errStr = String(err);

        if (errStr.includes("Profile not found"))
          setErrorMessage("Your Professor profile has not been created yet. Please contact admin.");
        else if (errStr.includes("401"))
          setErrorMessage("Unauthorized — please log in again.");
        else if (errStr.includes("403"))
          setErrorMessage("Access denied. You are not allowed to view announcements.");
        else if (errStr.includes("Failed to fetch"))
          setErrorMessage("Cannot connect to the server. Please check your network.");
        else setErrorMessage("Failed to load announcements. Please try again later.");

        setAnnouncements([]);
      }
    })();
  }, []);

  const canPost = useMemo(() => content.trim().length > 0, [content]);

  /* ---------------- Create new announcement ---------------- */
  const handlePost = async () => {
    if (!canPost) return;
    try {
      const newPost = await createProfessorAnnouncement({
        content,
        is_connection: false,
      });

      if (newPost && (newPost.id || newPost?.data?.id)) {
        const created = newPost.id !== undefined ? newPost : newPost.data || newPost.results?.[0];
        setAnnouncements((prev) => [created, ...prev]);
      }

      setContent("");
      setErrorMessage(null);
    } catch (err: any) {
      console.error("⚠️ Failed to create announcement:", err);
      const errStr = String(err);

      if (errStr.includes("Profile not found"))
        setErrorMessage("Cannot post yet — your Professor profile hasn’t been created.");
      else if (errStr.includes("401"))
        setErrorMessage("Unauthorized. Please login again.");
      else setErrorMessage("Failed to create announcement. Try again.");
    }
  };

  /* ---------------- Delete announcement ---------------- */
  const handleDelete = async (id: number) => {
    try {
      await deleteProfessorAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      setErrorMessage(null);
    } catch (err) {
      console.error("❌ Failed to delete:", err);
      setErrorMessage("Failed to delete announcement. Try again.");
    }
  };

  return (
    <main className="mt-24 mx-auto max-w-2xl px-4 py-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-gray-800 text-center">
        Professor Announcements
      </h1>

      {errorMessage && (
        <div className="mt-4 rounded-lg bg-red-100 border border-red-300 text-red-700 p-3 text-sm text-center">
          {errorMessage}
        </div>
      )}

      {/* Composer */}
      <section
        className="mt-6 rounded-xl border bg-white shadow-sm p-4 space-y-3"
        style={{ borderColor: GREEN }}
      >
        <textarea
          placeholder="What is happening?!"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-24 resize-none border rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />

        <div className="flex justify-end">
          <button
            disabled={!canPost}
            onClick={handlePost}
            className="rounded-md px-5 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: GREEN }}
          >
            Post
          </button>
        </div>
      </section>

      {/* Feed */}
      <div className="mt-8 space-y-6">
        {announcements.length === 0 ? (
          <p className="text-gray-500 text-sm text-center mt-10">
            No announcements yet.
          </p>
        ) : (
          announcements.map((a) => (
            <article
              key={a.id}
              className="rounded-2xl border bg-white shadow-sm p-5 relative"
              style={{ borderColor: GREEN }}
            >
              {/* Delete button */}
              <button
                onClick={() => handleDelete(a.id)}
                className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-md border bg-white text-gray-600 hover:bg-gray-100"
                title="Delete"
              >
                ✕
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-2">
                <div className="h-8 w-8 rounded-full bg-emerald-700 text-white grid place-items-center font-semibold">
                  {(a.author?.username?.[0] || "P").toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-sm text-gray-800">
                    {a.author?.username || "Professor"}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(a.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Content */}
              <p className="mt-2 text-gray-700 text-sm leading-6 whitespace-pre-line">
                {a.content}
              </p>

              {/* Reaction Bar */}
              <div className="mt-4 flex items-center gap-6 text-sm text-gray-600">
                <span className="flex items-center gap-1 cursor-pointer">
                  💚 <span>41</span>
                </span>
                <span className="flex items-center gap-1 cursor-pointer">
                  💬 <span>3</span>
                </span>
                <span className="flex items-center gap-1 cursor-pointer">
                  🔄 <span>52</span>
                </span>
              </div>

              {/* Comments */}
              <div className="mt-3 border-t pt-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className="h-6 w-6 rounded-full bg-gray-200" />
                  <input
                    placeholder="Add a comment..."
                    className="flex-1 border rounded-full px-3 py-1 text-sm focus:outline-none"
                  />
                </div>

                {/* Example mock comments */}
                <div className="space-y-2 text-sm text-gray-800 mt-2">
                  <div>
                    <b>Jetaime_op</b>{" "}
                    <span className="text-gray-500 text-xs">· Dec 23, 2023</span>
                    <div>Amazing</div>
                  </div>
                  <div>
                    <b>milliebobbybrown</b>{" "}
                    <span className="text-gray-500 text-xs">· Jan 02, 2024</span>
                    <div>Interesting</div>
                  </div>
                  <div>
                    <b>junior.np</b>{" "}
                    <span className="text-gray-500 text-xs">· Jan 15, 2024</span>
                    <div>good</div>
                  </div>
                </div>
              </div>
            </article>
          ))
        )}
      </div>
    </main>
  );
}
