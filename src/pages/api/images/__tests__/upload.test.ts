/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { AwsClient } from "aws4fetch";

// Mock aws4fetch globally
vi.mock("aws4fetch", () => {
  const AwsClientMock = vi.fn();
  AwsClientMock.prototype.sign = vi.fn();
  return { AwsClient: AwsClientMock };
});

import { POST as getUploadUrl } from "../upload";

describe("POST /api/images/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Provide safe fallback env vars for the test environment
    import.meta.env.R2_ENDPOINT = "https://mock.com";
    import.meta.env.R2_BUCKET_NAME = "mock-bucket";
    import.meta.env.R2_PUBLIC_URL = "https://public.mock.com";
  });

  it("should return 400 for a missing payload", async () => {
    const request = new Request("http://localhost/api/images/upload", {
      method: "POST",
      body: JSON.stringify({}),
    });

    const response = await getUploadUrl({ request } as any);
    expect(response.status).toBe(400);
  });

  it("should return 400 for unsupported file types (e.g., PDFs)", async () => {
    const request = new Request("http://localhost/api/images/upload", {
      method: "POST",
      body: JSON.stringify({ contentType: "application/pdf" }),
    });

    const response = await getUploadUrl({ request } as any);
    expect(response.status).toBe(400);
  });

  it("should return 500 if AWS signing fails", async () => {
    // Force the prototype mock to throw
    (AwsClient.prototype.sign as any).mockRejectedValue(new Error("AWS Error"));

    const request = new Request("http://localhost/api/images/upload", {
      method: "POST",
      body: JSON.stringify({ contentType: "image/webp" }),
    });

    const response = await getUploadUrl({ request } as any);
    expect(response.status).toBe(500);
  });

  it("should return 200 and presigned URLs on success", async () => {
    // Mock successful URL generation
    (AwsClient.prototype.sign as any).mockResolvedValue({
      url: "https://mock.com/signed-url?signature=123",
    });

    const request = new Request("http://localhost/api/images/upload", {
      method: "POST",
      body: JSON.stringify({ contentType: "image/jpeg" }),
    });

    const response = await getUploadUrl({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.uploadUrl).toBe("https://mock.com/signed-url?signature=123");
    expect(data.publicUrl).toMatch(/https:\/\/public\.mock\.com\/.*\.jpeg/);
  });
});
