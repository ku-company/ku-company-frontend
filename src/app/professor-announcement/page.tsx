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

  useEffect(() => {
    (async () => {
      try {
        const data = await fetchProfessorAnnouncements();
        if (Array.isArray(data)) setAnnouncements(data);
        else if (data?.results) setAnnouncements(data.results);
        else setAnnouncements([]);
      } catch (err) {
        console.error("❌ Failed to load announcements:", err);
      }
    })();
  }, []);

  const canPost = useMemo(() => content.trim().length > 0, [content]);

  const handlePost = async () => {
    if (!canPost) return;
    try {
      const newPost = await createProfessorAnnouncement({
        content,
        is_connection: false,
      });
      if (newPost && newPost.id) {
        setAnnouncements((prev) => [newPost, ...prev]);
      }
      setContent("");
    } catch (err) {
      console.error("❌ Failed to create announcement:", err);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await deleteProfessorAnnouncement(id);
      setAnnouncements((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      console.error("❌ Failed to delete:", err);
    }
  };

  return (
    <main className="mt-24 mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-6">
      <h1 className="text-2xl font-extrabold tracking-tight text-gray-800">
        ANNOUNCEMENT
      </h1>
      <div className="mt-6 border-t" />

      <section
        className="mt-6 rounded-2xl border bg-white shadow-sm p-4"
        style={{ borderColor: GREEN }}
      >
        <textarea
          placeholder="Write your announcement..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="w-full h-40 resize-y border rounded-md p-3 text-sm focus:outline-none"
        />
        <div className="mt-3 flex justify-end">
          <button
            disabled={!canPost}
            onClick={handlePost}
            className="rounded-full px-5 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
            style={{ backgroundColor: GREEN }}
          >
            Post
          </button>
        </div>
      </section>

      <div className="mt-6 space-y-5">
        {announcements.length === 0 ? (
          <p className="text-gray-500 text-sm text-center mt-10">
            No announcements yet.
          </p>
        ) : (
          announcements.map((a) => (
            <article
              key={a.id}
              className="relative rounded-2xl border bg-white shadow-sm p-5"
              style={{ borderColor: GREEN }}
            >
              <button
                onClick={() => handleDelete(a.id)}
                className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-lg border bg-white text-gray-600 hover:bg-gray-50"
                title="Delete"
              >
                ✕
              </button>

              <div className="text-sm font-semibold text-gray-800">
                {a.author?.username || "Professor"}
              </div>
              <div className="mt-1 text-xs text-gray-500">
                {new Date(a.created_at).toLocaleString()}
              </div>
              <p className="mt-3 text-gray-700 text-sm leading-6 whitespace-pre-line">
                {a.content}
              </p>
            </article>
          ))
        )}
      </div>
    </main>
  );
}
