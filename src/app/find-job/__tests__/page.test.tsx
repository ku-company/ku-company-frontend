import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import FindJobPage from "../page";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Mock contexts
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: { role: "student", user_name: "alice" } }),
}));

const addMock = vi.fn();
const containsMock = vi.fn((id: number) => id === 2 ? false : false);
vi.mock("@/context/ApplyCartContext", () => ({
  useApplyCart: () => ({ add: addMock, contains: containsMock }),
}));

// Mock dependent APIs
vi.mock("@/api/resume", () => ({
  listResumes: vi.fn().mockResolvedValue([{ id: 10, name: "Resume A" }]),
  uploadResume: vi.fn(),
}));
vi.mock("@/api/applications", () => ({
  listMyApplications: vi.fn().mockResolvedValue([{ job_id: 1 }]),
}));
vi.mock("@/api/base", () => ({
  buildInit: (init?: any) => init || {},
}));
vi.mock("@/api/jobs", () => ({ applyToJob: vi.fn() }));

// Mock global fetch for categories/jobTypes/jobs
const mockFetch = vi.fn(async (url: string) => {
  if (url.includes("/api/job-postings/category")) {
    return new Response(JSON.stringify({ categories: ["Engineering"] }), { status: 200 });
  }
  if (url.includes("/api/job-postings/job-type")) {
    return new Response(JSON.stringify({ jobTypes: ["FullTime"] }), { status: 200 });
  }
  if (url.includes("/api/job-postings/?")) {
    const jobs = [
      {
        id: 1,
        description: "Build backend services",
        jobType: "FullTime",
        position: "Backend Engineer",
        available_position: 2,
        created_at: "",
        company: { id: 7, company_name: "Acme", location: "Bangkok" },
      },
      {
        id: 2,
        description: "Build UI",
        jobType: "Internship",
        position: "Frontend Intern",
        available_position: 1,
        created_at: "",
        company: { id: 8, company_name: "Globex", location: "Chiang Mai" },
      },
    ];
    return new Response(JSON.stringify({ job_postings: jobs }), { status: 200 });
  }
  return new Response("[]", { status: 200 });
});

describe("FindJobPage", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", mockFetch);
    addMock.mockReset();
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("lists jobs, selects first, and reflects applied state", async () => {
    render(<FindJobPage />);

    // Wait for jobs to load (appears in list and detail)
    const be = await screen.findAllByText(/Backend Engineer/i);
    expect(be.length).toBeGreaterThan(0);
    expect(screen.getByText(/Frontend Intern/i)).toBeInTheDocument();

    // Right panel shows first job details (text appears in list and detail)
    expect(screen.getAllByText(/Build backend services/i).length).toBeGreaterThan(0);

    // First job is marked applied
    const applyBtn1 = screen.getByRole("button", { name: /APPLIED/i });
    expect(applyBtn1).toBeDisabled();

    // Select second job and expect APPLY available
    fireEvent.click(screen.getByText(/Frontend Intern/i));
    await waitFor(() => expect(screen.getAllByText(/Build UI/i).length).toBeGreaterThan(0));
    const applyBtn2 = screen.getByRole("button", { name: /APPLY/i });
    expect(applyBtn2).not.toBeDisabled();
  });
});
