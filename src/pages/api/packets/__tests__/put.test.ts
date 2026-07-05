/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
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

describe("PUT /api/packets/[id]", () => {
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
    // @ts-expect-error - Return an empty array to simulate non-existent record
    db.update().set().where().returning.mockResolvedValue([]);

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
    // @ts-expect-error - expected argument
    db.update()
      // @ts-expect-error - expected argument
      .set()
      // @ts-expect-error - expected argument
      .where()
      // @ts-expect-error - Mocking with the global chainable mock
      .returning.mockRejectedValue(new Error("DB Crash"));

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

  it("should return 200 OK on successful update", async () => {
    // @ts-expect-error - expected argument
    db.update()
      // @ts-expect-error - expected argument
      .set()
      // @ts-expect-error - expected argument
      .where()
      // @ts-expect-error - Mocking with the global chainable mock
      .returning.mockResolvedValue([{ id: validUuid }]);

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
  });
});
