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
import notify from "@/lib/toast";

const GREEN = "#5b8f5b";

type AnnouncementAuthor = {
  id?: number;
  userId?: number;
  profileUserId?: number;
  username?: string;
  firstname?: string;
  lastname?: string;
};

type JobMeta = {
  id?: number;
  title?: string;
  is_connection?: boolean;
};

type Announcement = {
  id: number;
  author?: AnnouncementAuthor;
  content: string;
  created_at: string;
  jobMeta?: JobMeta;
  raw?: any;
};

const asNumber = (value: unknown): number | undefined => {
  if (typeof value === "number") return Number.isFinite(value) ? value : undefined;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
};

const asString = (value: unknown): string | undefined => {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : undefined;
};

const asBoolean = (value: unknown): boolean | undefined => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") {
    if (!Number.isFinite(value)) return undefined;
    if (value === 1) return true;
    if (value === 0) return false;
  }
  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();
    if (["true", "1", "yes", "y", "connected", "has_connection"].includes(normalized)) return true;
    if (["false", "0", "no", "n", "none", "not_connected", "no_connection"].includes(normalized))
      return false;
  }
  return undefined;
};

const pickString = (...values: unknown[]): string | undefined => {
  for (const value of values) {
    const str = asString(value);
    if (str) return str;
  }
  return undefined;
};

function deriveJobMeta(payload: any): JobMeta {
  if (!payload || typeof payload !== "object") return {};
  const data = payload.data && typeof payload.data === "object" ? payload.data : payload;
  const jobSources = [
    data.job_post,
    data.job_posting,
    data.jobPosting,
    data.job,
    data.target,
    data.target_job,
    data.repost_of,
    data.reference,
    data.jobPosting,
    data.job_detail,
    data.job_posting_detail,
  ].filter(Boolean);
  const job = jobSources[0];

  const id =
    asNumber(data.job_posting_id) ??
    asNumber(data.job_post_id) ??
    asNumber(data.job_id) ??
    asNumber(data.jobId) ??
    asNumber(job?.job_posting_id) ??
    asNumber(job?.job_post_id) ??
    asNumber(job?.job_id) ??
    asNumber(job?.id);

  const title =
    pickString(
      data.job_title,
      data.title,
      data.position,
      job?.job_title,
      job?.title,
      job?.position,
    ) || undefined;

  const is_connection =
    asBoolean(data.is_connection) ??
    asBoolean(data.connection) ??
    asBoolean(data.has_connection) ??
    asBoolean((data as any).hasConnection) ??
    asBoolean((data as any).isConnection) ??
    asBoolean(data.connection_status) ??
    asBoolean(job?.is_connection) ??
    asBoolean(job?.has_connection);

  return { id, title, is_connection };
}

function formatAuthor(a?: Announcement["author"]) {
  const first = a?.firstname?.trim();
  const last = a?.lastname?.trim();
  const username = a?.username?.trim();
  const full = [first, last].filter(Boolean).join(" ").trim();
  const displayName = full || username || "Professor";
  const initial = (first?.[0] || last?.[0] || username?.[0] || "P").toUpperCase();
  const profileUserId = a?.userId;
  return { displayName, initial, profileUserId };
}

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

        const list = Array.isArray(data)
          ? data
          : (data?.results || data?.data || []);

        const normalized: Announcement[] = (Array.isArray(list) ? list : []).map(toAnnouncement);
        setAnnouncements(normalized);

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

  function toAnnouncement(raw: any): Announcement {
    const authorNode = raw?.author ?? raw?.professor ?? raw?.user ?? {};
    const userNode =
      raw?.author?.user ??
      raw?.professor?.user ??
      raw?.user ??
      raw?.author?.profile ??
      raw?.profile ??
      authorNode;

    const first =
      pickString(
        userNode?.first_name,
        userNode?.firstname,
        authorNode?.first_name,
        authorNode?.firstname,
        raw?.first_name,
        raw?.firstname,
      ) || undefined;
    const last =
      pickString(
        userNode?.last_name,
        userNode?.lastname,
        authorNode?.last_name,
        authorNode?.lastname,
        raw?.last_name,
        raw?.lastname,
      ) || undefined;
    const username =
      pickString(
        userNode?.user_name,
        userNode?.username,
        authorNode?.user_name,
        authorNode?.username,
        raw?.user_name,
        raw?.username,
      ) || undefined;

    const authorId =
      asNumber(authorNode?.id) ??
      asNumber(authorNode?.user_id) ??
      asNumber(raw?.author_id) ??
      asNumber(raw?.professor_id) ??
      asNumber(raw?.user_id) ??
      asNumber(raw?.professor?.id) ??
      asNumber(raw?.professor?.user_id);

    const userIdCandidates: unknown[] = [
      raw?.author?.user_id,
      raw?.author?.user?.user_id,
      raw?.author?.user?.id,
      raw?.author?.user_id,
      raw?.professor?.user_id,
      raw?.professor?.user?.user_id,
      raw?.professor?.user?.id,
      raw?.user?.user_id,
      raw?.user?.id,
      raw?.user_id,
      userNode?.user_id,
      userNode?.id,
    ];

    const resolvedUserId =
      userIdCandidates
        .map((value) => asNumber(value))
        .find((value): value is number => typeof value === "number");

    const profileIdCandidates: unknown[] = [
      resolvedUserId,
      raw?.author?.profile_user_id,
      raw?.author?.profile?.id,
      raw?.profile?.id,
      raw?.profile_user_id,
      userNode?.profile?.id,
      authorId,
    ];

    const profileUserId =
      profileIdCandidates
        .map((value) => asNumber(value))
        .find((value): value is number => typeof value === "number") ?? resolvedUserId ?? authorId;

    const announcementUserId = resolvedUserId ?? authorId;

    const jobMeta = deriveJobMeta(raw);

    return {
      id: Number(raw?.id ?? 0),
      content: String(raw?.content ?? raw?.text ?? raw?.body ?? ""),
      created_at: String(raw?.created_at ?? raw?.createdAt ?? new Date().toISOString()),
      author: {
        id: authorId,
        userId: announcementUserId,
        profileUserId,
        username,
        firstname: first,
        lastname: last,
      },
      jobMeta,
      raw,
    };
  }

  // Resolve repost details for announcements (best-effort)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!Array.isArray(announcements) || announcements.length === 0) return;
      const seeded: Record<number, any> = {};
      const initialTitles: Record<number, string> = {};
      for (const a of announcements) {
        const meta = a.jobMeta ?? (a.raw ? extractMetaFromAnnouncement(a.raw) : undefined);
        if (meta?.id) {
          seeded[a.id] = {
            job_posting_id: meta.id,
            job_title: meta.title,
            is_connection: meta.is_connection,
          };
          if (meta.title && !(meta.id in jobTitleCache)) {
            initialTitles[meta.id] = meta.title;
          }
        }
      }
      if (!cancelled) {
        setReposts(seeded);
        const titleEntries = Object.entries(initialTitles);
        if (titleEntries.length > 0) {
          setJobTitleCache((prev) => {
            const next = { ...prev };
            let changed = false;
            for (const [idStr, title] of titleEntries) {
              const id = Number(idStr);
              if (title && !next[id]) {
                next[id] = title;
                changed = true;
              }
            }
            return changed ? next : prev;
          });
        }
      }
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
          if (r.detail) merged[r.id] = r.detail?.data ?? r.detail;
        }
        setReposts(merged);

        const mergedTitleEntries: Record<number, string> = {};
        for (const value of Object.values(merged)) {
          const meta = extractRepostMeta(value);
          if (meta.id && meta.title && !jobTitleCache[meta.id]) {
            mergedTitleEntries[meta.id] = meta.title;
          }
        }
        const mergedTitleIds = Object.keys(mergedTitleEntries);
        if (mergedTitleIds.length > 0) {
          setJobTitleCache((prev) => {
            const next = { ...prev };
            let changed = false;
            for (const key of mergedTitleIds) {
              const id = Number(key);
              const title = mergedTitleEntries[id];
              if (title && !next[id]) {
                next[id] = title;
                changed = true;
              }
            }
            return changed ? next : prev;
          });
        }

        // Fetch missing job titles
        const toFetch = Array.from(
          new Set(
            Object.values(merged)
              .map((value) => extractRepostMeta(value))
              .filter((meta): meta is { id: number; title?: string } => typeof meta.id === "number")
              .filter((meta) => !meta.title && !jobTitleCache[meta.id])
              .map((meta) => meta.id as number),
          ),
        );
        if (toFetch.length > 0) {
          const pairs = await Promise.all(
            toFetch.map(async (jid) => {
              try {
                const title = await fetchJobTitle(jid);
                return [jid, title] as const;
              } catch {
                return [jid, ""] as const;
              }
            }),
          );
          if (!cancelled && pairs.length > 0) {
            setJobTitleCache((prev) => {
              const next = { ...prev } as Record<number, string>;
              let changed = false;
              for (const [jid, t] of pairs) {
                if (t && next[jid] !== t) {
                  next[jid] = t;
                  changed = true;
                }
              }
              return changed ? next : prev;
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

  function extractRepostMeta(node: any): JobMeta {
    if (!node || typeof node !== "object") return {};
    const x = node.data && typeof node.data === "object" ? node.data : node;
    return deriveJobMeta(x);
  }

  function extractMetaFromAnnouncement(node: any): JobMeta {
    if (!node || typeof node !== "object") return {};
    return deriveJobMeta(node);
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
        const createdRaw = newPost.id !== undefined ? newPost : newPost.data || newPost.results?.[0];
        const created = toAnnouncement(createdRaw);
        setAnnouncements((prev) => [created, ...prev]);
      }

      setContent("");
      setComposerIsConnection(false);
      setErrorMessage(null);
      notify.success("Announcement posted");
    } catch (err: any) {
      console.error("⚠️ Failed to create announcement:", err);
      const errStr = String(err);

      if (errStr.includes("Profile not found"))
        setErrorMessage("Cannot post yet — your Professor profile hasn’t been created.");
      else if (errStr.includes("401"))
        setErrorMessage("Unauthorized. Please login again.");
      else setErrorMessage("Failed to create announcement. Try again.");
      notify.error("Failed to create announcement");
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
      const createdRaw = (res && (res.data || res.results?.[0] || res)) || null;
      if (createdRaw && createdRaw.id !== undefined) {
        const normalized = toAnnouncement(createdRaw);
        setAnnouncements((prev) => [normalized, ...prev]);
        // Seed repost meta so link + connection badge appear immediately
        if (normalized.jobMeta?.id) {
          const jobId = normalized.jobMeta.id;
          const jobTitle = normalized.jobMeta.title;
          setReposts((prev) => ({
            ...prev,
            [normalized.id]: {
              job_posting_id: jobId,
              job_title: jobTitle,
              is_connection: normalized.jobMeta.is_connection ?? repostIsConnection,
            },
          }));
          if (jobTitle) {
            setJobTitleCache((prev) => (prev[jobId] ? prev : { ...prev, [jobId]: jobTitle }));
          }
        } else {
          setReposts((prev) => ({
            ...prev,
            [normalized.id]: {
              job_posting_id: repostParsedId,
              job_title: undefined,
              is_connection: repostIsConnection,
            },
          }));
        }
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
      notify.success("Announcement deleted");
    } catch (err) {
      console.error("❌ Failed to delete:", err);
      setErrorMessage("Failed to delete announcement. Try again.");
      notify.error("Failed to delete announcement");
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
          announcements.map((a) => {
            const author = formatAuthor(a.author);
            const profileHref = author.profileUserId ? `/profile/${author.profileUserId}` : null;

            return (
              <article
                key={a.id}
                className="rounded-2xl border bg-white shadow-sm p-5 relative"
                style={{ borderColor: GREEN }}
              >
              {/* Delete button (only visible to the author) */}
              {isProfessor && user?.id && a.author?.userId === user.id && (
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
                  {author.initial}
                </div>
                <div>
                  <div className="font-semibold text-sm text-gray-800">
                    {profileHref ? (
                      <Link
                        href={profileHref}
                        className="text-emerald-700 hover:underline focus-visible:underline"
                      >
                        {author.displayName}
                      </Link>
                    ) : (
                      author.displayName
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(a.created_at).toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Repost target (if any): title link on top */}
              {(() => {
                const fromMap = extractRepostMeta(reposts[a.id]);
                const fromPost = a.jobMeta ?? (a.raw ? extractMetaFromAnnouncement(a.raw) : undefined);
                const info = fromMap.id ? fromMap : fromPost;
                if (!info?.id) return null;
                const cachedTitle = info.title || (info.id ? jobTitleCache[info.id] : "");
                const label = cachedTitle || `Job #${info.id}`;
                const connectionRaw = info.is_connection ?? fromPost?.is_connection;
                const connectionValue =
                  typeof connectionRaw === "boolean" ? connectionRaw : asBoolean(connectionRaw);

                return (
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <Link
                      className="text-emerald-700 font-medium hover:underline"
                      href={`/job/${info.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {label}
                    </Link>
                    {!cachedTitle && (
                      <span className="text-xs text-gray-500">Loading title…</span>
                    )}
                    {connectionValue !== undefined && (
                      connectionValue ? (
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
            );
          })
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
