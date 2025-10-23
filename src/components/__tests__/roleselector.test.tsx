import { render, screen, fireEvent } from "@testing-library/react";
import RoleSelectModal from "../roleselector";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock Next.js router
const pushMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock }),
}));

describe("RoleSelectModal", () => {
  beforeEach(() => {
    pushMock.mockReset();
  });

  it("renders when open and navigates on selection", () => {
    const onClose = vi.fn();
    render(<RoleSelectModal isOpen={true} onClose={onClose} />);

    // Should display all three roles
    expect(screen.getByText(/Student/i)).toBeInTheDocument();
    expect(screen.getByText(/Professor/i)).toBeInTheDocument();
    expect(screen.getByText(/Company/i)).toBeInTheDocument();

    // Click Student and assert navigation + close
    fireEvent.click(screen.getByText(/Student/i));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(pushMock).toHaveBeenCalledWith("/register/student");
  });

  it("calls onSelect callback if provided (no navigation)", () => {
    const onClose = vi.fn();
    const onSelect = vi.fn();
    render(<RoleSelectModal isOpen={true} onClose={onClose} onSelect={onSelect} />);

    fireEvent.click(screen.getByText(/Company/i));
    expect(onClose).toHaveBeenCalledTimes(1);
    expect(onSelect).toHaveBeenCalledWith("company");
    expect(pushMock).not.toHaveBeenCalled();
  });

  it("does not render when closed", () => {
    const { container } = render(<RoleSelectModal isOpen={false} onClose={() => {}} />);
    expect(container.firstChild).toBeNull();
  });
});

