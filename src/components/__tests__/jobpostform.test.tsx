import { render, screen, fireEvent } from "@testing-library/react";
import JobPostForm from "../JobPostForm";
import { describe, expect, it, vi } from "vitest";

describe("JobPostForm", () => {
  it("submits with mapped values and resets key fields", () => {
    const onSubmit = vi.fn();
    render(<JobPostForm onSubmit={onSubmit} />);

    // Defaults are Internship + Backend_Developer, positionsAvailable=1
    // Fill details and change a couple fields
    fireEvent.change(screen.getByPlaceholderText(/More Details here/i), {
      target: { value: "Build APIs" },
    });
    const selects = screen.getAllByRole("combobox");
    fireEvent.change(selects[0], { target: { value: "FullTime" } });
    fireEvent.change(selects[1], { target: { value: "Frontend_Developer" } });
    fireEvent.change(screen.getByRole("spinbutton"), { target: { value: "3" } });

    fireEvent.click(screen.getByRole("button", { name: /Post/i }));

    expect(onSubmit).toHaveBeenCalledWith({
      jobType: "FullTime",
      title: "Frontend_Developer",
      details: "Build APIs",
      positionsAvailable: 3,
    });

    // Details cleared and positions reset to 1
    expect((screen.getByPlaceholderText(/More Details here/i) as HTMLTextAreaElement).value).toBe("");
    expect((screen.getByRole("spinbutton") as HTMLInputElement).value).toBe("1");
  });
});
