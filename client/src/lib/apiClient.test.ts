import { describe, expect, it, vi, afterEach } from "vitest";
import { createApiClient, ApiError } from "./apiClient";

function jsonResponse(body: unknown, status: number): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  } as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("createApiClient", () => {
  it("throws ApiError carrying the HTTP status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ error: "Product not found" }, 404)),
    );
    const api = createApiClient("/api");

    await expect(api.get("/products?seoSlug=missing")).rejects.toMatchObject({
      status: 404,
      message: "Product not found",
    });
  });

  // The soft-404 regression: a backend outage returns 5xx, and callers must be
  // able to tell that apart from a part that genuinely no longer exists.
  it("reports a backend outage as a non-404 status", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({}, 503)),
    );
    const api = createApiClient("/api");

    const err: unknown = await api
      .get("/products?seoSlug=any")
      .catch((e: unknown) => e);
    expect(err).toBeInstanceOf(ApiError);
    expect((err as ApiError).status).toBe(503);
    expect((err as ApiError).status).not.toBe(404);
  });

  it("returns the parsed body on success", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => jsonResponse({ partNumber: "ABC-1" }, 200)),
    );
    const api = createApiClient("/api");

    await expect(api.get("/products?seoSlug=abc-1")).resolves.toEqual({
      partNumber: "ABC-1",
    });
  });
});
