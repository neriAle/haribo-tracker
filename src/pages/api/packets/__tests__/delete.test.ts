/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { db } from "../../../../db";
import { DELETE as deletePacket } from "../[id]";

const validUuid = crypto.randomUUID();

describe("DELETE /api/packets/[id]", () => {
  it("should return 400 if the ID is missing or not a valid UUID", async () => {
    const response = await deletePacket({
      params: { id: "not-a-uuid" },
    } as any);

    expect(response.status).toBe(400);
    expect(db.delete).not.toHaveBeenCalled();
  });

  it("should return 404 if the packet is not found", async () => {
    // @ts-expect-error - Empty array means the target ID didn't exist
    db.delete().where().returning.mockResolvedValue([]);

    const response = await deletePacket({
      params: { id: validUuid },
    } as any);

    expect(response.status).toBe(404);
  });

  it("should return 500 if the database throws an error", async () => {
    // @ts-expect-error - Mocking with the global chainable mock
    db.delete().where().returning.mockRejectedValue(new Error("DB Crash"));

    const response = await deletePacket({
      params: { id: validUuid },
    } as any);

    expect(response.status).toBe(500);
  });

  it("should return 200 OK on successful deletion", async () => {
    // @ts-expect-error - expected argument
    db.delete()
      // @ts-expect-error - expected argument
      .where()
      // @ts-expect-error - Mocking with the global chainable mock
      .returning.mockResolvedValue([{ id: validUuid }]);

    const response = await deletePacket({
      params: { id: validUuid },
    } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
