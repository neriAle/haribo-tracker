/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "../../../../db";
import { DELETE as deletePacket } from "../[id]";

const validUuid = crypto.randomUUID();

// 1. Hoist the fetch mock for AWS
const { mockAwsFetch } = vi.hoisted(() => ({
  mockAwsFetch: vi.fn(),
}));

// 2. Mock aws4fetch using a Javascript class
vi.mock("aws4fetch", () => {
  return {
    AwsClient: class {
      fetch = mockAwsFetch;
    },
  };
});

// 3. Mock environment variables for R2 credentials
vi.mock("cloudflare:workers", () => ({
  env: {
    R2_ACCESS_KEY_ID: "test-key",
    R2_SECRET_ACCESS_KEY: "test-secret",
    R2_ENDPOINT: "https://test.r2.com",
    R2_BUCKET_NAME: "test-bucket",
  },
}));

describe("DELETE /api/packets/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 if the ID is missing or not a valid UUID", async () => {
    const response = await deletePacket({
      params: { id: "not-a-uuid" },
    } as any);

    expect(response.status).toBe(400);
    expect(db.delete).not.toHaveBeenCalled();
  });

  it("should return 404 if the packet is not found", async () => {
    // @ts-expect-error - Empty array means the target ID didn't exist
    db.delete().where().returning.mockResolvedValueOnce([]);

    const response = await deletePacket({
      params: { id: validUuid },
    } as any);

    expect(response.status).toBe(404);
  });

  it("should return 500 if the database throws an error", async () => {
    // @ts-expect-error - Mocking with the global chainable mock
    db.delete().where().returning.mockRejectedValueOnce(new Error("DB Crash"));

    const response = await deletePacket({
      params: { id: validUuid },
    } as any);

    expect(response.status).toBe(500);
  });

  it("should return 200 OK and successfully delete the image from R2", async () => {
    // @ts-expect-error - expected argument
    db.delete()
      // @ts-expect-error - expected argument
      .where()
      // @ts-expect-error - Mocking with the global chainable mock
      .returning.mockResolvedValueOnce([
        { id: validUuid, imageUrl: "https://example.com/test.png" },
      ]);

    mockAwsFetch.mockResolvedValueOnce({ ok: true });

    const response = await deletePacket({
      params: { id: validUuid },
    } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockAwsFetch).toHaveBeenCalled();
  });

  it("should return 200 OK even if R2 returns a non-200 status", async () => {
    // @ts-expect-error - expected argument
    db.delete()
      // @ts-expect-error - expected argument
      .where()
      // @ts-expect-error - Needs to return a Promise
      .returning.mockResolvedValueOnce([
        { id: validUuid, imageUrl: "https://example.com/test.png" },
      ]);

    mockAwsFetch.mockResolvedValueOnce({ ok: false, status: 403 });

    const response = await deletePacket({
      params: { id: validUuid },
    } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("should return 200 OK even if R2 fetch throws an error", async () => {
    // @ts-expect-error - expected argument
    db.delete()
      // @ts-expect-error - expected argument
      .where()
      // @ts-expect-error - Needs to return a Promise
      .returning.mockResolvedValueOnce([
        { id: validUuid, imageUrl: "https://example.com/test.png" },
      ]);

    mockAwsFetch.mockRejectedValueOnce(new Error("Network Error"));

    const response = await deletePacket({
      params: { id: validUuid },
    } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
