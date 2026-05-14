import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

vi.mock("../../lib/adminApi", () => ({
  clearToken: vi.fn(),
}));

import { clearToken } from "../../lib/adminApi";

describe("AdminSidebar", () => {
  beforeEach(() => {
    vi.mocked(clearToken).mockClear();
  });

  it("calls onToggleCollapse when collapse control is used", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminSidebar
                collapsed={false}
                onToggleCollapse={onToggle}
                onLogout={vi.fn()}
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    await user.click(screen.getByTitle("Collapse sidebar"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("shows expand control when collapsed and forwards toggle", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminSidebar
                collapsed
                onToggleCollapse={onToggle}
                onLogout={vi.fn()}
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByTitle("Expand sidebar")).toBeInTheDocument();
    await user.click(screen.getByTitle("Expand sidebar"));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("calls clearToken and onLogout when Logout is pressed", async () => {
    const user = userEvent.setup();
    const onLogout = vi.fn();
    render(
      <MemoryRouter initialEntries={["/admin"]}>
        <Routes>
          <Route
            path="/admin"
            element={
              <AdminSidebar
                collapsed={false}
                onToggleCollapse={vi.fn()}
                onLogout={onLogout}
              />
            }
          />
        </Routes>
      </MemoryRouter>,
    );
    await user.click(screen.getByRole("button", { name: /logout/i }));
    expect(clearToken).toHaveBeenCalledTimes(1);
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
