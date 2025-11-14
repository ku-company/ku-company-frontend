import { NextRequest, NextResponse } from "next/server";
import { API_BASE } from "@/api/base";

type NotificationPayload = {
  id: string;
  type: "application" | "announcement";
  title: string;
  body: string;
  status?: string;
  timestamp: string;
  version: string;
};

const APPLICATIONS_ENDPOINT = `${API_BASE}/api/employee/my-applications`;
const ANNOUNCEMENTS_ENDPOINT = `${API_BASE}/api/announcements`;

function toStatus(app: any): string {
  const emp = (app?.employee_send_status ?? "").toString().toLowerCase();
  const comp = (app?.company_send_status ?? "").toString().toLowerCase();
  if (emp === "confirmed") return "Confirmed";
  if (emp === "rejected") return "Declined";
  if (comp === "approved" || comp === "confirmed") return "Approved";
  return "Pending";
}

function normalizeApplications(applications: any[]): NotificationPayload[] {
  return applications
    .filter((app) => app && typeof app === "object")
    .map((app) => {
      const id = Number(app?.id ?? 0);
      const position =
        app?.job_post?.position ??
        app?.job_post?.job_title ??
        app?.position ??
        "Position";
      const companyName =
        app?.job_post?.company?.company_name ??
        app?.job_post?.company_name ??
        `Company #${app?.job_post?.company_id ?? app?.company_id ?? "-"}`;
      const status = toStatus(app);
      const timestamp =
        app?.employee_responded_at ??
        app?.company_responded_at ??
        app?.applied_at ??
        new Date().toISOString();

      return {
        id: `application:${id}`,
        type: "application",
        title: `Application for ${position} · ${companyName}`,
        body: `Status updated to ${status}`,
        status,
        timestamp,
        version: `${status}`,
      };
    });
}

function normalizeAnnouncements(announcements: any[]): NotificationPayload[] {
  return announcements
    .filter(
      (ann) =>
        ann &&
        typeof ann === "object" &&
        (ann?.type_post === undefined ||
          String(ann.type_post).toLowerCase() === "announcement"),
    )
    .map((ann) => {
      const id = Number(ann?.id ?? 0);
      const profUser = ann?.professor?.user;
      const nameParts = [
        profUser?.first_name,
        profUser?.last_name,
      ].filter(Boolean);
      const fallbackName = profUser?.user_name ?? "Professor";
      const author =
        nameParts.join(" ").trim() ||
        fallbackName ||
        "Professor announcement";
      const content =
        typeof ann?.content === "string" && ann.content.trim().length > 0
          ? ann.content.trim()
          : "New announcement posted.";
      const timestamp =
        ann?.updated_at ??
        ann?.created_at ??
        new Date().toISOString();

      return {
        id: `announcement:${id}`,
        type: "announcement",
        title: `Announcement from ${author}`,
        body: content,
        timestamp,
        version: `${timestamp}`,
      };
    });
}

async function readJson(res: Response) {
  const text = await res.text();
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return {};
  }
}

function extractList(payload: any): any[] {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.results)) return payload.results;
  return [];
}

function buildBackendHeaders(req: NextRequest): HeadersInit {
  const headers: Record<string, string> = {};
  const cookie = req.headers.get("cookie");
  if (cookie) headers.cookie = cookie;
  const auth = req.headers.get("authorization");
  if (auth) headers.authorization = auth;
  return headers;
}

export async function GET(request: NextRequest) {
  try {
    const headers = buildBackendHeaders(request);

    const [appsRes, announcementsRes] = await Promise.all([
      fetch(APPLICATIONS_ENDPOINT, { method: "GET", headers, cache: "no-store" }),
      fetch(ANNOUNCEMENTS_ENDPOINT, { method: "GET", headers, cache: "no-store" }),
    ]);

    if (!appsRes.ok && !announcementsRes.ok) {
      return NextResponse.json(
        { message: "Unable to load notifications" },
        { status: 502 },
      );
    }

    const appsJson = appsRes.ok ? await readJson(appsRes) : {};
    const announcementsJson = announcementsRes.ok ? await readJson(announcementsRes) : {};

    const notifications = [
      ...normalizeApplications(extractList(appsJson)),
      ...normalizeAnnouncements(extractList(announcementsJson)),
    ]
      .filter((item) => item && item.timestamp)
      .sort((a, b) => {
        const t1 = new Date(a.timestamp).getTime();
        const t2 = new Date(b.timestamp).getTime();
        return t2 - t1;
      })
      .slice(0, 20);

    return NextResponse.json({ notifications });
  } catch (error) {
    console.error("Failed to load notifications:", error);
    return NextResponse.json(
      { message: "Failed to load notifications" },
      { status: 500 },
    );
  }
}
