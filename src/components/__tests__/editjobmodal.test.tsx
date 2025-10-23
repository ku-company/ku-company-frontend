import { render, screen, fireEvent } from "@testing-library/react";
import EditJobModal, { type EditableJob } from "../EditJobModal";
import { describe, expect, it, vi } from "vitest";

const initial: EditableJob = {
  title: "Backend_Developer",
  position: "Backend_Developer",
  details: "Old details",
  positionsAvailable: 2,
};

describe("EditJobModal", () => {
  it("renders initial values and saves with edits", async () => {
    const onSave = vi.fn();
    const onClose = vi.fn();
    render(
      <EditJobModal isOpen={true} onClose={onClose} initial={initial} onSave={onSave} />
    );

    // Wait for initial values to populate
    const titleInput = await screen.findByPlaceholderText(/Job title/i);

    // Ensure title has initial, then clear it
    expect((titleInput as HTMLInputElement).value).toBe("Backend_Developer");
    fireEvent.change(titleInput, { target: { value: "" } });

    // Change position using the combobox
    const positionSelect = screen.getByRole("combobox");
    fireEvent.change(positionSelect, { target: { value: "Frontend_Developer" } });

    // Title should auto-fill as Frontend_Developer because it was empty
    expect(titleInput.value).toBe("Frontend_Developer");

    // Update details and positionsAvailable
    fireEvent.change(screen.getByPlaceholderText(/Enter job description/i), {
      target: { value: "New details" },
    });
    const spin = screen.getByRole("spinbutton") as HTMLInputElement;
    fireEvent.change(spin, { target: { value: "5" } });

    // Save should be enabled now
    const saveBtn = screen.getByRole("button", { name: /Save changes/i });
    expect(saveBtn).not.toBeDisabled();
    fireEvent.click(saveBtn);

    expect(onSave).toHaveBeenCalledWith({
      title: "Frontend_Developer",
      position: "Frontend_Developer",
      details: "New details",
      positionsAvailable: 5,
    });
  });

  it("does not render when closed or without initial", () => {
    const { container: c1 } = render(
      <EditJobModal isOpen={false} onClose={() => {}} initial={initial} onSave={() => {}} />
    );
    expect(c1.firstChild).toBeNull();

    const { container: c2 } = render(
      <EditJobModal isOpen={true} onClose={() => {}} initial={null} onSave={() => {}} />
    );
    expect(c2.firstChild).toBeNull();
  });
});
