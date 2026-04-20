import { afterEach, describe, expect, it, vi } from "vitest";

import { resolveApiBaseUrl } from "@/lib/api";

describe("resolveApiBaseUrl", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it("prefers the configured base URL and trims trailing slashes", () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "https://api.example.com///");

    expect(
      resolveApiBaseUrl({ hostname: "preview.example.com", origin: "https://preview.example.com" }),
    ).toBe("https://api.example.com");
  });

  it("falls back to localhost during local browser development", () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");

    expect(resolveApiBaseUrl({ hostname: "localhost", origin: "http://localhost:3000" })).toBe(
      "http://localhost:8000",
    );
  });

  it("throws a clear error when deployed without an API base URL", () => {
    vi.stubEnv("NEXT_PUBLIC_API_BASE_URL", "");

    expect(() =>
      resolveApiBaseUrl({ hostname: "ai-champion.vercel.app", origin: "https://ai-champion.vercel.app" }),
    ).toThrow("NEXT_PUBLIC_API_BASE_URL is not configured");
  });
});
