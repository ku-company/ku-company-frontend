import { render, screen, fireEvent } from "@testing-library/react";
import ApplyModal from "../ApplyModal";
import { describe, expect, it, vi } from "vitest";

describe("ApplyModal", () => {
  const resumes = [
    { id: "1", name: "Resume A" },
    { id: "2", name: "Resume B" },
  ];

  it("preselects first resume and submits payload", () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn();
    render(
      <ApplyModal
        isOpen={true}
        onClose={onClose}
        onSubmit={onSubmit}
        resumes={resumes}
        jobTitle="Software Engineer"
      />
    );

    // Submit directly without changing selection
    fireEvent.click(screen.getByRole("button", { name: /Submit application/i }));
    expect(onSubmit).toHaveBeenCalledWith({ mode: "existing", resumeId: "1" });
  });

  it("allows selecting a different resume and calls onClose on cancel", () => {
    const onClose = vi.fn();
    const onSubmit = vi.fn();
    render(
      <ApplyModal isOpen={true} onClose={onClose} onSubmit={onSubmit} resumes={resumes} />
    );

    // Choose second resume via radio
    const option = screen.getByRole("radio", { name: /Resume B/i });
    fireEvent.click(option);

    fireEvent.click(screen.getByRole("button", { name: /Submit application/i }));
    expect(onSubmit).toHaveBeenCalledWith({ mode: "existing", resumeId: "2" });

    fireEvent.click(screen.getByRole("button", { name: /Cancel/i }));
    expect(onClose).toHaveBeenCalled();
  });

  it("disables submit when no resumes", () => {
    const { getByRole } = render(
      <ApplyModal isOpen={true} onClose={() => {}} onSubmit={() => {}} resumes={[]} />
    );
    expect(getByRole("button", { name: /Submit application/i })).toBeDisabled();
  });
});

