/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { db } from "../../../../db";
import { POST as createPacket } from "../index";

const validPayload = {
  name: "Test Goldbears",
  language: "English",
  imageUrl: "https://example.com/goldbears.png",
  categoryIds: [1, 2],
  rating: 5,
};

describe("POST /api/packets", () => {
  it("should return 400 if a mandatory field is missing", async () => {
    const payload = { ...validPayload };
    // @ts-expect-error - Intentionally deleting a required field
    delete payload.imageUrl;

    const request = new Request("http://localhost/api/packets", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const response = await createPacket({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Validation failed");
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("should return 400 if a field has an invalid data type", async () => {
    const payload = {
      ...validPayload,
      name: "",
      rating: 4.3,
    };

    const request = new Request("http://localhost/api/packets", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    const response = await createPacket({ request } as any);

    expect(response.status).toBe(400);
    expect(db.insert).not.toHaveBeenCalled();
  });

  it("should return 500 if the database throws an error", async () => {
    // @ts-expect-error - Mocking with the global chainable mock
    db.insert().values().returning.mockRejectedValue(new Error("DB Crash"));

    const request = new Request("http://localhost/api/packets", {
      method: "POST",
      body: JSON.stringify(validPayload),
    });

    const response = await createPacket({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal Server Error");
  });

  it("should return 201 Created and the UUID on success", async () => {
    const newUuid = crypto.randomUUID();
    // @ts-expect-error - expected argument
    db.insert()
      // @ts-expect-error - expected argument
      .values()
      // @ts-expect-error - Mocking with the global chainable mock
      .returning.mockResolvedValue([{ id: newUuid }]);

    const request = new Request("http://localhost/api/packets", {
      method: "POST",
      body: JSON.stringify(validPayload),
    });

    const response = await createPacket({ request } as any);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.success).toBe(true);
    expect(data.id).toBe(newUuid);
  });
});
