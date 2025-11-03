"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchCompanyProfileWithCommentsByUserId, postCompanyComment, editCompanyComment, deleteCompanyComment, type CompanyComment } from "@/api/companycomments";
import { getAuthMe } from "@/api/user";
import { API_BASE, buildInit } from "@/api/base";

type Props = {
  companyUserId: number;
  companyProfileId?: number | null; // if absent, we'll fetch via userId and derive
};

export default function CompanyComments({ companyUserId, companyProfileId }: Props) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<number | null>(companyProfileId ?? null);
  const [comments, setComments] = useState<CompanyComment[]>([]);
  const [text, setText] = useState("");
  const role = (user?.role || "").toLowerCase();
  const isProfessor = role.includes("professor");
  const canComment = role.includes("student") || role.includes("alumni") || isProfessor;
  const [myUserId, setMyUserId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState("");
  const [nameMap, setNameMap] = useState<Record<number, string>>({});

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await fetchCompanyProfileWithCommentsByUserId(companyUserId);
        if (cancelled) return;
        const cid = Number(data?.id || data?.company?.id || companyProfileId || 0) || null;
        setCompanyId(cid);
        const list = Array.isArray(data?.comments) ? data.comments : [];
        setComments(list);
        setError(null);
      } catch (e: any) {
        setError(e?.message || "Failed to load comments");
      } finally {
        setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [companyUserId, companyProfileId]);

  // Fetch current user's id for owner controls
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const me = await getAuthMe().catch(() => null as any);
        if (!cancelled && me && typeof me.id === 'number') {
          setMyUserId(me.id);
          const first = (me.first_name || '').toString().trim();
          const last = (me.last_name || '').toString().trim();
          const uname = (me.user_name || '').toString().trim();
          const myName = [first, last].filter(Boolean).join(' ') || uname;
          if (myName) {
            setNameMap((prev) => ({ ...prev, [me.id as number]: myName }));
          }
        }
      } catch {}
    })();
    return () => { cancelled = true; };
  }, []);

  // Resolve missing names by fetching each commenter profile (cached)
  useEffect(() => {
    let cancelled = false;
    const toFetch = new Set<number>();
    for (const c of comments) {
      const anyc: any = c as any;
      const hasName = Boolean(anyc?.user?.first_name || anyc?.first_name);
      if (!hasName && typeof c.user_id === 'number' && !nameMap[c.user_id]) {
        toFetch.add(c.user_id);
      }
    }
    if (toFetch.size === 0) return;
    (async () => {
      for (const uid of toFetch) {
        try {
          const res = await fetch(`${API_BASE}/api/user/profile/${uid}`, buildInit({ method: 'GET', credentials: 'include' }));
          const txt = await res.text();
          let json: any = {};
          try { json = JSON.parse(txt); } catch {}
          if (!res.ok) continue;
          const data = json?.data ?? json;
          const u = data?.user ?? {};
          const first = (u?.first_name ?? data?.first_name ?? "").toString().trim();
          const last = (u?.last_name ?? data?.last_name ?? "").toString().trim();
          const name = [first, last].filter(Boolean).join(' ');
          if (!cancelled && name) {
            setNameMap((prev) => ({ ...prev, [uid]: name }));
          }
        } catch {}
      }
    })();
    return () => { cancelled = true; };
  }, [comments, nameMap]);

  async function handlePost() {
    const content = (text || "").trim();
    if (!content) return;
    if (!canComment) {
      setError("Only students or professors can comment at the moment.");
      return;
    }
    if (!companyId) {
      setError("Cannot determine company profile id.");
      return;
    }
    try {
      setError(null);
      await postCompanyComment(companyId, content, isProfessor ? 'professor' : 'employee');
      setText("");
      // Refresh comments list
      const data = await fetchCompanyProfileWithCommentsByUserId(companyUserId);
      const list = Array.isArray(data?.comments) ? data.comments : [];
      setComments(list);
    } catch (e: any) {
      setError(e?.message || "Failed to post comment");
    }
  }

  async function handleEditSave(id: number) {
    const content = (editText || "").trim();
    if (!content) { setEditingId(null); return; }
    try {
      await editCompanyComment(id, content, isProfessor ? 'professor' : 'employee');
      setEditingId(null);
      setEditText("");
      const data = await fetchCompanyProfileWithCommentsByUserId(companyUserId);
      const list = Array.isArray(data?.comments) ? data.comments : [];
      setComments(list);
    } catch (e: any) {
      setError(e?.message || "Failed to edit comment");
    }
  }

  async function handleDelete(id: number) {
    try {
      const ok = typeof window !== 'undefined' ? window.confirm('Delete this comment?') : true;
      if (!ok) return;
      await deleteCompanyComment(id, isProfessor ? 'professor' : 'employee');
      const data = await fetchCompanyProfileWithCommentsByUserId(companyUserId);
      const list = Array.isArray(data?.comments) ? data.comments : [];
      setComments(list);
    } catch (e: any) {
      setError(e?.message || "Failed to delete comment");
    }
  }

  return (
    <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Comments</h2>
      {canComment && (
        <div className="mt-3 mb-4">
          <label className="block text-sm text-gray-700 mb-1">Add a comment</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Share your thoughts about this company…"
          />
          <div className="mt-2 flex justify-end">
            <button onClick={handlePost} className="rounded-full bg-emerald-700 text-white text-sm px-4 py-1.5 disabled:opacity-50" disabled={!text.trim() || loading}>Post</button>
          </div>
        </div>
      )}
      {loading ? (
        <div className="mt-2 text-sm text-gray-600">Loading comments…</div>
      ) : (
        <div className="mt-3 space-y-3">
          {comments.length === 0 ? (
            <div className="text-sm text-gray-500">No comments yet.</div>
          ) : (
            comments.map((c) => {
              const anyc: any = c as any;
              const first = (anyc?.user?.first_name ?? anyc?.first_name ?? "").toString().trim();
              const last = (anyc?.user?.last_name ?? anyc?.last_name ?? "").toString().trim();
              const uname = (anyc?.user?.user_name ?? anyc?.user_name ?? "").toString().trim();
              const name = [first, last].filter(Boolean).join(" ") || uname || (c.user_id && nameMap[c.user_id]) || (c.user_id ? `User #${c.user_id}` : "");
              const when = c.created_at ? new Date(c.created_at).toLocaleString() : "";
              const edited = c.updated_at && c.created_at && c.updated_at !== c.created_at;
              const isOwner = !!myUserId && (c.user_id === myUserId || (anyc?.user?.id && anyc.user.id === myUserId));
              return (
                <div key={c.id} className="rounded-lg border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      {name && (
                        <div className="text-sm font-semibold text-gray-900">
                          {name} {edited && <span className="text-xs font-normal text-gray-500">(Edited)</span>}
                        </div>
                      )}
                      {editingId === c.id ? (
                        <div className="mt-1">
                          <textarea
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            rows={3}
                            className="w-full rounded-md border px-3 py-2 text-sm"
                          />
                          <div className="mt-2 flex gap-2">
                            <button className="rounded-full bg-emerald-700 text-white text-xs px-3 py-1" onClick={() => handleEditSave(c.id)}>Save</button>
                            <button className="rounded-full border text-xs px-3 py-1" onClick={() => { setEditingId(null); setEditText(""); }}>Cancel</button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-0.5 text-sm text-gray-800 whitespace-pre-wrap">{c.content}</div>
                      )}
                      <div className="mt-1 text-xs text-gray-500">{when}</div>
                    </div>
                    {isOwner && editingId !== c.id && (
                      <div className="shrink-0 flex gap-2">
                        <button
                          className="text-xs text-gray-600 hover:underline"
                          onClick={() => { setEditingId(c.id); setEditText(c.content || ""); }}
                        >
                          Edit
                        </button>
                        <button
                          className="text-xs text-rose-600 hover:underline"
                          onClick={() => handleDelete(c.id)}
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      

      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
    </section>
  );
}
