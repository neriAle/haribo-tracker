/* eslint-disable @typescript-eslint/no-explicit-any */
import { describe, it, expect } from "vitest";
import { db } from "../../../../db";
import { GET as getCategories } from "../index";

describe("GET /api/categories", () => {
  it("should return 200 OK and an array of categories", async () => {
    const mockCategories = [
      { id: 1, name: "Classic" },
      { id: 2, name: "Sour" },
    ];
    (db.query.categories.findMany as any).mockResolvedValue(mockCategories);

    const response = await getCategories({} as any);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].name).toBe("Classic");
  });

  it("should return 500 if the database throws an error", async () => {
    (db.query.categories.findMany as any).mockRejectedValue(
      new Error("DB Error"),
    );

    const response = await getCategories({} as any);
    const data = await response.json();

    expect(response.status).toBe(500);
    expect(data.error).toBe("Internal Server Error");
  });
});
