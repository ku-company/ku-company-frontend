import { render, screen, fireEvent } from "@testing-library/react";
import { vi } from "vitest";

// Mutable test state for mocks
let mockUser: any = { user_name: "alice", role: "student" };
let mockCount = 0;
let mockPathname = "/find-job";
const pushMock = vi.fn();

// Hoisted mocks
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
  usePathname: () => mockPathname,
}));
vi.mock("next/link", () => ({ default: (props: any) => <a {...props} /> }));
vi.mock("@/context/AuthContext", () => ({
  useAuth: () => ({ user: mockUser, logout: vi.fn() }),
}));
vi.mock("@/context/ApplyCartContext", () => ({
  useApplyCart: () => ({ count: mockCount }),
}));

// Import after mocks
import Navbar from "../Navbar";

describe("Navbar", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders student-specific items and badge count", () => {
    mockUser = { user_name: "alice", role: "student" };
    mockCount = 2;
    mockPathname = "/find-job";

    render(<Navbar />);

    expect(screen.getByText(/FIND JOB/i)).toBeInTheDocument();
    expect(screen.getByText(/STATUS/i)).toBeInTheDocument();
    expect(screen.getByText("2")).toBeInTheDocument();

    const avatarBtn = screen.getByRole("button", { name: /avatar/i });
    fireEvent.click(avatarBtn);
    expect(screen.getByText(/Signed in as/i)).toBeInTheDocument();
  });

  it("renders company-specific items and no apply list", () => {
    mockUser = { user_name: "acme", role: "company" };
    mockCount = 0;
    mockPathname = "/company/jobpostings";

    render(<Navbar />);

    expect(screen.getByText(/JOB POSTINGS/i)).toBeInTheDocument();
    expect(screen.getByText(/VIEW RESUME/i)).toBeInTheDocument();
    expect(screen.queryByText(/STATUS/i)).toBeNull();
    expect(screen.queryByText("1")).toBeNull();
  });
});

