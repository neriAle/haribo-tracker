/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { db } from "../../../../db";
import { PUT as updatePacket } from "../[id]";

const validUuid = crypto.randomUUID();
const validPayload = {
  name: "Updated Goldbears",
  language: "German",
  imageUrl: "https://example.com/updated.png",
  categoryIds: [3],
  rating: 4,
};

// 1. Hoist the fetch mock for AWS
const { mockAwsFetch } = vi.hoisted(() => ({
  mockAwsFetch: vi.fn(),
}));

// 2. Mock aws4fetch properly using a Javascript class
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

describe("PUT /api/packets/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 400 if the ID is missing or not a valid UUID", async () => {
    const request = new Request(`http://localhost/api/packets/invalid-id`, {
      method: "PUT",
      body: JSON.stringify(validPayload),
    });

    const response = await updatePacket({
      params: { id: "invalid-id" },
      request,
    } as any);

    expect(response.status).toBe(400);
    expect(db.update).not.toHaveBeenCalled();
  });

  it("should return 400 if the payload is invalid", async () => {
    const payload = { ...validPayload, rating: "five" };
    const request = new Request(`http://localhost/api/packets/${validUuid}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    });

    const response = await updatePacket({
      params: { id: validUuid },
      request,
    } as any);

    expect(response.status).toBe(400);
    expect(db.update).not.toHaveBeenCalled();
  });

  it("should return 404 if the packet is not found", async () => {
    db.select()
      // @ts-expect-error - Mocking from method
      .from()
      // @ts-expect-error - Mocking where to return empty array
      .where.mockResolvedValueOnce([]);

    const request = new Request(`http://localhost/api/packets/${validUuid}`, {
      method: "PUT",
      body: JSON.stringify(validPayload),
    });

    const response = await updatePacket({
      params: { id: validUuid },
      request,
    } as any);

    expect(response.status).toBe(404);
  });

  it("should return 500 if the database throws an error", async () => {
    // @ts-expect-error - missing argument
    const chain = db.select().from();

    chain.where
      // @ts-expect-error - Needs to return a Promise
      .mockResolvedValueOnce([{ imageUrl: "https://example.com/old.png" }])
      .mockReturnValueOnce(chain);

    // @ts-expect-error - Mocking returning to throw error
    chain.returning.mockRejectedValueOnce(new Error("DB Crash"));

    const request = new Request(`http://localhost/api/packets/${validUuid}`, {
      method: "PUT",
      body: JSON.stringify(validPayload),
    });

    const response = await updatePacket({
      params: { id: validUuid },
      request,
    } as any);

    expect(response.status).toBe(500);
  });

  it("should return 200 OK and successfully delete old image from R2 when URL changes", async () => {
    // @ts-expect-error - missing argument
    const chain = db.select().from();

    chain.where
      // @ts-expect-error - Needs to return a Promise
      .mockResolvedValueOnce([{ imageUrl: "https://example.com/old.png" }])
      .mockReturnValueOnce(chain)
      .mockResolvedValueOnce([]); // junction delete

    // @ts-expect-error - Mocking returning to resolve with ID
    chain.returning.mockResolvedValueOnce([{ id: validUuid }]);

    mockAwsFetch.mockResolvedValueOnce({ ok: true });

    const request = new Request(`http://localhost/api/packets/${validUuid}`, {
      method: "PUT",
      body: JSON.stringify(validPayload),
    });

    const response = await updatePacket({
      params: { id: validUuid },
      request,
    } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockAwsFetch).toHaveBeenCalled();
  });

  it("should return 200 OK even if R2 returns a non-200 status", async () => {
    // @ts-expect-error - missing argument
    const chain = db.select().from();

    chain.where
      // @ts-expect-error - Needs to return a Promise
      .mockResolvedValueOnce([{ imageUrl: "https://example.com/old.png" }])
      .mockReturnValueOnce(chain)
      .mockResolvedValueOnce([]);

    // @ts-expect-error - Needs to return a Promise
    chain.returning.mockResolvedValueOnce([{ id: validUuid }]);

    mockAwsFetch.mockResolvedValueOnce({ ok: false, status: 403 });

    const request = new Request(`http://localhost/api/packets/${validUuid}`, {
      method: "PUT",
      body: JSON.stringify(validPayload),
    });

    const response = await updatePacket({
      params: { id: validUuid },
      request,
    } as any);

    expect(response.status).toBe(200);
  });

  it("should return 200 OK even if R2 fetch throws an error", async () => {
    // @ts-expect-error - missing argument
    const chain = db.select().from();

    chain.where
      // @ts-expect-error - Needs to return a Promise
      .mockResolvedValueOnce([{ imageUrl: "https://example.com/old.png" }])
      .mockReturnValueOnce(chain)
      .mockResolvedValueOnce([]);

    // @ts-expect-error - Needs to return a Promise
    chain.returning.mockResolvedValueOnce([{ id: validUuid }]);

    mockAwsFetch.mockRejectedValueOnce(new Error("Network Error"));

    const request = new Request(`http://localhost/api/packets/${validUuid}`, {
      method: "PUT",
      body: JSON.stringify(validPayload),
    });

    const response = await updatePacket({
      params: { id: validUuid },
      request,
    } as any);

    expect(response.status).toBe(200);
  });
});
