/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { db } from "../../../../db";
import { GET as getAllPackets } from "../index";
import { GET as getPacketById } from "../[id]";

describe("GET /api/packets", () => {
  it("should return a flattened array of all packets", async () => {
    const mockDbResponse = [
      {
        id: "mock-uuid-1",
        name: "Goldbears",
        rating: 5,
        packetCategories: [{ category: { id: 1, name: "Classic" } }],
      },
    ];
    // @ts-expect-error - Bypassing strict types for the mock implementation
    db.query.packets.findMany.mockResolvedValue(mockDbResponse);

    const response = await getAllPackets({} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data[0].categories).toEqual([{ id: 1, name: "Classic" }]);
  });

  it("should return 500 if the database throws an error", async () => {
    // @ts-expect-error - Bypassing strict types for the mock implementation
    db.query.packets.findMany.mockRejectedValue(new Error("DB Crash"));

    const response = await getAllPackets({} as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal Server Error");
  });
});

describe("GET /api/packets/[id]", () => {
  it("should return a single flattened packet when found", async () => {
    const validUuid = crypto.randomUUID();
    const mockDbResponse = {
      id: validUuid,
      name: "Happy Cola",
      packetCategories: [{ category: { id: 2, name: "Sour" } }],
    };
    // @ts-expect-error - Bypassing strict types for the mock implementation
    db.query.packets.findFirst.mockResolvedValue(mockDbResponse);

    const response = await getPacketById({ params: { id: validUuid } } as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.name).toBe("Happy Cola");
  });

  it("should return 404 if the packet does not exist", async () => {
    // @ts-expect-error - Bypassing strict types for the mock implementation
    db.query.packets.findFirst.mockResolvedValue(null);

    const response = await getPacketById({
      params: { id: crypto.randomUUID() },
    } as any);

    expect(response.status).toBe(404);
  });

  it("should return 400 if the ID is not a valid UUID", async () => {
    const response = await getPacketById({
      params: { id: "not-a-uuid" },
    } as any);

    expect(response.status).toBe(400);
    expect(db.query.packets.findFirst).not.toHaveBeenCalled();
  });
});
