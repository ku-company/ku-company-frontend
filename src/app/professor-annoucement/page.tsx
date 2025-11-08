"use client";

import { useEffect, useMemo, useState } from "react";
import { MegaphoneIcon, CheckBadgeIcon, XMarkIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { API_BASE, buildInit } from "@/api/base";
import { getRepostById, repostJobPosting } from "@/api/professorrepost";
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
  const { user } = useAuth();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [content, setContent] = useState("");
  const [composerIsConnection, setComposerIsConnection] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showQuote, setShowQuote] = useState(false);
  const [quoteLink, setQuoteLink] = useState("");
  const [reposts, setReposts] = useState<Record<number, any>>({}); // announcementId -> repost detail

  // Repost modal state
  const [showRepostModal, setShowRepostModal] = useState(false);
  const [repostInput, setRepostInput] = useState(""); // URL or ID
  const [repostParsedId, setRepostParsedId] = useState<number | null>(null);
  const [repostIsConnection, setRepostIsConnection] = useState(false);
  const [repostContent, setRepostContent] = useState("");
  const [repostPosting, setRepostPosting] = useState(false);
  const [repostErr, setRepostErr] = useState<string | null>(null);
  const [jobTitleCache, setJobTitleCache] = useState<Record<number, string>>({});
  const [repostTitle, setRepostTitle] = useState<string>("");

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
        const errStr = String(err || "");

        if (errStr.includes("verify your account") || errStr.includes("Please verify your account")) {
          setErrorMessage("Please verify your account to view announcements.");
        } else if (errStr.includes("401")) {
          setErrorMessage("Unauthorized — please log in again.");
        } else if (errStr.includes("403")) {
          setErrorMessage("Access denied. You are not allowed to view announcements.");
        } else if (errStr.includes("Failed to fetch")) {
          setErrorMessage("Cannot connect to the server. Please check your network.");
        } else {
          setErrorMessage("Failed to load announcements. Please try again later.");
        }

        setAnnouncements([]);
      }
    })();
  }, []);

  // Resolve repost details for announcements (best-effort)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!Array.isArray(announcements) || announcements.length === 0) return;
      const seeded: Record<number, any> = {};
      for (const a of announcements) {
        const meta = extractMetaFromAnnouncement(a);
        if (meta.id) seeded[a.id] = { job_posting_id: meta.id, job_title: meta.title, is_connection: meta.is_connection };
      }
      if (!cancelled) setReposts(seeded);
      const promises = announcements.map(async (a) => {
        try {
          const detail = await getRepostById(a.id).catch(() => null);
          return { id: a.id, detail } as const;
        } catch {
          return { id: a.id, detail: null } as const;
        }
      });
      const results = await Promise.all(promises);
      if (!cancelled) {
        const merged = { ...seeded } as Record<number, any>;
        for (const r of results) {
          if (r.detail) merged[r.id] = r.detail;
        }
        setReposts(merged);

        // Fetch missing job titles
        const toFetch: number[] = [];
        for (const v of Object.values(merged)) {
          const meta = extractRepostMeta(v);
          if (meta.id && !meta.title && !(meta.id in jobTitleCache)) toFetch.push(meta.id);
        }
        if (toFetch.length > 0) {
          const pairs = await Promise.all(
            toFetch.map(async (jid) => {
              try {
                const title = await fetchJobTitle(jid);
                return [jid, title] as const;
              } catch {
                return [jid, ""] as const;
              }
            })
          );
          if (!cancelled) {
            setJobTitleCache((prev) => {
              const next = { ...prev } as Record<number, string>;
              for (const [jid, t] of pairs) {
                if (t) next[jid] = t;
              }
              return next;
            });
          }
        }
      }
    })();
    return () => { cancelled = true; };
  }, [announcements]);

  async function fetchJobTitle(id: number): Promise<string> {
    const res = await fetch(`${API_BASE}/api/job-postings/${id}`, buildInit({ method: "GET" }));
    const text = await res.text();
    if (!res.ok) throw new Error(text || `Failed to fetch job ${id}`);
    let json: any = {};
    try { json = JSON.parse(text); } catch {}
    const obj = json?.job_posting || json?.data || json;
    return obj?.job_title || obj?.position || obj?.title || "";
  }

  // When modal has a parsed id, fetch its title for display
  useEffect(() => {
    let alive = true;
    (async () => {
      if (!repostParsedId) { setRepostTitle(""); return; }
      const cached = jobTitleCache[repostParsedId];
      if (cached) { setRepostTitle(cached); return; }
      try {
        const t = await fetchJobTitle(repostParsedId);
        if (!alive) return;
        setRepostTitle(t);
        if (t) setJobTitleCache((p) => ({ ...p, [repostParsedId]: t }));
      } catch { if (alive) setRepostTitle(""); }
    })();
    return () => { alive = false; };
  }, [repostParsedId]);

  function extractRepostMeta(x: any): { id?: number; title?: string; is_connection?: boolean } {
    if (!x || typeof x !== 'object') return {};
    const id = x.job_posting_id || x.job_post_id || x.jobId || x.job_id || x.job?.id || x.job_posting?.id || x.jobPostingId;
    const title = x.job_title || x.title || x.position || x.job?.job_title || x.job?.title || x.job?.position || x.job_posting?.job_title || x.job_posting?.position;
    const isConn = x.is_connection === true || x.connection === true || x.has_connection === true;
    return { id: typeof id === 'number' ? id : undefined, title: typeof title === 'string' ? title : undefined, is_connection: isConn };
  }

  // Attempt to extract repost metadata directly from the announcement object
  function extractMetaFromAnnouncement(a: any): { id?: number; title?: string; is_connection?: boolean } {
    if (!a || typeof a !== 'object') return {};
    const id = a.job_posting_id || a.job_post_id || a.job_id || a.jobId || a.job?.id || a.target?.id || a.repost_of?.id;
    const title = a.job_title || a.title || a.position || a.job?.job_title || a.job?.position || a.target?.job_title || a.repost_of?.job_title;
    const isConn = a.is_connection === true || a.connection === true || a.has_connection === true;
    return { id: typeof id === 'number' ? id : undefined, title: typeof title === 'string' ? title : undefined, is_connection: isConn };
  }

  const isProfessor = (user?.role || "").toLowerCase().includes("professor");
  const canPost = useMemo(() => isProfessor && content.trim().length > 0, [isProfessor, content]);

  /* ---------------- Create new announcement ---------------- */
  const handlePost = async () => {
    if (!canPost) return;
    try {
      const newPost = await createProfessorAnnouncement({
        content,
        is_connection: composerIsConnection,
      });

      if (newPost && (newPost.id || newPost?.data?.id)) {
        const created = newPost.id !== undefined ? newPost : newPost.data || newPost.results?.[0];
        setAnnouncements((prev) => [created, ...prev]);
      }

      setContent("");
      setComposerIsConnection(false);
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

  const insertQuoteLink = () => {
    const link = (quoteLink || "").trim();
    if (!link) return;
    const prefix = content.trim().length > 0 ? "\n\n" : "";
    setContent((prev) => `${prev}${prefix}📣 Job Posting: ${link}`);
    setShowQuote(false);
    setQuoteLink("");
  };

  function extractJobIdFromInput(s: string): number | null {
    const t = (s || "").trim();
    if (!t) return null;
    // Allow raw numeric id
    const num = Number(t);
    if (!Number.isNaN(num) && Number.isFinite(num)) return Math.abs(Math.trunc(num));
    // Try to pull from URL paths like /job/123 or /api/job-postings/123
    const m = t.match(/(?:\/job\/|job-postings\/)\s*(\d+)/i);
    if (m && m[1]) return parseInt(m[1], 10);
    return null;
  }

  function openRepostModal() {
    setShowRepostModal(true);
    setRepostInput("");
    setRepostParsedId(null);
    setRepostIsConnection(false);
    setRepostContent("");
    setRepostErr(null);
  }

  useEffect(() => {
    setRepostParsedId(extractJobIdFromInput(repostInput));
  }, [repostInput]);

  async function handleSubmitRepost() {
    if (!repostParsedId) { setRepostErr("Please provide a valid job id or link"); return; }
    setRepostPosting(true);
    setRepostErr(null);
    try {
      const res = await repostJobPosting(repostParsedId, {
        content: repostContent.trim(),
        is_connection: repostIsConnection,
      });
      // Prepend newly created repost to feed if id present
      const created = (res && (res.data || res.results?.[0] || res)) || null;
      if (created && (created.id !== undefined)) {
        setAnnouncements((prev) => [created, ...prev]);
        // Seed repost meta so link + connection badge appear immediately
        setReposts((prev) => ({
          ...prev,
          [created.id]: { job_posting_id: repostParsedId, is_connection: repostIsConnection },
        }));
      }
      setShowRepostModal(false);
      setRepostInput("");
      setRepostParsedId(null);
      setRepostContent("");
      setRepostIsConnection(false);
    } catch (e: any) {
      setRepostErr(String(e?.message || e || "Failed to repost"));
    } finally {
      setRepostPosting(false);
    }
  }

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

      {/* Composer (professors only) */}
      {isProfessor && (
        <section
          className="mt-6 rounded-xl border bg-white shadow-sm p-4 space-y-3"
          style={{ borderColor: GREEN }}
        >
          <textarea
            placeholder="Share an announcement…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full h-24 resize-none border rounded-md p-3 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />

          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={composerIsConnection}
              onChange={(e) => setComposerIsConnection(e.target.checked)}
            />
            I have a connection with this announcement
          </label>

          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={openRepostModal}
                className="inline-flex items-center gap-1 rounded-md border px-2.5 py-1 text-sm text-emerald-700 hover:bg-emerald-50"
                title="Repost a job posting"
              >
                <MegaphoneIcon className="h-4 w-4" />
                Repost Job
              </button>
            </div>
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
      )}

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
              {/* Delete button (professors only) */}
              {isProfessor && (
                <button
                  onClick={() => handleDelete(a.id)}
                  className="absolute right-3 top-3 grid h-7 w-7 place-items-center rounded-md border bg-white text-gray-600 hover:bg-gray-100"
                  title="Delete"
                >
                  ✕
                </button>
              )}

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

              {/* Repost target (if any): title link on top */}
              {(() => {
                const fromMap = extractRepostMeta(reposts[a.id]);
                const fromPost = extractMetaFromAnnouncement(a);
                const info = fromMap.id ? fromMap : fromPost;
                if (!info.id) return null;
                const label = info.title || jobTitleCache[info.id] || "";
                if (!label) return (
                  <div className="mb-1">
                    <span className="text-gray-500 text-sm">Loading job…</span>
                  </div>
                );
                return (
                  <div className="mb-1 flex items-center gap-2">
                    <Link className="text-emerald-700 font-medium hover:underline" href={`/job/${info.id}`} target="_blank" rel="noopener noreferrer">
                      {label}
                    </Link>
                    {(info.is_connection ?? fromPost.is_connection) !== undefined && (
                      info.is_connection ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 text-xs">
                          <CheckBadgeIcon className="h-4 w-4" /> Has connection
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-gray-500 text-xs">
                          <XMarkIcon className="h-4 w-4" /> No connection
                        </span>
                      )
                    )}
                  </div>
                );
              })()}

              {/* Content */}
              <p className="mt-2 text-gray-700 text-sm leading-6 whitespace-pre-line">
                {a.content}
              </p>

              {/* Reactions/comments removed per request */}
            </article>
          ))
        )}
      </div>
      {/* Repost Modal */}
      {showRepostModal && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4" onClick={() => !repostPosting && setShowRepostModal(false)}>
          <div className="w-full max-w-lg rounded-xl border bg-white p-4 shadow-lg" style={{ borderColor: GREEN }} onClick={(e) => e.stopPropagation()}>
            <div className="font-semibold flex items-center gap-2">
              <MegaphoneIcon className="h-5 w-5 text-emerald-700" />
              Repost a job
            </div>
            <div className="mt-3 text-sm">Paste a job link or enter an ID:</div>
            <input
              className="mt-2 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="/job/123 or 123"
              value={repostInput}
              onChange={(e) => setRepostInput(e.target.value)}
            />
            {repostParsedId && (
              <div className="mt-2 text-sm">
                {repostTitle ? (
                  <a className="text-emerald-700 font-medium hover:underline" href={`/job/${repostParsedId}`} target="_blank" rel="noopener noreferrer">
                    {repostTitle}
                  </a>
                ) : (
                  <span className="text-gray-500">Loading job…</span>
                )}
              </div>
            )}
            <textarea
              className="mt-3 w-full h-28 resize-none border rounded-md p-2 text-sm focus:outline-none focus:ring-1 focus:ring-emerald-500"
              placeholder="Add a note (optional)"
              value={repostContent}
              onChange={(e) => setRepostContent(e.target.value)}
            />
            <label className="mt-3 flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" checked={repostIsConnection} onChange={(e) => setRepostIsConnection(e.target.checked)} />
              I have a connection with this job post
            </label>
            {repostErr && (
              <div className="mt-2 text-red-600 text-sm">{repostErr}</div>
            )}
            <div className="mt-3 flex justify-end gap-2">
              <button className="rounded-md border px-3 py-1.5 text-sm hover:bg-gray-50" onClick={() => setShowRepostModal(false)} disabled={repostPosting}>
                Cancel
              </button>
              <button
                className="rounded-md px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
                style={{ backgroundColor: GREEN }}
                onClick={handleSubmitRepost}
                disabled={repostPosting || !repostParsedId}
              >
                {repostPosting ? "Reposting…" : "Repost"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
