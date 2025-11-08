"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { fetchCompanyProfileWithCommentsByUserId, postCompanyComment, type CompanyComment } from "@/api/companycomments";

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

  async function handlePost() {
    const content = (text || "").trim();
    if (!content) return;
    if (!isProfessor) {
      setError("Only professors can comment at the moment.");
      return;
    }
    if (!companyId) {
      setError("Cannot determine company profile id.");
      return;
    }
    try {
      setError(null);
      await postCompanyComment(companyId, content);
      setText("");
      // Refresh comments list
      const data = await fetchCompanyProfileWithCommentsByUserId(companyUserId);
      const list = Array.isArray(data?.comments) ? data.comments : [];
      setComments(list);
    } catch (e: any) {
      setError(e?.message || "Failed to post comment");
    }
  }

  return (
    <section className="mt-6 rounded-2xl border bg-white p-6 shadow-sm">
      <h2 className="text-lg font-semibold">Comments</h2>
      {loading ? (
        <div className="mt-2 text-sm text-gray-600">Loading comments…</div>
      ) : (
        <div className="mt-3 space-y-3">
          {comments.length === 0 ? (
            <div className="text-sm text-gray-500">No comments yet.</div>
          ) : (
            comments.map((c) => (
              <div key={c.id} className="rounded-lg border p-3">
                <div className="text-sm text-gray-800 whitespace-pre-wrap">{c.content}</div>
                <div className="mt-1 text-xs text-gray-500">{c.created_at ? new Date(c.created_at).toLocaleString() : ""}</div>
              </div>
            ))
          )}
        </div>
      )}

      {isProfessor && (
        <div className="mt-4">
          <label className="block text-sm text-gray-700 mb-1">Add a comment</label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="w-full rounded-md border px-3 py-2 text-sm"
            placeholder="Share your thoughts about this company…"
          />
          <div className="mt-2 flex justify-end">
            <button
              onClick={handlePost}
              className="rounded-full bg-emerald-700 text-white text-sm px-4 py-1.5 disabled:opacity-50"
              disabled={!text.trim() || loading}
            >
              Post
            </button>
          </div>
        </div>
      )}

      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
    </section>
  );
}
